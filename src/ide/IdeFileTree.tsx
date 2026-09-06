import { useState, useEffect, useRef, useCallback } from 'react'
import { FileCode, Folder, FolderOpen, ChevronRight, RefreshCw, FolderPlus, FilePlus, Pencil, Trash2, Link2 } from 'lucide-react'
import type { DirEntry } from '../electron-api'
import { CODE_FILE_EXTENSIONS } from './ide-language'
import { uniquePath } from '../utils/path'

interface MenuState {
  x: number
  y: number
  entry: DirEntry | null // null 表示在空白处（针对根目录操作）
}

interface IdeFileTreeProps {
  rootPath: string | null
  onOpenFile: (path: string) => void
  refreshKey: number
  onChanged: () => void
  onFileRenamed?: (oldPath: string, newPath: string) => void
  onFileDeleted?: (path: string) => void
  onLinkFolder?: () => void
}

/** 简易输入对话框（Electron 无 window.prompt） */
function IdeInputDialog({ title, defaultValue, onSubmit, onClose }: {
  title: string
  defaultValue?: string
  onSubmit: (value: string) => void
  onClose: () => void
}) {
  const [value, setValue] = useState(defaultValue ?? '')
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select() }, [])
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (e.target === backdropRef.current) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])
  return (
    <div ref={backdropRef} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 dialog-overlay">
      <div className="bg-[var(--color-surface)] rounded-xl shadow-2xl border border-[var(--color-border)] w-[320px] p-4 dialog-panel">
        <div className="text-xs font-medium text-[var(--color-text)] mb-3">{title}</div>
        <input ref={inputRef} type="text" value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && value.trim() && !submitting) { setSubmitting(true); onSubmit(value.trim()) }
            if (e.key === 'Escape') onClose()
          }}
          className="w-full h-9 px-3 text-xs bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg outline-none text-[var(--color-text)] focus:border-[var(--color-accent)] transition-colors" />
        <div className="flex justify-end gap-2 mt-3">
          <button onClick={onClose}
            className="px-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">取消</button>
          <button onClick={() => { if (value.trim() && !submitting) { setSubmitting(true); onSubmit(value.trim()) } }} disabled={!value.trim() || submitting}
            className="px-3 py-1.5 text-xs rounded-lg bg-[var(--color-accent)] text-white hover:opacity-80 disabled:opacity-40 transition-opacity">确定</button>
        </div>
      </div>
    </div>
  )
}

export default function IdeFileTree({ rootPath, onOpenFile, refreshKey, onChanged, onFileRenamed, onFileDeleted, onLinkFolder }: IdeFileTreeProps) {
  const [childrenMap, setChildrenMap] = useState<Record<string, DirEntry[]>>({})
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [menu, setMenu] = useState<MenuState | null>(null)
  const [inputState, setInputState] = useState<{
    title: string; defaultValue?: string
    onSubmit: (value: string) => void
  } | null>(null)

  const loadDir = useCallback(async (dir: string) => {
    const entries = await window.electronAPI?.readDirectory(dir, CODE_FILE_EXTENSIONS) ?? []
    setChildrenMap(prev => ({ ...prev, [dir]: entries.filter(e => e.name !== '.trash') }))
    return entries
  }, [])

  useEffect(() => {
    if (!rootPath) return
    setLoading(true)
    setExpanded(new Set())
    loadDir(rootPath).finally(() => setLoading(false))
  }, [rootPath, refreshKey, loadDir])

  const toggleDir = useCallback(async (dir: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(dir)) { next.delete(dir) } else { next.add(dir) }
      return next
    })
    if (!childrenMap[dir]) await loadDir(dir)
  }, [childrenMap, loadDir])

  // 右键菜单打开时，点击菜单外任意位置关闭（菜单容器内已 stopPropagation）
  useEffect(() => {
    if (!menu) return
    const dismiss = () => setMenu(null)
    document.addEventListener('mousedown', dismiss)
    return () => document.removeEventListener('mousedown', dismiss)
  }, [menu])

  const parentDirOf = useCallback((entryPath: string) => {
    // 保留原始分隔符，避免 Windows 下正反斜杠混用导致目录缓存 key 错位
    const i = Math.max(entryPath.lastIndexOf('\\'), entryPath.lastIndexOf('/'))
    return i > 0 ? entryPath.slice(0, i) : (rootPath || '')
  }, [rootPath])

  const sepOf = useCallback((entryPath: string) => (entryPath.includes('\\') ? '\\' : '/'), [])

  const handleNewFile = useCallback((dir: string) => {
    setInputState({
      title: '新建文件（含扩展名，如 index.ts）',
      onSubmit: async (name) => {
        const sep = sepOf(dir)
        const exists = (p: string) => window.electronAPI?.fileExists(p) ?? Promise.resolve(false)
        // 名字重复时自动加 (1)、(2)… 后缀，避免覆盖已有文件
        const fp = await uniquePath(dir + sep + name, exists)
        await window.electronAPI?.writeFile(fp, '')
        setInputState(null)
        await loadDir(dir)
        onChanged()
      },
    })
  }, [loadDir, onChanged, sepOf])

  const handleNewFolder = useCallback((dir: string) => {
    setInputState({
      title: '新建文件夹',
      onSubmit: async (name) => {
        const sep = sepOf(dir)
        await window.electronAPI?.makeDirectory(dir + sep + name)
        setInputState(null)
        await loadDir(dir)
        onChanged()
      },
    })
  }, [loadDir, onChanged, sepOf])

  const handleRename = useCallback((entry: DirEntry) => {
    setInputState({
      title: entry.isDirectory ? '重命名文件夹' : '重命名文件',
      defaultValue: entry.name,
      onSubmit: async (name) => {
        if (name !== entry.name) {
          const exists = (p: string) => window.electronAPI?.fileExists(p) ?? Promise.resolve(false)
          // 名字重复时自动加 (1)、(2)… 后缀
          const newPath = await uniquePath(parentDirOf(entry.path) + sepOf(entry.path) + name, exists)
          await window.electronAPI?.renameEntry(entry.path, newPath)
          onFileRenamed?.(entry.path, newPath)
        }
        setInputState(null)
        await loadDir(parentDirOf(entry.path))
        onChanged()
      },
    })
  }, [loadDir, onChanged, onFileRenamed, parentDirOf, sepOf])

  const handleDelete = useCallback(async (entry: DirEntry) => {
    const ok = await window.electronAPI?.deleteEntry(entry.path)
    if (ok) {
      onFileDeleted?.(entry.path)
      await loadDir(parentDirOf(entry.path))
      onChanged()
    }
  }, [loadDir, onChanged, onFileDeleted, parentDirOf])

  const renderEntries = (dir: string, depth: number) => {
    const entries = childrenMap[dir]
    if (!entries) return null
    return entries.map(entry => {
      const isOpen = expanded.has(entry.path)
      return (
        <div key={entry.path}>
          <div
            role="button" tabIndex={0}
            className={`flex items-center gap-1.5 py-1 pr-2 cursor-pointer text-xs rounded-md mx-1 transition-colors hover:bg-[var(--color-hover)] group ${isOpen && entry.isDirectory ? 'text-[var(--color-text)]' : 'text-[var(--color-text-secondary)]'}`}
            style={{ paddingLeft: 6 + depth * 12 }}
            onClick={() => entry.isDirectory ? toggleDir(entry.path) : onOpenFile(entry.path)}
            onKeyDown={e => { if (e.key === 'Enter') entry.isDirectory ? toggleDir(entry.path) : onOpenFile(entry.path) }}
            onContextMenu={e => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, entry }) }}
          >
            {entry.isDirectory
              ? <ChevronRight size={12} className={`flex-shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
              : <span className="w-3 flex-shrink-0" />}
            {entry.isDirectory
              ? (isOpen ? <FolderOpen size={13} className="text-[var(--color-accent)] flex-shrink-0" /> : <Folder size={13} className="text-[var(--color-accent)] flex-shrink-0" />)
              : <FileCode size={13} className="text-[var(--color-text-muted)] flex-shrink-0" />}
            <span className="truncate">{entry.name}</span>
          </div>
          {entry.isDirectory && isOpen && renderEntries(entry.path, depth + 1)}
        </div>
      )
    })
  }

  if (!rootPath) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 px-6 text-center">
        <Folder size={28} className="text-[var(--color-text-muted)]" />
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">未关联文件夹，无法浏览代码文件</p>
        {onLinkFolder && (
          <button onClick={onLinkFolder}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors">
            <Link2 size={12} /> 关联文件夹
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)] flex-shrink-0">
        <span className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider truncate">资源管理器</span>
        <div className="flex items-center gap-0.5">
          <button onClick={() => handleNewFile(rootPath)} className="w-5 h-5 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors" title="新建文件"><FilePlus size={12} /></button>
          <button onClick={() => handleNewFolder(rootPath)} className="w-5 h-5 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors" title="新建文件夹"><FolderPlus size={12} /></button>
          <button onClick={() => loadDir(rootPath)} className="w-5 h-5 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors" title="刷新"><RefreshCw size={12} /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-1.5">
        {loading && <div className="px-3 py-1 text-xs text-[var(--color-text-muted)]">加载中...</div>}
        {!loading && !(childrenMap[rootPath]?.length) && (
          <div className="px-3 py-1 text-xs text-[var(--color-text-muted)]">没有代码文件</div>
        )}
        {renderEntries(rootPath, 0)}
      </div>

      {menu && (
        <>
          <div className="fixed inset-0 z-40" aria-hidden="true" />
          <div className="fixed z-50 min-w-[140px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl py-1.5"
            role="menu" tabIndex={-1} aria-label="文件操作菜单"
            onKeyDown={e => { if (e.key === 'Escape') setMenu(null) }}
            onMouseDown={e => e.stopPropagation()}
            style={{ left: Math.min(menu.x, window.innerWidth - 150), top: Math.min(menu.y, window.innerHeight - 160) }}>
            {menu.entry?.isDirectory && (
              <>
                <button onClick={() => { handleNewFile(menu.entry!.path); setMenu(null) }}
                  className="w-full px-3 py-1.5 text-xs text-left text-[var(--color-text)] hover:bg-[var(--color-hover)] flex items-center gap-2 transition-colors"><FilePlus size={12} /> 新建文件</button>
                <button onClick={() => { handleNewFolder(menu.entry!.path); setMenu(null) }}
                  className="w-full px-3 py-1.5 text-xs text-left text-[var(--color-text)] hover:bg-[var(--color-hover)] flex items-center gap-2 transition-colors"><FolderPlus size={12} /> 新建文件夹</button>
                <div className="h-px bg-[var(--color-border)] my-1" />
              </>
            )}
            {menu.entry && (
              <>
                <button onClick={() => { handleRename(menu.entry!); setMenu(null) }}
                  className="w-full px-3 py-1.5 text-xs text-left text-[var(--color-text)] hover:bg-[var(--color-hover)] flex items-center gap-2 transition-colors"><Pencil size={12} /> 重命名</button>
                <button onClick={() => { handleDelete(menu.entry!); setMenu(null) }}
                  className="w-full px-3 py-1.5 text-xs text-left text-[var(--color-danger)] hover:bg-[var(--color-hover)] flex items-center gap-2 transition-colors"><Trash2 size={12} /> 删除（移入回收站）</button>
              </>
            )}
            {!menu.entry && (
              <>
                <button onClick={() => { handleNewFile(rootPath); setMenu(null) }}
                  className="w-full px-3 py-1.5 text-xs text-left text-[var(--color-text)] hover:bg-[var(--color-hover)] flex items-center gap-2 transition-colors"><FilePlus size={12} /> 新建文件</button>
                <button onClick={() => { handleNewFolder(rootPath); setMenu(null) }}
                  className="w-full px-3 py-1.5 text-xs text-left text-[var(--color-text)] hover:bg-[var(--color-hover)] flex items-center gap-2 transition-colors"><FolderPlus size={12} /> 新建文件夹</button>
              </>
            )}
          </div>
        </>
      )}

      {inputState && (
        <IdeInputDialog title={inputState.title} defaultValue={inputState.defaultValue}
          onSubmit={inputState.onSubmit} onClose={() => setInputState(null)} />
      )}
    </div>
  )
}
