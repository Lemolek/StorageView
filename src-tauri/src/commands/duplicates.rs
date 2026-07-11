use std::path::PathBuf;
use std::sync::atomic::Ordering;
use std::sync::Arc;
use tauri::{AppHandle, State};

use crate::core::error::AppError;
use crate::duplicates::{find_duplicates, DuplicateGroup};
use crate::scanning::ScanState;

#[tauri::command]
pub async fn scan_duplicates(
    app: AppHandle,
    state: State<'_, Arc<ScanState>>,
    path: String,
    min_size_bytes: u64,
) -> Result<Vec<DuplicateGroup>, AppError> {
    let scan_state = state.inner().clone();
    if scan_state.running.swap(true, Ordering::SeqCst) {
        return Err(AppError::ScanInProgress);
    }
    scan_state.cancelled.store(false, Ordering::SeqCst);
    let worker_state = scan_state.clone();
    let outcome = tauri::async_runtime::spawn_blocking(move || {
        find_duplicates(&app, &worker_state, PathBuf::from(path), min_size_bytes)
    })
    .await
    .map_err(|error| AppError::Internal(error.to_string()));
    scan_state.running.store(false, Ordering::SeqCst);
    outcome?
}
