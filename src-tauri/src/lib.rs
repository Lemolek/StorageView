pub mod apps;
pub mod cleanup;
pub mod commands;
pub mod core;
pub mod duplicates;
pub mod reports;
pub mod scanning;
pub mod search;
pub mod system;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .manage(std::sync::Arc::new(scanning::ScanState::default()))
        .setup(|app| {
            core::migration::migrate_legacy_app_data(app.handle());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::app::get_app_info,
            commands::system::list_disks,
            commands::system::open_path,
            commands::system::reveal_path,
            commands::scanning::start_scan,
            commands::scanning::cancel_scan,
            commands::scanning::list_extension_files,
            commands::scanning::browse_directory,
            commands::search::start_search,
            commands::apps::list_installed_apps,
            commands::apps::launch_uninstall,
            commands::apps::find_app_leftovers,
            commands::cleanup::classify_paths,
            commands::cleanup::execute_cleanup,
            commands::cleanup::suggest_cleanup,
            commands::cleanup::recycle_bin_summary,
            commands::cleanup::empty_recycle_bin,
            commands::duplicates::scan_duplicates,
            commands::reports::save_report
        ])
        .run(tauri::generate_context!())
        .expect("error while running StorageView");
}
