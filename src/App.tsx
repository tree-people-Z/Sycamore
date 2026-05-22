import { useState, useRef, useCallback, useEffect } from 'react'
import { Leaf } from 'lucide-react'
import Editor, { type EditorHandle } from './editor/Editor'
import WindowControls from './components/WindowControls'
import WelcomePage from './components/WelcomePage'
import Toolbar from './components/Toolbar'
import StatusBar from './components/StatusBar'
import Sidebar from './components/Sidebar'
import SettingsPanel from './components/SettingsPanel'
import FormulaDialog from './components/FormulaDialog'
import Dialogs from './components/Dialogs'
import { useTheme } from './hooks/useTheme'
import { useFileSystem } from './hooks/useFileSystem'
import { useSettings } from './hooks/useSettings'
import { useUnsavedGuard } from './hooks/useUnsavedGuard'
import { useDialogs } from './hooks/useDialogs'
import type { InlineFormatType, BlockFormatType } from './types'

function App() {
  const editorRef = useRef<EditorHandle>(null)
  const { theme, darkMode, cycleTheme } = useTheme()
  const { settings, handleSettingsChange } = useSettings()
  const { dialogState, showUnsavedDialog, showSaveDialog, showOpenDialog, showFolderDialog, closeDialog } = useDialogs()
  const {
    folderPath, folderEntries, linkedFolderPath,
    handleLinkFolder, handleUnlinkFolder, handleRefreshFolder,
  } = useFileSystem(showFolderDialog)

  const [isModified, setIsModified] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)
  const [wordCount, setWordCount] = useState(0)
  const [lineCount, setLineCount] = useState(0)
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [sidebarPinned, setSidebarPinned] = useState(false)
  const [hasContent, setHasContent] = useState(false)
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [showImageInput, setShowImageInput] = useState(false)
  const [showFormulaDialog, setShowFormulaDialog] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [welcomeKey, setWelcomeKey] = useState(0)
  const [focusMode, setFocusMode] = useState(false)
  const [editorWide, setEditorWide] = useState(false)
  const sidebarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const confirmUnsaved = useUnsavedGuard(
    () => editorRef.current?.getModified() ?? false,
    () => editorRef.current?.saveFile() ?? Promise.resolve(),
    showUnsavedDialog,
  )

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (!e.relatedTarget && !sidebarPinned) {
        if (sidebarTimerRef.current) clearTimeout(sidebarTimerRef.current)
        setSidebarVisible(false)
      }
    }
    document.addEventListener('mouseout', handle)
    return () => document.removeEventListener('mouseout', handle)
  }, [sidebarPinned])

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      const sidebar = document.querySelector('.sidebar-panel')
      const toggleBtn = (e.target as HTMLElement)?.closest?.('[data-sidebar-toggle]')
      if (sidebarPinned && sidebar && !sidebar.contains(e.target as Node) && !toggleBtn) {
        setSidebarPinned(false)
        setSidebarVisible(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [sidebarPinned])

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
    const doc = `<!DOCTYPE html><html><head><meta charset="UTF-8"><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"></head><body>${html}</body></html>`
    await window.electronAPI?.writeFile(fp, doc)
  }, [showSaveDialog])

  const handleExportPdf = useCallback(async () => {
    const editor = editorRef.current
    if (!editor) return
    const fp = await showSaveDialog('untitled.pdf')
    if (!fp) return
    await window.electronAPI?.exportPdfToPath(fp, editor.getExportHTML(), darkMode)
  }, [showSaveDialog, darkMode])

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
        case 'save': setShowWelcome(false); await editor.saveFile(); handleRefreshFolder(); break
        case 'save-as': await editor.saveAs(); handleRefreshFolder(); break
        case 'exit': await handleExit(); break
        case 'undo': editor.undo(); break
        case 'redo': editor.redo(); break
        case 'cut': editor.focus(); document.execCommand('cut'); break
        case 'copy': editor.focus(); document.execCommand('copy'); break
        case 'paste': editor.focus(); document.execCommand('paste'); break
        case 'export-html': await handleExportHtml(); break
        case 'export-pdf': await handleExportPdf(); break
      }
    })
    return () => cleanup?.()
  }, [handleExit, handleExportHtml, handleExportPdf, handleRefreshFolder])

  useEffect(() => {
    const cleanup = window.electronAPI?.onBeforeClose(beforeClose)
    return () => cleanup?.()
  }, [beforeClose])

  const handleNew = useCallback(() => {
    setShowWelcome(false)
    setHasContent(true)
    setTimeout(() => editorRef.current?.newFile(), 0)
  }, [])

  const handleSave = useCallback(() => {
    setShowWelcome(false)
    editorRef.current?.saveFile()
  }, [])

  const handleContentChange = useCallback((content: string) => {
    if (showWelcome && content) {
      setShowWelcome(false)
      setHasContent(true)
    }
  }, [showWelcome])

  const handleImageSubmit = useCallback(() => {
    const url = imageUrlInput.trim()
    if (!url) return
    editorRef.current?.formatInline('image', url)
    editorRef.current?.focus()
    setShowImageInput(false)
    setImageUrlInput('')
  }, [imageUrlInput])

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
  }, [])

  const handleBlock = useCallback((type: BlockFormatType) => {
    const editor = editorRef.current
    if (!editor) return
    if (type === 'math') { setShowFormulaDialog(true); return }
    editor.insertBlock(type)
  }, [])

  const handleFormulaInsert = useCallback((expression: string, displayMode: boolean) => {
    editorRef.current?.insertText({
      type: displayMode ? 'mathBlock' : 'mathInline',
      attrs: { tex: expression },
    })
    setShowFormulaDialog(false)
  }, [])

  const handleOpenFile = useCallback(async (filePath: string) => {
    const editor = editorRef.current
    if (!editor) return
    if (!(await confirmUnsaved())) return
    const content = await window.electronAPI?.readFile(filePath)
    if (content != null) {
      setShowWelcome(false)
      setHasContent(true)
      const fileName = filePath.replace(/.*[/\\]/, '').replace(/\.\w+$/, '')
      editor.setTitle(fileName)
      editor.setFilePath(filePath)
      try { editor.setContent(JSON.parse(content)) }
      catch { editor.setContent(content) }
      editor.resetModified()
      editor.focus()
    }
  }, [confirmUnsaved])

  const handleHome = useCallback(async () => {
    if (!(await confirmUnsaved())) return
    setShowWelcome(true)
    setHasContent(false)
    setWelcomeKey(k => k + 1)
    editorRef.current?.clear()
  }, [confirmUnsaved])

  const handleSidebarMouseEnter = useCallback(async () => {
    if (sidebarTimerRef.current) clearTimeout(sidebarTimerRef.current)
    if (!sidebarVisible && linkedFolderPath) await handleRefreshFolder()
    setSidebarVisible(true)
  }, [sidebarVisible, linkedFolderPath, handleRefreshFolder])

  const handleSidebarMouseLeave = useCallback(() => {
    if (sidebarPinned) return
    sidebarTimerRef.current = setTimeout(() => setSidebarVisible(false), 1000)
  }, [sidebarPinned])

  const handleToggleSidebar = useCallback(async () => {
    if (sidebarTimerRef.current) clearTimeout(sidebarTimerRef.current)
    if (sidebarVisible) { setSidebarVisible(false); setSidebarPinned(false); return }
    if (linkedFolderPath) await handleRefreshFolder()
    setSidebarVisible(true)
    setSidebarPinned(true)
  }, [sidebarVisible, linkedFolderPath, handleRefreshFolder])

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
        onSave={() => { if (!showWelcome) handleSave() }}
        onToggleTheme={cycleTheme} onSettings={() => setShowSettings(true)}
        onHome={handleHome} onToggleSidebar={handleToggleSidebar}
        onFormat={(type, url) => { if (!showWelcome) handleFormat(type, url) }}
        onBlock={(type) => { if (!showWelcome) handleBlock(type) }}
        onUndo={() => { if (!showWelcome) editorRef.current?.undo() }}
        onRedo={() => { if (!showWelcome) editorRef.current?.redo() }}
        onExportHtml={() => { if (!showWelcome) handleExportHtml() }}
        onExportPdf={() => { if (!showWelcome) handleExportPdf() }}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <Sidebar onNew={handleNew} onOpenFile={handleOpenFile}
            folderPath={folderPath} folderEntries={folderEntries}
            onLinkFolder={handleLinkFolder} onUnlinkFolder={handleUnlinkFolder}
            linkedFolderPath={linkedFolderPath} isVisible={sidebarVisible}
            onMouseEnter={handleSidebarMouseEnter} onMouseLeave={handleSidebarMouseLeave}
            onRefreshFolder={handleRefreshFolder} onClose={() => setSidebarVisible(false)} />

          {showWelcome && (
            <WelcomePage key={welcomeKey} onNew={handleNew} onOpenFile={handleOpenFile}
              onLinkFolder={handleLinkFolder} linkedFolderPath={linkedFolderPath} folderEntries={folderEntries} />
          )}

          <div className={`h-full transition-opacity duration-150 ${showWelcome ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <Editor ref={editorRef} darkMode={darkMode}
              settings={{ ...settings, editorWidth: editorWide ? 1000 : settings.editorWidth }}
              linkedFolderPath={linkedFolderPath} focusMode={focusMode}
              onModifiedChange={setIsModified} onContentChange={handleContentChange}
              onWordCountChange={setWordCount} onLineCountChange={setLineCount}
              onShowSaveDialog={showSaveDialog} onShowOpenDialog={showOpenDialog}
              onSaved={handleRefreshFolder} />
          </div>
        </div>
      </div>

      {showImageInput && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/10 dialog-overlay">
          <div className="bg-[var(--color-surface)] rounded-xl shadow-2xl p-4 border border-[var(--color-border)] min-w-[360px] dialog-panel">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[var(--color-text)]">插入图片 URL</span>
              <button onClick={() => { setShowImageInput(false); setImageUrlInput('') }}
                className="w-6 h-6 flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] rounded transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <input autoFocus type="text" value={imageUrlInput} onChange={e => setImageUrlInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleImageSubmit(); if (e.key === 'Escape') { setShowImageInput(false); setImageUrlInput('') } }}
              placeholder="https://..."
              className="w-full h-9 px-3 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg outline-none text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] transition-colors" />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => { setShowImageInput(false); setImageUrlInput('') }}
                className="px-3 py-1.5 text-xs rounded-lg bg-[var(--color-hover)] text-[var(--color-text)] hover:opacity-80 transition-opacity">取消</button>
              <button onClick={handleImageSubmit}
                className="px-3 py-1.5 text-xs rounded-lg bg-[var(--color-accent)] text-white hover:opacity-80 transition-colors">插入</button>
            </div>
          </div>
        </div>
      )}

      {showFormulaDialog && (
        <FormulaDialog onInsert={handleFormulaInsert} onClose={() => setShowFormulaDialog(false)} />
      )}

      {showSettings && (
        <SettingsPanel settings={settings} onChange={handleSettingsChange} onClose={() => setShowSettings(false)} />
      )}

      <Dialogs dialogState={dialogState} onSaveCurrent={handleSaveCurrent} onClose={closeDialog} />

      <StatusBar wordCount={wordCount} lineCount={lineCount} isModified={isModified} hasContent={hasContent}
        focusMode={focusMode} onToggleFocusMode={() => setFocusMode(v => !v)}
        editorWide={editorWide} onToggleEditorWidth={() => setEditorWide(v => !v)} />
    </div>
  )
}

export default App
