import { useState, useEffect } from 'react'
import { FilePlus, Feather, FileText, Folder, Link2 } from 'lucide-react'
import type { FolderEntry } from '../types'

interface WelcomePageProps {
  onNew: () => void
  onOpenFile?: (filePath: string) => void
  onLinkFolder?: () => void
  linkedFolderPath?: string | null
  folderEntries?: FolderEntry[]
}

function WelcomePage({ onNew, onOpenFile, onLinkFolder, linkedFolderPath, folderEntries }: WelcomePageProps) {
  const [showNotes, setShowNotes] = useState(false)
  const allFiles = (folderEntries || []).filter(e => !e.isDirectory && /\.json$/i.test(e.name))

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
        <div className="px-4 pt-3">
          <button
            onClick={() => setShowNotes(false)}
            className="text-xs text-[var(--color-accent)] hover:opacity-80 transition-opacity"
          >
            ← 返回
          </button>
        </div>

        {/* Files */}
        <div className="flex-1 overflow-y-auto p-4">
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
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {allFiles.map(entry => {
                const preview = entry.preview || ''
                const lines = preview.split('\n')
                const title = entry.name.replace(/\.json$/i, '')
                const bodyLines = lines.filter(l => !l.startsWith('#') && !l.startsWith('>') && !l.startsWith('-') && !l.match(/^\d+\.\s/)).join(' ').trim().slice(0, 120)
                return (
                  <button
                    key={entry.path}
                    onClick={() => onOpenFile?.(entry.path)}
                    className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 hover:shadow-md hover:border-[var(--color-accent)]/30 transition-all text-left group flex flex-col"
                  >
                    <p className="text-sm font-semibold text-[var(--color-text)] line-clamp-1 mb-1">
                      {title}
                    </p>
                    {bodyLines ? (
                      <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed line-clamp-2 flex-1">
                        {bodyLines}
                      </p>
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
        <Feather size={28} className="text-white" />
      </div>
      <h1 className="text-3xl font-semibold text-[var(--color-text)] mb-2 tracking-tight">
        Sycamore
      </h1>
      <p className="text-sm text-[var(--color-text-secondary)] mb-10 font-normal">
        专注写作，拥抱灵感
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