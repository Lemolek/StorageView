use std::sync::atomic::Ordering;
use std::sync::Arc;
use tauri::{AppHandle, State};

use crate::core::error::AppError;
use crate::scanning::ScanState;
use crate::search::{run_search, SearchQuery, SearchSummary};

#[tauri::command]
pub async fn start_search(
    app: AppHandle,
    state: State<'_, Arc<ScanState>>,
    query: SearchQuery,
) -> Result<SearchSummary, AppError> {
    let scan_state = state.inner().clone();
    if scan_state.running.swap(true, Ordering::SeqCst) {
        return Err(AppError::ScanInProgress);
    }
    scan_state.cancelled.store(false, Ordering::SeqCst);
    let worker_state = scan_state.clone();
    let outcome =
        tauri::async_runtime::spawn_blocking(move || run_search(&app, &worker_state, query))
            .await
            .map_err(|error| AppError::Internal(error.to_string()));
    scan_state.running.store(false, Ordering::SeqCst);
    outcome?
}
