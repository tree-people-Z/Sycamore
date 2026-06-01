#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod menu;
mod utils;
mod window;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            window::setup_window_events(app.handle());
            menu::create_menu(app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::fs::read_directory,
            commands::fs::read_directory_recursive,
            commands::fs::read_file,
            commands::fs::write_file,
            commands::fs::delete_entry,
            commands::fs::count_directory_contents,
            commands::fs::list_trash_items,
            commands::fs::restore_from_trash,
            commands::fs::permanent_delete,
            commands::fs::rename_entry,
            commands::fs::make_directory,
            commands::fs::file_exists,
            commands::dialog::open_in_explorer,
            commands::dialog::get_default_save_dir,
            commands::window::window_minimize,
            commands::window::window_maximize,
            commands::window::window_is_maximized,
            commands::window::force_close,
            commands::window::quit_app,
            commands::pdf::export_pdf_to_path,
        ])
        .on_menu_event(|app, event| {
            menu::handle_menu_event(app, event.id().as_ref());
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
