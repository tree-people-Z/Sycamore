use tauri_plugin_opener::OpenerExt;

#[tauri::command]
pub async fn open_in_explorer(
    target_path: String,
    app: tauri::AppHandle,
) -> Result<bool, String> {
    let p = std::path::Path::new(&target_path);
    if p.is_dir() {
        app.opener().open_path(&target_path, None::<&str>)
            .map(|_| true)
            .map_err(|e| e.to_string())
    } else if p.exists() {
        if let Some(parent) = p.parent() {
            app.opener().reveal_item_in_dir(parent.to_string_lossy().as_ref())
                .map(|_| true)
                .map_err(|e| e.to_string())
        } else {
            Err("no parent dir".into())
        }
    } else {
        Err("path does not exist".into())
    }
}

#[tauri::command]
pub fn get_default_save_dir() -> String {
    dirs::document_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("Sycamore笔记")
        .to_string_lossy()
        .to_string()
}
