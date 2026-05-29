import { useState, useEffect, useRef, useCallback } from 'react'
import { FilePlus, Feather, FileText, Folder, Leaf, Link2, Search, Trash2, Pencil, Copy, ExternalLink } from 'lucide-react'
import type { FolderEntry } from '../types'

interface WelcomePageProps {
  onNew: () => void
  onOpenFile?: (filePath: string) => void
  onLinkFolder?: () => void
  linkedFolderPath?: string | null
  folderEntries?: FolderEntry[]
  onRefreshFolder?: () => void
}

const POEM_LINES = ['梧桐树，三更雨，', '不道离情正苦。', '一叶叶，一声声，', '空阶滴到明。']

function highlightText(text: string, query: string): string {
  if (!query.trim() || !text) return text
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return escaped.replace(regex, '<mark class="bg-[var(--color-accent-10)] text-[var(--color-accent)] rounded px-0.5">$1</mark>')
}

function getFileLocation(filePath: string, linkedFolderPath: string | null) {
  if (!linkedFolderPath) return ''
  const relative = filePath.replace(linkedFolderPath, '').replace(/^[/\\]/, '').replace(/[/\\][^/\\]+$/, '')
  return relative || linkedFolderPath.split(/[/\\]/).pop() || ''
}

function getBodyPreview(preview: string) {
  const lines = preview.split('\n')
  return lines.filter(l => !l.startsWith('#') && !l.startsWith('>') && !l.startsWith('-') && !l.match(/^\d+\.\s/)).join(' ').trim().slice(0, 120)
}

function WelcomePage({ onNew, onOpenFile, onLinkFolder, linkedFolderPath, folderEntries, onRefreshFolder }: WelcomePageProps) {
  const [showNotes, setShowNotes] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchExpanded, setSearchExpanded] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; entry: FolderEntry } | null>(null)

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

  const allFiles = (folderEntries || []).filter(e => !e.isDirectory && /\.json$/i.test(e.name))
    .sort((a, b) => (b.mtime || 0) - (a.mtime || 0))
  const filteredFiles = searchQuery.trim()
    ? allFiles.filter(entry => {
        const title = entry.name.replace(/\.json$/i, '')
        const body = entry.preview || ''
        const q = searchQuery.toLowerCase()
        return title.toLowerCase().includes(q) || body.toLowerCase().includes(q)
      })
    : allFiles

  useEffect(() => {
    setShowNotes(false)
  }, [linkedFolderPath])

  const handleViewNotes = () => setShowNotes(true)

  const handleContextMenu = useCallback((e: React.MouseEvent, entry: FolderEntry) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, entry })
  }, [])

  const handleDelete = useCallback(async (entry: FolderEntry) => {
    setContextMenu(null)
    const name = entry.name.replace(/\.json$/i, '')
    if (!window.confirm(`确定要删除"${name}"吗？`)) return
    const ok = await window.electronAPI?.deleteEntry(entry.path)
    if (ok) onRefreshFolder?.()
  }, [onRefreshFolder])

  const handleRename = useCallback(async (entry: FolderEntry) => {
    setContextMenu(null)
    const oldName = entry.name.replace(/\.json$/i, '')
    const newName = window.prompt('输入新名称：', oldName)
    if (!newName || newName === oldName) return
    const dir = entry.path.replace(/[/\\][^/\\]+$/, '')
    const newPath = dir + '\\' + newName + '.json'
    const ok = await window.electronAPI?.renameEntry(entry.path, newPath)
    if (ok) onRefreshFolder?.()
  }, [onRefreshFolder])

  const handleOpenFolder = useCallback(async (entry: FolderEntry) => {
    setContextMenu(null)
    await window.electronAPI?.openInExplorer(entry.path)
  }, [])

  const handleCopyPath = useCallback((entry: FolderEntry) => {
    setContextMenu(null)
    navigator.clipboard.writeText(entry.path)
  }, [])

  return (
    <>
      {showNotes ? (
        <div className="absolute inset-0 bg-[var(--color-bg)] flex flex-col select-none z-10">
          <div className="px-4 pt-3 flex items-center justify-between">
            <button onClick={() => setShowNotes(false)}
              className="text-xs text-[var(--color-accent)] hover:opacity-80 transition-opacity">
              ← 返回
            </button>
          </div>

          <div className="px-4 py-2 flex justify-center">
            <div className="flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden transition-all duration-300 ease-out cursor-text"
              style={{ width: searchExpanded ? 280 : 120, height: 36 }}
              onClick={() => {
                if (!searchExpanded) {
                  setSearchExpanded(true)
                  setTimeout(() => searchInputRef.current?.focus(), 200)
                }
              }}>
              <Search size={16} className="text-[var(--color-text-muted)] flex-shrink-0 ml-2.5" />
              <input ref={searchInputRef} type="text"
                placeholder={searchExpanded ? "搜索笔记..." : "搜索"}
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                onBlur={() => { if (!searchQuery.trim()) setSearchExpanded(false) }}
                className="bg-transparent outline-none text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] flex-1 px-2 py-1.5 min-w-0" />
              {searchQuery && (
                <button onClick={(e) => { e.stopPropagation(); setSearchQuery('') }}
                  className="pr-2.5 flex-shrink-0 hover:opacity-80">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className="text-[var(--color-text-muted)]">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 pt-1">
            {!linkedFolderPath ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Folder size={32} className="text-[var(--color-text-muted)] mb-3" />
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">尚未关联文件夹</p>
                {onLinkFolder && (
                  <button onClick={onLinkFolder}
                    className="px-4 py-2 text-xs rounded-lg bg-[var(--color-accent)] text-white hover:opacity-80 transition-opacity flex items-center gap-2">
                    <Link2 size={14} /> 关联文件夹
                  </button>
                )}
              </div>
            ) : allFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <FileText size={32} className="text-[var(--color-text-muted)] mb-3" />
                <p className="text-sm text-[var(--color-text-secondary)]">该文件夹中暂无文件</p>
                <button onClick={onNew}
                  className="mt-4 px-4 py-2 text-xs rounded-lg bg-[var(--color-accent)] text-white hover:opacity-80 transition-opacity flex items-center gap-2">
                  <FilePlus size={14} /> 新建笔记
                </button>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Search size={28} className="text-[var(--color-text-muted)] mb-3" />
                <p className="text-sm text-[var(--color-text-secondary)]">未找到相关笔记</p>
                <button onClick={() => { setSearchQuery(''); searchInputRef.current?.focus() }}
                  className="mt-4 text-xs text-[var(--color-accent)] hover:opacity-80 transition-opacity">
                  清除搜索
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredFiles.map(entry => {
                  const title = entry.name.replace(/\.json$/i, '')
                  const bodyLines = getBodyPreview(entry.preview || '')
                  const searchActive = searchQuery.trim().length > 0
                  const hlTitle = searchActive ? highlightText(title, searchQuery) : ''
                  const hlBody = searchActive && bodyLines ? highlightText(bodyLines, searchQuery) : ''
                  const showTitle = searchActive && hlTitle
                  const showBody = searchActive && hlBody
                  return (
                    <button key={entry.path} onClick={() => onOpenFile?.(entry.path)}
                      onContextMenu={(e) => handleContextMenu(e, entry)}
                      className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 hover:shadow-md hover:border-[var(--color-accent)]/30 transition-all text-left group flex flex-col">
                      {showTitle ? (
                        <p className="text-sm font-semibold line-clamp-1 mb-1" dangerouslySetInnerHTML={{ __html: hlTitle }} />
                      ) : (
                        <p className="text-sm font-semibold text-[var(--color-text)] line-clamp-1 mb-1">{title}</p>
                      )}
                      {bodyLines ? (
                        showBody ? (
                          <p className="text-[11px] leading-relaxed line-clamp-2 flex-1" dangerouslySetInnerHTML={{ __html: hlBody }} />
                        ) : (
                          <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed line-clamp-2 flex-1">{bodyLines}</p>
                        )
                      ) : <div className="flex-1" />}
                      <p className="text-[10px] text-[var(--color-text-tertiary)] mt-2 truncate">
                        {getFileLocation(entry.path, linkedFolderPath)}
                      </p>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 bg-[var(--color-bg)] flex flex-col items-center justify-center select-none z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-alt)] flex items-center justify-center mb-6 shadow-lg"
            style={{ boxShadow: '0 8px 30px var(--color-accent-10)' }}>
            <Leaf size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-semibold text-[var(--color-text)] mb-8 tracking-tight">Sycamore</h1>

          <div className="flex flex-row-reverse gap-8 mb-6 justify-center items-start border-r border-[var(--color-border)] pr-5"
            style={{ fontFamily: "'Noto Serif SC','Songti SC','STSong','SimSun',serif" }}>
            {POEM_LINES.map((line, i) => (
              <div key={i} className="text-xl leading-[2.6] tracking-wider text-[var(--color-text-secondary)]"
                style={{ writingMode: 'vertical-rl' }}>{line}</div>
            ))}
          </div>

          <p className="text-xs text-[var(--color-text-muted)] mb-10 tracking-wide">
            ——温庭筠《更漏子》
          </p>

          <div className="flex gap-3">
            <button onClick={onNew}
              className="px-6 py-2.5 text-sm rounded-lg bg-[var(--color-accent)] text-white hover:opacity-80 transition-opacity font-medium flex items-center gap-2 shadow-sm">
              <FilePlus size={16} /> 新建笔记
            </button>
            <button onClick={handleViewNotes}
              className="px-6 py-2.5 text-sm rounded-lg bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-hover)] transition-colors font-medium flex items-center gap-2 border border-[var(--color-border)] shadow-sm">
              <Feather size={16} /> 查看笔记
            </button>
          </div>
          <p className="mt-10 text-xs text-[var(--color-text-muted)]">
            或按 <kbd className="px-1.5 py-0.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-[10px] font-mono">⌘N</kbd> 快速新建
          </p>
        </div>
      )}

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

export default WelcomePage
