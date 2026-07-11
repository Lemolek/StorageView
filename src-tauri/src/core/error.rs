use serde::ser::SerializeStruct;
use serde::{Serialize, Serializer};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("path not found: {0}")]
    PathNotFound(String),
    #[error("permission denied: {0}")]
    PermissionDenied(String),
    #[error("path is protected: {0}")]
    ProtectedPath(String),
    #[error("operation cancelled")]
    Cancelled,
    #[error("a scan is already running")]
    ScanInProgress,
    #[error("internal error: {0}")]
    Internal(String),
    #[error(transparent)]
    Io(#[from] std::io::Error),
}

impl AppError {
    fn code(&self) -> &'static str {
        match self {
            AppError::PathNotFound(_) => "path_not_found",
            AppError::PermissionDenied(_) => "permission_denied",
            AppError::ProtectedPath(_) => "protected_path",
            AppError::Cancelled => "cancelled",
            AppError::ScanInProgress => "scan_in_progress",
            AppError::Internal(_) => "internal",
            AppError::Io(_) => "io_error",
        }
    }
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_struct("AppError", 2)?;
        state.serialize_field("code", self.code())?;
        state.serialize_field("message", &self.to_string())?;
        state.end()
    }
}
