import { useState, useRef, memo } from 'react'
import {
  Bold, Italic, Strikethrough, Underline, Highlighter, Code, Link2,
  Check, Sparkles,
} from 'lucide-react'
import ColorPicker from './ColorPicker'

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
  onAi?: () => void
}

function SelectionToolbar({
  top, left, onBold, onItalic, onStrikethrough, onUnderline,
  onHighlight, onColor, onCode, onLink, onClose, onAi,
}: SelectionToolbarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const colorRef = useRef<HTMLDivElement>(null)

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
      {onAi && (
          <button onClick={() => { onAi(); onClose() }} className={`${btn} ai-btn`} title="AI 提问、润色、翻译、续写…" aria-label="AI 助手">
          <Sparkles size={14} className="text-[var(--color-accent)]" />
        </button>
      )}
      <button onClick={() => { onBold(); onClose() }} className={btn} title="加粗" aria-label="加粗"><Bold size={14} /></button>
      <button onClick={() => { onItalic(); onClose() }} className={btn} title="斜体" aria-label="斜体"><Italic size={14} /></button>
      <button onClick={() => { onStrikethrough(); onClose() }} className={btn} title="删除线" aria-label="删除线"><Strikethrough size={14} /></button>
      <button onClick={() => { onUnderline(); onClose() }} className={btn} title="下划线" aria-label="下划线"><Underline size={14} /></button>

      <div className="relative" ref={colorRef}>
        <ColorPicker onColor={(c) => { onColor(c); onClose() }} btnClass={btn} />
      </div>

      <button onClick={() => { onHighlight(); onClose() }} className={btn} title="高亮"><Highlighter size={14} /></button>
      <button onClick={() => { onCode(); onClose() }} className={btn} title="代码"><Code size={14} /></button>

      <div className="w-px h-5 bg-[var(--color-border)] mx-0.5" />

      {showLinkInput ? (
        <form onSubmit={(e) => { e.preventDefault(); handleLinkSubmit() }} className="flex items-center gap-1">
          <input
            ref={(el) => el?.focus()}
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

export default memo(SelectionToolbar)
