import { memo, useRef, useEffect } from 'react'

interface ImageInputDialogProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onClose: () => void
}

function ImageInputDialog({ value, onChange, onSubmit, onClose }: ImageInputDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSubmit()
    if (e.key === 'Escape') { onChange(''); onClose() }
  }

  return (
    <div role="button" tabIndex={-1} className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/10 dialog-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }} onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}>
      <div className="bg-[var(--color-surface)] rounded-xl shadow-2xl p-4 border border-[var(--color-border)] min-w-[360px] dialog-panel">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-[var(--color-text)]">插入图片 URL</span>
          <button onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] rounded transition-colors" aria-label="关闭">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <input ref={inputRef} type="text" value={value} onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://..."
          className="w-full h-9 px-3 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg outline-none text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] transition-colors" />
        <div className="flex justify-end gap-2 mt-3">
          <button onClick={onClose}
            className="px-3 py-1.5 text-xs rounded-lg bg-[var(--color-hover)] text-[var(--color-text)] hover:opacity-80 transition-opacity">取消</button>
          <button onClick={onSubmit}
            className="px-3 py-1.5 text-xs rounded-lg bg-[var(--color-accent)] text-white hover:opacity-80 transition-colors">插入</button>
        </div>
      </div>
    </div>
  )
}

export default memo(ImageInputDialog)
