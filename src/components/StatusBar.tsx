import { Check, Pencil, Eye, EyeOff, Maximize2, Minimize2 } from 'lucide-react'

interface StatusBarProps {
  wordCount: number
  lineCount: number
  isModified: boolean
  hasContent: boolean
  focusMode?: boolean
  onToggleFocusMode?: () => void
  editorWide?: boolean
  onToggleEditorWidth?: () => void
}

const WORD_GOAL = 1000

function ProgressRing({ current, max }: { current: number; max: number }) {
  const radius = 7
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(current / max, 1)
  const offset = circumference - progress * circumference

  return (
    <svg width="18" height="18" className="progress-ring">
      <circle cx="9" cy="9" r={radius} fill="none" stroke="var(--color-border)" strokeWidth="2" />
      <circle
        cx="9" cy="9" r={radius}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="progress-ring-circle"
      />
    </svg>
  )
}

function StatusBar({ wordCount, lineCount, isModified, hasContent, focusMode, onToggleFocusMode, editorWide, onToggleEditorWidth }: StatusBarProps) {
  return (
    <div className="h-7 bg-[var(--color-bg)] border-t border-[var(--color-border)] flex items-center px-4 text-xs text-[var(--color-text-secondary)] select-none flex-shrink-0">
      <div className="flex items-center gap-4">
        {hasContent && (
          <span>{wordCount} 字 · {lineCount} 行</span>
        )}
      </div>
      <div className="flex-1" />
      {hasContent && (
        <div className="flex items-center gap-3">
          {/* Progress ring */}
          <div className="flex items-center gap-1.5" title={`目标: ${WORD_GOAL} 字`}>
            <ProgressRing current={wordCount} max={WORD_GOAL} />
            <span className="text-[10px] text-[var(--color-text-muted)]">{Math.min(Math.round(wordCount / WORD_GOAL * 100), 100)}%</span>
          </div>

          {/* Focus mode toggle */}
          {onToggleFocusMode && (
            <button
              onClick={onToggleFocusMode}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                focusMode ? 'bg-[var(--color-accent-10)] text-[var(--color-accent)]' : 'hover:bg-[var(--color-hover)]'
              }`}
              title={focusMode ? '退出专注模式' : '专注模式'}
            >
              {focusMode ? <EyeOff size={11} /> : <Eye size={11} />}
            </button>
          )}

          {/* Editor width toggle */}
          {onToggleEditorWidth && (
            <button
              onClick={onToggleEditorWidth}
              className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-[var(--color-hover)] transition-colors"
              title={editorWide ? '标准宽度' : '宽屏模式'}
            >
              {editorWide ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
            </button>
          )}

          {/* Save status */}
          <span className={`flex items-center gap-1 ${isModified ? 'text-[var(--color-warning)]' : 'text-[var(--color-success)]'}`}>
            {isModified ? <Pencil size={10} /> : <Check size={10} />}
            <span>{isModified ? '未保存' : '已保存'}</span>
          </span>
        </div>
      )}
    </div>
  )
}

export default StatusBar