import { contextBridge, ipcRenderer, IpcRendererEvent, webUtils } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Electron 32+ 已移除 File.path，拖拽文件需经 webUtils 获取真实路径
  getPathForFile: (file: File): string => webUtils.getPathForFile(file),

  readDirectory: (dirPath: string, extensions?: string[]): Promise<Array<import('../src/electron-api').DirEntry>> =>
    ipcRenderer.invoke('readDirectory', dirPath, extensions),

  readDirectoryRecursive: (dirPath: string): Promise<Array<import('../src/electron-api').DirEntry & { preview?: string }>> =>
    ipcRenderer.invoke('readDirectoryRecursive', dirPath),

  readFile: (filePath: string): Promise<string> =>
    ipcRenderer.invoke('readFile', filePath),

  getFileStats: (filePath: string): Promise<{ mtime: number; isDirectory: boolean }> =>
    ipcRenderer.invoke('getFileStats', filePath),

  writeFile: (filePath: string, content: string): Promise<void> =>
    ipcRenderer.invoke('writeFile', { filePath, content }),

  deleteEntry: (entryPath: string): Promise<boolean> =>
    ipcRenderer.invoke('deleteEntry', entryPath),

  countDirectoryContents: (dirPath: string): Promise<number> =>
    ipcRenderer.invoke('countDirectoryContents', dirPath),

  listTrashItems: (parentPath: string): Promise<Array<{ name: string; path: string; isDirectory: boolean }>> =>
    ipcRenderer.invoke('listTrashItems', parentPath),

  restoreFromTrash: (trashPath: string, originalPath: string): Promise<string | null> =>
    ipcRenderer.invoke('restoreFromTrash', { trashPath, originalPath }),

  permanentDelete: (entryPath: string): Promise<boolean> =>
    ipcRenderer.invoke('permanentDelete', entryPath),

  renameEntry: (oldPath: string, newPath: string): Promise<boolean> =>
    ipcRenderer.invoke('renameEntry', { oldPath, newPath }),

  openInExplorer: (targetPath: string): Promise<boolean> =>
    ipcRenderer.invoke('openInExplorer', targetPath),

  makeDirectory: (dirPath: string): Promise<void> =>
    ipcRenderer.invoke('makeDirectory', dirPath),

  fileExists: (filePath: string): Promise<boolean> =>
    ipcRenderer.invoke('fileExists', filePath),

  getDefaultSaveDir: (): Promise<string> =>
    ipcRenderer.invoke('getDefaultSaveDir'),

  buildExportHtml: (bodyHtml: string, darkMode: boolean): Promise<string> =>
    ipcRenderer.invoke('buildExportHtml', { bodyHtml, darkMode }),

  exportPdfToPath: (filePath: string, html: string, darkMode: boolean): Promise<string | null> =>
    ipcRenderer.invoke('exportPdfToPath', { filePath, html, darkMode }),

  onMenuAction: (callback: (action: string) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, action: string) => callback(action)
    ipcRenderer.on('menu-action', handler)
    return () => ipcRenderer.removeListener('menu-action', handler)
  },

  onToggleDarkMode: (callback: () => void): (() => void) => {
    const handler = () => callback()
    ipcRenderer.on('toggle-dark-mode', handler)
    return () => ipcRenderer.removeListener('toggle-dark-mode', handler)
  },

  onBeforeClose: (callback: () => Promise<void>): (() => void) => {
    const handler = async () => {
      try { await callback() } finally { ipcRenderer.send('close-response') }
    }
    ipcRenderer.on('before-close', handler)
    return () => ipcRenderer.removeListener('before-close', handler)
  },

  closeConfirmed: (): void => {
    ipcRenderer.send('close-confirmed')
  },

  quitApp: (): Promise<void> => ipcRenderer.invoke('quitApp'),

  windowMinimize: (): Promise<void> => ipcRenderer.invoke('windowMinimize'),

  windowMaximize: (): Promise<void> => ipcRenderer.invoke('windowMaximize'),

  windowClose: (): Promise<void> => ipcRenderer.invoke('windowClose'),

  windowIsMaximized: (): Promise<boolean> => ipcRenderer.invoke('windowIsMaximized'),

  showOpenFileDialog: (startingPath?: string, filters?: Array<{ name: string; extensions: string[] }>): Promise<string | null> =>
    ipcRenderer.invoke('showOpenFileDialog', { startingPath, filters }),

  showSaveFileDialog: (defaultName?: string, startingPath?: string, filters?: Array<{ name: string; extensions: string[] }>): Promise<string | null> =>
    ipcRenderer.invoke('showSaveFileDialog', { defaultName, startingPath, filters }),

  showFolderPickerDialog: (): Promise<string | null> =>
    ipcRenderer.invoke('showFolderPickerDialog'),

  showImportFileDialog: (): Promise<string[]> =>
    ipcRenderer.invoke('showImportFileDialog'),

  checkForUpdates: (): Promise<import('../src/electron-api').UpdateInfo> =>
    ipcRenderer.invoke('checkForUpdates'),

  onMaximizeChange: (callback: (maximized: boolean) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, maximized: boolean) => callback(maximized)
    ipcRenderer.on('maximize-change', handler)
    return () => ipcRenderer.removeListener('maximize-change', handler)
  },
})
