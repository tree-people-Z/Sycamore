use crate::utils::export_template::build_export_html;
use std::fs;
use std::path::Path;
use std::process::Command;

#[tauri::command]
pub async fn export_pdf_to_path(
    file_path: String,
    html: String,
    dark_mode: bool,
) -> Result<Option<String>, String> {
    let full_html = build_export_html(&html, dark_mode);

    let tmp_dir = std::env::temp_dir();
    let tmp_file = tmp_dir.join(format!("sycamore-export-{}.html", chrono::Utc::now().timestamp_millis()));
    fs::write(&tmp_file, &full_html).map_err(|e| e.to_string())?;

    let result = try_headless_chrome(&tmp_file, &file_path).or_else(|| {
        try_wkhtmltopdf(&tmp_file, &file_path)
    });

    let _ = fs::remove_file(&tmp_file);

    match result {
        Some(Ok(())) => Ok(Some(file_path)),
        Some(Err(e)) => Err(e),
        None => Err("No PDF renderer available. Install wkhtmltopdf or Chrome.".into()),
    }
}

fn try_headless_chrome(_html_path: &Path, _output_path: &str) -> Option<Result<(), String>> {
    let chrome_paths = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    ];

    for chrome_path in &chrome_paths {
        if Path::new(chrome_path).exists() {
            let output = Command::new(chrome_path)
                .args([
                    "--headless",
                    "--disable-gpu",
                    &format!("--print-to-pdf={}", _output_path),
                    "--no-pdf-header-footer",
                    _html_path.to_str().unwrap_or(""),
                ])
                .output();

            match output {
                Ok(o) if o.status.success() => return Some(Ok(())),
                Ok(o) => {
                    let stderr = String::from_utf8_lossy(&o.stderr);
                    return Some(Err(format!("Chrome PDF failed: {}", stderr)));
                }
                Err(e) => return Some(Err(e.to_string())),
            }
        }
    }
    None
}

fn try_wkhtmltopdf(_html_path: &Path, _output_path: &str) -> Option<Result<(), String>> {
    let output = Command::new("wkhtmltopdf")
        .args([
            "--enable-local-file-access",
            _html_path.to_str().unwrap_or(""),
            _output_path,
        ])
        .output();

    match output {
        Ok(o) if o.status.success() => Some(Ok(())),
        Ok(o) => {
            let stderr = String::from_utf8_lossy(&o.stderr);
            Some(Err(format!("wkhtmltopdf failed: {}", stderr)))
        }
        Err(_) => None,
    }
}
