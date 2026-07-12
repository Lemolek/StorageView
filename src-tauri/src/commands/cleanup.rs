use tauri::AppHandle;

use crate::cleanup::{self, CleanupReport, CleanupRequestItem, CleanupSuggestion, RiskAssessment};
use crate::core::error::AppError;

#[tauri::command]
pub fn classify_paths(paths: Vec<String>) -> Vec<RiskAssessment> {
    paths
        .iter()
        .map(|path| cleanup::assess_path(path))
        .collect()
}

#[tauri::command]
pub async fn recycle_bin_summary() -> Result<cleanup::RecycleBinSummary, AppError> {
    tauri::async_runtime::spawn_blocking(cleanup::recycle_bin_summary)
        .await
        .map_err(|error| AppError::Internal(error.to_string()))?
}

#[tauri::command]
pub async fn empty_recycle_bin() -> Result<(), AppError> {
    tauri::async_runtime::spawn_blocking(cleanup::empty_recycle_bin)
        .await
        .map_err(|error| AppError::Internal(error.to_string()))?
}

#[tauri::command]
pub async fn suggest_cleanup() -> Result<Vec<CleanupSuggestion>, AppError> {
    tauri::async_runtime::spawn_blocking(cleanup::suggest_cleanup)
        .await
        .map_err(|error| AppError::Internal(error.to_string()))
}

#[tauri::command]
pub async fn execute_cleanup(
    app: AppHandle,
    items: Vec<CleanupRequestItem>,
    permanent: bool,
) -> Result<CleanupReport, AppError> {
    tauri::async_runtime::spawn_blocking(move || cleanup::execute(&app, items, permanent))
        .await
        .map_err(|error| AppError::Internal(error.to_string()))
}
