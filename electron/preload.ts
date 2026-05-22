import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  readDirectory: (dirPath: string): Promise<Array<import('../src/electron-api').DirEntry>> =>
    ipcRenderer.invoke('readDirectory', dirPath),

  readDirectoryRecursive: (dirPath: string): Promise<Array<import('../src/electron-api').DirEntry & { preview?: string }>> =>
    ipcRenderer.invoke('readDirectoryRecursive', dirPath),

  readFile: (filePath: string): Promise<string> =>
    ipcRenderer.invoke('readFile', filePath),

  writeFile: (filePath: string, content: string): Promise<void> =>
    ipcRenderer.invoke('writeFile', { filePath, content }),

  makeDirectory: (dirPath: string): Promise<void> =>
    ipcRenderer.invoke('makeDirectory', dirPath),

  fileExists: (filePath: string): Promise<boolean> =>
    ipcRenderer.invoke('fileExists', filePath),

  getDefaultSaveDir: (): Promise<string> =>
    ipcRenderer.invoke('getDefaultSaveDir'),

  getHomePath: (): Promise<string> =>
    ipcRenderer.invoke('getHomePath'),

  getSystemPath: (name: string): Promise<string | null> =>
    ipcRenderer.invoke('getSystemPath', name),

  getDrives: (): Promise<string[]> =>
    ipcRenderer.invoke('getDrives'),

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

  onMaximizeChange: (callback: (maximized: boolean) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, maximized: boolean) => callback(maximized)
    ipcRenderer.on('maximize-change', handler)
    return () => ipcRenderer.removeListener('maximize-change', handler)
  },
})
