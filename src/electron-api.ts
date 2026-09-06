export interface DirEntry {
  name: string
  path: string
  isDirectory: boolean
  mtime?: number
  size?: number
}

export interface UpdateInfo {
  hasUpdate: boolean
  latestVersion: string
  downloadUrl: string
  releaseNotes?: string
}

export interface FileFilter {
  name: string
  extensions: string[]
}

export interface ElectronAPI {
  getPathForFile(file: File): string
  readDirectory(dirPath: string, extensions?: string[]): Promise<DirEntry[]>
  readDirectoryRecursive(dirPath: string): Promise<Array<DirEntry & { preview?: string }>>
  readFile(filePath: string): Promise<string>
  writeFile(filePath: string, content: string): Promise<void>
  makeDirectory(dirPath: string): Promise<void>
  deleteEntry(entryPath: string): Promise<boolean>
  countDirectoryContents(dirPath: string): Promise<number>
  listTrashItems(parentPath: string): Promise<Array<{ name: string; path: string; isDirectory: boolean }>>
  restoreFromTrash(trashPath: string, originalPath: string): Promise<string | null>
  permanentDelete(entryPath: string): Promise<boolean>
  renameEntry(oldPath: string, newPath: string): Promise<boolean>
  openInExplorer(targetPath: string): Promise<boolean>
  fileExists(filePath: string): Promise<boolean>
  getFileStats(filePath: string): Promise<{ mtime: number; isDirectory: boolean }>
  getDefaultSaveDir(): Promise<string>
  buildExportHtml(bodyHtml: string, darkMode: boolean): Promise<string>
  exportPdfToPath(filePath: string, html: string, darkMode: boolean): Promise<string | null>

  onMenuAction(callback: (action: string) => void): () => void
  onToggleDarkMode(callback: () => void): () => void
  onBeforeClose(callback: () => Promise<void>): () => void
  closeConfirmed(): void
  quitApp(): Promise<void>

  windowMinimize(): Promise<void>
  windowMaximize(): Promise<void>
  windowClose(): Promise<void>
  windowIsMaximized(): Promise<boolean>
  showOpenFileDialog(startingPath?: string, filters?: FileFilter[]): Promise<string | null>
  showSaveFileDialog(defaultName?: string, startingPath?: string, filters?: FileFilter[]): Promise<string | null>
  showFolderPickerDialog(): Promise<string | null>
  showImportFileDialog(): Promise<string[]>
  checkForUpdates(): Promise<UpdateInfo>
  onMaximizeChange(callback: (maximized: boolean) => void): () => void
  updateKeybindings(keybindings?: Record<string, string>): void
}
