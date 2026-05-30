import { useState, useRef, useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import mermaid from 'mermaid'

interface ChartDialogProps {
  onInsert: (content: string) => void
  onClose: () => void
}

const TEMPLATES = [
  { key: 'graph', label: '流程图', content: 'graph TD\n  A[开始] --> B[结束]' },
  { key: 'pie', label: '饼图', content: 'pie title 数据分布\n  "分类A" : 45\n  "分类B" : 30\n  "分类C" : 25' },
  { key: 'sequence', label: '时序图', content: 'sequenceDiagram\n  用户->>系统: 发起请求\n  系统->>数据库: 查询数据\n  数据库-->>系统: 返回结果\n  系统-->>用户: 显示结果' },
  { key: 'gantt', label: '甘特图', content: 'gantt\n  title 项目计划\n  dateFormat YYYY-MM-DD\n  section 阶段1\n  任务1 :a1, 2024-01-01, 30d\n  任务2 :after a1, 20d' },
  { key: 'er', label: 'E-R 图', content: 'erDiagram\n  CUSTOMER ||--o{ ORDER : places\n  ORDER ||--|{ ORDER_ITEM : contains\n  PRODUCT ||--o{ ORDER_ITEM : "ordered in"' },
  { key: 'timeline', label: '时间线', content: 'timeline\n  title 里程碑\n  2024 Q1 : 启动\n  2024 Q2 : 开发\n  2024 Q3 : 测试\n  2024 Q4 : 上线' },
]

function ChartDialog({ onInsert, onClose }: ChartDialogProps) {
  const [code, setCode] = useState(TEMPLATES[0].content)
  const [error, setError] = useState('')
  const previewRef = useRef<HTMLDivElement>(null)
  const id = useMemo(() => `chart-${Date.now()}`, [])

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: 'default' })
  }, [])

  useEffect(() => {
    if (!code.trim()) { setError(''); return }
    mermaid.render(id, code).then(({ svg }) => {
      if (previewRef.current) previewRef.current.innerHTML = svg
      setError('')
    }).catch((e) => {
      setError(e.str || e.message || '无效的 Mermaid 语法')
    })
  }, [code, id])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 bg-black/20 dialog-overlay">
      <div className="bg-[var(--color-surface)] rounded-xl shadow-2xl border border-[var(--color-border)] w-[560px] max-h-[85vh] flex flex-col dialog-panel">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] flex-shrink-0">
          <span className="text-sm font-medium text-[var(--color-text)]">插入图表</span>
          <button onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] rounded transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="px-4 pt-3 flex-shrink-0">
          <div className="flex gap-1.5 flex-wrap">
            {TEMPLATES.map(t => (
              <button key={t.key} onClick={() => setCode(t.content)}
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
          <textarea value={code} onChange={e => setCode(e.target.value)}
            className="w-full h-28 resize-none text-sm font-mono bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-3 outline-none text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] transition-colors leading-relaxed"
            spellCheck={false} />

          <div className="min-h-[100px] bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)] p-4 flex items-center justify-center">
            {error ? (
              <p className="text-xs text-red-500 text-center">{error}</p>
            ) : (
              <div ref={previewRef} className="w-full overflow-x-auto" />
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[var(--color-border)] flex-shrink-0">
          <button onClick={onClose}
            className="px-3 py-1.5 text-xs rounded-lg bg-[var(--color-hover)] text-[var(--color-text)] hover:opacity-80 transition-opacity">
            取消
          </button>
          <button onClick={() => { if (code.trim()) onInsert(code.trim()) }}
            className="px-3 py-1.5 text-xs rounded-lg bg-[var(--color-accent)] text-white hover:opacity-80 transition-opacity">
            确定
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChartDialog