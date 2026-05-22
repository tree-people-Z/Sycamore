import { useState, useRef, useEffect } from 'react'
import {
  Bold, Italic, Strikethrough, Underline, Highlighter, Code, Link2,
  Check, Palette,
} from 'lucide-react'
import { COLORS } from '../constants'

interface SelectionToolbarProps {
  top: number
  left: number
  onBold: () => void
  onItalic: () => void
  onStrikethrough: () => void
  onUnderline: () => void
  onHighlight: () => void
  onColor: (color: string) => void
  onCode: () => void
  onLink: (url: string) => void
  onClose: () => void
}

function SelectionToolbar({
  top, left, onBold, onItalic, onStrikethrough, onUnderline,
  onHighlight, onColor, onCode, onLink, onClose,
}: SelectionToolbarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const colorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) setShowColorPicker(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const handleLinkSubmit = () => {
    if (linkUrl.trim()) onLink(linkUrl.trim())
    setLinkUrl('')
    setShowLinkInput(false)
  }

  const btn = 'w-7 h-7 flex items-center justify-center text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] rounded transition-colors'

  return (
    <div
      className="fixed z-[100] flex items-center gap-0.5 bg-[var(--color-surface)] rounded-lg shadow-xl border border-[var(--color-border)] px-1 py-1 selection-toolbar"
      style={{ top: `${top}px`, left: `${left}px` }}
    >
      <button onClick={() => { onBold(); onClose() }} className={btn} title="加粗"><Bold size={14} /></button>
      <button onClick={() => { onItalic(); onClose() }} className={btn} title="斜体"><Italic size={14} /></button>
      <button onClick={() => { onStrikethrough(); onClose() }} className={btn} title="删除线"><Strikethrough size={14} /></button>
      <button onClick={() => { onUnderline(); onClose() }} className={btn} title="下划线"><Underline size={14} /></button>

      <div className="relative" ref={colorRef}>
        <button onClick={() => setShowColorPicker(v => !v)} className={btn} title="文字颜色"><Palette size={14} /></button>
        {showColorPicker && (
          <div className="absolute bottom-full left-0 mb-1 bg-[var(--color-surface)] rounded-lg shadow-xl border border-[var(--color-border)] p-2 z-50" style={{ width: '144px' }}>
            <div className="flex flex-wrap gap-1">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => { onColor(c); onClose(); setShowColorPicker(false) }}
                  className="w-6 h-6 rounded border border-[var(--color-border)] hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <button onClick={() => { onHighlight(); onClose() }} className={btn} title="高亮"><Highlighter size={14} /></button>
      <button onClick={() => { onCode(); onClose() }} className={btn} title="代码"><Code size={14} /></button>

      <div className="w-px h-5 bg-[var(--color-border)] mx-0.5" />

      {showLinkInput ? (
        <form onSubmit={(e) => { e.preventDefault(); handleLinkSubmit() }} className="flex items-center gap-1">
          <input
            autoFocus
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="输入 URL..."
            className="w-32 h-7 px-2 text-xs bg-[var(--color-bg)] border border-[var(--color-border)] rounded outline-none text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)]"
            onKeyDown={(e) => { if (e.key === 'Escape') setShowLinkInput(false) }}
          />
          <button type="submit" className="w-7 h-7 flex items-center justify-center text-white bg-[var(--color-accent)] rounded hover:opacity-80 transition-opacity"><Check size={14} /></button>
        </form>
      ) : (
        <button onClick={() => setShowLinkInput(true)} className={btn} title="链接"><Link2 size={14} /></button>
      )}
    </div>
  )
}

export default SelectionToolbar
