import { useState, useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { Code2, FileCode } from 'lucide-react'
import IdeFileTree from './IdeFileTree'
import IdeEditorTabs from './IdeEditorTabs'
import IdeCodeEditor from './IdeCodeEditor'
import type { IdeCodeEditorHandle } from './IdeCodeEditor'
import UnsavedDialog from '../components/UnsavedDialog'
import { useToast } from '../hooks/useToast'
import { on } from '../utils/emitter'
import { extractFileName } from '../utils/path'
import { CODE_FILE_EXTENSIONS } from './ide-language'
import type { IdeTab } from './IdeEditorTabs'

const CODE_FILTERS = [{ name: 'Code Files', extensions: CODE_FILE_EXTENSIONS }]

export interface IdeWorkspaceHandle {
  getActiveContent: () => string
  getActivePath: () => string | null
  hasDirty: () => boolean
  saveAll: () => Promise<void>
  replaceSelection: (text: string) => void
  insertText: (text: string) => void
}

interface IDEWorkspaceProps {
  linkedFolderPath: string | null
  onLinkFolder?: () => void
  onSelectionChange?: (text: string) => void
  onActiveFileChange?: (path: string | null) => void
}

const IDEWorkspace = forwardRef<IdeWorkspaceHandle, IDEWorkspaceProps>(function IDEWorkspace(
  { linkedFolderPath, onLinkFolder, onSelectionChange, onActiveFileChange },
  ref,
) {  const { addToast } = useToast()
  const [tabs, setTabs] = useState<IdeTab[]>([])
  const [activePath, setActivePath] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [closeTarget, setCloseTarget] = useState<string | null>(null)
  const tabsRef = useRef(tabs)
  const activePathRef = useRef(activePath)
  const editorRef = useRef<IdeCodeEditorHandle>(null)
  tabsRef.current = tabs
  activePathRef.current = activePath

  useEffect(() => {
    onActiveFileChange?.(activePath)
  }, [activePath, onActiveFileChange])

  const saveTab = useCallback(async (path: string) => {
    const tab = tabsRef.current.find(t => t.path === path)
    if (!tab) return
    try {
      await window.electronAPI?.writeFile(path, tab.content)
      setTabs(prev => prev.map(t => t.path === path ? { ...t, savedContent: t.content } : t))
      addToast('已保存', 'success', 1500)
    } catch {
      addToast('保存失败', 'error')
    }
  }, [addToast])

  useImperativeHandle(ref, () => ({
    getActiveContent: () => tabsRef.current.find(t => t.path === activePathRef.current)?.content ?? '',
    getActivePath: () => activePathRef.current,
    hasDirty: () => tabsRef.current.some(t => t.content !== t.savedContent),
    saveAll: async () => {
      for (const t of tabsRef.current) {
        if (t.content !== t.savedContent) await saveTab(t.path)
      }
    },
    replaceSelection: (text) => editorRef.current?.replaceSelection(text),
    insertText: (text) => editorRef.current?.insertText(text),
  }), [saveTab])

  const openFile = useCallback(async (filePath: string) => {
    const existing = tabsRef.current.find(t => t.path === filePath)
    if (existing) { setActivePath(filePath); return }
    const content = await window.electronAPI?.readFile(filePath)
    if (content == null) { addToast('无法读取文件', 'error'); return }
    setTabs(prev => [...prev, { path: filePath, name: extractFileName(filePath, false), content, savedContent: content }])
    setActivePath(filePath)
  }, [addToast])

  const openExternal = useCallback(async () => {
    const fp = await window.electronAPI?.showOpenFileDialog(undefined, CODE_FILTERS)
    if (fp) await openFile(fp)
  }, [openFile])

  const handleChange = useCallback((content: string) => {
    const path = activePathRef.current
    if (!path) return
    setTabs(prev => prev.map(t => t.path === path ? { ...t, content } : t))
  }, [])

  const closeTab = useCallback(async (path: string, force = false) => {
    const tab = tabsRef.current.find(t => t.path === path)
    if (!tab) return
    if (!force && tab.content !== tab.savedContent) { setCloseTarget(path); return }
    const next = tabsRef.current.filter(t => t.path !== path)
    setTabs(next)
    if (activePathRef.current === path) {
      setActivePath(next.length ? next[next.length - 1].path : null)
    }
  }, [])

  // 文件树中的重命名/删除同步到已打开的标签页
  const handleFileRenamed = useCallback((oldPath: string, newPath: string) => {
    const remap = (p: string) => {
      if (p === oldPath) return newPath
      if (p.startsWith(oldPath + '\\') || p.startsWith(oldPath + '/')) return newPath + p.slice(oldPath.length)
      return p
    }
    setTabs(prev => prev.map(t => {
      const np = remap(t.path)
      return np === t.path ? t : { ...t, path: np, name: extractFileName(np, false) }
    }))
    if (activePathRef.current) {
      const np = remap(activePathRef.current)
      if (np !== activePathRef.current) setActivePath(np)
    }
  }, [])

  const handleFileDeleted = useCallback((path: string) => {
    closeTab(path, true)
  }, [closeTab])

  const confirmClose = useCallback(async (mode: 'save' | 'discard') => {
    const path = closeTarget
    if (!path) return
    setCloseTarget(null)
    if (mode === 'save') {
      await saveTab(path)
      await closeTab(path, true)
    } else {
      await closeTab(path, true)
    }
  }, [closeTarget, saveTab, closeTab])

  // 菜单/快捷键 Ctrl+S：App 层在 IDE 模式下转发到这里
  useEffect(() => {
    return on('ide-save', () => {
      const path = activePathRef.current
      if (path) saveTab(path)
    })
  }, [saveTab])

  const activeTab = tabs.find(t => t.path === activePath) ?? null

  return (
    <div className="h-full w-full flex bg-[var(--color-bg)]">
      <div className="w-56 flex-shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)]">
        <IdeFileTree rootPath={linkedFolderPath} onOpenFile={openFile}
          refreshKey={refreshKey} onChanged={() => setRefreshKey(k => k + 1)}
          onFileRenamed={handleFileRenamed} onFileDeleted={handleFileDeleted}
          onLinkFolder={onLinkFolder} />
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <IdeEditorTabs tabs={tabs} activePath={activePath}
          onActivate={setActivePath}
          onClose={(path) => closeTab(path)}
          onOpenExternally={openExternal} />

        <div className="flex-1 min-h-0">
          {activeTab ? (
            <IdeCodeEditor ref={editorRef} fileKey={activeTab.path} value={activeTab.content}
              onChange={handleChange} onSave={() => saveTab(activeTab.path)}
              onSelectionChange={onSelectionChange} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
              <Code2 size={40} className="text-[var(--color-text-tertiary)]" />
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                从左侧文件树打开代码文件<br />或在标签栏右侧打开任意位置的文件
              </p>
              <button onClick={openExternal}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors">
                <FileCode size={12} /> 打开代码文件
              </button>
            </div>
          )}
        </div>

        <div className="h-6 flex-shrink-0 border-t border-[var(--color-border)] flex items-center px-3 gap-3 text-[10px] text-[var(--color-text-muted)] select-none">
          {activeTab && <span className="truncate">{activeTab.path}</span>}
          {activeTab && activeTab.content !== activeTab.savedContent && <span className="text-[var(--color-accent)]">未保存 · Ctrl+S 保存</span>}
          {activeTab && <span className="ml-auto">{activeTab.content.split('\n').length} 行</span>}
        </div>
      </div>

      {closeTarget && (
        <UnsavedDialog
          onSave={() => confirmClose('save')}
          onDiscard={() => confirmClose('discard')}
          onCancel={() => setCloseTarget(null)}
        />
      )}
    </div>
  )
})

export default IDEWorkspace
