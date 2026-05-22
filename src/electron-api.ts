export interface DirEntry {
  name: string
  path: string
  isDirectory: boolean
  mtime?: number
  size?: number
}

export interface ElectronAPI {
  readDirectory(dirPath: string): Promise<DirEntry[]>
  readDirectoryRecursive(dirPath: string): Promise<Array<DirEntry & { preview?: string }>>
  readFile(filePath: string): Promise<string>
  writeFile(filePath: string, content: string): Promise<void>
  makeDirectory(dirPath: string): Promise<void>
  fileExists(filePath: string): Promise<boolean>
  getDefaultSaveDir(): Promise<string>
  getHomePath(): Promise<string>
  getSystemPath(name: string): Promise<string | null>
  getDrives(): Promise<string[]>
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
  onMaximizeChange(callback: (maximized: boolean) => void): () => void
}
