import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { basicSetup } from 'codemirror'
import { indentWithTab } from '@codemirror/commands'
import { getLanguageSupport, ideHighlight } from './ide-language'

export interface IdeCodeEditorHandle {
  replaceSelection: (text: string) => void
  insertText: (text: string) => void
}

interface IdeCodeEditorProps {
  fileKey: string
  value: string
  onChange: (content: string) => void
  onSave: () => void
  onSelectionChange?: (text: string) => void
}

// Tab 缩进 / Shift+Tab 反缩进（basicSetup 默认不含，Tab 会把焦点移出编辑器）
const ideTabKeys = keymap.of([indentWithTab])

const ideEditorTheme = EditorView.theme({
  '&': { height: '100%', backgroundColor: 'transparent', color: 'var(--color-text)', fontSize: '13px' },
  '.cm-content': {
    fontFamily: "'SF Mono', Consolas, 'Liberation Mono', 'Courier New', monospace",
    lineHeight: '1.65',
    paddingBottom: '40vh',
  },
  '.cm-scroller': { overflow: 'auto' },
  '.cm-gutters': {
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text-tertiary)',
    border: 'none',
    borderRight: '1px solid var(--color-border)',
  },
  '.cm-activeLine': { backgroundColor: 'var(--color-accent-8)' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--color-accent)' },
  '.cm-selectionBackground': { backgroundColor: 'var(--color-selection) !important' },
  '.cm-cursor': { borderLeftColor: 'var(--color-text)' },
  '.cm-tooltip': {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
  },
  '.cm-searchMatch': { backgroundColor: 'var(--color-accent-10)' },
  '.cm-searchMatch-selected': { backgroundColor: 'var(--color-selection)' },
})

/**
 * 单一 EditorView 实例的多文件代码编辑器。
 * 每个打开的文件保留独立 EditorState（撤销历史、光标位置），切标签时交换。
 */
const IdeCodeEditor = forwardRef<IdeCodeEditorHandle, IdeCodeEditorProps>(function IdeCodeEditor(
  { fileKey, value, onChange, onSave, onSelectionChange },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const statesRef = useRef<Map<string, EditorState>>(new Map())
  const currentKeyRef = useRef<string | null>(null)
  const onChangeRef = useRef(onChange)
  const onSaveRef = useRef(onSave)
  const onSelectionChangeRef = useRef(onSelectionChange)
  onChangeRef.current = onChange
  onSaveRef.current = onSave
  onSelectionChangeRef.current = onSelectionChange

  const listener = EditorView.updateListener.of(u => {
    if (u.docChanged) onChangeRef.current(u.state.doc.toString())
    if (u.selectionSet) {
      const { from, to } = u.state.selection.main
      onSelectionChangeRef.current?.(from !== to ? u.state.sliceDoc(from, to) : '')
    }
  })

  useImperativeHandle(ref, () => ({
    replaceSelection: (text) => {
      const view = viewRef.current
      if (!view) return
      const { from, to } = view.state.selection.main
      view.dispatch({ changes: { from, to, insert: text }, selection: { anchor: from + text.length } })
    },
    insertText: (text) => {
      const view = viewRef.current
      if (!view) return
      const pos = view.state.selection.main.head
      view.dispatch({ changes: { from: pos, insert: text }, selection: { anchor: pos + text.length } })
    },
  }), [])

  useEffect(() => {
    const states = statesRef.current
    const view = new EditorView({
      parent: containerRef.current!,
      state: EditorState.create({
        extensions: [listener],
      }),
    })
    viewRef.current = view
    return () => {
      view.destroy()
      viewRef.current = null
      states.clear()
      currentKeyRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    if (fileKey === currentKeyRef.current) return
    if (currentKeyRef.current) statesRef.current.set(currentKeyRef.current, view.state)
    // 限制缓存数量，关闭的标签状态不会无限驻留内存
    if (statesRef.current.size > 20) {
      const oldest = statesRef.current.keys().next().value
      if (oldest !== undefined && oldest !== fileKey) statesRef.current.delete(oldest)
    }
    currentKeyRef.current = fileKey
    const restored = statesRef.current.get(fileKey)
    if (restored) {
      view.setState(restored)
      return
    }
    view.setState(EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        ideTabKeys,
        keymap.of([{ key: 'Mod-s', run: () => { onSaveRef.current(); return true } }]),
        listener,
        getLanguageSupport(fileKey),
        ideHighlight,
        ideEditorTheme,
      ],
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileKey])

  // 文件内容被外部替换（如磁盘重读）时同步到当前视图
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    if (fileKey !== currentKeyRef.current) return
    if (view.state.doc.toString() === value) return
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } })
  }, [value, fileKey])

  return <div ref={containerRef} className="h-full w-full overflow-hidden" />
})

export default IdeCodeEditor
