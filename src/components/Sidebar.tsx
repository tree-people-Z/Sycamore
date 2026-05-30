import { useState, useCallback, useMemo, useEffect } from 'react'
import {
  FilePlus, FileText, Folder, FolderOpen, Search,
  ChevronRight, Link2, Unlink, RefreshCw,
  List, FolderTree, ChevronLeft, Trash2,
  Pencil, Copy, ExternalLink,
} from 'lucide-react'
import type { FolderEntry } from '../types'

interface SidebarProps {
  onNew: () => void
  onOpenFile?: (filePath: string) => void
  folderPath?: string | null
  folderEntries?: FolderEntry[]
  onLinkFolder?: () => void
  onUnlinkFolder?: () => void
  linkedFolderPath?: string | null
  isVisible: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
  onRefreshFolder?: () => void
  onClose?: () => void
}

function Sidebar({
  onNew, onOpenFile, folderPath, folderEntries,
  onLinkFolder, onUnlinkFolder, linkedFolderPath,
  isVisible, onMouseEnter, onMouseLeave, onRefreshFolder, onClose,
}: SidebarProps) {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('sidebar-expanded-dirs')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch { return new Set() }
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [trashItems, setTrashItems] = useState<FolderEntry[]>([])
  const [showTrash, setShowTrash] = useState(false)
  const [viewMode, setViewMode] = useState<'tree' | 'flat'>('tree')
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; entry: FolderEntry } | null>(null)

  useEffect(() => {
    try { localStorage.setItem('sidebar-expanded-dirs', JSON.stringify([...expandedDirs])) }
    catch {}
  }, [expandedDirs])

  useEffect(() => {
    if (!isVisible) {
      setSearchQuery('')
      setContextMenu(null)
    }
  }, [isVisible])

  useEffect(() => {
    const dismiss = () => setContextMenu(null)
    if (contextMenu) {
      document.addEventListener('click', dismiss)
      document.addEventListener('scroll', dismiss, true)
    }
    return () => {
      document.removeEventListener('click', dismiss)
      document.removeEventListener('scroll', dismiss, true)
    }
  }, [contextMenu])

  useEffect(() => {
    if (isVisible && linkedFolderPath) {
      window.electronAPI?.listTrashItems(linkedFolderPath).then(items => setTrashItems(items || []))
    }
  }, [isVisible, linkedFolderPath])

  const toggleDir = useCallback((dirPath: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev)
      if (next.has(dirPath)) next.delete(dirPath)
      else next.add(dirPath)
      return next
    })
  }, [])

  const handleOpenFileWrapper = useCallback((filePath: string) => {
    setCurrentFilePath(filePath)
    setContextMenu(null)
    onOpenFile?.(filePath)
  }, [onOpenFile])

  const handleContextMenu = useCallback((e: React.MouseEvent, entry: FolderEntry) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, entry })
  }, [])

  const handleDelete = useCallback(async (entry: FolderEntry) => {
    setContextMenu(null)
    const name = entry.name.replace(/\.json$/i, '')
    if (entry.isDirectory) {
      const count = await window.electronAPI?.countDirectoryContents(entry.path) ?? 0
      if (count > 0 && !window.confirm(`文件夹"${name}"包含 ${count} 个文件，确定移到回收站吗？`)) return
    } else if (!window.confirm(`确定要删除"${name}"吗？`)) return
    const ok = await window.electronAPI?.deleteEntry(entry.path)
    if (ok) {
      if (currentFilePath === entry.path) {
        setCurrentFilePath(null)
      }
      onRefreshFolder?.()
    }
  }, [currentFilePath, onRefreshFolder])

  const handleRename = useCallback(async (entry: FolderEntry) => {
    setContextMenu(null)
    const oldName = entry.name.replace(/\.json$/i, '')
    const newName = window.prompt('输入新名称：', oldName)
    if (!newName || newName === oldName) return
    const dir = entry.path.replace(/[/\\][^/\\]+$/, '')
    const newPath = dir + '\\' + newName + (entry.isDirectory ? '' : '.json')
    const ok = await window.electronAPI?.renameEntry(entry.path, newPath)
    if (ok) {
      if (currentFilePath === entry.path) {
        setCurrentFilePath(newPath)
      }
      onRefreshFolder?.()
    }
  }, [currentFilePath, onRefreshFolder])

  const handleOpenFolder = useCallback(async (entry: FolderEntry) => {
    setContextMenu(null)
    await window.electronAPI?.openInExplorer(entry.path)
  }, [])

  const handleCopyPath = useCallback((entry: FolderEntry) => {
    setContextMenu(null)
    navigator.clipboard.writeText(entry.path)
  }, [])

  const matchesSearch = useCallback((name: string, preview?: string) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return name.toLowerCase().includes(q) || (preview || '').toLowerCase().includes(q)
  }, [searchQuery])

  const dirHasMatchingChild = useCallback((dirPath: string) => {
    if (!searchQuery || !folderEntries) return false
    const prefix = dirPath.replace(/\\/g, '/') + '/'
    return folderEntries.some(e => {
      const parent = e.path.replace(/[/\\][^/\\]+$/, '').replace(/\\/g, '/') + '/'
      return parent === prefix && matchesSearch(e.name, e.preview)
    })
  }, [searchQuery, folderEntries, matchesSearch])

  const filteredEntries = useMemo(
    () => folderEntries?.filter(e => matchesSearch(e.name, e.preview) || (e.isDirectory && dirHasMatchingChild(e.path))) ?? [],
    [folderEntries, matchesSearch, dirHasMatchingChild],
  )
  const flatEntries = useMemo(
    () => (folderEntries || []).filter(e => !e.isDirectory && /\.json$/i.test(e.name) && matchesSearch(e.name, e.preview))
      .sort((a, b) => (b.mtime || 0) - (a.mtime || 0)),
    [folderEntries, matchesSearch],
  )

  return (
    <>
      {!isVisible && (
        <div
          className="absolute left-0 top-0 bottom-0 w-5 z-30"
          onMouseEnter={onMouseEnter}
        />
      )}

      <div
        className={`sidebar-panel absolute left-0 top-0 bottom-0 w-64 z-20 bg-[var(--color-bg)] border-r border-[var(--color-border)] flex flex-col select-none shadow-xl transition-all duration-500 ${
          isVisible ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* Search + buttons */}
        <div className="h-10 flex items-center px-3 gap-1 border-b border-[var(--color-border)] flex-shrink-0">
          <div className="flex-1 relative">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#aeaeb2] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索..."
              className="w-full h-7 pl-7 pr-2 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md outline-none text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] transition-colors"
            />
          </div>
          <button
            onClick={() => setViewMode(v => v === 'tree' ? 'flat' : 'tree')}
            className="w-7 h-7 flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] rounded-md transition-colors flex-shrink-0"
            title={viewMode === 'tree' ? '列表视图' : '文件夹视图'}
          >
            {viewMode === 'tree' ? <List size={14} /> : <FolderTree size={14} />}
          </button>
          <button
            onClick={onNew}
            className="w-7 h-7 flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] rounded-md transition-colors flex-shrink-0"
            title="新建文档"
          >
            <FilePlus size={15} />
          </button>
          {onRefreshFolder && linkedFolderPath && (
            <button
              onClick={onRefreshFolder}
              className="w-7 h-7 flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] rounded-md transition-colors flex-shrink-0"
              title="刷新"
            >
              <RefreshCw size={13} />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] rounded-md transition-colors flex-shrink-0"
              title="收起侧栏"
            >
              <ChevronLeft size={15} />
            </button>
          )}
        </div>

        {/* Files */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {!folderPath ? (
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
              <FileText size={16} className="text-[var(--color-accent)] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text)] truncate">无标题文档</p>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">未保存</p>
              </div>
            </div>
          ) : viewMode === 'flat' ? (
            flatEntries.length === 0 ? (
              <p className="text-xs text-[#aeaeb2] text-center pt-6">无匹配文件</p>
            ) : (
                  flatEntries.map(entry => (
                <button
                  key={entry.path}
                  onClick={() => handleOpenFileWrapper(entry.path)}
                  onContextMenu={(e) => handleContextMenu(e, entry)}
                  className={`sidebar-item w-full rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-3 hover:shadow-md hover:border-[var(--color-accent)]/30 transition-all text-left ${currentFilePath === entry.path ? 'active' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-10)] flex items-center justify-center flex-shrink-0">
                      <FileText size={16} className="text-[var(--color-accent)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--color-text)] truncate">{entry.name.replace(/\.json$/i, '')}</p>
                      <p className="text-[11px] text-[var(--color-text-muted)] truncate mt-0.5">{folderPath ? entry.path.replace(folderPath, '').replace(/^[/\\]/, '') : ''}</p>
                    </div>
                  </div>
                </button>
              ))
            )
          ) : (
            /* Tree view - root level entries only, subdirs expand on demand */
            (() => {
              const isRootLevel = (entry: FolderEntry) => {
                if (!folderPath) return true
                const rel = entry.path.replace(folderPath, '').replace(/^[/\\]/, '')
                return !rel.includes('/') && !rel.includes('\\')
              }
              const dirHasFiles = (dirPath: string) => {
                const prefix = dirPath.replace(/\\/g, '/') + '/'
                return (folderEntries || []).some(e =>
                  !e.isDirectory && /\.json$/i.test(e.name) && e.path.replace(/\\/g, '/') !== dirPath.replace(/\\/g, '/') && e.path.replace(/\\/g, '/').startsWith(prefix)
                )
              }
              const visibleRoot = filteredEntries.filter(e =>
                isRootLevel(e) && (
                  !e.isDirectory
                    ? /\.json$/i.test(e.name)
                    : dirHasFiles(e.path)
                )
              )
              return visibleRoot.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)] text-center pt-6">无匹配文件</p>
              ) : (
                visibleRoot.map(entry => (
                  <div key={entry.path}>
                    {entry.isDirectory ? (
                      <div>
                        <button
                          onClick={() => toggleDir(entry.path)}
                          onContextMenu={(e) => handleContextMenu(e, entry)}
                          className="sidebar-item w-full rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-3 hover:shadow-md hover:border-[var(--color-accent)]/30 transition-all text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-10)] flex items-center justify-center flex-shrink-0">
                              {expandedDirs.has(entry.path)
                                ? <FolderOpen size={16} className="text-[var(--color-accent)]" />
                                : <Folder size={16} className="text-[var(--color-accent)]" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-[var(--color-text)] truncate">{entry.name}</p>
                              <p className="text-[11px] text-[var(--color-text-muted)] truncate mt-0.5">文件夹</p>
                            </div>
                            <div className={`flex-shrink-0 folder-chevron${expandedDirs.has(entry.path) ? ' open' : ''}`}>
                              <ChevronRight size={14} className="text-[var(--color-text-muted)]" />
                            </div>
                          </div>
                        </button>
                        {expandedDirs.has(entry.path) && (
                          <div className="mt-1 ml-4 space-y-1">
                            {(folderEntries || []).filter(e => {
                              const parent = e.path.replace(/[/\\][^/\\]+$/, '').replace(/\\/g, '/')
                              const dir = entry.path.replace(/\\/g, '/')
                              return parent === dir && (e.isDirectory || /\.json$/i.test(e.name)) && matchesSearch(e.name, e.preview)
                            }).map(sub => (
                              sub.isDirectory ? (
                                <div key={sub.path} className="px-3 py-2 text-xs text-[var(--color-text-secondary)] truncate">
                                  <Folder size={12} className="inline mr-1" />{sub.name}
                                </div>
                              ) : (
                                <button
                                  key={sub.path}
                                  onClick={() => handleOpenFileWrapper(sub.path)}
                                  onContextMenu={(e) => handleContextMenu(e, sub)}
                                  className={`sidebar-item w-full rounded-lg bg-[var(--color-surface)]/50 border border-[var(--color-border)] px-3 py-2 hover:bg-[var(--color-surface)] hover:shadow-sm transition-all text-left ${currentFilePath === sub.path ? 'active' : ''}`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-6 h-6 rounded-md bg-[var(--color-accent-8)] flex items-center justify-center flex-shrink-0">
                                      <FileText size={12} className="text-[var(--color-accent)]" />
                                    </div>
                                    <p className="text-xs font-medium text-[var(--color-text)] truncate">{sub.name.replace(/\.json$/i, '')}</p>
                                  </div>
                                </button>
                              )
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenFileWrapper(entry.path)}
                        onContextMenu={(e) => handleContextMenu(e, entry)}
                        className={`sidebar-item w-full rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-3 hover:shadow-md hover:border-[var(--color-accent)]/30 transition-all text-left ${currentFilePath === entry.path ? 'active' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-10)] flex items-center justify-center flex-shrink-0">
                            <FileText size={16} className="text-[var(--color-accent)]" />
                          </div>
                          <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--color-text)] truncate">{entry.name.replace(/\.json$/i, '')}</p>
                            <p className="text-[11px] text-[var(--color-text-muted)] truncate mt-0.5">{folderPath ? entry.path.replace(folderPath, '').replace(/^[/\\]/, '') : ''}</p>
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                ))
              )
            })()
          )}
        </div>

        {/* Bottom: Linked folder button */}
        <div className="flex-shrink-0 border-t border-[var(--color-border)] px-3 py-2.5">
          {linkedFolderPath ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onLinkFolder}
                className="flex-1 flex items-center gap-2 px-3 py-2 text-xs rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-accent)] hover:shadow-sm transition-all truncate"
                title="更换关联文件夹"
              >
                <Link2 size={12} />
                <span className="truncate">{linkedFolderPath.split(/[/\\]/).pop()}</span>
              </button>
              <button
                onClick={onUnlinkFolder}
                className="w-7 h-7 flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] rounded-md transition-colors"
                title="解除关联"
              >
                <Unlink size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={onLinkFolder}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-lg border border-dashed border-[var(--color-text-tertiary)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all"
            >
              <Link2 size={12} />
              <span>关联文件夹</span>
            </button>
          )}
        </div>

        {trashItems.length > 0 && (
          <div className="flex-shrink-0 border-t border-[var(--color-border)] bg-red-500/[0.03] dark:bg-red-500/[0.05]">
            <button onClick={() => setShowTrash(v => !v)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500/70 hover:text-red-500 hover:bg-red-500/5 transition-colors">
              <Trash2 size={12} />
              <span className="truncate font-medium">回收站 ({trashItems.length})</span>
              <ChevronRight size={11} className={`ml-auto transition-transform${showTrash ? ' rotate-90' : ''}`} />
            </button>
            {showTrash && (
              <div className="px-2 pb-2 space-y-0.5 ml-[2px]">
                {trashItems.map(item => (
                  <div key={item.path} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-red-500/5 group">
                    <Trash2 size={10} className="flex-shrink-0 text-red-500/40" />
                    <span className="flex-1 text-[11px] text-[var(--color-text-secondary)] truncate">{item.name}</span>
                    <button onClick={async () => {
                      const orig = item.path.replace(/[/\\]\.trash[/\\]\d+-/, '\\')
                      const restored = await window.electronAPI?.restoreFromTrash(item.path, orig)
                      if (restored) {
                        setTrashItems(prev => prev.filter(t => t.path !== item.path))
                        onRefreshFolder?.()
                      }
                    }}
                      className="text-[10px] px-1.5 py-0.5 rounded text-[var(--color-accent)] hover:bg-[var(--color-accent-10)] opacity-0 group-hover:opacity-100 transition-opacity">还原</button>
                    <button onClick={async () => {
                      if (window.confirm(`永久删除"${item.name}"？不可恢复`)) {
                        await window.electronAPI?.permanentDelete(item.path)
                        setTrashItems(prev => prev.filter(t => t.path !== item.path))
                      }
                    }}
                      className="text-[10px] px-1.5 py-0.5 rounded text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity">永久删除</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {contextMenu && (
        <div
          className="fixed z-50 min-w-[150px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl py-1.5"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleRename(contextMenu.entry)}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-[var(--color-text)] hover:bg-[var(--color-hover)] transition-colors text-left"
          >
            <Pencil size={13} />
            <span>重命名</span>
          </button>
          <button
            onClick={() => handleOpenFolder(contextMenu.entry)}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-[var(--color-text)] hover:bg-[var(--color-hover)] transition-colors text-left"
          >
            <ExternalLink size={13} />
            <span>打开文件夹</span>
          </button>
          <button
            onClick={() => handleCopyPath(contextMenu.entry)}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-[var(--color-text)] hover:bg-[var(--color-hover)] transition-colors text-left"
          >
            <Copy size={13} />
            <span>复制路径</span>
          </button>
          <div className="h-px bg-[var(--color-border)] mx-2 my-1" />
          <button
            onClick={() => handleDelete(contextMenu.entry)}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-red-500 hover:bg-red-500/10 transition-colors text-left"
          >
            <Trash2 size={13} />
            <span>删除</span>
          </button>
        </div>
      )}
    </>
  )
}

export default Sidebar
