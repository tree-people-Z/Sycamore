import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { useState, useEffect, useCallback } from 'react'
import mermaid from 'mermaid'
import { Code, Check } from 'lucide-react'

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'inherit',
})

const DIAGRAM_TYPES = [
  { type: 'flowchart', label: '流程图', alias: ['graph', 'flowchart', 'flowchart-v2', 'td', 'graph TD', 'graph BT', 'graph LR', 'graph RL'] },
  { type: 'sequence', label: '时序图', alias: ['sequence', 'sequenceDiagram'] },
  { type: 'classDiagram', label: '类图', alias: ['class', 'classDiagram'] },
  { type: 'stateDiagram', label: '状态图', alias: ['state', 'stateDiagram', 'stateDiagram-v2'] },
  { type: 'er', label: 'E-R 图', alias: ['er', 'erDiagram'] },
  { type: 'gantt', label: '甘特图', alias: ['gantt'] },
  { type: 'pie', label: '饼图', alias: ['pie'] },
  { type: 'journey', label: '旅程图', alias: ['journey', 'gitGraph'] },
]

function detectDiagramType(code: string): string {
  const trimmed = code.trim()
  const firstLine = trimmed.split('\n')[0]?.toLowerCase() || ''
  for (const config of DIAGRAM_TYPES) {
    if (config.alias.some(alias => firstLine.startsWith(alias) || firstLine === alias)) {
      return config.type
    }
  }
  return 'flowchart'
}

function MermaidDiagramView({ node, updateAttributes }: NodeViewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [code, setCode] = useState(node.attrs.code || '')
  const [diagramType, setDiagramType] = useState(node.attrs.type || 'flowchart')
  const [svg, setSvg] = useState('')
  const [error, setError] = useState<string | null>(null)

  const renderDiagram = useCallback(async () => {
    if (!code.trim()) {
      setSvg('')
      setError(null)
      return
    }
    setError(null)
    try {
      mermaid.parse(code)
      const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const { svg: renderedSvg } = await mermaid.render(id, code)
      setSvg(renderedSvg)
    } catch (err: any) {
      setError(err.str || err.message || '渲染失败')
      setSvg('')
    }
  }, [code])

  useEffect(() => { renderDiagram() }, [])

  useEffect(() => {
    if (!isEditing) renderDiagram()
  }, [isEditing])

  useEffect(() => {
    const detected = detectDiagramType(code)
    if (detected !== diagramType) setDiagramType(detected)
  }, [code, diagramType])

  const handleUpdate = () => {
    updateAttributes({ code, type: diagramType })
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleUpdate() }
    if (e.key === 'Escape') { setCode(node.attrs.code || ''); setIsEditing(false) }
  }

  return (
    <NodeViewWrapper className="mermaid-diagram-wrapper">
      {!isEditing ? (
        <div className="mermaid-preview" onClick={() => setIsEditing(true)}>
          {error ? (
            <div className="mermaid-error-content">
              <p className="mermaid-error-title">渲染错误</p>
              <p className="mermaid-error-detail">{error}</p>
              <p className="mermaid-error-hint">点击编辑</p>
            </div>
          ) : svg ? (
            <div className="mermaid-svg" dangerouslySetInnerHTML={{ __html: svg }} />
          ) : (
            <div className="mermaid-empty">点击添加图表</div>
          )}
          <div className="mermaid-overlay">
            <button className="mermaid-edit-btn" onClick={(e) => { e.stopPropagation(); setIsEditing(true) }}>
              <Code size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="mermaid-editor">
          <div className="mermaid-editor-header">
            <select
              className="mermaid-type-select"
              value={diagramType}
              onChange={(e) => setDiagramType(e.target.value)}
            >
              {DIAGRAM_TYPES.map(item => (
                <option key={item.type} value={item.type}>{item.label}</option>
              ))}
            </select>
            <div className="mermaid-editor-spacer" />
            <button className="mermaid-save-btn" onClick={handleUpdate}>
              <Check size={16} />
            </button>
          </div>
          <textarea
            className="mermaid-textarea"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
          />
          {error && <div className="mermaid-edit-error">{error}</div>}
        </div>
      )}
    </NodeViewWrapper>
  )
}

export const MermaidDiagram = Node.create({
  name: 'mermaidDiagram',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      code: { default: '' },
      type: { default: 'flowchart' },
    }
  },

  parseHTML() {
    return [
      { tag: 'div[data-type="mermaid-diagram"]' },
      { tag: 'pre[data-mermaid]' },
    ]
  },

  renderHTML({ node }) {
    return ['div', { 'data-type': 'mermaid-diagram', 'data-mermaid-code': node.attrs.code || '' }]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MermaidDiagramView)
  },
})

export default MermaidDiagram