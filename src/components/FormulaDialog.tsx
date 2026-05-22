import { useState } from 'react'
import { X } from 'lucide-react'

interface FormulaDialogProps {
  onInsert: (expression: string, displayMode: boolean) => void
  onClose: () => void
}

function FormulaDialog({ onInsert, onClose }: FormulaDialogProps) {
  const [expression, setExpression] = useState('')
  const [displayMode, setDisplayMode] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/20 dialog-overlay">
      <div className="bg-[var(--color-surface)] rounded-xl shadow-2xl border border-[var(--color-border)] min-w-[420px] dialog-panel">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
          <span className="text-sm font-medium text-[var(--color-text)]">插入公式</span>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] rounded transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <textarea
            autoFocus
            value={expression}
            onChange={e => setExpression(e.target.value)}
            placeholder="输入 LaTeX 公式，例如: E = mc^2"
            className="w-full h-24 resize-none text-sm font-mono bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-3 outline-none text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] transition-colors leading-relaxed"
            spellCheck={false}
          />

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={displayMode}
              onChange={e => setDisplayMode(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-[var(--color-text-tertiary)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
            />
            <span className="text-xs text-[var(--color-text-secondary)]">块级显示（居中单独一行）</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[var(--color-border)]">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs rounded-lg bg-[var(--color-hover)] text-[var(--color-text)] hover:opacity-80 transition-opacity"
          >
            取消
          </button>
          <button
            onClick={() => {
              if (expression.trim()) {
                onInsert(expression.trim(), displayMode)
              }
            }}
            className="px-3 py-1.5 text-xs rounded-lg bg-[var(--color-accent)] text-white hover:opacity-80 transition-opacity"
          >
            插入
          </button>
        </div>
      </div>
    </div>
  )
}

export default FormulaDialog