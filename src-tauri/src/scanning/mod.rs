use serde::Serialize;
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::{Instant, SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter};

use crate::core::error::AppError;

const TOP_FILES_LIMIT: usize = 100;
const TOP_DIRECTORIES_LIMIT: usize = 100;
const FILE_TYPES_LIMIT: usize = 500;
const PROGRESS_INTERVAL_MS: u128 = 150;
const PROGRESS_EVENT: &str = "scan-progress";
const AGE_BUCKET_LABELS: [&str; 7] = [
    "Last 30 days",
    "1–6 months",
    "6–12 months",
    "1–2 years",
    "2–5 years",
    "Older than 5 years",
    "Unknown",
];

#[derive(Default)]
pub struct ScanState {
    pub cancelled: AtomicBool,
    pub running: AtomicBool,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanProgress {
    files_scanned: u64,
    directories_scanned: u64,
    bytes_scanned: u64,
    current_path: String,
    elapsed_ms: u64,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileEntry {
    name: String,
    path: String,
    extension: String,
    size_bytes: u64,
    modified_ms: Option<u64>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectoryEntry {
    name: String,
    path: String,
    size_bytes: u64,
    file_count: u64,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileTypeStat {
    extension: String,
    total_bytes: u64,
    file_count: u64,
    largest_file_bytes: u64,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AgeBucket {
    label: String,
    file_count: u64,
    total_bytes: u64,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanResult {
    root_path: String,
    total_files: u64,
    total_directories: u64,
    total_bytes: u64,
    permission_errors: u64,
    elapsed_ms: u64,
    largest_files: Vec<FileEntry>,
    largest_directories: Vec<DirectoryEntry>,
    file_types: Vec<FileTypeStat>,
    age_distribution: Vec<AgeBucket>,
}

struct TopEntries<T> {
    capacity: usize,
    entries: Vec<(u64, T)>,
}

impl<T> TopEntries<T> {
    fn new(capacity: usize) -> Self {
        Self {
            capacity,
            entries: Vec::with_capacity(capacity + 1),
        }
    }

    fn push(&mut self, size: u64, item: T) {
        if self.entries.len() == self.capacity
            && self.entries.last().is_some_and(|last| size <= last.0)
        {
            return;
        }
        let position = self.entries.partition_point(|entry| entry.0 >= size);
        self.entries.insert(position, (size, item));
        if self.entries.len() > self.capacity {
            self.entries.pop();
        }
    }

    fn into_items(self) -> Vec<T> {
        self.entries.into_iter().map(|(_, item)| item).collect()
    }
}

#[derive(Default, Clone, Copy)]
struct DirectoryTotals {
    bytes: u64,
    files: u64,
}

#[derive(Default)]
struct FileTypeAccumulator {
    total_bytes: u64,
    file_count: u64,
    largest_file_bytes: u64,
}

struct Scanner<'a> {
    app: &'a AppHandle,
    state: &'a ScanState,
    started: Instant,
    last_progress: Instant,
    files_scanned: u64,
    directories_scanned: u64,
    bytes_scanned: u64,
    permission_errors: u64,
    top_files: TopEntries<FileEntry>,
    top_directories: TopEntries<DirectoryEntry>,
    file_types: HashMap<String, FileTypeAccumulator>,
    ignored_paths: Vec<String>,
    now_ms: u64,
    age_buckets: [(u64, u64); AGE_BUCKET_LABELS.len()],
}

pub fn run_scan(
    app: &AppHandle,
    state: &ScanState,
    root: PathBuf,
    ignored_paths: Vec<String>,
) -> Result<ScanResult, AppError> {
    if !root.is_dir() {
        return Err(AppError::PathNotFound(root.display().to_string()));
    }
    let normalized_ignored = ignored_paths
        .iter()
        .map(|path| {
            path.replace('/', "\\")
                .to_lowercase()
                .trim_end_matches('\\')
                .to_string()
        })
        .filter(|path| !path.is_empty())
        .collect();
    let now_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis() as u64)
        .unwrap_or_default();
    let mut scanner = Scanner {
        app,
        state,
        started: Instant::now(),
        last_progress: Instant::now(),
        files_scanned: 0,
        directories_scanned: 0,
        bytes_scanned: 0,
        permission_errors: 0,
        top_files: TopEntries::new(TOP_FILES_LIMIT),
        top_directories: TopEntries::new(TOP_DIRECTORIES_LIMIT),
        file_types: HashMap::new(),
        ignored_paths: normalized_ignored,
        now_ms,
        age_buckets: [(0, 0); AGE_BUCKET_LABELS.len()],
    };
    let totals = scanner.scan_directory(&root)?;
    let mut file_types: Vec<FileTypeStat> = scanner
        .file_types
        .into_iter()
        .map(|(extension, accumulator)| FileTypeStat {
            extension,
            total_bytes: accumulator.total_bytes,
            file_count: accumulator.file_count,
            largest_file_bytes: accumulator.largest_file_bytes,
        })
        .collect();
    file_types.sort_unstable_by_key(|stat| std::cmp::Reverse(stat.total_bytes));
    file_types.truncate(FILE_TYPES_LIMIT);
    Ok(ScanResult {
        root_path: root.display().to_string(),
        total_files: totals.files,
        total_directories: scanner.directories_scanned,
        total_bytes: totals.bytes,
        permission_errors: scanner.permission_errors,
        elapsed_ms: scanner.started.elapsed().as_millis() as u64,
        age_distribution: AGE_BUCKET_LABELS
            .iter()
            .zip(scanner.age_buckets)
            .map(|(label, (file_count, total_bytes))| AgeBucket {
                label: label.to_string(),
                file_count,
                total_bytes,
            })
            .collect(),
        largest_files: scanner.top_files.into_items(),
        largest_directories: scanner.top_directories.into_items(),
        file_types,
    })
}

impl Scanner<'_> {
    fn scan_directory(&mut self, path: &Path) -> Result<DirectoryTotals, AppError> {
        if self.state.cancelled.load(Ordering::Relaxed) {
            return Err(AppError::Cancelled);
        }
        let entries = match fs::read_dir(path) {
            Ok(entries) => entries,
            Err(error) => {
                if error.kind() == std::io::ErrorKind::PermissionDenied {
                    self.permission_errors += 1;
                }
                return Ok(DirectoryTotals::default());
            }
        };
        let mut totals = DirectoryTotals::default();
        for entry in entries.flatten() {
            let Ok(file_type) = entry.file_type() else {
                continue;
            };
            if file_type.is_symlink() {
                continue;
            }
            if file_type.is_dir() {
                let sub_path = entry.path();
                if self.is_ignored(&sub_path) {
                    continue;
                }
                let sub_totals = self.scan_directory(&sub_path)?;
                self.directories_scanned += 1;
                totals.bytes += sub_totals.bytes;
                totals.files += sub_totals.files;
                self.top_directories.push(
                    sub_totals.bytes,
                    DirectoryEntry {
                        name: entry.file_name().to_string_lossy().into_owned(),
                        path: sub_path.display().to_string(),
                        size_bytes: sub_totals.bytes,
                        file_count: sub_totals.files,
                    },
                );
            } else if file_type.is_file() {
                let Ok(metadata) = entry.metadata() else {
                    continue;
                };
                let size = metadata.len();
                totals.bytes += size;
                totals.files += 1;
                self.files_scanned += 1;
                self.bytes_scanned += size;
                let name = entry.file_name().to_string_lossy().into_owned();
                let extension = extension_of(&name);
                let accumulator = self.file_types.entry(extension.clone()).or_default();
                accumulator.total_bytes += size;
                accumulator.file_count += 1;
                accumulator.largest_file_bytes = accumulator.largest_file_bytes.max(size);
                let modified = modified_ms(&metadata);
                let bucket = age_bucket_index(modified, self.now_ms);
                self.age_buckets[bucket].0 += 1;
                self.age_buckets[bucket].1 += size;
                self.top_files.push(
                    size,
                    FileEntry {
                        name,
                        path: entry.path().display().to_string(),
                        extension,
                        size_bytes: size,
                        modified_ms: modified,
                    },
                );
            }
            self.emit_progress_if_due(path);
        }
        Ok(totals)
    }

    fn is_ignored(&self, path: &Path) -> bool {
        if self.ignored_paths.is_empty() {
            return false;
        }
        let normalized = path.display().to_string().replace('/', "\\").to_lowercase();
        self.ignored_paths.iter().any(|ignored| {
            normalized == *ignored || normalized.starts_with(&format!("{ignored}\\"))
        })
    }

    fn emit_progress_if_due(&mut self, current: &Path) {
        if self.last_progress.elapsed().as_millis() < PROGRESS_INTERVAL_MS {
            return;
        }
        self.last_progress = Instant::now();
        let progress = ScanProgress {
            files_scanned: self.files_scanned,
            directories_scanned: self.directories_scanned,
            bytes_scanned: self.bytes_scanned,
            current_path: current.display().to_string(),
            elapsed_ms: self.started.elapsed().as_millis() as u64,
        };
        let _ = self.app.emit(PROGRESS_EVENT, progress);
    }
}

pub fn collect_extension_files(
    state: &ScanState,
    root: &Path,
    extension: &str,
    limit: usize,
) -> Result<Vec<FileEntry>, AppError> {
    if !root.is_dir() {
        return Err(AppError::PathNotFound(root.display().to_string()));
    }
    let target = extension.to_lowercase();
    let mut top = TopEntries::new(limit);
    collect_extension_recursive(state, root, &target, &mut top)?;
    Ok(top.into_items())
}

fn collect_extension_recursive(
    state: &ScanState,
    path: &Path,
    target: &str,
    top: &mut TopEntries<FileEntry>,
) -> Result<(), AppError> {
    if state.cancelled.load(Ordering::Relaxed) {
        return Err(AppError::Cancelled);
    }
    let Ok(entries) = fs::read_dir(path) else {
        return Ok(());
    };
    for entry in entries.flatten() {
        let Ok(file_type) = entry.file_type() else {
            continue;
        };
        if file_type.is_symlink() {
            continue;
        }
        if file_type.is_dir() {
            collect_extension_recursive(state, &entry.path(), target, top)?;
        } else if file_type.is_file() {
            let name = entry.file_name().to_string_lossy().into_owned();
            if extension_of(&name) != target {
                continue;
            }
            let Ok(metadata) = entry.metadata() else {
                continue;
            };
            let size = metadata.len();
            top.push(
                size,
                FileEntry {
                    name,
                    path: entry.path().display().to_string(),
                    extension: target.to_string(),
                    size_bytes: size,
                    modified_ms: modified_ms(&metadata),
                },
            );
        }
    }
    Ok(())
}

fn age_bucket_index(modified_ms: Option<u64>, now_ms: u64) -> usize {
    let Some(modified) = modified_ms else {
        return 6;
    };
    let age_days = now_ms.saturating_sub(modified) / 86_400_000;
    match age_days {
        0..=30 => 0,
        31..=180 => 1,
        181..=365 => 2,
        366..=730 => 3,
        731..=1825 => 4,
        _ => 5,
    }
}

fn extension_of(name: &str) -> String {
    Path::new(name)
        .extension()
        .map(|extension| extension.to_string_lossy().to_lowercase())
        .unwrap_or_default()
}

fn modified_ms(metadata: &fs::Metadata) -> Option<u64> {
    metadata
        .modified()
        .ok()?
        .duration_since(UNIX_EPOCH)
        .ok()
        .map(|duration| duration.as_millis() as u64)
}

#[cfg(test)]
mod tests {
    use super::{collect_extension_files, extension_of, ScanState, TopEntries};
    use std::fs;

    #[test]
    fn collect_extension_files_finds_matching_files_by_size() {
        let root = std::env::temp_dir().join("storageview-test-ext-collect");
        let nested = root.join("nested");
        fs::create_dir_all(&nested).unwrap();
        fs::write(root.join("small.log"), vec![0u8; 10]).unwrap();
        fs::write(root.join("big.LOG"), vec![0u8; 500]).unwrap();
        fs::write(nested.join("mid.log"), vec![0u8; 100]).unwrap();
        fs::write(nested.join("other.txt"), vec![0u8; 900]).unwrap();

        let state = ScanState::default();
        let files = collect_extension_files(&state, &root, "log", 2).unwrap();

        assert_eq!(files.len(), 2);
        assert_eq!(files[0].name.to_lowercase(), "big.log");
        assert_eq!(files[0].size_bytes, 500);
        assert_eq!(files[1].size_bytes, 100);

        fs::remove_dir_all(&root).unwrap();
    }

    #[test]
    fn top_entries_keeps_largest_in_descending_order() {
        let mut top = TopEntries::new(3);
        top.push(10, "a");
        top.push(50, "b");
        top.push(30, "c");
        top.push(40, "d");
        top.push(5, "e");
        assert_eq!(top.into_items(), vec!["b", "d", "c"]);
    }

    #[test]
    fn top_entries_ignores_items_below_threshold_when_full() {
        let mut top = TopEntries::new(2);
        top.push(100, "a");
        top.push(200, "b");
        top.push(50, "c");
        assert_eq!(top.into_items(), vec!["b", "a"]);
    }

    #[test]
    fn extension_of_lowercases_and_handles_missing() {
        assert_eq!(extension_of("Archive.ZIP"), "zip");
        assert_eq!(extension_of("video.mp4"), "mp4");
        assert_eq!(extension_of("README"), "");
        assert_eq!(extension_of(".gitignore"), "");
    }
}
