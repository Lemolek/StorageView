use std::path::PathBuf;
use std::sync::atomic::Ordering;
use std::sync::Arc;
use tauri::{AppHandle, State};

use crate::core::error::AppError;
use crate::scanning::{collect_extension_files, run_scan, FileEntry, ScanResult, ScanState};

#[tauri::command]
pub async fn start_scan(
    app: AppHandle,
    state: State<'_, Arc<ScanState>>,
    path: String,
    ignored_paths: Vec<String>,
) -> Result<ScanResult, AppError> {
    let scan_state = state.inner().clone();
    if scan_state.running.swap(true, Ordering::SeqCst) {
        return Err(AppError::ScanInProgress);
    }
    scan_state.cancelled.store(false, Ordering::SeqCst);
    let worker_state = scan_state.clone();
    let outcome = tauri::async_runtime::spawn_blocking(move || {
        run_scan(&app, &worker_state, PathBuf::from(path), ignored_paths)
    })
    .await
    .map_err(|error| AppError::Internal(error.to_string()));
    scan_state.running.store(false, Ordering::SeqCst);
    outcome?
}

#[tauri::command]
pub async fn list_extension_files(
    state: State<'_, Arc<ScanState>>,
    path: String,
    extension: String,
    limit: usize,
) -> Result<Vec<FileEntry>, AppError> {
    let scan_state = state.inner().clone();
    if scan_state.running.swap(true, Ordering::SeqCst) {
        return Err(AppError::ScanInProgress);
    }
    scan_state.cancelled.store(false, Ordering::SeqCst);
    let worker_state = scan_state.clone();
    let outcome = tauri::async_runtime::spawn_blocking(move || {
        collect_extension_files(&worker_state, &PathBuf::from(path), &extension, limit)
    })
    .await
    .map_err(|error| AppError::Internal(error.to_string()));
    scan_state.running.store(false, Ordering::SeqCst);
    outcome?
}

#[tauri::command]
pub fn cancel_scan(state: State<'_, Arc<ScanState>>) {
    if state.running.load(Ordering::SeqCst) {
        state.cancelled.store(true, Ordering::SeqCst);
    }
}
