use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppInfo {
    name: String,
    version: String,
    author: String,
    tagline: String,
}

#[tauri::command]
pub fn get_app_info() -> AppInfo {
    AppInfo {
        name: "DiskScope".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        author: "Lemolek".to_string(),
        tagline: "Advanced Storage Analyzer".to_string(),
    }
}
