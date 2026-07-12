use crate::apps::{self, InstalledApp, LeftoverCandidate};
use crate::core::error::AppError;

#[tauri::command]
pub async fn list_installed_apps() -> Result<Vec<InstalledApp>, AppError> {
    tauri::async_runtime::spawn_blocking(apps::list_installed_apps)
        .await
        .map_err(|error| AppError::Internal(error.to_string()))?
}

#[tauri::command]
pub fn launch_uninstall(app_id: String) -> Result<(), AppError> {
    apps::launch_uninstall(&app_id)
}

#[tauri::command]
pub async fn find_app_leftovers(
    name: String,
    publisher: Option<String>,
    install_location: Option<String>,
) -> Result<Vec<LeftoverCandidate>, AppError> {
    tauri::async_runtime::spawn_blocking(move || {
        apps::find_leftovers(&name, publisher.as_deref(), install_location.as_deref())
    })
    .await
    .map_err(|error| AppError::Internal(error.to_string()))?
}
