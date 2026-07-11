use crate::core::error::AppError;
use crate::system::{self, DiskInfo};

#[tauri::command]
pub fn list_disks() -> Vec<DiskInfo> {
    system::list_disks()
}

#[tauri::command]
pub fn open_path(path: String) -> Result<(), AppError> {
    system::open_path(&path)
}

#[tauri::command]
pub fn reveal_path(path: String) -> Result<(), AppError> {
    system::reveal_path(&path)
}
