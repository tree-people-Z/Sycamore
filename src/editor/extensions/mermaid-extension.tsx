import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { useState, useEffect, useCallback } from 'react'
import mermaid from 'mermaid'
import { Code, Check } from 'lucide-react'
import { DIAGRAM_TYPES, initMermaid, detectDiagramType } from './mermaid-shared'

initMermaid()

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
      const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
      const { svg: renderedSvg } = await mermaid.render(id, code)
      setSvg(renderedSvg)
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' ? (err as Record<string, unknown>).str || (err as Error).message : String(err)
      setError((msg as string) || '渲染失败')
      setSvg('')
    }
  }, [code])

  useEffect(() => { renderDiagram() }, [renderDiagram])

  useEffect(() => {
    if (!isEditing) renderDiagram()
  }, [isEditing, renderDiagram])

  useEffect(() => {
    const detected = detectDiagramType(code)
    if (detected !== diagramType) setDiagramType(detected)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

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
        <div role="button" tabIndex={0} className="mermaid-preview" onClick={() => setIsEditing(true)} onKeyDown={(e) => { if (e.key === 'Enter') setIsEditing(true) }}>
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