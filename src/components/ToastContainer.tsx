import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import type { Toast, ToastType } from '../hooks/useToast'

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={14} className="text-green-500" />,
  error: <XCircle size={14} className="text-red-500" />,
  info: <Info size={14} className="text-[var(--color-accent)]" />,
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2" aria-live="polite">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl text-xs text-[var(--color-text)] animate-in slide-in-from-right"
          style={{ minWidth: '200px', maxWidth: '360px' }}
        >
          {ICONS[toast.type]}
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => onRemove(toast.id)}
            className="flex-shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            aria-label="关闭提示"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  )
}

export default ToastContainer
