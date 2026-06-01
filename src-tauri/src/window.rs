use tauri::{Emitter, Manager};

pub fn setup_window_events(app: &tauri::AppHandle) {
    let Some(window) = app.get_webview_window("main") else {
        return;
    };

    let w = window.clone();
    window.on_window_event(move |event| {
        match event {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                api.prevent_close();
                let _ = w.emit("before-close", ());
            }
            tauri::WindowEvent::Resized(_) => {
                let maximized = w.is_maximized().unwrap_or(false);
                let _ = w.emit("maximize-change", maximized);
            }
            _ => {}
        }
    });
}
