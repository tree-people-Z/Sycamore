import { invoke } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'

export interface DirEntry {
  name: string
  path: string
  isDirectory: boolean
  mtime?: number
  size?: number
}

async function openFileDialog(startingPath?: string): Promise<string | null> {
  const { open } = await import('@tauri-apps/plugin-dialog')
  const path = await open({
    title: '打开文件',
    filters: [{ name: 'Sycamore Files', extensions: ['json', 'md'] }],
    defaultPath: startingPath,
    multiple: false,
    directory: false,
  })
  return path ?? null
}

async function saveFileDialog(defaultName?: string, startingPath?: string): Promise<string | null> {
  const { save } = await import('@tauri-apps/plugin-dialog')
  const defaultPath = defaultName
    ? (startingPath ? startingPath + '\\' + defaultName : defaultName)
    : startingPath
  return await save({
    title: '保存文件',
    filters: [{ name: 'Sycamore Files', extensions: ['json', 'md', 'html', 'pdf'] }],
    defaultPath,
  }) ?? null
}

async function folderPickerDialog(): Promise<string | null> {
  const { open } = await import('@tauri-apps/plugin-dialog')
  const path = await open({
    title: '选择文件夹',
    directory: true,
    multiple: false,
  })
  return path ?? null
}

export const tauriAPI = {
  readDirectory: (dirPath: string) => invoke<DirEntry[]>('read_directory', { dirPath }),
  readDirectoryRecursive: (dirPath: string) => invoke<Array<DirEntry & { preview?: string }>>('read_directory_recursive', { dirPath }),
  readFile: (filePath: string) => invoke<string>('read_file', { filePath }),
  writeFile: (filePath: string, content: string) => invoke<void>('write_file', { filePath, content }),
  makeDirectory: (dirPath: string) => invoke<void>('make_directory', { dirPath }),
  deleteEntry: (entryPath: string) => invoke<boolean>('delete_entry', { entryPath }),
  countDirectoryContents: (dirPath: string) => invoke<number>('count_directory_contents', { dirPath }),
  listTrashItems: (parentPath: string) => invoke<Array<{ name: string; path: string; isDirectory: boolean }>>('list_trash_items', { parentPath }),
  restoreFromTrash: (trashPath: string, originalPath: string) =>
    invoke<string | null>('restore_from_trash', { trashPath, originalPath }),
  permanentDelete: (entryPath: string) => invoke<boolean>('permanent_delete', { entryPath }),
  renameEntry: (oldPath: string, newPath: string) => invoke<boolean>('rename_entry', { oldPath, newPath }),
  openInExplorer: (targetPath: string) => invoke<boolean>('open_in_explorer', { targetPath }),
  fileExists: (filePath: string) => invoke<boolean>('file_exists', { filePath }),
  getDefaultSaveDir: () => invoke<string>('get_default_save_dir'),
  exportPdfToPath: (filePath: string, html: string, darkMode: boolean) =>
    invoke<string | null>('export_pdf_to_path', { filePath, html, darkMode }),

  onMenuAction(callback: (action: string) => void): UnlistenFn {
    const promise = listen<string>('menu-action', (event) => callback(event.payload))
    let unlisten: UnlistenFn | null = null
    promise.then((fn) => { unlisten = fn })
    return () => { unlisten?.() }
  },

  onToggleDarkMode(callback: () => void): UnlistenFn {
    const promise = listen('toggle-dark-mode', () => callback())
    let unlisten: UnlistenFn | null = null
    promise.then((fn) => { unlisten = fn })
    return () => { unlisten?.() }
  },

  onBeforeClose(callback: () => Promise<void>): UnlistenFn {
    const promise = listen('before-close', () => { callback() })
    let unlisten: UnlistenFn | null = null
    promise.then((fn) => { unlisten = fn })
    return () => { unlisten?.() }
  },

  closeConfirmed(): void {
    invoke('force_close')
  },

  quitApp: () => invoke<void>('quit_app'),

  windowMinimize: () => invoke<void>('window_minimize'),
  windowMaximize: () => invoke<void>('window_maximize'),
  windowClose: () => invoke<void>('force_close'),
  windowIsMaximized: () => invoke<boolean>('window_is_maximized'),

  showOpenFileDialog: (startingPath?: string) => openFileDialog(startingPath),
  showSaveFileDialog: (defaultName?: string, startingPath?: string) => saveFileDialog(defaultName, startingPath),
  showFolderPickerDialog: () => folderPickerDialog(),

  onMaximizeChange(callback: (maximized: boolean) => void): UnlistenFn {
    const promise = listen<boolean>('maximize-change', (event) => callback(event.payload))
    let unlisten: UnlistenFn | null = null
    promise.then((fn) => { unlisten = fn })
    return () => { unlisten?.() }
  },
}

export type TauriAPI = typeof tauriAPI
