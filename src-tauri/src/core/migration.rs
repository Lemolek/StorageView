use std::fs;
use std::path::Path;
use tauri::{AppHandle, Manager};

pub fn migrate_legacy_app_data(app: &AppHandle) {
    let Ok(app_data_dir) = app.path().app_data_dir() else {
        return;
    };
    let marker = app_data_dir.join("migration-v1");
    if marker.exists() {
        return;
    }
    if fs::create_dir_all(&app_data_dir).is_err() {
        return;
    }
    let Some(parent) = app_data_dir.parent() else {
        return;
    };
    let legacy_dir = parent.join("com.lemolek.diskscope");
    if legacy_dir.is_dir() {
        copy_legacy_files(&legacy_dir, &app_data_dir);
    }
    let _ = fs::write(&marker, b"");
}

fn copy_legacy_files(legacy_dir: &Path, target_dir: &Path) {
    let Ok(entries) = fs::read_dir(legacy_dir) else {
        return;
    };
    for entry in entries.flatten() {
        let source = entry.path();
        if !source.is_file() {
            continue;
        }
        let target = target_dir.join(entry.file_name());
        if !target.exists() {
            let _ = fs::copy(&source, &target);
        }
    }
}
