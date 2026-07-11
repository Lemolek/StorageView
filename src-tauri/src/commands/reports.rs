use crate::core::error::AppError;
use crate::reports;

#[tauri::command]
pub fn save_report(path: String, contents: String) -> Result<(), AppError> {
    reports::save_text_file(&path, &contents)
}
