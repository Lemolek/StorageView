use std::fs;
use std::path::Path;

use crate::core::error::AppError;

pub fn save_text_file(path: &str, contents: &str) -> Result<(), AppError> {
    let target = Path::new(path);
    if let Some(parent) = target.parent() {
        if !parent.exists() {
            return Err(AppError::PathNotFound(parent.display().to_string()));
        }
    }
    fs::write(target, contents).map_err(AppError::Io)
}
