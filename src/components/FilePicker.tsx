import { useState, useCallback, useEffect, useRef } from 'react'
import { ChevronRight, Home, Search, ArrowLeft, ArrowUp, RotateCw, Folder, FileText, HardDrive } from 'lucide-react'
import type { DirEntry } from '../electron-api'

interface FilePickerProps {
  mode: 'open' | 'save' | 'folder'
  defaultName?: string
  startingPath?: string
  onSelect: (path: string | null) => void
  onClose: () => void
}

type SortField = 'name' | 'mtime' | 'size'
type SortDir = 'asc' | 'desc'

const QUICK_ACCESS: { label: string; key: string; icon: typeof Home }[] = [
  { label: '桌面', key: 'desktop', icon: Home },
  { label: '下载', key: 'downloads', icon: Home },
  { label: '文档', key: 'documents', icon: Home },
  { label: '图片', key: 'pictures', icon: Home },
]

function formatDate(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FilePicker({ mode, defaultName, startingPath, onSelect, onClose }: FilePickerProps) {
  const [currentPath, setCurrentPath] = useState(startingPath || '')
  const [entries, setEntries] = useState<DirEntry[]>([])
  const [drives, setDrives] = useState<string[]>([])
  const [history, setHistory] = useState<string[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const [searchQuery, setSearchQuery] = useState('')
  const [fileName, setFileName] = useState(defaultName || '')
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    window.electronAPI?.getDrives().then(setDrives)
  }, [])

  useEffect(() => {
    if (!currentPath) {
      window.electronAPI?.getHomePath().then(h => { if (h) navigateTo(h) })
      return
    }
    window.electronAPI?.readDirectory(currentPath).then(setEntries)
  }, [currentPath]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mode === 'save' && inputRef.current) {
      inputRef.current.focus()
      const dot = fileName.lastIndexOf('.')
      if (dot > 0) inputRef.current.setSelectionRange(0, dot)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const navigateTo = useCallback((dir: string) => {
    setHistory(prev => {
      const next = prev.slice(0, historyIdx + 1)
      next.push(dir)
      return next
    })
    setHistoryIdx(prev => prev + 1)
    setCurrentPath(dir)
    setSelectedPath(null)
    setSearchQuery('')
  }, [historyIdx])

  const goBack = useCallback(() => {
    if (historyIdx > 0) {
      setHistoryIdx(prev => prev - 1)
      setCurrentPath(history[historyIdx - 1])
    }
  }, [history, historyIdx])

  const goForward = useCallback(() => {
    if (historyIdx < history.length - 1) {
      setHistoryIdx(prev => prev + 1)
      setCurrentPath(history[historyIdx + 1])
    }
  }, [history, historyIdx])

  const goUp = useCallback(() => {
    const parts = currentPath.replace(/\\/g, '/').replace(/\/$/, '').split('/')
    if (parts.length > 1) {
      parts.pop()
      navigateTo(parts.join('/'))
    }
  }, [currentPath, navigateTo])

  const handleEntryClick = useCallback((entry: DirEntry) => {
    if (entry.isDirectory) {
      navigateTo(entry.path)
    } else {
      setSelectedPath(entry.path)
      const name = entry.name.replace(/\.json$/i, '')
      if (mode === 'save') { setFileName(entry.name) }
      else if (mode === 'open') { setFileName(name) }
    }
  }, [navigateTo, mode])

  const handleEntryDoubleClick = useCallback((entry: DirEntry) => {
    if (entry.isDirectory) {
      navigateTo(entry.path)
    } else if (mode === 'open') {
      onSelect(entry.path)
    }
  }, [navigateTo, mode, onSelect])

  const handleConfirm = useCallback(() => {
    if (mode === 'folder') { onSelect(currentPath || null) }
    else if (mode === 'save') {
      const name = fileName.trim()
      if (!name) return
      const sep = currentPath.includes('/') ? '/' : '\\'
      onSelect(currentPath.endsWith(sep) ? currentPath + name : currentPath + sep + name)
    } else if (mode === 'open') {
      onSelect(selectedPath)
    }
  }, [mode, currentPath, fileName, onSelect, selectedPath])

  const handleSort = useCallback((field: SortField) => {
    setSortDir(prev => sortField === field && prev === 'asc' ? 'desc' : 'asc')
    setSortField(field)
  }, [sortField])

  const sortedEntries = [...entries]
    .filter(e => !searchQuery || e.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1
      if (!a.isDirectory && b.isDirectory) return 1
      if (a.isDirectory && b.isDirectory && sortField === 'mtime') {
        const da = a.mtime ?? 0; const db = b.mtime ?? 0
        return sortDir === 'asc' ? da - db : db - da
      }
      if (sortField === 'name') {
        return sortDir === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name)
      }
      if (sortField === 'mtime') {
        const da = a.mtime ?? 0; const db = b.mtime ?? 0
        return sortDir === 'asc' ? da - db : db - da
      }
      if (sortField === 'size') {
        const sa = a.size ?? 0; const sb = b.size ?? 0
        return sortDir === 'asc' ? sa - sb : sb - sa
      }
      return 0
    })

  const pathSegments = currentPath.replace(/\\/g, '/').replace(/\/$/, '').split('/').filter(Boolean)

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="ml-1 text-[#aeaeb2]">↕</span>
    return <span className="ml-1 text-[var(--color-accent)]">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  const showSidebar = mode !== 'open'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] bg-black/30 dialog-overlay" onKeyDown={e => { if (e.key === 'Escape') onClose() }}>
      <div className="bg-[var(--color-surface)] rounded-xl shadow-2xl border border-[var(--color-border)] w-[680px] max-h-[80vh] flex flex-col dialog-panel">
        {/* Toolbar */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-[var(--color-border)] flex-shrink-0">
          <button onClick={goBack} disabled={historyIdx <= 0}
            className="w-7 h-7 flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="后退">
            <ArrowLeft size={14} />
          </button>
          <button onClick={goForward} disabled={historyIdx >= history.length - 1}
            className="w-7 h-7 flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="前进">
            <ArrowLeft size={14} className="rotate-180" />
          </button>
          <button onClick={goUp}
            className="w-7 h-7 flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] rounded transition-colors" title="上级目录">
            <ArrowUp size={14} />
          </button>
          <button onClick={() => navigateTo(currentPath)}
            className="w-7 h-7 flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] rounded transition-colors" title="刷新">
            <RotateCw size={13} />
          </button>

          <div className="flex-1 flex items-center gap-0.5 mx-2 px-2 py-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md text-[11px] min-w-0">
            <button onClick={() => window.electronAPI?.getHomePath().then(h => { if (h) navigateTo(h) })}
              className="flex-shrink-0 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors">
              <Home size={12} />
            </button>
            <ChevronRight size={10} className="flex-shrink-0 text-[var(--color-text-muted)] mx-0.5" />
            {pathSegments.map((seg, i) => (
              <span key={i} className="flex items-center gap-0.5 min-w-0">
                <button onClick={() => {
                  const p = pathSegments.slice(0, i + 1).join('/')
                  const full = currentPath.startsWith('/') ? '/' + p : p
                  navigateTo(currentPath.includes(':\\') ? `${pathSegments[0]}\\${pathSegments.slice(1, i + 1).join('\\')}` : full)
                }}
                  className="truncate max-w-[100px] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:underline transition-colors">
                  {seg}
                </button>
                {i < pathSegments.length - 1 && (
                  <ChevronRight size={10} className="flex-shrink-0 text-[var(--color-text-muted)]" />
                )}
              </span>
            ))}
          </div>

          <div className="relative w-40">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#aeaeb2] pointer-events-none" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索"
              className="w-full h-7 pl-7 pr-2 text-xs bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md outline-none text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] transition-colors" />
          </div>
        </div>

        {/* Main area */}
        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          {showSidebar && (
            <div className="w-44 flex-shrink-0 border-r border-[var(--color-border)] overflow-y-auto py-2 select-none">
              <div className="px-2 mb-1">
                <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium px-2 py-1">快速访问</p>
                {QUICK_ACCESS.map(qa => (
                  <SidebarItem key={qa.key} label={qa.label} icon={qa.icon}
                    onClick={() => window.electronAPI?.getSystemPath(qa.key).then(p => { if (p) navigateTo(p) })} />
                ))}
              </div>
              {drives.length > 0 && (
                <div>
                  <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium px-4 py-1">此电脑</p>
                  {drives.map(d => (
                    <SidebarItem key={d} label={d} icon={HardDrive}
                      onClick={() => navigateTo(d)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Table header */}
            <div className="flex items-center text-[11px] text-[var(--color-text-secondary)] border-b border-[var(--color-border)] bg-[var(--color-bg)] select-none flex-shrink-0">
              <button onClick={() => handleSort('name')} className="flex items-center px-3 py-1.5 w-[40%] min-w-0 text-left hover:bg-[var(--color-hover)] transition-colors">
                名称<SortIcon field="name" />
              </button>
              <button onClick={() => handleSort('mtime')} className="flex items-center px-3 py-1.5 w-[28%] text-left hover:bg-[var(--color-hover)] transition-colors">
                修改日期<SortIcon field="mtime" />
              </button>
              <button onClick={() => handleSort('mtime')} className="flex items-center px-3 py-1.5 w-[16%] text-left hover:bg-[var(--color-hover)] transition-colors">
                类型<SortIcon field="mtime" />
              </button>
              <button onClick={() => handleSort('size')} className="flex items-center px-3 py-1.5 w-[16%] text-left hover:bg-[var(--color-hover)] transition-colors">
                大小<SortIcon field="size" />
              </button>
            </div>

            {/* File rows */}
            <div className="flex-1 overflow-y-auto">
              {sortedEntries.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-[var(--color-text-muted)]">空文件夹</p>
                </div>
              ) : sortedEntries.map(entry => {
                const isSelected = selectedPath === entry.path || (mode === 'folder' && entry.isDirectory && entry.path === currentPath)
                const isFile = !entry.isDirectory
                return (
                  <div key={entry.path}
                    onClick={() => handleEntryClick(entry)}
                    onDoubleClick={() => handleEntryDoubleClick(entry)}
                    className={`flex items-center text-xs px-3 py-1.5 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[var(--color-accent-10)] text-[var(--color-accent)]'
                        : 'text-[var(--color-text)] hover:bg-[var(--color-hover)]'
                    }`}>
                    <div className="flex items-center gap-2 w-[40%] min-w-0 pr-2">
                      {entry.isDirectory
                        ? <Folder size={15} className="flex-shrink-0 text-[var(--color-accent)]" />
                        : <FileText size={15} className="flex-shrink-0 text-[var(--color-text-muted)]" />}
                      <span className="truncate">{entry.name.replace(/\.json$/i, '')}</span>
                    </div>
                    <div className="w-[28%] truncate pr-2">
                      {entry.mtime ? formatDate(entry.mtime) : '-'}
                    </div>
                    <div className="w-[16%] truncate pr-2 text-[var(--color-text-muted)]">
                      {entry.isDirectory ? '文件夹' : 'JSON 文件'}
                    </div>
                    <div className="w-[16%] truncate text-right text-[var(--color-text-muted)]">
                      {isFile && entry.size != null ? formatSize(entry.size) : ''}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-4 py-3 border-t border-[var(--color-border)] flex-shrink-0 bg-[var(--color-bg)]">
          {mode !== 'open' && (
            <>
              <label className="text-xs text-[var(--color-text-secondary)] whitespace-nowrap">文件名(N):</label>
              <input ref={inputRef} type="text" value={fileName}
                onChange={e => setFileName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleConfirm() }}
                placeholder={mode === 'folder' ? currentPath.split(/[/\\]/).pop() || '' : '文件名'}
                className="flex-1 h-8 px-3 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg outline-none text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] transition-colors min-w-0" />
            </>
          )}
          {mode === 'open' && (
            <div className="flex-1 flex items-center gap-2">
              <span className="text-xs text-[var(--color-text-secondary)] whitespace-nowrap">已选:</span>
              <span className="text-xs text-[var(--color-text)] truncate">{selectedPath ? selectedPath.split(/[/\\]/).pop() : '-'}</span>
            </div>
          )}
          {mode !== 'open' && (
            <label className="text-xs text-[var(--color-text-secondary)] whitespace-nowrap">文件类型:</label>
          )}
          {mode !== 'open' && (
            <div className="text-xs text-[var(--color-text-muted)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 whitespace-nowrap">
              {mode === 'folder' ? '文件夹' : 'Sycamore Files (*.json)'}
            </div>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={onClose}
              className="px-4 py-1.5 text-xs rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-hover)] transition-colors">
              取消
            </button>
            <button onClick={handleConfirm}
              className="px-4 py-1.5 text-xs rounded-lg bg-[var(--color-accent)] text-white hover:opacity-80 transition-opacity"
              disabled={mode === 'save' && !fileName.trim()}>
              {mode === 'save' ? '保存' : mode === 'folder' ? '选择文件夹' : '打开'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SidebarItem({ label, icon: Icon, onClick }: { label: string; icon: typeof Home; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs text-[var(--color-text)] hover:bg-[var(--color-hover)] transition-colors text-left">
      <Icon size={13} className="flex-shrink-0 text-[var(--color-text-secondary)]" />
      <span className="truncate">{label}</span>
    </button>
  )
}

export default FilePicker
