use regex::{Regex, RegexBuilder};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::sync::atomic::Ordering;
use std::time::{Instant, SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter};

use crate::core::error::AppError;
use crate::scanning::ScanState;

pub const HITS_EVENT: &str = "search-hits";

const HIT_BATCH_SIZE: usize = 200;

#[cfg(windows)]
const FILE_ATTRIBUTE_HIDDEN: u32 = 0x2;

#[derive(Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SearchScope {
    All,
    Files,
    Folders,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchQuery {
    pub root: String,
    pub scope: SearchScope,
    pub text: String,
    pub use_regex: bool,
    pub extensions: Vec<String>,
    pub min_size_bytes: Option<u64>,
    pub max_size_bytes: Option<u64>,
    pub modified_after_ms: Option<u64>,
    pub modified_before_ms: Option<u64>,
    pub created_after_ms: Option<u64>,
    pub created_before_ms: Option<u64>,
    pub include_hidden: bool,
    pub limit: usize,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchHit {
    pub name: String,
    pub path: String,
    pub kind: String,
    pub size_bytes: u64,
    pub modified_ms: Option<u64>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchSummary {
    pub total_hits: u64,
    pub truncated: bool,
    pub elapsed_ms: u64,
}

pub fn run_search(
    app: &AppHandle,
    state: &ScanState,
    query: SearchQuery,
) -> Result<SearchSummary, AppError> {
    let started = Instant::now();
    let (total_hits, truncated) = search_with(state, &query, |batch| {
        let _ = app.emit(HITS_EVENT, batch);
    })?;
    Ok(SearchSummary {
        total_hits,
        truncated,
        elapsed_ms: started.elapsed().as_millis() as u64,
    })
}

fn search_with<F: FnMut(Vec<SearchHit>)>(
    state: &ScanState,
    query: &SearchQuery,
    on_batch: F,
) -> Result<(u64, bool), AppError> {
    let root = Path::new(&query.root);
    if !root.is_dir() {
        return Err(AppError::PathNotFound(query.root.clone()));
    }
    let matcher = build_matcher(&query.text, query.use_regex)?;
    let extensions: Vec<String> = query
        .extensions
        .iter()
        .map(|extension| extension.trim().trim_start_matches('.').to_lowercase())
        .filter(|extension| !extension.is_empty())
        .collect();
    let mut walker = SearchWalker {
        state,
        query,
        matcher,
        extensions,
        buffer: Vec::new(),
        total: 0,
        truncated: false,
        on_batch,
    };
    walker.walk(root)?;
    walker.flush();
    Ok((walker.total, walker.truncated))
}

fn build_matcher(text: &str, use_regex: bool) -> Result<Option<Regex>, AppError> {
    let pattern = if use_regex {
        if text.is_empty() {
            return Ok(None);
        }
        text.to_string()
    } else {
        let trimmed = text.trim();
        if trimmed.is_empty() {
            return Ok(None);
        }
        if trimmed.contains(['*', '?']) {
            let mut translated = String::from("^");
            for character in trimmed.chars() {
                match character {
                    '*' => translated.push_str(".*"),
                    '?' => translated.push('.'),
                    other => translated.push_str(&regex::escape(&other.to_string())),
                }
            }
            translated.push('$');
            translated
        } else {
            regex::escape(trimmed)
        }
    };
    RegexBuilder::new(&pattern)
        .case_insensitive(true)
        .build()
        .map(Some)
        .map_err(|error| AppError::Internal(error.to_string()))
}

struct SearchWalker<'a, F: FnMut(Vec<SearchHit>)> {
    state: &'a ScanState,
    query: &'a SearchQuery,
    matcher: Option<Regex>,
    extensions: Vec<String>,
    buffer: Vec<SearchHit>,
    total: u64,
    truncated: bool,
    on_batch: F,
}

impl<F: FnMut(Vec<SearchHit>)> SearchWalker<'_, F> {
    fn walk(&mut self, path: &Path) -> Result<(), AppError> {
        if self.state.cancelled.load(Ordering::Relaxed) {
            return Err(AppError::Cancelled);
        }
        let Ok(entries) = fs::read_dir(path) else {
            return Ok(());
        };
        for entry in entries.flatten() {
            if self.truncated {
                return Ok(());
            }
            let Ok(file_type) = entry.file_type() else {
                continue;
            };
            if file_type.is_symlink() {
                continue;
            }
            let name = entry.file_name().to_string_lossy().into_owned();
            let metadata = entry.metadata().ok();
            if !self.query.include_hidden && is_hidden(&name, metadata.as_ref()) {
                continue;
            }
            if file_type.is_dir() {
                if self.query.scope != SearchScope::Files {
                    self.consider_folder(&entry, &name, metadata.as_ref());
                }
                if !self.truncated {
                    self.walk(&entry.path())?;
                }
            } else if file_type.is_file() && self.query.scope != SearchScope::Folders {
                if let Some(metadata) = metadata.as_ref() {
                    self.consider_file(&entry, &name, metadata);
                }
            }
        }
        Ok(())
    }

    fn consider_folder(
        &mut self,
        entry: &fs::DirEntry,
        name: &str,
        metadata: Option<&fs::Metadata>,
    ) {
        if !self.name_matches(name) || !self.size_within(0) {
            return;
        }
        let modified = metadata.and_then(modified_ms);
        if !self.modified_within(modified) || !self.created_within(metadata.and_then(created_ms)) {
            return;
        }
        self.push(SearchHit {
            name: name.to_string(),
            path: entry.path().display().to_string(),
            kind: "folder".to_string(),
            size_bytes: 0,
            modified_ms: modified,
        });
    }

    fn consider_file(&mut self, entry: &fs::DirEntry, name: &str, metadata: &fs::Metadata) {
        if !self.name_matches(name) {
            return;
        }
        if !self.extensions.is_empty() && !self.extensions.contains(&extension_of(name)) {
            return;
        }
        let size = metadata.len();
        if !self.size_within(size) {
            return;
        }
        let modified = modified_ms(metadata);
        if !self.modified_within(modified) || !self.created_within(created_ms(metadata)) {
            return;
        }
        self.push(SearchHit {
            name: name.to_string(),
            path: entry.path().display().to_string(),
            kind: "file".to_string(),
            size_bytes: size,
            modified_ms: modified,
        });
    }

    fn name_matches(&self, name: &str) -> bool {
        self.matcher
            .as_ref()
            .is_none_or(|matcher| matcher.is_match(name))
    }

    fn size_within(&self, size: u64) -> bool {
        self.query.min_size_bytes.is_none_or(|min| size >= min)
            && self.query.max_size_bytes.is_none_or(|max| size <= max)
    }

    fn modified_within(&self, modified: Option<u64>) -> bool {
        within_bounds(
            modified,
            self.query.modified_after_ms,
            self.query.modified_before_ms,
        )
    }

    fn created_within(&self, created: Option<u64>) -> bool {
        within_bounds(
            created,
            self.query.created_after_ms,
            self.query.created_before_ms,
        )
    }

    fn push(&mut self, hit: SearchHit) {
        if self.total >= self.query.limit as u64 {
            self.truncated = true;
            return;
        }
        self.buffer.push(hit);
        self.total += 1;
        if self.buffer.len() >= HIT_BATCH_SIZE {
            self.flush();
        }
        if self.total >= self.query.limit as u64 {
            self.truncated = true;
        }
    }

    fn flush(&mut self) {
        if self.buffer.is_empty() {
            return;
        }
        (self.on_batch)(std::mem::take(&mut self.buffer));
    }
}

fn within_bounds(value: Option<u64>, after: Option<u64>, before: Option<u64>) -> bool {
    if after.is_none() && before.is_none() {
        return true;
    }
    let Some(value) = value else {
        return false;
    };
    after.is_none_or(|bound| value >= bound) && before.is_none_or(|bound| value <= bound)
}

#[cfg(windows)]
fn is_hidden(name: &str, metadata: Option<&fs::Metadata>) -> bool {
    use std::os::windows::fs::MetadataExt;
    name.starts_with('.')
        || metadata.is_some_and(|metadata| metadata.file_attributes() & FILE_ATTRIBUTE_HIDDEN != 0)
}

#[cfg(not(windows))]
fn is_hidden(name: &str, _metadata: Option<&fs::Metadata>) -> bool {
    name.starts_with('.')
}

fn extension_of(name: &str) -> String {
    Path::new(name)
        .extension()
        .map(|extension| extension.to_string_lossy().to_lowercase())
        .unwrap_or_default()
}

fn modified_ms(metadata: &fs::Metadata) -> Option<u64> {
    time_ms(metadata.modified().ok()?)
}

fn created_ms(metadata: &fs::Metadata) -> Option<u64> {
    time_ms(metadata.created().ok()?)
}

fn time_ms(time: SystemTime) -> Option<u64> {
    time.duration_since(UNIX_EPOCH)
        .ok()
        .map(|duration| duration.as_millis() as u64)
}

#[cfg(test)]
mod tests {
    use super::{build_matcher, search_with, SearchHit, SearchQuery, SearchScope};
    use crate::core::error::AppError;
    use crate::scanning::ScanState;
    use std::fs;
    use std::path::{Path, PathBuf};

    fn temp_root(name: &str) -> PathBuf {
        let root = std::env::temp_dir().join(format!("storageview-test-search-{name}"));
        let _ = fs::remove_dir_all(&root);
        fs::create_dir_all(&root).unwrap();
        root
    }

    fn base_query(root: &Path) -> SearchQuery {
        SearchQuery {
            root: root.display().to_string(),
            scope: SearchScope::All,
            text: String::new(),
            use_regex: false,
            extensions: Vec::new(),
            min_size_bytes: None,
            max_size_bytes: None,
            modified_after_ms: None,
            modified_before_ms: None,
            created_after_ms: None,
            created_before_ms: None,
            include_hidden: true,
            limit: 1000,
        }
    }

    fn collect(query: &SearchQuery) -> (Vec<SearchHit>, u64, bool) {
        let state = ScanState::default();
        let mut hits = Vec::new();
        let (total, truncated) = search_with(&state, query, |batch| hits.extend(batch)).unwrap();
        (hits, total, truncated)
    }

    fn names(hits: &[SearchHit]) -> Vec<String> {
        let mut names: Vec<String> = hits.iter().map(|hit| hit.name.clone()).collect();
        names.sort();
        names
    }

    #[test]
    fn wildcard_star_matches_extension_pattern() {
        let matcher = build_matcher("*.log", false).unwrap().unwrap();
        assert!(matcher.is_match("app.log"));
        assert!(matcher.is_match("APP.LOG"));
        assert!(!matcher.is_match("app.log.bak"));
        assert!(!matcher.is_match("applog"));
    }

    #[test]
    fn wildcard_question_matches_single_character() {
        let matcher = build_matcher("report?.txt", false).unwrap().unwrap();
        assert!(matcher.is_match("report1.txt"));
        assert!(matcher.is_match("REPORTX.TXT"));
        assert!(!matcher.is_match("report12.txt"));
        assert!(!matcher.is_match("report.txt"));
    }

    #[test]
    fn plain_text_matches_as_substring() {
        let matcher = build_matcher("port", false).unwrap().unwrap();
        assert!(matcher.is_match("report1.txt"));
        assert!(matcher.is_match("IMPORTANT.md"));
        assert!(!matcher.is_match("notes.txt"));
    }

    #[test]
    fn plain_text_escapes_regex_metacharacters() {
        let matcher = build_matcher("file(1)", false).unwrap().unwrap();
        assert!(matcher.is_match("file(1).txt"));
        assert!(!matcher.is_match("file1.txt"));
    }

    #[test]
    fn invalid_regex_returns_internal_error() {
        let error = build_matcher("[unclosed", true).unwrap_err();
        assert!(matches!(error, AppError::Internal(_)));
    }

    #[test]
    fn regex_mode_compiles_case_insensitively() {
        let matcher = build_matcher("^re.*\\.txt$", true).unwrap().unwrap();
        assert!(matcher.is_match("REport1.TXT"));
        assert!(!matcher.is_match("notes.txt"));
    }

    #[test]
    fn search_finds_wildcard_matches_in_nested_directories() {
        let root = temp_root("wildcard");
        let nested = root.join("nested");
        fs::create_dir_all(&nested).unwrap();
        fs::write(root.join("app.log"), b"a").unwrap();
        fs::write(nested.join("trace.LOG"), b"b").unwrap();
        fs::write(nested.join("notes.txt"), b"c").unwrap();

        let mut query = base_query(&root);
        query.scope = SearchScope::Files;
        query.text = "*.log".to_string();
        let (hits, total, truncated) = collect(&query);

        assert_eq!(total, 2);
        assert!(!truncated);
        assert_eq!(names(&hits), vec!["app.log", "trace.LOG"]);
        assert!(hits.iter().all(|hit| hit.kind == "file"));

        fs::remove_dir_all(&root).unwrap();
    }

    #[test]
    fn extension_and_size_filters_apply_to_files() {
        let root = temp_root("filters");
        fs::write(root.join("small.log"), vec![0u8; 10]).unwrap();
        fs::write(root.join("big.log"), vec![0u8; 500]).unwrap();
        fs::write(root.join("big.txt"), vec![0u8; 500]).unwrap();

        let mut query = base_query(&root);
        query.scope = SearchScope::Files;
        query.extensions = vec![".LOG".to_string()];
        query.min_size_bytes = Some(100);
        let (hits, total, _) = collect(&query);

        assert_eq!(total, 1);
        assert_eq!(hits[0].name, "big.log");
        assert_eq!(hits[0].size_bytes, 500);

        fs::remove_dir_all(&root).unwrap();
    }

    #[test]
    fn folder_scope_matches_directories_with_zero_size() {
        let root = temp_root("folders");
        fs::create_dir_all(root.join("photos")).unwrap();
        fs::create_dir_all(root.join("docs")).unwrap();
        fs::write(root.join("photos.txt"), b"x").unwrap();

        let mut query = base_query(&root);
        query.scope = SearchScope::Folders;
        query.text = "pho".to_string();
        let (hits, total, _) = collect(&query);

        assert_eq!(total, 1);
        assert_eq!(hits[0].name, "photos");
        assert_eq!(hits[0].kind, "folder");
        assert_eq!(hits[0].size_bytes, 0);

        fs::remove_dir_all(&root).unwrap();
    }

    #[test]
    fn limit_truncates_results() {
        let root = temp_root("limit");
        for index in 0..5 {
            fs::write(root.join(format!("file{index}.txt")), b"x").unwrap();
        }

        let mut query = base_query(&root);
        query.scope = SearchScope::Files;
        query.limit = 3;
        let (hits, total, truncated) = collect(&query);

        assert_eq!(total, 3);
        assert_eq!(hits.len(), 3);
        assert!(truncated);

        fs::remove_dir_all(&root).unwrap();
    }

    #[test]
    fn hidden_entries_are_excluded_by_default() {
        let root = temp_root("hidden");
        let hidden_dir = root.join(".cache");
        fs::create_dir_all(&hidden_dir).unwrap();
        fs::write(hidden_dir.join("inner.txt"), b"x").unwrap();
        fs::write(root.join(".secret.txt"), b"x").unwrap();
        fs::write(root.join("visible.txt"), b"x").unwrap();

        let mut query = base_query(&root);
        query.scope = SearchScope::Files;
        query.include_hidden = false;
        let (hits, total, _) = collect(&query);
        assert_eq!(total, 1);
        assert_eq!(hits[0].name, "visible.txt");

        query.include_hidden = true;
        let (hits, total, _) = collect(&query);
        assert_eq!(total, 3);
        assert_eq!(
            names(&hits),
            vec![".secret.txt", "inner.txt", "visible.txt"]
        );

        fs::remove_dir_all(&root).unwrap();
    }

    #[test]
    fn missing_root_returns_path_not_found() {
        let mut query = base_query(Path::new(""));
        query.root = std::env::temp_dir()
            .join("storageview-test-search-does-not-exist")
            .display()
            .to_string();
        let state = ScanState::default();
        let error = search_with(&state, &query, |_| {}).unwrap_err();
        assert!(matches!(error, AppError::PathNotFound(_)));
    }
}
