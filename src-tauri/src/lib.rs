pub mod cleanup;
pub mod commands;
pub mod core;
pub mod duplicates;
pub mod reports;
pub mod scanning;
pub mod system;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .manage(std::sync::Arc::new(scanning::ScanState::default()))
        .invoke_handler(tauri::generate_handler![
            commands::app::get_app_info,
            commands::system::list_disks,
            commands::system::open_path,
            commands::system::reveal_path,
            commands::scanning::start_scan,
            commands::scanning::cancel_scan,
            commands::scanning::list_extension_files,
            commands::cleanup::classify_paths,
            commands::cleanup::execute_cleanup,
            commands::cleanup::suggest_cleanup,
            commands::duplicates::scan_duplicates,
            commands::reports::save_report
        ])
        .run(tauri::generate_context!())
        .expect("error while running DiskScope");
}
