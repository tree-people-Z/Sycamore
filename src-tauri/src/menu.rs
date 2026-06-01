use tauri::menu::{MenuBuilder, SubmenuBuilder, MenuItemBuilder};
use tauri::{Emitter, Manager};

pub fn create_menu(app: &tauri::AppHandle) -> Result<(), tauri::Error> {
    let new_item = MenuItemBuilder::with_id("new", "新建").accelerator("CmdOrCtrl+N").build(app)?;
    let open_item = MenuItemBuilder::with_id("open", "打开").accelerator("CmdOrCtrl+O").build(app)?;
    let save_item = MenuItemBuilder::with_id("save", "保存").accelerator("CmdOrCtrl+S").build(app)?;
    let save_as_item = MenuItemBuilder::with_id("save-as", "另存为").accelerator("CmdOrCtrl+Shift+S").build(app)?;
    let export_html_item = MenuItemBuilder::with_id("export-html", "导出 HTML").accelerator("CmdOrCtrl+Shift+H").build(app)?;
    let export_md_item = MenuItemBuilder::with_id("export-markdown", "导出 Markdown").accelerator("CmdOrCtrl+Shift+M").build(app)?;
    let import_md_item = MenuItemBuilder::with_id("import-markdown", "导入 Markdown").accelerator("CmdOrCtrl+Shift+I").build(app)?;
    let batch_import_item = MenuItemBuilder::with_id("batch-import-markdown", "批量导入 Markdown").build(app)?;

    let file_menu = SubmenuBuilder::new(app, "文件")
        .item(&new_item)
        .item(&open_item)
        .separator()
        .item(&save_item)
        .item(&save_as_item)
        .separator()
        .item(&export_html_item)
        .item(&export_md_item)
        .separator()
        .item(&import_md_item)
        .item(&batch_import_item)
        .separator()
        .quit()
        .build()?;

    let edit_menu = SubmenuBuilder::new(app, "编辑")
        .undo()
        .redo()
        .separator()
        .cut()
        .copy()
        .paste()
        .build()?;

    let toggle_dark_item = MenuItemBuilder::with_id("toggle-dark-mode", "深色模式切换").build(app)?;

    let view_menu = SubmenuBuilder::new(app, "视图")
        .item(&toggle_dark_item)
        .build()?;

    let menu = MenuBuilder::new(app)
        .item(&file_menu)
        .item(&edit_menu)
        .item(&view_menu)
        .build()?;

    app.set_menu(menu)?;
    Ok(())
}

pub fn handle_menu_event(app: &tauri::AppHandle, id: &str) {
    let action = match id {
        "new" => "new",
        "open" => "open",
        "save" => "save",
        "save-as" => "save-as",
        "export-html" => "export-html",
        "export-markdown" => "export-markdown",
        "import-markdown" => "import-markdown",
        "batch-import-markdown" => "batch-import-markdown",
        "undo" => "undo",
        "redo" => "redo",
        "cut" => "cut",
        "copy" => "copy",
        "paste" => "paste",
        "toggle-dark-mode" => return emit_toggle_dark_mode(app),
        _ => return,
    };

    if let Some(window) = app.get_webview_window("main") {
        let _ = window.emit("menu-action", action);
    }
}

fn emit_toggle_dark_mode(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.emit("toggle-dark-mode", ());
    }
}
