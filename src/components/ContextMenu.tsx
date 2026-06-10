import { useCallback, useEffect, useRef, useState, memo } from 'react'
import { Pencil, ExternalLink, Copy, Trash2 } from 'lucide-react'

interface ContextMenuEntry {
  path: string
  name: string
  isDirectory: boolean
}

interface ContextMenuProps {
  x: number
  y: number
  entry: ContextMenuEntry
  onClose: () => void
  onRename?: (entry: ContextMenuEntry) => void
  onOpenFolder?: (entry: ContextMenuEntry) => void
  onCopyPath?: (entry: ContextMenuEntry) => void
  onDelete?: (entry: ContextMenuEntry) => void
}

function ContextMenu({ x, y, entry, onClose, onRename, onOpenFolder, onCopyPath, onDelete }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ left: x, top: y })

  useEffect(() => {
    setPos({ left: x, top: y })
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect()
      setPos({
        left: Math.min(x, window.innerWidth - rect.width - 8),
        top: Math.min(y, window.innerHeight - rect.height - 8),
      })
    }
  }, [x, y])

  useEffect(() => {
    const dismiss = () => onClose()
    document.addEventListener('click', dismiss)
    document.addEventListener('scroll', dismiss, true)
    return () => {
      document.removeEventListener('click', dismiss)
      document.removeEventListener('scroll', dismiss, true)
    }
  }, [onClose])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[150px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl py-1.5"
      style={{ left: pos.left, top: pos.top }}
      tabIndex={-1}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={handleKeyDown}
      role="menu"
      aria-label="文件操作菜单"
    >
      {onRename && (
        <button
          onClick={() => { onRename(entry); onClose() }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-[var(--color-text)] hover:bg-[var(--color-hover)] transition-colors text-left"
          role="menuitem"
        >
          <Pencil size={13} />
          <span>重命名</span>
        </button>
      )}
      {onOpenFolder && (
        <button
          onClick={() => { onOpenFolder(entry); onClose() }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-[var(--color-text)] hover:bg-[var(--color-hover)] transition-colors text-left"
          role="menuitem"
        >
          <ExternalLink size={13} />
          <span>打开文件夹</span>
        </button>
      )}
      {onCopyPath && (
        <button
          onClick={() => { onCopyPath(entry); onClose() }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-[var(--color-text)] hover:bg-[var(--color-hover)] transition-colors text-left"
          role="menuitem"
        >
          <Copy size={13} />
          <span>复制路径</span>
        </button>
      )}
      {onDelete && (
        <>
          <div className="h-px bg-[var(--color-border)] mx-2 my-1" />
          <button
            onClick={() => { onDelete(entry); onClose() }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-red-500 hover:bg-red-500/10 transition-colors text-left"
            role="menuitem"
          >
            <Trash2 size={13} />
            <span>删除</span>
          </button>
        </>
      )}
    </div>
  )
}

export default memo(ContextMenu)
