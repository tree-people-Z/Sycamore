import { NodeViewProps } from '@tiptap/react'
import katex from 'katex'
import { useEffect, useRef, useState } from 'react'

export function MathInlineView({ node, editor, getPos }: NodeViewProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [error, setError] = useState(false)
  const tex = node.attrs.tex || ''

  useEffect(() => {
    if (!ref.current) return
    try {
      katex.render(tex, ref.current, { displayMode: false, throwOnError: true })
      setError(false)
    } catch {
      setError(true)
    }
  }, [tex])

  const handleClick = () => {
    const pos = getPos()
    if (typeof pos !== 'number') return
    editor.commands.setNodeSelection(pos)
    editor.chain().focus().setTextSelection({ from: pos, to: pos + node.nodeSize }).run()
  }

  return (
    <span
      ref={ref}
      className="cm-math-widget"
      onClick={handleClick}
      contentEditable={false}
      style={{ cursor: 'pointer', display: 'inline-block', padding: '0 2px' }}
    >
      {error && <span className="text-red-500 text-xs">${tex}$</span>}
    </span>
  )
}
