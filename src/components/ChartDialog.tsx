import { useState, useRef, useEffect, memo } from 'react'
import { X } from 'lucide-react'
import mermaid from 'mermaid'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { DIAGRAM_TYPES, initMermaid } from '../editor/extensions/mermaid-shared'

interface ChartDialogProps {
  onInsert: (content: string) => void
  onClose: () => void
}

const CHART_ID = 'chart-dialog-preview'

function ChartDialog({ onInsert, onClose }: ChartDialogProps) {
  const [code, setCode] = useState(DIAGRAM_TYPES[0].content!)
  const [error, setError] = useState('')
  const previewRef = useRef<HTMLDivElement>(null)
  const panelRef = useFocusTrap(true)
  const idRef = useRef(0)
  if (idRef.current === 0) idRef.current = Date.now()
  const isMac = navigator.platform.includes('Mac')
  const shortcut = isMac ? '⌘⏎ 插入 · ⎋ 关闭' : 'Ctrl+Enter 插入 · Esc 关闭'

  useEffect(() => { initMermaid() }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!code.trim()) { setError(''); if (previewRef.current) previewRef.current.innerHTML = ''; return }
      mermaid.parse(code)
      const renderId = `${CHART_ID}-${idRef.current}`
      mermaid.render(renderId, code).then(({ svg }) => {
        if (previewRef.current) previewRef.current.innerHTML = svg
        setError('')
      }).catch((e) => {
        setError(e.str || e.message || '语法错误')
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [code])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      if (code.trim()) onInsert(code.trim())
    }
    if (e.key === 'Escape') onClose()
  }

  return (
    <div role="button" tabIndex={-1} className="fixed inset-0 z-50 flex items-start justify-center pt-12 bg-black/20 dialog-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }} onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}>
      <div ref={panelRef} className="bg-[var(--color-surface)] rounded-xl shadow-2xl border border-[var(--color-border)] w-[600px] max-h-[85vh] flex flex-col dialog-panel">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] flex-shrink-0">
          <span className="text-sm font-medium text-[var(--color-text)]">插入图表</span>
          <button onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] rounded transition-colors" aria-label="关闭">
            <X size={14} />
          </button>
        </div>

        <div className="px-4 pt-3 flex-shrink-0">
          <div className="flex gap-1.5 flex-wrap">
            {DIAGRAM_TYPES.map(t => (
              <button key={t.type} onClick={() => setCode(t.content!)}
                className={`px-2.5 py-1 text-[11px] rounded-md border transition-colors ${
                  code === t.content!
                    ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]'
                }`} aria-label={t.label}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <textarea value={code} onChange={e => setCode(e.target.value)} onKeyDown={handleKeyDown}
            className="w-full h-28 resize-none text-sm font-mono bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-3 outline-none text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] transition-colors leading-relaxed"
            spellCheck={false} />

          <div className="min-h-[120px] bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)] p-4 flex items-center justify-center overflow-x-auto">
            {error ? (
              <div className="text-center">
                <p className="text-xs text-red-500 mb-1">渲染错误</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">{error}</p>
              </div>
            ) : code.trim() ? (
              <div ref={previewRef} className="w-full" />
            ) : (
              <p className="text-xs text-[var(--color-text-muted)]">输入 Mermaid 代码后预览</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border)] flex-shrink-0">
          <span className="text-[11px] text-[var(--color-text-muted)]">{shortcut}</span>
          <div className="flex items-center gap-2">
            <button onClick={onClose}
              className="px-3 py-1.5 text-xs rounded-lg bg-[var(--color-hover)] text-[var(--color-text)] hover:opacity-80 transition-opacity">
              取消
            </button>
            <button onClick={() => { if (code.trim()) onInsert(code.trim()) }}
              className="px-3 py-1.5 text-xs rounded-lg bg-[var(--color-accent)] text-white hover:opacity-80 transition-opacity">
              插入
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(ChartDialog)