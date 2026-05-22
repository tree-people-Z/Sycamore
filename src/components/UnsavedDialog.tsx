import { X } from 'lucide-react'

interface UnsavedDialogProps {
  onSave: () => void
  onDiscard: () => void
  onCancel: () => void
}

function UnsavedDialog({ onSave, onDiscard, onCancel }: UnsavedDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dialog-overlay">
      <div className="bg-[var(--color-surface)] rounded-xl shadow-2xl border border-[var(--color-border)] w-[340px] dialog-panel">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">未保存的更改</h2>
          <button onClick={onCancel}
            className="w-7 h-7 flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] rounded-md transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            是否保存当前文档的更改？如果不保存，更改将会丢失。
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--color-border)]">
          <button onClick={onCancel}
            className="px-3 py-1.5 text-xs rounded-lg bg-[var(--color-hover)] text-[var(--color-text)] hover:opacity-80 transition-opacity">
            取消
          </button>
          <button onClick={onDiscard}
            className="px-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] hover:border-[var(--color-danger)] transition-colors">
            不保存
          </button>
          <button onClick={onSave}
            className="px-3 py-1.5 text-xs rounded-lg bg-[var(--color-accent)] text-white hover:opacity-80 transition-opacity">
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

export default UnsavedDialog
