use serde::Serialize;
use std::collections::HashMap;
use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};
use std::sync::atomic::Ordering;
use std::time::{Instant, UNIX_EPOCH};
use tauri::{AppHandle, Emitter};

use crate::core::error::AppError;
use crate::scanning::ScanState;

const GROUPS_LIMIT: usize = 200;
const HASH_BUFFER_BYTES: usize = 1024 * 1024;
const PROGRESS_INTERVAL_MS: u128 = 150;
const PROGRESS_EVENT: &str = "duplicate-progress";

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DuplicateProgress {
    phase: String,
    files_seen: u64,
    hashed: u64,
    total_candidates: u64,
    current_path: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DuplicateFile {
    name: String,
    path: String,
    modified_ms: Option<u64>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DuplicateGroup {
    size_bytes: u64,
    file_count: u64,
    wasted_bytes: u64,
    files: Vec<DuplicateFile>,
}

struct DuplicateFinder<'a> {
    app: &'a AppHandle,
    state: &'a ScanState,
    last_progress: Instant,
    files_seen: u64,
    hashed: u64,
    total_candidates: u64,
}

pub fn find_duplicates(
    app: &AppHandle,
    state: &ScanState,
    root: PathBuf,
    min_size_bytes: u64,
) -> Result<Vec<DuplicateGroup>, AppError> {
    if !root.is_dir() {
        return Err(AppError::PathNotFound(root.display().to_string()));
    }
    let mut finder = DuplicateFinder {
        app,
        state,
        last_progress: Instant::now(),
        files_seen: 0,
        hashed: 0,
        total_candidates: 0,
    };
    let mut by_size: HashMap<u64, Vec<PathBuf>> = HashMap::new();
    finder.collect_files(&root, min_size_bytes, &mut by_size)?;

    let candidates: Vec<(u64, Vec<PathBuf>)> = by_size
        .into_iter()
        .filter(|(_, paths)| paths.len() >= 2)
        .collect();
    finder.total_candidates = candidates.iter().map(|(_, paths)| paths.len() as u64).sum();

    let mut groups: Vec<DuplicateGroup> = Vec::new();
    for (size, paths) in candidates {
        if finder.state.cancelled.load(Ordering::Relaxed) {
            return Err(AppError::Cancelled);
        }
        let mut by_hash: HashMap<[u8; 32], Vec<PathBuf>> = HashMap::new();
        for path in paths {
            finder.hashed += 1;
            finder.emit_progress_if_due("hashing", &path);
            if let Some(hash) = hash_file(&path) {
                by_hash.entry(hash).or_default().push(path);
            }
        }
        for (_, files) in by_hash {
            if files.len() < 2 {
                continue;
            }
            let file_count = files.len() as u64;
            groups.push(DuplicateGroup {
                size_bytes: size,
                file_count,
                wasted_bytes: size * (file_count - 1),
                files: files.into_iter().map(duplicate_file).collect(),
            });
        }
    }
    groups.sort_unstable_by_key(|group| std::cmp::Reverse(group.wasted_bytes));
    groups.truncate(GROUPS_LIMIT);
    Ok(groups)
}

impl DuplicateFinder<'_> {
    fn collect_files(
        &mut self,
        path: &Path,
        min_size_bytes: u64,
        by_size: &mut HashMap<u64, Vec<PathBuf>>,
    ) -> Result<(), AppError> {
        if self.state.cancelled.load(Ordering::Relaxed) {
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
                self.collect_files(&entry.path(), min_size_bytes, by_size)?;
            } else if file_type.is_file() {
                let Ok(metadata) = entry.metadata() else {
                    continue;
                };
                let size = metadata.len();
                self.files_seen += 1;
                self.emit_progress_if_due("collecting", path);
                if size >= min_size_bytes {
                    by_size.entry(size).or_default().push(entry.path());
                }
            }
        }
        Ok(())
    }

    fn emit_progress_if_due(&mut self, phase: &str, current: &Path) {
        if self.last_progress.elapsed().as_millis() < PROGRESS_INTERVAL_MS {
            return;
        }
        self.last_progress = Instant::now();
        let progress = DuplicateProgress {
            phase: phase.to_string(),
            files_seen: self.files_seen,
            hashed: self.hashed,
            total_candidates: self.total_candidates,
            current_path: current.display().to_string(),
        };
        let _ = self.app.emit(PROGRESS_EVENT, progress);
    }
}

fn duplicate_file(path: PathBuf) -> DuplicateFile {
    let modified_ms = fs::metadata(&path)
        .and_then(|metadata| metadata.modified())
        .ok()
        .and_then(|time| time.duration_since(UNIX_EPOCH).ok())
        .map(|duration| duration.as_millis() as u64);
    DuplicateFile {
        name: path
            .file_name()
            .map(|name| name.to_string_lossy().into_owned())
            .unwrap_or_default(),
        path: path.display().to_string(),
        modified_ms,
    }
}

fn hash_file(path: &Path) -> Option<[u8; 32]> {
    let mut file = fs::File::open(path).ok()?;
    let mut hasher = blake3::Hasher::new();
    let mut buffer = vec![0u8; HASH_BUFFER_BYTES];
    loop {
        let read = file.read(&mut buffer).ok()?;
        if read == 0 {
            break;
        }
        hasher.update(&buffer[..read]);
    }
    Some(*hasher.finalize().as_bytes())
}
