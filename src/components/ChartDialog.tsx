import { useState, useRef, useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import mermaid from 'mermaid'

interface ChartDialogProps {
  onInsert: (content: string) => void
  onClose: () => void
}

const DIAGRAM_TYPES = [
  { type: 'flowchart', label: '流程图', alias: ['graph', 'flowchart', 'td'], content: 'graph TD\n  A[开始] --> B[结束]' },
  { type: 'sequence', label: '时序图', alias: ['sequence', 'sequenceDiagram'], content: 'sequenceDiagram\n  用户->>系统: 发起请求\n  系统-->>用户: 返回结果' },
  { type: 'classDiagram', label: '类图', alias: ['class', 'classDiagram'], content: 'classDiagram\n  class Animal {\n    +name: string\n    +move()\n  }' },
  { type: 'stateDiagram', label: '状态图', alias: ['state', 'stateDiagram', 'stateDiagram-v2'], content: 'stateDiagram-v2\n  [*] --> 待办\n  待办 --> 进行中\n  进行中 --> 已完成' },
  { type: 'er', label: 'E-R 图', alias: ['er', 'erDiagram'], content: 'erDiagram\n  USER ||--o{ ORDER : places\n  ORDER ||--|{ ITEM : contains' },
  { type: 'gantt', label: '甘特图', alias: ['gantt'], content: 'gantt\n  title 项目计划\n  dateFormat YYYY-MM-DD\n  section 阶段1\n  任务1 :a1, 2024-01-01, 30d\n  任务2 :after a1, 20d' },
  { type: 'pie', label: '饼图', alias: ['pie'], content: 'pie title 数据分布\n  "分类A" : 45\n  "分类B" : 30\n  "分类C" : 25' },
  { type: 'journey', label: '旅程图', alias: ['journey'], content: 'journey\n  title 用户体验\n  section 注册\n    打开应用: 5: 用户\n    填写信息: 3: 用户' },
]

function ChartDialog({ onInsert, onClose }: ChartDialogProps) {
  const [code, setCode] = useState(DIAGRAM_TYPES[0].content)
  const [error, setError] = useState('')
  const previewRef = useRef<HTMLDivElement>(null)
  const id = useMemo(() => `chart-${Date.now()}`, [])

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' })
  }, [])

  useEffect(() => {
    if (!code.trim()) { setError(''); if (previewRef.current) previewRef.current.innerHTML = ''; return }
    mermaid.parse(code)
    mermaid.render(id, code).then(({ svg }) => {
      if (previewRef.current) previewRef.current.innerHTML = svg
      setError('')
    }).catch((e) => {
      setError(e.str || e.message || '语法错误')
    })
  }, [code, id])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      if (code.trim()) onInsert(code.trim())
    }
    if (e.key === 'Escape') onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 bg-black/20 dialog-overlay" onClick={onClose}>
      <div className="bg-[var(--color-surface)] rounded-xl shadow-2xl border border-[var(--color-border)] w-[600px] max-h-[85vh] flex flex-col dialog-panel" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] flex-shrink-0">
          <span className="text-sm font-medium text-[var(--color-text)]">插入图表</span>
          <button onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] rounded transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="px-4 pt-3 flex-shrink-0">
          <div className="flex gap-1.5 flex-wrap">
            {DIAGRAM_TYPES.map(t => (
              <button key={t.type} onClick={() => setCode(t.content)}
                className={`px-2.5 py-1 text-[11px] rounded-md border transition-colors ${
                  code === t.content
                    ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]'
                }`}>
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
          <span className="text-[11px] text-[var(--color-text-muted)]">⌘⏎ 插入 · ⎋ 关闭</span>
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

export default ChartDialog