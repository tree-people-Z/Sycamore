import { NodeViewProps } from '@tiptap/react'
import katex from 'katex'
import { useEffect, useRef, useState } from 'react'

export function MathBlockView({ node, editor, getPos }: NodeViewProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState(false)
  const tex = node.attrs.tex || ''

  useEffect(() => {
    if (!ref.current) return
    try {
      katex.render(tex, ref.current, { displayMode: true, throwOnError: true })
      setError(false)
    } catch {
      setError(true)
      // katex.render 抛错前不会清空容器，需手动移除上一次的渲染残影
      if (ref.current) ref.current.textContent = ''
    }
  }, [tex])

  const handleDoubleClick = () => {
    const pos = getPos()
    if (typeof pos !== 'number') return
    editor.commands.setNodeSelection(pos)
    editor.chain().focus().setTextSelection({ from: pos, to: pos + node.nodeSize }).run()
  }

  return (
    <div
      ref={ref}
      className="cm-math-widget"
      onDoubleClick={handleDoubleClick}
      contentEditable={false}
      style={{
        textAlign: 'center',
        padding: '8px 0',
        cursor: 'pointer',
        background: 'var(--math-bg, transparent)',
        borderRadius: '4px',
      }}
    >
      {error && <pre className="text-red-500 text-xs text-left">$$ {tex} $$</pre>}
    </div>
  )
}
