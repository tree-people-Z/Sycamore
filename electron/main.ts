import { app, BrowserWindow, Menu, ipcMain, shell, dialog } from 'electron'
import path from 'path'
import fs from 'fs/promises'
import { buildExportHtml } from './export-template'

const isDev = !!process.env.VITE_DEV_SERVER_URL

let mainWindow: BrowserWindow | null = null
let closeInProgress = false

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    createMenu()
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 680,
    minHeight: 400,
    frame: false,
    title: 'Sycamore',
    titleBarStyle: 'hidden',
    icon: path.join(__dirname, '../build-assets/icon.ico'),
    ...(process.platform === 'darwin'
      ? { trafficLightPosition: { x: -100, y: -100 } }
      : { backgroundColor: '#f5f5f7' }),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.platform === 'darwin') {
    mainWindow.setVibrancy?.('under-window')
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('close', (e) => {
    if (!closeInProgress) {
      closeInProgress = true
      e.preventDefault()
      mainWindow?.webContents.send('before-close')
      setTimeout(() => { closeInProgress = false }, 10000)
    }
  })

  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('maximize-change', true)
  })

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('maximize-change', false)
  })

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL!)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('menu-action', 'new'),
        },
        {
          label: '打开',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow?.webContents.send('menu-action', 'open'),
        },
        { type: 'separator' },
        {
          label: '保存',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow?.webContents.send('menu-action', 'save'),
        },
        {
          label: '另存为',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => mainWindow?.webContents.send('menu-action', 'save-as'),
        },
        { type: 'separator' },
        {
          label: '导出 HTML',
          accelerator: 'CmdOrCtrl+Shift+H',
          click: () => mainWindow?.webContents.send('menu-action', 'export-html'),
        },
        {
          label: '导出 Markdown',
          accelerator: 'CmdOrCtrl+Shift+M',
          click: () => mainWindow?.webContents.send('menu-action', 'export-markdown'),
        },
        { type: 'separator' },
        {
          label: '导入 Markdown',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => mainWindow?.webContents.send('menu-action', 'import-markdown'),
        },
        {
          label: '批量导入 Markdown',
          click: () => mainWindow?.webContents.send('menu-action', 'batch-import-markdown'),
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'CmdOrCtrl+Q',
          click: () => mainWindow?.webContents.send('menu-action', 'exit'),
        },
      ],
    },
    {
      label: '编辑',
      submenu: [
        {
          label: '撤销',
          accelerator: 'CmdOrCtrl+Z',
          click: () => mainWindow?.webContents.send('menu-action', 'undo'),
        },
        {
          label: '重做',
          accelerator: 'CmdOrCtrl+Shift+Z',
          click: () => mainWindow?.webContents.send('menu-action', 'redo'),
        },
        { type: 'separator' },
        {
          label: '剪切',
          accelerator: 'CmdOrCtrl+X',
          click: () => mainWindow?.webContents.send('menu-action', 'cut'),
        },
        {
          label: '复制',
          accelerator: 'CmdOrCtrl+C',
          click: () => mainWindow?.webContents.send('menu-action', 'copy'),
        },
        {
          label: '粘贴',
          accelerator: 'CmdOrCtrl+V',
          click: () => mainWindow?.webContents.send('menu-action', 'paste'),
        },
      ],
    },
    {
      label: '视图',
      submenu: [
        {
          label: '深色模式切换',
          click: () => mainWindow?.webContents.send('toggle-dark-mode'),
        },
      ],
    },
  ]

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    })
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

interface DirEntry {
  name: string
  path: string
  isDirectory: boolean
  mtime?: number
  size?: number
}

async function readDirEntries(dirPath: string): Promise<DirEntry[]> {
  try {
    const dirents = await fs.readdir(dirPath, { withFileTypes: true })
    const entries: DirEntry[] = []
    for (const e of dirents) {
      if (!e.isDirectory() && !e.name.endsWith('.json') && !e.name.endsWith('.md')) continue
      const fullPath = path.join(dirPath, e.name)
      const entry: DirEntry = { name: e.name, path: fullPath, isDirectory: e.isDirectory() }
      try {
        const stat = await fs.stat(fullPath)
        entry.mtime = stat.mtimeMs
        entry.size = stat.size
      } catch {}
      entries.push(entry)
    }
    entries.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1
      if (!a.isDirectory && b.isDirectory) return 1
      return (b.mtime || 0) - (a.mtime || 0)
    })
    return entries
  } catch { return [] }
}

function extractText(node: any): string {
  if (typeof node === 'string') return node
  if (node?.text) return node.text
  if (node?.content?.length) return node.content.map((n: any) => extractText(n)).join(' ')
  return ''
}

ipcMain.handle('readDirectory', async (_event, dirPath: string) => readDirEntries(dirPath))

ipcMain.handle('readDirectoryRecursive', async (_event, dirPath: string) => {
  const result: Array<{ name: string; path: string; isDirectory: boolean; preview?: string }> = []
  async function walk(dir: string) {
    const entries = await readDirEntries(dir)
    for (const e of entries) {
      result.push(e)
      if (e.isDirectory) { await walk(e.path); continue }
      try {
        const content = await fs.readFile(e.path, 'utf-8')
        result[result.length - 1].preview = extractText(JSON.parse(content)).slice(0, 500)
      } catch {}
    }
  }
  await walk(dirPath)
  return result
})

ipcMain.handle('readFile', async (_event, filePath: string) => fs.readFile(filePath, 'utf-8'))

ipcMain.handle('writeFile', async (_event, { filePath, content }: { filePath: string; content: string }) => {
  await fs.writeFile(filePath, content, 'utf-8')
})

ipcMain.handle('deleteEntry', async (_event, entryPath: string) => {
  try {
    const parentDir = path.dirname(entryPath)
    const trashDir = path.join(parentDir, '.trash')
    await fs.mkdir(trashDir, { recursive: true })
    await fs.rename(entryPath, path.join(trashDir, `${Date.now()}-${path.basename(entryPath)}`))
    return true
  } catch { return false }
})

ipcMain.handle('countDirectoryContents', async (_event, dirPath: string) => {
  try {
    let count = 0
    async function walk(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      for (const e of entries) {
        if (e.name === '.trash') continue
        if (e.isDirectory()) { await walk(path.join(dir, e.name)) }
        else { count++ }
      }
    }
    await walk(dirPath)
    return count
  } catch { return 0 }
})

ipcMain.handle('listTrashItems', async (_event, parentPath: string) => {
  try {
    const trashDir = path.join(parentPath, '.trash')
    const dirents = await fs.readdir(trashDir, { withFileTypes: true })
    return dirents.map(e => ({
      name: e.name.replace(/^\d+-/, ''),
      path: path.join(trashDir, e.name),
      isDirectory: e.isDirectory(),
    }))
  } catch { return [] }
})

ipcMain.handle('restoreFromTrash', async (_event, { trashPath, originalPath }: { trashPath: string; originalPath: string }) => {
  try {
    const ext = path.extname(originalPath)
    const base = path.basename(originalPath, ext)
    const parentDir = path.dirname(originalPath)
    let restorePath = originalPath
    let counter = 1
    while (await fs.access(restorePath).then(() => true).catch(() => false)) {
      restorePath = path.join(parentDir, `${base}(restored${counter})${ext}`)
      counter++
    }
    await fs.rename(trashPath, restorePath)
    return restorePath
  } catch { return null }
})

ipcMain.handle('permanentDelete', async (_event, entryPath: string) => {
  try {
    const stat = await fs.stat(entryPath)
    if (stat.isDirectory()) await fs.rm(entryPath, { recursive: true, force: true })
    else await fs.unlink(entryPath)
    return true
  } catch { return false }
})

ipcMain.handle('renameEntry', async (_event, { oldPath, newPath }: { oldPath: string; newPath: string }) => {
  try {
    await fs.rename(oldPath, newPath)
    return true
  } catch { return false }
})

ipcMain.handle('openInExplorer', async (_event, targetPath: string) => {
  try {
    const stat = await fs.stat(targetPath)
    if (stat.isDirectory()) {
      await shell.openPath(targetPath)
    } else {
      shell.showItemInFolder(targetPath)
    }
    return true
  } catch { return false }
})

ipcMain.handle('makeDirectory', async (_event, dirPath: string) => {
  await fs.mkdir(dirPath, { recursive: true })
})

ipcMain.handle('fileExists', async (_event, filePath: string) => {
  try { await fs.access(filePath); return true }
  catch { return false }
})

ipcMain.handle('getDefaultSaveDir', async () => {
  return path.join(app.getPath('documents'), 'Sycamore笔记')
})

ipcMain.handle('exportPdfToPath', async (_event, { filePath, html, darkMode }: { filePath: string; html: string; darkMode: boolean }) => {
  const tempFile = path.join(app.getPath('temp'), `editor-export-${Date.now()}.html`)
  await fs.writeFile(tempFile, buildExportHtml(html, darkMode), 'utf-8')
  const pdfWindow = new BrowserWindow({
    width: 800, height: 600, show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  })
  try {
    await pdfWindow.loadFile(tempFile)
    const pdf = await pdfWindow.webContents.printToPDF({ printBackground: true, preferCSSPageSize: true })
    await fs.writeFile(filePath, pdf)
    return filePath
  } finally {
    pdfWindow.destroy()
    try { await fs.unlink(tempFile) } catch {}
  }
})

ipcMain.handle('quitApp', () => { app.quit() })

ipcMain.on('close-response', () => { closeInProgress = false })

ipcMain.on('close-confirmed', () => {
  closeInProgress = false
  mainWindow?.destroy()
})

ipcMain.handle('windowMinimize', () => { mainWindow?.minimize() })

ipcMain.handle('windowMaximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize()
  else mainWindow?.maximize()
})

ipcMain.handle('windowClose', () => { mainWindow?.close() })

ipcMain.handle('windowIsMaximized', () => mainWindow?.isMaximized() ?? false)

ipcMain.handle('showOpenFileDialog', async (_event, { startingPath }: { startingPath?: string }) => {
  const opts: Electron.OpenDialogOptions = {
    title: '打开文件',
    filters: [{ name: 'Sycamore Files', extensions: ['json', 'md'] }],
    properties: ['openFile'],
  }
  if (startingPath) opts.defaultPath = startingPath
  const result = await dialog.showOpenDialog(mainWindow!, opts)
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('showSaveFileDialog', async (_event, { defaultName, startingPath }: { defaultName?: string; startingPath?: string }) => {
  const opts: Electron.SaveDialogOptions = {
    title: '保存文件',
    filters: [{ name: 'Sycamore Files', extensions: ['json', 'md', 'html', 'pdf'] }],
  }
  if (defaultName) {
    opts.defaultPath = (startingPath ? startingPath + '\\' : '') + defaultName
  } else if (startingPath) {
    opts.defaultPath = startingPath
  }
  const result = await dialog.showSaveDialog(mainWindow!, opts)
  return result.canceled ? null : result.filePath
})

ipcMain.handle('showFolderPickerDialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: '选择文件夹',
    properties: ['openDirectory'],
  })
  return result.canceled ? null : result.filePaths[0]
})
