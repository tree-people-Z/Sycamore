import { useState, useRef, useCallback, useEffect } from 'react'
import { Leaf } from 'lucide-react'
import Editor, { type EditorHandle } from './editor/Editor'
import WindowControls from './components/WindowControls'
import WelcomePage from './components/WelcomePage'
import Toolbar from './components/Toolbar'
import StatusBar from './components/StatusBar'
import Sidebar from './components/Sidebar'
import AiChatPanel from './components/AiChatPanel'
import SettingsPanel from './components/SettingsPanel'
import FormulaDialog from './components/FormulaDialog'
import ChartDialog from './components/ChartDialog'
import Dialogs from './components/Dialogs'
import ImageInputDialog from './components/ImageInputDialog'
import ToastContainer from './components/ToastContainer'
import { useTheme } from './hooks/useTheme'
import { useFileSystem } from './hooks/useFileSystem'
import { useSettings } from './hooks/useSettings'
import { useUnsavedGuard } from './hooks/useUnsavedGuard'
import { useDialogs } from './hooks/useDialogs'
import { useToast } from './hooks/useToast'
import { useAppUIState } from './hooks/useAppUIState'
import type { InlineFormatType, BlockFormatType } from './types'
import { convertMarkdownToJSON } from './utils/markdown-convert'
import { extractFileName } from './utils/path'
import { on } from './utils/emitter'

function App() {
  const { toasts, addToast, removeToast } = useToast()
  const editorRef = useRef<EditorHandle>(null)
  const { theme, darkMode, cycleTheme } = useTheme()
  const { settings, handleSettingsChange } = useSettings()
  const { dialogState, showUnsavedDialog, showSaveDialog, showOpenDialog, showFolderDialog, closeDialog } = useDialogs()
  const {
    folderPath, folderEntries, linkedFolderPath,
    handleLinkFolder, handleUnlinkFolder, handleRefreshFolder,
  } = useFileSystem(showFolderDialog)

  const {
    ui,
    setShowWelcome, setSidebarVisible, setSidebarPinned,
    toggleFocusMode, toggleEditorWide, toggleAiChat, openAiChat,
    setShowSettings, setShowFormulaDialog, setShowChartDialog,
    setShowImageInput, setImageUrlInput, setSelectedText,
    incrementWelcomeKey, setDocKey,
  } = useAppUIState()

  const [isModified, setIsModified] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [lineCount, setLineCount] = useState(0)
  const [hasContent, setHasContent] = useState(false)
  const sidebarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const confirmUnsaved = useUnsavedGuard(
    () => editorRef.current?.getModified() ?? false,
    () => editorRef.current?.saveFile() ?? Promise.resolve(),
    showUnsavedDialog,
  )

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (!e.relatedTarget && !ui.sidebarPinned) {
        if (sidebarTimerRef.current) clearTimeout(sidebarTimerRef.current)
        setSidebarVisible(false)
      }
    }
    document.addEventListener('mouseout', handle)
    return () => document.removeEventListener('mouseout', handle)
  }, [ui.sidebarPinned, setSidebarVisible])

  useEffect(() => {
    return on('open-ai-chat', () => openAiChat())
  }, [openAiChat])

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      const sidebar = document.querySelector('.sidebar-panel')
      const toggleBtn = (e.target as HTMLElement)?.closest?.('[data-sidebar-toggle]')
      if (ui.sidebarPinned && sidebar && !sidebar.contains(e.target as Node) && !toggleBtn) {
        setSidebarPinned(false)
        setSidebarVisible(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [ui.sidebarPinned, setSidebarPinned, setSidebarVisible])

  const handleExit = useCallback(async () => {
    if (await confirmUnsaved()) await window.electronAPI?.quitApp()
  }, [confirmUnsaved])

  const beforeClose = useCallback(async () => {
    if (await confirmUnsaved()) window.electronAPI?.closeConfirmed()
  }, [confirmUnsaved])

  const handleExportHtml = useCallback(async () => {
    const editor = editorRef.current
    if (!editor) return
    const fp = await showSaveDialog('untitled.html')
    if (!fp) return
    const html = editor.getExportHTML()
    const doc = await window.electronAPI?.buildExportHtml(html, darkMode)
    if (doc) await window.electronAPI?.writeFile(fp, doc)
  }, [showSaveDialog, darkMode])

  const handleExportPdf = useCallback(async () => {
    const editor = editorRef.current
    if (!editor) return
    const fp = await showSaveDialog('untitled.pdf')
    if (!fp) return
    await window.electronAPI?.exportPdfToPath(fp, editor.getExportHTML(), darkMode)
  }, [showSaveDialog, darkMode])

  const handleExportMarkdown = useCallback(async () => {
    const editor = editorRef.current
    if (!editor) return
    const fp = await showSaveDialog('untitled.md')
    if (!fp) return
    const md = editor.exportMarkdown()
    const note = '<!-- 由 Sycamore 导出。图片为外部链接，不在 Markdown 内嵌。 -->\n'
    await window.electronAPI?.writeFile(fp, note + md)
  }, [showSaveDialog])

  const handleImportMarkdown = useCallback(async () => {
    const editor = editorRef.current
    if (!editor) return
    const fp = await showOpenDialog()
    if (!fp) return
    if (!/\.md$/i.test(fp)) return
    const content = await window.electronAPI?.readFile(fp)
    if (content == null) return
    setShowWelcome(false)
    setHasContent(true)
    await editor.importMarkdown(content)
    const fileName = extractFileName(fp)
    editor.setTitle(fileName)
  }, [showOpenDialog, setShowWelcome])

  const handleBatchImportMarkdown = useCallback(async () => {
    const fp = await showFolderDialog()
    if (!fp) return
    const entries = await window.electronAPI?.readDirectory(fp)
    if (!entries) return
    const mdFiles = entries.filter(e => !e.isDirectory && /\.md$/i.test(e.name))
    if (mdFiles.length === 0) { addToast('所选文件夹中没有 Markdown 文件', 'info'); return }
    const baseDir = (linkedFolderPath || '').replace(/\\/g, '/') || await window.electronAPI?.getDefaultSaveDir()
    if (!baseDir) return
    const concurrency = 4
    let count = 0
    const processBatch = async (batch: typeof mdFiles) => {
      await Promise.all(batch.map(async (entry) => {
        const content = await window.electronAPI?.readFile(entry.path)
        if (!content) return
        const json = await convertMarkdownToJSON(content)
        const date = entry.mtime ? new Date(entry.mtime) : new Date()
        const monthDir = `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月`
        const dir = baseDir + '/' + monthDir
        await window.electronAPI?.makeDirectory(dir)
        let name = entry.name.replace(/\.md$/i, '.json')
        let counter = 1
        while (await window.electronAPI?.fileExists(dir + '/' + name)) {
          name = entry.name.replace(/\.md$/i, '') + `(${counter}).json`
          counter++
        }
        await window.electronAPI?.writeFile(dir + '/' + name, JSON.stringify(json, null, 2))
        count++
      }))
    }
    for (let i = 0; i < mdFiles.length; i += concurrency) {
      await processBatch(mdFiles.slice(i, i + concurrency))
    }
    addToast(`成功导入 ${count} 个文件`, 'success')
    handleRefreshFolder()
  }, [showFolderDialog, linkedFolderPath, handleRefreshFolder, addToast])

  const handleSaveCurrent = useCallback(async () => {
    await editorRef.current?.saveFile()
  }, [])

  useEffect(() => {
    const cleanup = window.electronAPI?.onMenuAction(async (action) => {
      const editor = editorRef.current
      if (!editor) return
      switch (action) {
        case 'new': setShowWelcome(false); await editor.newFile(); break
        case 'open': setShowWelcome(false); await editor.openFile(); break
        case 'save': setShowWelcome(false); await editor.saveFile(); break
        case 'save-as': await editor.saveAs(); handleRefreshFolder(); break
        case 'exit': await handleExit(); break
        case 'undo': editor.undo(); break
        case 'redo': editor.redo(); break
        case 'cut': editor.focus(); try { document.execCommand('cut') } catch { /* ignore */ } break
        case 'copy': try { const t = editor.getText(); if (t) navigator.clipboard.writeText(t) } catch { /* ignore */ } break
        case 'paste': editor.focus(); break
        case 'export-html': await handleExportHtml(); break
        case 'export-pdf': await handleExportPdf(); break
        case 'export-markdown': await handleExportMarkdown(); break
        case 'import-markdown': await handleImportMarkdown(); break
        case 'batch-import-markdown': await handleBatchImportMarkdown(); break
      }
    })
    return () => cleanup?.()
  }, [handleExit, handleExportHtml, handleExportPdf, handleExportMarkdown, handleImportMarkdown, handleBatchImportMarkdown, handleRefreshFolder, setShowWelcome])

  useEffect(() => {
    window.electronAPI?.checkForUpdates().then(result => {
      if (result?.hasUpdate) {
        addToast(`发现新版本 v${result.latestVersion}，可在设置中下载`, 'info', 10000)
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const cleanup = window.electronAPI?.onBeforeClose(beforeClose)
    return () => cleanup?.()
  }, [beforeClose])

  const handleNew = useCallback(() => {
    setShowWelcome(false)
    setHasContent(true)
    setTimeout(() => editorRef.current?.newFile(), 0)
  }, [setShowWelcome])

  const handleSave = useCallback(async () => {
    setShowWelcome(false)
    await editorRef.current?.saveFile()
  }, [setShowWelcome])

  const handleContentChange = useCallback((content: string) => {
    if (ui.showWelcome && content) {
      setShowWelcome(false)
      setHasContent(true)
    }
  }, [ui.showWelcome, setShowWelcome])

  const handleImageSubmit = useCallback(() => {
    const url = ui.imageUrlInput.trim()
    if (!url) return
    editorRef.current?.formatInline('image', url)
    editorRef.current?.focus()
    setShowImageInput(false)
    setImageUrlInput('')
  }, [ui.imageUrlInput, setShowImageInput, setImageUrlInput])

  const handleFormat = useCallback((type: InlineFormatType, url?: string) => {
    const editor = editorRef.current
    if (!editor) return
    if (type === 'image') { setImageUrlInput('https://'); setShowImageInput(true); return }
    if (type === 'link' && !url) {
      const input = prompt('输入链接 URL:')
      if (input) editor.formatInline('link', input)
      return
    }
    editor.formatInline(type, url)
  }, [setImageUrlInput, setShowImageInput])

  const handleBlock = useCallback((type: BlockFormatType) => {
    const editor = editorRef.current
    if (!editor) return
    if (type === 'math') { setShowFormulaDialog(true); return }
    editor.insertBlock(type)
  }, [setShowFormulaDialog])

  const handleFormulaInsert = useCallback((expression: string, displayMode: boolean) => {
    editorRef.current?.insertText({
      type: displayMode ? 'mathBlock' : 'mathInline',
      attrs: { tex: expression },
    })
    setShowFormulaDialog(false)
  }, [setShowFormulaDialog])

  const handleChartInsert = useCallback((content: string) => {
    editorRef.current?.insertText({
      type: 'mermaidDiagram', attrs: { code: content },
    })
    setShowChartDialog(false)
  }, [setShowChartDialog])

  const handleOpenFile = useCallback(async (filePath: string) => {
    const editor = editorRef.current
    if (!editor) return
    if (!(await confirmUnsaved())) return
    const content = await window.electronAPI?.readFile(filePath)
    if (content != null) {
      setShowWelcome(false)
      setHasContent(true)
      const fileName = extractFileName(filePath)
      editor.setTitle(fileName)
      editor.setFilePath(filePath)
      try { editor.setContent(JSON.parse(content)) }
      catch { editor.setContent(content) }
      editor.resetModified()
      editor.focus()
    }
  }, [confirmUnsaved, setShowWelcome])

  const handleHome = useCallback(async () => {
    if (!(await confirmUnsaved())) return
    setShowWelcome(true)
    setHasContent(false)
    incrementWelcomeKey()
    editorRef.current?.clear()
  }, [confirmUnsaved, setShowWelcome, incrementWelcomeKey])

  const handleSidebarMouseEnter = useCallback(async () => {
    if (sidebarTimerRef.current) clearTimeout(sidebarTimerRef.current)
    if (!ui.sidebarVisible && linkedFolderPath) await handleRefreshFolder()
    setSidebarVisible(true)
  }, [ui.sidebarVisible, linkedFolderPath, handleRefreshFolder, setSidebarVisible])

  const handleSidebarMouseLeave = useCallback(() => {
    if (ui.sidebarPinned) return
    sidebarTimerRef.current = setTimeout(() => setSidebarVisible(false), 1000)
  }, [ui.sidebarPinned, setSidebarVisible])

  const handleToggleSidebar = useCallback(async () => {
    if (sidebarTimerRef.current) clearTimeout(sidebarTimerRef.current)
    if (ui.sidebarVisible) { setSidebarVisible(false); setSidebarPinned(false); return }
    if (linkedFolderPath) await handleRefreshFolder()
    setSidebarVisible(true)
    setSidebarPinned(true)
  }, [ui.sidebarVisible, linkedFolderPath, handleRefreshFolder, setSidebarVisible, setSidebarPinned])

  return (
    <div className="h-screen w-screen bg-[var(--color-bg)] flex flex-col">
      <div className="titlebar h-10 w-full flex-shrink-0 flex items-center bg-[var(--color-bg)] border-b border-[var(--color-border)]"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <div className="flex-1" />
        <div className="flex items-center justify-center gap-2 absolute left-1/2 -translate-x-1/2">
          <Leaf size={13} className="text-[var(--color-accent)]" />
          <span className="text-xs text-[var(--color-text-secondary)] select-none font-medium tracking-wide">Sycamore</span>
        </div>
        <div className="h-full flex" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <WindowControls />
        </div>
      </div>

      <Toolbar
        theme={theme} onNew={handleNew}
        onSave={() => { if (!ui.showWelcome) handleSave() }}
        onToggleTheme={cycleTheme} onSettings={() => setShowSettings(true)}
        onHome={handleHome} onToggleSidebar={handleToggleSidebar}
        onFormat={(type, url) => { if (!ui.showWelcome) handleFormat(type, url) }}
        onBlock={(type) => { if (!ui.showWelcome) handleBlock(type) }}
        onUndo={() => { if (!ui.showWelcome) editorRef.current?.undo() }}
        onRedo={() => { if (!ui.showWelcome) editorRef.current?.redo() }}
        onExportHtml={() => { if (!ui.showWelcome) handleExportHtml() }}
        onExportPdf={() => { if (!ui.showWelcome) handleExportPdf() }}
        onExportMarkdown={() => { if (!ui.showWelcome) handleExportMarkdown() }}
        onImportMarkdown={() => handleImportMarkdown()}
        onBatchImportMarkdown={() => handleBatchImportMarkdown()}
        onToggleAiChat={() => toggleAiChat()}
        onInsertChart={() => { if (!ui.showWelcome) setShowChartDialog(true) }}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <Sidebar onNew={handleNew} onOpenFile={handleOpenFile}
            folderPath={folderPath} folderEntries={folderEntries}
            onLinkFolder={handleLinkFolder} onUnlinkFolder={handleUnlinkFolder}
            linkedFolderPath={linkedFolderPath} isVisible={ui.sidebarVisible}
            onMouseEnter={handleSidebarMouseEnter} onMouseLeave={handleSidebarMouseLeave}
            onRefreshFolder={handleRefreshFolder} onClose={() => setSidebarVisible(false)} />

          {ui.showWelcome && (
            <WelcomePage key={ui.welcomeKey} onNew={handleNew} onOpenFile={handleOpenFile}
              onLinkFolder={handleLinkFolder} linkedFolderPath={linkedFolderPath}
              folderEntries={folderEntries} onRefreshFolder={handleRefreshFolder} />
          )}

          <div className={`h-full transition-opacity duration-150 ${ui.showWelcome ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <Editor ref={editorRef} darkMode={darkMode}
              settings={{ ...settings, editorWidth: ui.editorWide ? 1000 : settings.editorWidth }}
              linkedFolderPath={linkedFolderPath} focusMode={ui.focusMode}
              onModifiedChange={setIsModified} onContentChange={handleContentChange}
              onWordCountChange={setWordCount} onLineCountChange={setLineCount}
              onShowSaveDialog={showSaveDialog} onShowOpenDialog={showOpenDialog}
              onSaved={handleRefreshFolder}
              onDocChange={(fp) => setDocKey(fp || 'untitled')}
              aiEditMode={ui.aiChatOpen && ui.selectedText.length > 0}
              onSelectionChange={setSelectedText} />
          </div>
          {ui.aiChatOpen && <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black/5 to-transparent pointer-events-none z-10" />}
        </div>

        <div className={`absolute right-0 top-0 bottom-0 w-[420px] z-20 bg-[var(--color-bg)] shadow-xl transition-all duration-500 ease-out ${
          ui.aiChatOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
        }`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}>
          <AiChatPanel onClose={() => toggleAiChat()}
            getDocumentContent={() => editorRef.current?.exportMarkdown?.() ?? editorRef.current?.getText?.() ?? ''}
            selectedText={ui.selectedText}
            replaceSelection={(text) => editorRef.current?.replaceSelection?.(text)}
            settings={settings} docKey={ui.showWelcome ? '__welcome__' : ui.docKey}
            insertText={(text) => editorRef.current?.insertText(text)} />
        </div>
      </div>

      {ui.showImageInput && (
        <ImageInputDialog value={ui.imageUrlInput} onChange={setImageUrlInput}
          onSubmit={handleImageSubmit} onClose={() => { setShowImageInput(false); setImageUrlInput('') }} />
      )}

      {ui.showFormulaDialog && (
        <FormulaDialog onInsert={handleFormulaInsert} onClose={() => setShowFormulaDialog(false)} />
      )}
      {ui.showChartDialog && (
        <ChartDialog onInsert={handleChartInsert} onClose={() => setShowChartDialog(false)} />
      )}

      {ui.showSettings && (
        <SettingsPanel settings={settings} onChange={handleSettingsChange} onClose={() => setShowSettings(false)} />
      )}

      <Dialogs dialogState={dialogState} onSaveCurrent={handleSaveCurrent} onClose={closeDialog} />

      <StatusBar wordCount={wordCount} lineCount={lineCount} isModified={isModified} hasContent={hasContent}
        focusMode={ui.focusMode} onToggleFocusMode={() => toggleFocusMode()}
        editorWide={ui.editorWide} onToggleEditorWidth={() => toggleEditorWide()} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

export default App
