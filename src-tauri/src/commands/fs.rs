use serde::Serialize;
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize)]
pub struct DirEntry {
    pub name: String,
    pub path: String,
    #[serde(rename = "isDirectory")]
    pub is_directory: bool,
    pub mtime: Option<u64>,
    pub size: Option<u64>,
}

#[derive(Debug, Serialize)]
pub struct DirEntryWithPreview {
    pub name: String,
    pub path: String,
    #[serde(rename = "isDirectory")]
    pub is_directory: bool,
    pub mtime: Option<u64>,
    pub size: Option<u64>,
    pub preview: Option<String>,
}

fn read_dir_entries(dir_path: &str) -> Result<Vec<DirEntry>, String> {
    let path = Path::new(dir_path);
    if !path.is_dir() {
        return Ok(vec![]);
    }
    let mut entries: Vec<DirEntry> = vec![];

    let read_dir = fs::read_dir(path).map_err(|e| e.to_string())?;
    for entry in read_dir.flatten() {
        let name = entry.file_name().to_string_lossy().to_string();
        let full_path = entry.path();
        let is_dir = entry.file_type().map(|t| t.is_dir()).unwrap_or(false);

        if !is_dir && !name.ends_with(".json") && !name.ends_with(".md") {
            continue;
        }

        if name == ".trash" {
            continue;
        }

        let metadata = fs::metadata(&full_path).ok();
        entries.push(DirEntry {
            name,
            path: full_path.to_string_lossy().to_string(),
            is_directory: is_dir,
            mtime: metadata
                .as_ref()
                .and_then(|m| m.modified().ok())
                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|d| d.as_millis() as u64),
            size: metadata.as_ref().map(|m| m.len()),
        });
    }

    entries.sort_by(|a, b| {
        if a.is_directory && !b.is_directory {
            std::cmp::Ordering::Less
        } else if !a.is_directory && b.is_directory {
            std::cmp::Ordering::Greater
        } else {
            b.mtime
                .unwrap_or(0)
                .cmp(&a.mtime.unwrap_or(0))
        }
    });

    Ok(entries)
}

fn extract_text(node: &serde_json::Value) -> String {
    if let Some(s) = node.as_str() {
        return s.to_string();
    }
    if let Some(text) = node.get("text").and_then(|v| v.as_str()) {
        return text.to_string();
    }
    if let Some(content) = node.get("content").and_then(|v| v.as_array()) {
        return content
            .iter()
            .map(|n| extract_text(n))
            .collect::<Vec<_>>()
            .join(" ");
    }
    String::new()
}

#[tauri::command]
pub fn read_directory(dir_path: String) -> Result<Vec<DirEntry>, String> {
    read_dir_entries(&dir_path)
}

#[tauri::command]
pub fn read_directory_recursive(dir_path: String) -> Result<Vec<DirEntryWithPreview>, String> {
    let mut result: Vec<DirEntryWithPreview> = vec![];

    fn walk(
        dir: &str,
        result: &mut Vec<DirEntryWithPreview>,
    ) -> Result<(), String> {
        let entries = read_dir_entries(dir)?;
        for e in entries {
            let idx = result.len();
            result.push(DirEntryWithPreview {
                name: e.name.clone(),
                path: e.path.clone(),
                is_directory: e.is_directory,
                mtime: e.mtime,
                size: e.size,
                preview: None,
            });
            if e.is_directory {
                walk(&e.path, result)?;
            } else {
                if let Ok(content) = fs::read_to_string(&e.path) {
                    if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                        let text = extract_text(&json);
                        result[idx].preview =
                            Some(text.chars().take(500).collect());
                    }
                }
            }
        }
        Ok(())
    }

    walk(&dir_path, &mut result)?;
    Ok(result)
}

#[tauri::command]
pub fn read_file(file_path: String) -> Result<String, String> {
    fs::read_to_string(&file_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn write_file(file_path: String, content: String) -> Result<(), String> {
    if let Some(parent) = Path::new(&file_path).parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(&file_path, content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_entry(entry_path: String) -> Result<bool, String> {
    let p = Path::new(&entry_path);
    let parent_dir = p.parent().ok_or("no parent")?;
    let trash_dir = parent_dir.join(".trash");
    fs::create_dir_all(&trash_dir).map_err(|e| e.to_string())?;

    let filename = p.file_name().ok_or("no filename")?;
    let ts = chrono::Utc::now().timestamp_millis();
    let trash_path = trash_dir.join(format!("{}-{}", ts, filename.to_string_lossy()));

    fs::rename(&entry_path, &trash_path)
        .map(|_| true)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn count_directory_contents(dir_path: String) -> Result<usize, String> {
    fn walk(dir: &Path) -> Result<usize, String> {
        let mut count = 0;
        let entries = fs::read_dir(dir).map_err(|e| e.to_string())?;
        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().to_string();
            if name == ".trash" {
                continue;
            }
            if entry.file_type().map(|t| t.is_dir()).unwrap_or(false) {
                count += walk(&entry.path())?;
            } else {
                count += 1;
            }
        }
        Ok(count)
    }
    walk(Path::new(&dir_path))
}

#[tauri::command]
pub fn list_trash_items(parent_path: String) -> Result<Vec<DirEntry>, String> {
    let trash_dir = Path::new(&parent_path).join(".trash");
    if !trash_dir.is_dir() {
        return Ok(vec![]);
    }
    let read_dir = fs::read_dir(&trash_dir).map_err(|e| e.to_string())?;
    let mut entries: Vec<DirEntry> = vec![];
    for entry in read_dir.flatten() {
        let name = entry.file_name().to_string_lossy().to_string();
        let full_path = entry.path();
        let is_dir = entry.file_type().map(|t| t.is_dir()).unwrap_or(false);
        let metadata = fs::metadata(&full_path).ok();
        let display_name = name
            .chars()
            .skip_while(|c| c.is_ascii_digit())
            .skip_while(|c| *c == '-')
            .collect::<String>();

        entries.push(DirEntry {
            name: display_name,
            path: full_path.to_string_lossy().to_string(),
            is_directory: is_dir,
            mtime: metadata
                .as_ref()
                .and_then(|m| m.modified().ok())
                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|d| d.as_millis() as u64),
            size: metadata.map(|m| m.len()),
        });
    }
    Ok(entries)
}

#[tauri::command]
pub fn restore_from_trash(
    trash_path: String,
    original_path: String,
) -> Result<Option<String>, String> {
    let orig = Path::new(&original_path);
    let ext = orig.extension().map(|e| e.to_string_lossy().to_string()).unwrap_or_default();
    let base = orig
        .file_stem()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_default();
    let parent = orig.parent().ok_or("no parent")?;

    let mut restore_path = original_path.clone();
    let mut counter = 1;
    while Path::new(&restore_path).exists() {
        if ext.is_empty() {
            restore_path = parent
                .join(format!("{}(restored{})", base, counter))
                .to_string_lossy()
                .to_string();
        } else {
            restore_path = parent
                .join(format!("{}(restored{}).{}", base, counter, ext))
                .to_string_lossy()
                .to_string();
        }
        counter += 1;
    }

    fs::rename(&trash_path, &restore_path)
        .map(|_| Some(restore_path))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn permanent_delete(entry_path: String) -> Result<bool, String> {
    let p = Path::new(&entry_path);
    if p.is_dir() {
        fs::remove_dir_all(p).map_err(|e| e.to_string())?;
    } else if p.is_file() {
        fs::remove_file(p).map_err(|e| e.to_string())?;
    }
    Ok(true)
}

#[tauri::command]
pub fn rename_entry(old_path: String, new_path: String) -> Result<bool, String> {
    if let Some(parent) = Path::new(&new_path).parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::rename(&old_path, &new_path)
        .map(|_| true)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn make_directory(dir_path: String) -> Result<(), String> {
    fs::create_dir_all(&dir_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn file_exists(file_path: String) -> bool {
    Path::new(&file_path).exists()
}
