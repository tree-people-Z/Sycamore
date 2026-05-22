import { useState, useEffect, useRef } from 'react'
import { FilePlus, Feather, FileText, Folder, Leaf, Link2, Search } from 'lucide-react'
import type { FolderEntry } from '../types'

interface WelcomePageProps {
  onNew: () => void
  onOpenFile?: (filePath: string) => void
  onLinkFolder?: () => void
  linkedFolderPath?: string | null
  folderEntries?: FolderEntry[]
}

function highlightText(text: string, query: string): string {
  if (!query.trim() || !text) return text
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return escaped.replace(regex, '<mark class="bg-[var(--color-accent-10)] text-[var(--color-accent)] rounded px-0.5">$1</mark>')
}

function WelcomePage({ onNew, onOpenFile, onLinkFolder, linkedFolderPath, folderEntries }: WelcomePageProps) {
  const [showNotes, setShowNotes] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchExpanded, setSearchExpanded] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const allFiles = (folderEntries || []).filter(e => !e.isDirectory && /\.json$/i.test(e.name))
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

  const handleViewNotes = () => {
    setShowNotes(true)
  }

  if (showNotes) {
    return (
      <div className="absolute inset-0 bg-[var(--color-bg)] flex flex-col select-none z-10">
        {/* Back button */}
        <div className="px-4 pt-3 flex items-center justify-between">
          <button
            onClick={() => setShowNotes(false)}
            className="text-xs text-[var(--color-accent)] hover:opacity-80 transition-opacity"
          >
            ← 返回
          </button>
        </div>

        {/* Search bar */}
        <div className="px-4 py-2 flex justify-center">
          <div
            className="flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden transition-all duration-300 ease-out cursor-text"
            style={{
              width: searchExpanded ? 280 : 120,
              height: 36,
            }}
            onClick={() => {
              if (!searchExpanded) {
                setSearchExpanded(true)
                setTimeout(() => searchInputRef.current?.focus(), 200)
              }
            }}
          >
            <Search size={16} className="text-[var(--color-text-muted)] flex-shrink-0 ml-2.5" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={searchExpanded ? "搜索笔记..." : "搜索"}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onBlur={() => { if (!searchQuery.trim()) setSearchExpanded(false) }}
              className="bg-transparent outline-none text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] flex-1 px-2 py-1.5 min-w-0"
            />
            {searchQuery && (
              <button onClick={(e) => { e.stopPropagation(); setSearchQuery('') }} className="pr-2.5 flex-shrink-0 hover:opacity-80">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--color-text-muted)]">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Files */}
        <div className="flex-1 overflow-y-auto p-4 pt-1">
          {!linkedFolderPath ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Folder size={32} className="text-[var(--color-text-muted)] mb-3" />
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">尚未关联文件夹</p>
              {onLinkFolder && (
                <button
                  onClick={onLinkFolder}
                  className="px-4 py-2 text-xs rounded-lg bg-[var(--color-accent)] text-white hover:opacity-80 transition-opacity flex items-center gap-2"
                >
                  <Link2 size={14} />
                  关联文件夹
                </button>
              )}
            </div>
          ) : allFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <FileText size={32} className="text-[var(--color-text-muted)] mb-3" />
              <p className="text-sm text-[var(--color-text-secondary)]">该文件夹中暂无文件</p>
              <button
                onClick={onNew}
                className="mt-4 px-4 py-2 text-xs rounded-lg bg-[var(--color-accent)] text-white hover:opacity-80 transition-opacity flex items-center gap-2"
              >
                <FilePlus size={14} />
                新建笔记
              </button>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Search size={28} className="text-[var(--color-text-muted)] mb-3" />
              <p className="text-sm text-[var(--color-text-secondary)]">未找到相关笔记</p>
              <button
                onClick={() => { setSearchQuery(''); searchInputRef.current?.focus() }}
                className="mt-4 text-xs text-[var(--color-accent)] hover:opacity-80 transition-opacity"
              >
                清除搜索
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredFiles.map(entry => {
                const preview = entry.preview || ''
                const lines = preview.split('\n')
                const title = entry.name.replace(/\.json$/i, '')
                const bodyLines = lines.filter(l => !l.startsWith('#') && !l.startsWith('>') && !l.startsWith('-') && !l.match(/^\d+\.\s/)).join(' ').trim().slice(0, 120)
                const searchActive = searchQuery.trim().length > 0
                const highlightedTitle = searchActive ? highlightText(title, searchQuery) : ''
                const highlightedBody = searchActive && bodyLines ? highlightText(bodyLines, searchQuery) : ''
                return (
                  <button
                    key={entry.path}
                    onClick={() => onOpenFile?.(entry.path)}
                    className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 hover:shadow-md hover:border-[var(--color-accent)]/30 transition-all text-left group flex flex-col"
                  >
                    {searchActive && highlightedTitle ? (
                      <p className="text-sm font-semibold line-clamp-1 mb-1" dangerouslySetInnerHTML={{ __html: highlightedTitle }} />
                    ) : (
                      <p className="text-sm font-semibold text-[var(--color-text)] line-clamp-1 mb-1">{title}</p>
                    )}
                    {bodyLines ? (
                      searchActive && highlightedBody ? (
                        <p className="text-[11px] leading-relaxed line-clamp-2 flex-1" dangerouslySetInnerHTML={{ __html: highlightedBody }} />
                      ) : (
                        <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed line-clamp-2 flex-1">{bodyLines}</p>
                      )
                    ) : (
                      <div className="flex-1" />
                    )}
                    <p className="text-[10px] text-[var(--color-text-tertiary)] mt-2 truncate">
                      {linkedFolderPath
                        ? (entry.path.replace(linkedFolderPath, '').replace(/^[/\\]/, '').replace(/[/\\][^/\\]+$/, '') ||
                           linkedFolderPath.split(/[/\\]/).pop()) || ''
                        : ''}
                    </p>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 bg-[var(--color-bg)] flex flex-col items-center justify-center select-none z-10">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-alt)] flex items-center justify-center mb-6 shadow-lg" style={{ boxShadow: '0 8px 30px var(--color-accent-10)' }}>
        <Leaf size={28} className="text-white" />
      </div>
      <h1 className="text-3xl font-semibold text-[var(--color-text)] mb-8 tracking-tight">
        Sycamore
      </h1>

      <div className="flex flex-row-reverse gap-8 mb-6 justify-center items-start border-r border-[var(--color-border)] pr-5"
        style={{ fontFamily: "'Noto Serif SC','Songti SC','STSong','SimSun',serif" }}>
        <div className="text-xl leading-[2.6] tracking-wider text-[var(--color-text-secondary)]"
          style={{ writingMode: 'vertical-rl' }}>梧桐树，三更雨，</div>
        <div className="text-xl leading-[2.6] tracking-wider text-[var(--color-text-secondary)]"
          style={{ writingMode: 'vertical-rl' }}>不道离情正苦。</div>
        <div className="text-xl leading-[2.6] tracking-wider text-[var(--color-text-secondary)]"
          style={{ writingMode: 'vertical-rl' }}>一叶叶，一声声，</div>
        <div className="text-xl leading-[2.6] tracking-wider text-[var(--color-text-secondary)]"
          style={{ writingMode: 'vertical-rl' }}>空阶滴到明。</div>
      </div>

      <p className="text-xs text-[var(--color-text-muted)] mb-10 tracking-wide">
        ——温庭筠《更漏子》
      </p>

      <div className="flex gap-3">
        <button
          onClick={onNew}
          className="px-6 py-2.5 text-sm rounded-lg bg-[var(--color-accent)] text-white hover:opacity-80 transition-opacity font-medium flex items-center gap-2 shadow-sm"
        >
          <FilePlus size={16} />
          新建笔记
        </button>
        <button
          onClick={handleViewNotes}
          className="px-6 py-2.5 text-sm rounded-lg bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-hover)] transition-colors font-medium flex items-center gap-2 border border-[var(--color-border)] shadow-sm"
        >
          <Feather size={16} />
          查看笔记
        </button>
      </div>
      <p className="mt-10 text-xs text-[var(--color-text-muted)]">
        或按 <kbd className="px-1.5 py-0.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-[10px] font-mono">⌘N</kbd> 快速新建
      </p>
    </div>
  )
}

export default WelcomePage