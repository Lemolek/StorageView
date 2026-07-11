use serde::Serialize;
use std::path::Path;
use sysinfo::Disks;

use crate::core::error::AppError;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiskInfo {
    name: String,
    mount_point: String,
    file_system: String,
    kind: String,
    total_bytes: u64,
    available_bytes: u64,
    removable: bool,
}

pub fn list_disks() -> Vec<DiskInfo> {
    Disks::new_with_refreshed_list()
        .iter()
        .map(|disk| DiskInfo {
            name: disk.name().to_string_lossy().into_owned(),
            mount_point: disk.mount_point().display().to_string(),
            file_system: disk.file_system().to_string_lossy().into_owned(),
            kind: match disk.kind() {
                sysinfo::DiskKind::SSD => "SSD".to_string(),
                sysinfo::DiskKind::HDD => "HDD".to_string(),
                sysinfo::DiskKind::Unknown(_) => "Disk".to_string(),
            },
            total_bytes: disk.total_space(),
            available_bytes: disk.available_space(),
            removable: disk.is_removable(),
        })
        .collect()
}

pub fn open_path(path: &str) -> Result<(), AppError> {
    let target = Path::new(path);
    if !target.exists() {
        return Err(AppError::PathNotFound(path.to_string()));
    }
    open_in_file_manager(target).map_err(AppError::Io)
}

pub fn reveal_path(path: &str) -> Result<(), AppError> {
    let target = Path::new(path);
    if !target.exists() {
        return Err(AppError::PathNotFound(path.to_string()));
    }
    reveal_in_file_manager(target).map_err(AppError::Io)
}

#[cfg(target_os = "windows")]
fn open_in_file_manager(path: &Path) -> std::io::Result<()> {
    std::process::Command::new("explorer.exe")
        .arg(path)
        .spawn()
        .map(|_| ())
}

#[cfg(target_os = "windows")]
fn reveal_in_file_manager(path: &Path) -> std::io::Result<()> {
    use std::os::windows::process::CommandExt;
    std::process::Command::new("explorer.exe")
        .raw_arg(format!("/select,\"{}\"", path.display()))
        .spawn()
        .map(|_| ())
}

#[cfg(target_os = "macos")]
fn open_in_file_manager(path: &Path) -> std::io::Result<()> {
    std::process::Command::new("open")
        .arg(path)
        .spawn()
        .map(|_| ())
}

#[cfg(target_os = "macos")]
fn reveal_in_file_manager(path: &Path) -> std::io::Result<()> {
    std::process::Command::new("open")
        .arg("-R")
        .arg(path)
        .spawn()
        .map(|_| ())
}

#[cfg(all(unix, not(target_os = "macos")))]
fn open_in_file_manager(path: &Path) -> std::io::Result<()> {
    std::process::Command::new("xdg-open")
        .arg(path)
        .spawn()
        .map(|_| ())
}

#[cfg(all(unix, not(target_os = "macos")))]
fn reveal_in_file_manager(path: &Path) -> std::io::Result<()> {
    let target = path.parent().unwrap_or(path);
    std::process::Command::new("xdg-open")
        .arg(target)
        .spawn()
        .map(|_| ())
}
