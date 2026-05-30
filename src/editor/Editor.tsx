import { forwardRef, useImperativeHandle, useRef, useCallback, useEffect, useState } from 'react'
import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react'
import { EditHighlightPlugin } from './extensions/edit-highlight'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Placeholder from '@tiptap/extension-placeholder'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import TextAlign from '@tiptap/extension-text-align'
import { common, createLowlight } from 'lowlight'
import { MathInline } from './extensions/math-inline'
import { MathBlock } from './extensions/math-block'
import { MathInlineView } from './MathInlineView'
import { MathBlockView } from './MathBlockView'
import { CodeBlockLowlightMermaid } from 'tiptap-extension-mermaid'
import { WikiLink } from './extensions/wiki-link'
import { SlashMenu } from './extensions/slash-menu'
import type { SlashMenuItem } from './extensions/slash-menu'
import { CustomImage } from './extensions/image-extension'
import SelectionToolbar from '../components/SelectionToolbar'
import type { EditorSettings } from '../constants'

import { useAutoSave } from '../hooks/useAutoSave'
import { applyEditorStyles } from '../utils/editor-styles'
import { handleImageFile, insertImage, hasImageItems, getImageFiles } from '../utils/images'
import { sanitizeFileName } from '../constants'
import katex from 'katex'
import TurndownService from 'turndown'
import { marked } from 'marked'

const lowlight = createLowlight(common)

export interface EditorHandle {
  getContent: () => Record<string, unknown>
  setContent: (content: Record<string, unknown> | string) => void
  setTitle: (title: string) => void
  setFilePath: (filePath: string | null) => void
  clear: () => void
  getModified: () => boolean
  resetModified: () => void
  getFilePath: () => string | null
  newFile: () => Promise<void>
  openFile: () => Promise<void>
  saveFile: () => Promise<void>
  saveAs: () => Promise<void>
  undo: () => void
  redo: () => void
  focus: () => void
  formatInline: (type: string, url?: string) => void
  insertBlock: (type: string) => void
  insertText: (text: string | Record<string, unknown>) => Promise<void>
  getExportHTML: () => string
  exportMarkdown: () => string
  importMarkdown: (markdown: string) => Promise<void>
  getText: () => string
  replaceSelection: (text: string) => Promise<void>
}

interface EditorProps {
  darkMode?: boolean
  settings?: EditorSettings
  linkedFolderPath?: string | null
  focusMode?: boolean
  onContentChange?: (content: string) => void
  onModifiedChange?: (modified: boolean) => void
  onWordCountChange?: (count: number) => void
  onLineCountChange?: (count: number) => void
  onShowSaveDialog?: (defaultName?: string, startingPath?: string) => Promise<string | null>
  onShowOpenDialog?: (startingPath?: string) => Promise<string | null>
  onSaved?: () => void
  onDocChange?: (filePath: string | null) => void
  aiEditMode?: boolean
  onSelectionChange?: (selectedText: string) => void
}

const Editor = forwardRef<EditorHandle, EditorProps>(function Editor(
  { darkMode, settings, linkedFolderPath, focusMode, onContentChange, onModifiedChange, onWordCountChange, onLineCountChange, onShowSaveDialog, onShowOpenDialog, onSaved, onDocChange, aiEditMode, onSelectionChange },
  ref,
) {
  const modifiedRef = useRef(false)
  const suppressModifiedRef = useRef(false)
  const filePathRef = useRef<string | null>(null)
  const titleRef = useRef('')
  const prevFocusNodeRef = useRef<HTMLElement | null>(null)
  const [title, setTitle] = useState('')
  const [selectionToolbarPos, setSelectionToolbarPos] = useState<{ top: number; left: number } | null>(null)

  const onModifiedChangeRef = useRef(onModifiedChange)
  onModifiedChangeRef.current = onModifiedChange
  const onSavedRef = useRef(onSaved)
  onSavedRef.current = onSaved
  const onDocChangeRef = useRef(onDocChange)
  onDocChangeRef.current = onDocChange
  const onSelectionChangeRef = useRef(onSelectionChange)
  onSelectionChangeRef.current = onSelectionChange
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  const updateToolbar = useCallback((ed: ReturnType<typeof useEditor>) => {
    if (!ed) return
    const sel = ed.state.selection
    if (sel.empty) { setSelectionToolbarPos(null); return }
    const coords = ed.view.coordsAtPos(sel.from)
    if (!coords) { setSelectionToolbarPos(null); return }
    let top = coords.top - 44
    let left = coords.left
    const toolbarWidth = 440
    if (left < 0) left = 8
    if (left + toolbarWidth > window.innerWidth) left = window.innerWidth - toolbarWidth - 8
    if (top < 0) top = 4
    setSelectionToolbarPos({ top, left })
  }, [])

  const updateFocusNode = useCallback((ed: ReturnType<typeof useEditor>) => {
    if (!ed || !focusMode) {
      if (prevFocusNodeRef.current) {
        prevFocusNodeRef.current.classList.remove('focus-active')
        prevFocusNodeRef.current = null
      }
      return
    }
    if (prevFocusNodeRef.current) {
      prevFocusNodeRef.current.classList.remove('focus-active')
    }
    const { anchor } = ed.state.selection
    const domPos = ed.view.domAtPos(anchor)
    let node = domPos.node as HTMLElement
    const container = ed.view.dom
    while (node && node.parentElement && node.parentElement !== container) {
      node = node.parentElement
    }
    if (node && node.parentElement === container) {
      node.classList.add('focus-active')
      prevFocusNodeRef.current = node
    }
  }, [focusMode])

  const mathBlockWithView = MathBlock.extend({
    addNodeView() { return ReactNodeViewRenderer(MathBlockView) },
  })

  const mathInlineWithView = MathInline.extend({
    addNodeView() { return ReactNodeViewRenderer(MathInlineView) },
  })

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4, 5, 6] }, codeBlock: false, link: false, underline: false }),
      Underline,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'editor-link' } }),
      Table.configure({ resizable: true }),
      TableRow, TableCell, TableHeader,
      Placeholder.configure({ placeholder: '开始写作...' }),
      TextStyle, Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      mathInlineWithView, mathBlockWithView, CustomImage,
      CodeBlockLowlightMermaid.configure({ lowlight, mermaidConfig: {} }),
      WikiLink.configure({}),
      SlashMenu.configure({
        items: ([
          { title: '标题 1', description: '大标题', command: ({ editor: ed, range }) => ed.chain().focus().deleteRange(range).toggleHeading({ level: 1 }).run() },
          { title: '标题 2', description: '中标题', command: ({ editor: ed, range }) => ed.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run() },
          { title: '标题 3', description: '小标题', command: ({ editor: ed, range }) => ed.chain().focus().deleteRange(range).toggleHeading({ level: 3 }).run() },
          { title: '引用', description: '引用文本', command: ({ editor: ed, range }) => ed.chain().focus().deleteRange(range).toggleBlockquote().run() },
          { title: '无序列表', description: '项目列表', command: ({ editor: ed, range }) => ed.chain().focus().deleteRange(range).toggleBulletList().run() },
          { title: '有序列表', description: '编号列表', command: ({ editor: ed, range }) => ed.chain().focus().deleteRange(range).toggleOrderedList().run() },
          { title: '代码块', description: '代码片段', command: ({ editor: ed, range }) => ed.chain().focus().deleteRange(range).toggleCodeBlock().run() },
          { title: '分割线', description: '水平分割线', command: ({ editor: ed, range }) => ed.chain().focus().deleteRange(range).setHorizontalRule().run() },
          { title: '表格', description: '插入表格', command: ({ editor: ed, range }) => ed.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3 }).run() },
          { title: '数学公式', description: '行内公式', command: ({ editor: ed, range }) => ed.chain().focus().deleteRange(range).insertContent({ type: 'mathInline', attrs: { tex: '\\frac{a}{b}' } }).run() },
          { title: '图片', description: '插入图片', command: ({ editor: ed, range }) => {
            const url = prompt('输入图片 URL:')
            if (url) ed.chain().focus().deleteRange(range).setImage({ src: url }).run()
          }},
        ] as SlashMenuItem[]).map(item => ({ ...item, icon: '' })),
      }),
      EditHighlightPlugin,
    ],
    editorProps: {
      attributes: { class: 'prose-editor' },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items
        if (!items || !hasImageItems(items)) return false
        event.preventDefault()
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile()
            if (file) handleImageFile(file, editor!, insertImage)
          }
        }
        return true
      },
      handleDrop: (_view, event) => {
        const files = event.dataTransfer?.files
        if (!files || files.length === 0) { event.preventDefault(); return true }
        const imageFiles = getImageFiles(files)
        if (imageFiles.length) {
          event.preventDefault()
          imageFiles.forEach(f => handleImageFile(f, editor!, insertImage))
          return true
        }
        for (const file of Array.from(files)) {
          const fp = (file as any).path
          if (!fp || !/\.(json|md)$/i.test(fp)) continue
          event.preventDefault()
          ;(async () => {
            const content = await window.electronAPI?.readFile(fp)
            if (content == null) return
            const fileName = fp.replace(/.*[/\\]/, '').replace(/\.\w+$/, '')
            setTitle(fileName); titleRef.current = fileName
            filePathRef.current = /\.md$/i.test(fp) ? null : fp
            if (!editor) return
            if (/\.md$/i.test(fp)) {
              const html = await marked.parse(content)
              editor.commands.setContent(html as string)
            } else {
              try { editor.commands.setContent(JSON.parse(content)) }
              catch { editor.commands.setContent(content) }
            }
          })()
          return true
        }
        return false
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (!suppressModifiedRef.current) {
        modifiedRef.current = true
        onModifiedChangeRef.current?.(true)
      }
      suppressModifiedRef.current = false
      const text = ed.getText()
      onContentChange?.(text)
      const words = text.trim() ? text.trim().replace(/\s+/g, '').length : 0
      onWordCountChange?.(words)
      const fullText = ed.state.doc.textBetween(0, ed.state.doc.content.size, '\n', ' ')
      onLineCountChange?.(fullText ? fullText.split('\n').length : 1)
    },
    onSelectionUpdate: ({ editor: ed }) => {
      updateToolbar(ed)
      updateFocusNode(ed)
      const { from, to } = ed.state.selection
      const selText = from !== to ? ed.state.doc.textBetween(from, to) : ''
      onSelectionChangeRef.current?.(selText)
      if (aiEditMode) {
        ed.view.dispatch(ed.state.tr.setMeta('editHighlight', from !== to ? { from, to } : 'clear'))
      }
    },
  })

  useEffect(() => {
    if (!editor) return
    if (darkMode) editor.view.dom.parentElement?.classList.add('dark')
    else editor.view.dom.parentElement?.classList.remove('dark')
  }, [darkMode, editor])

  useEffect(() => {
    if (!editor) return
    if (focusMode) {
      updateFocusNode(editor)
    } else {
      document.querySelectorAll('.focus-active').forEach(el => el.classList.remove('focus-active'))
      prevFocusNodeRef.current = null
    }
  }, [focusMode, editor]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!editor) return
    if (aiEditMode) {
      const { from, to } = editor.state.selection
      if (from !== to) editor.view.dispatch(editor.state.tr.setMeta('editHighlight', { from, to }))
    } else {
      editor.view.dispatch(editor.state.tr.setMeta('editHighlight', 'clear'))
    }
  }, [aiEditMode, editor])

  const commitSave = useCallback(async () => {
    if (!editor) return
    const t = sanitizeFileName(titleRef.current)
    const content = JSON.stringify(editor.getJSON(), null, 2)
    let fp = filePathRef.current
    if (!fp) {
      const now = new Date()
      const monthDir = `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, '0')}月`
      const baseDir = linkedFolderPath
        ? linkedFolderPath.replace(/\\/g, '/')
        : (await window.electronAPI?.getDefaultSaveDir())
      if (baseDir) {
        const dir = baseDir + '/' + monthDir
        await window.electronAPI?.makeDirectory(dir)
        let name = `${t}.json`
        let counter = 1
        while (await window.electronAPI?.fileExists(dir + '/' + name)) {
          name = `${t}(${counter}).json`
          counter++
        }
        fp = dir + '/' + name
      }
    }
    if (!fp) return
    try { await window.electronAPI?.writeFile(fp, content) } catch { window.alert('保存失败，请检查磁盘空间和权限'); return }
    filePathRef.current = fp
    const savedTitle = fp.replace(/.*[/\\]/, '').replace(/\.\w+$/, '')
    setTitle(savedTitle)
    titleRef.current = savedTitle
    modifiedRef.current = false
    onModifiedChangeRef.current?.(false)
    onSavedRef.current?.()
    onDocChangeRef.current?.(fp)
  }, [editor, linkedFolderPath])

  useAutoSave(
    settings?.autoSave ?? false,
    settings?.autoSaveInterval ?? 30,
    commitSave,
    () => modifiedRef.current,
  )

  useImperativeHandle(ref, () => ({
    getContent: () => editor?.getJSON() ?? {},
    setContent: (content) => {
      if (!editor) return
      suppressModifiedRef.current = true
      editor.commands.setContent(content)
      modifiedRef.current = false
      onModifiedChangeRef.current?.(false)
    },
    getExportHTML: () => editor ? renderMathForExport(editor.getHTML()) : '',
    exportMarkdown: () => editor ? markdownService.turndown(editor.getHTML()) : '',
    importMarkdown: async (markdown) => {
      if (!editor) return
      const html = await marked.parse(markdown)
      suppressModifiedRef.current = true
      editor.commands.setContent(html as string)
      modifiedRef.current = false
      onModifiedChangeRef.current?.(false)
    },
    getText: () => editor?.getText() ?? '',
    getSelectedText: () => {
      if (!editor) return ''
      const { from, to } = editor.state.selection
      if (from === to) return ''
      return editor.state.doc.textBetween(from, to)
    },
    replaceSelection: async (text) => {
      if (!editor) return
      const mermaidMatch = text.match(/```mermaid\n([\s\S]*?)```/)
      if (mermaidMatch) {
        editor.chain().focus().deleteSelection().insertContent({
          type: 'codeBlock', attrs: { language: 'mermaid' },
          content: [{ type: 'text', text: mermaidMatch[1].trim() }],
        }).run()
        return
      }
      const html = await marked.parse(text)
      const { from, to } = editor.state.selection
      if (from === to) {
        editor.commands.setContent(html as string)
      } else {
        editor.chain().focus().deleteSelection().insertContent(html as string).run()
      }
    },
    setTitle: (t: string) => { setTitle(t); titleRef.current = t },
    setFilePath: (filePath: string | null) => {
      filePathRef.current = filePath
      onDocChangeRef.current?.(filePath)
    },
    clear: () => {
      if (!editor) return
      setTitle(''); titleRef.current = ''
      suppressModifiedRef.current = true
      editor.commands.clearContent()
      modifiedRef.current = false; onModifiedChangeRef.current?.(false)
    },
    getModified: () => modifiedRef.current,
    resetModified: () => { modifiedRef.current = false; onModifiedChangeRef.current?.(false) },
    getFilePath: () => filePathRef.current,
    newFile: async () => {
      if (!editor) return
      setTitle(''); titleRef.current = ''
      suppressModifiedRef.current = true
      editor.commands.clearContent()
      modifiedRef.current = false; onModifiedChangeRef.current?.(false)
      filePathRef.current = null
      onDocChangeRef.current?.(null)
    },
    openFile: async () => {
      if (!editor || !onShowOpenDialog) return
      const filePath = await onShowOpenDialog()
      if (!filePath) return
      const content = await window.electronAPI?.readFile(filePath)
      if (content == null) return
      const fileName = filePath.replace(/.*[/\\]/, '').replace(/\.\w+$/, '')
      setTitle(fileName); titleRef.current = fileName
      suppressModifiedRef.current = true
      if (/\.md$/i.test(filePath)) {
        const html = await marked.parse(content)
        editor.commands.setContent(html as string)
        filePathRef.current = null
      } else {
        try { editor.commands.setContent(JSON.parse(content)) }
        catch { editor.commands.setContent(content) }
        filePathRef.current = filePath
      }
      modifiedRef.current = false; onModifiedChangeRef.current?.(false)
      onDocChangeRef.current?.(/\.md$/i.test(filePath) ? null : filePath)
    },
    saveFile: async () => { await commitSave() },
    saveAs: async () => {
      if (!editor || !onShowSaveDialog) return
      const fp = await onShowSaveDialog(`${sanitizeFileName(titleRef.current)}.json`)
      if (!fp) return
      const content = JSON.stringify(editor.getJSON(), null, 2)
      try { await window.electronAPI?.writeFile(fp, content) } catch { window.alert('保存失败，请检查磁盘空间和权限'); return }
      filePathRef.current = fp
      const savedTitle = fp.replace(/.*[/\\]/, '').replace(/\.\w+$/, '')
      setTitle(savedTitle); titleRef.current = savedTitle
      modifiedRef.current = false; onModifiedChangeRef.current?.(false)
      onSavedRef.current?.()
    },
    undo: () => editor?.chain().focus().undo().run(),
    redo: () => editor?.chain().focus().redo().run(),
    focus: () => editor?.commands.focus(),
    formatInline: (type, url) => {
      if (!editor) return
      const actions: Record<string, () => void> = {
        bold: () => editor.chain().focus().toggleBold().run(),
        italic: () => editor.chain().focus().toggleItalic().run(),
        strikethrough: () => editor.chain().focus().toggleStrike().run(),
        underline: () => editor.chain().focus().toggleUnderline().run(),
        highlight: () => editor.chain().focus().toggleHighlight().run(),
        code: () => editor.chain().focus().toggleCode().run(),
        link: () => url ? editor.chain().focus().setLink({ href: url }).run() : editor.chain().focus().extendMarkRange('link').unsetLink().run(),
        image: () => url && editor.chain().focus().setImage({ src: url }).run(),
        color: () => url && editor.chain().focus().setColor(url).run(),
      }
      actions[type]?.()
    },
    insertBlock: (type) => {
      if (!editor) return
      const map: Record<string, () => void> = {
        h1: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        h2: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        h3: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        h4: () => editor.chain().focus().toggleHeading({ level: 4 }).run(),
        h5: () => editor.chain().focus().toggleHeading({ level: 5 }).run(),
        h6: () => editor.chain().focus().toggleHeading({ level: 6 }).run(),
        quote: () => editor.chain().focus().toggleBlockquote().run(),
        codeblock: () => editor.chain().focus().toggleCodeBlock().run(),
        ul: () => editor.chain().focus().toggleBulletList().run(),
        ol: () => editor.chain().focus().toggleOrderedList().run(),
        hr: () => editor.chain().focus().setHorizontalRule().run(),
        table: () => editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run(),
        math: () => editor.chain().focus().insertContent({ type: 'mathBlock', attrs: { tex: '\\frac{a}{b}' } }).run(),
        mermaid: () => {
          editor.chain().focus().insertContent({
            type: 'codeBlock',
            attrs: { language: 'mermaid' },
            content: [{ type: 'text', text: 'graph TD\n  A[设计] --> B[实现]' }],
          }).run()
        },
      }
      map[type]?.()
    },
    insertText: async (text) => {
      if (!editor) return
      if (typeof text === 'object') {
        editor.chain().focus().insertContent(text).run()
      } else {
        const mermaidMatch = text.match(/```mermaid\n([\s\S]*?)```/)
        if (mermaidMatch) {
          editor.chain().focus().insertContent({
            type: 'codeBlock', attrs: { language: 'mermaid' },
            content: [{ type: 'text', text: mermaidMatch[1].trim() }],
          }).run()
          return
        }
        const html = await marked.parse(text)
        editor.chain().focus().insertContent(html as string).run()
      }
    },
  }), [editor, commitSave, onShowSaveDialog, onShowOpenDialog])

  useEffect(() => {
    applyEditorStyles(
      settings?.fontSize || 18,
      settings?.editorWidth || 800,
      settings?.lineWrapping ?? true,
    )
  }, [settings?.fontSize, settings?.editorWidth, settings?.lineWrapping])

  return (
    <div className="h-full w-full overflow-y-auto editor-scroll-container">
      <input
        type="text"
        className="cm-title-input"
        placeholder="标题"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value); titleRef.current = e.target.value
          modifiedRef.current = true
          onModifiedChangeRef.current?.(true)
        }}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); editor?.commands.focus() } }}
        style={{
          display: 'block', width: '100%', maxWidth: 'var(--editor-max-width)',
          margin: '0 auto', padding: '24px 48px 16px',
          fontSize: `${(settings?.fontSize || 18) + 6}px`, fontWeight: 700, textAlign: 'center',
        }}
      />
      <EditorContent editor={editor} className={`editor-content${focusMode ? ' focus-mode' : ''}`} />
      {selectionToolbarPos && editor && (
        <SelectionToolbar
          top={selectionToolbarPos.top}
          left={selectionToolbarPos.left}
          onBold={() => editor.chain().focus().toggleBold().run()}
          onItalic={() => editor.chain().focus().toggleItalic().run()}
          onStrikethrough={() => editor.chain().focus().toggleStrike().run()}
          onUnderline={() => editor.chain().focus().toggleUnderline().run()}
          onHighlight={() => editor.chain().focus().toggleHighlight().run()}
          onColor={(c) => editor.chain().focus().setColor(c).run()}
          onCode={() => editor.chain().focus().toggleCode().run()}
          onLink={() => { const url = prompt('输入链接 URL:'); if (url) editor.chain().focus().setLink({ href: url }).run() }}
          onClose={() => setSelectionToolbarPos(null)}
        />
      )}
    </div>
  )
})

function renderMathForExport(html: string): string {
  html = html.replace(/<div data-math-block="([^"]*?)"><\/div>/g, (_, tex: string) => {
    try { return katex.renderToString(tex, { displayMode: true, throwOnError: true, output: 'html' }) }
    catch { return `<pre>$$${tex}$$</pre>` }
  })
  html = html.replace(/<span data-math-inline="([^"]*?)"><\/span>/g, (_, tex: string) => {
    try { return katex.renderToString(tex, { displayMode: false, throwOnError: true, output: 'html' }) }
    catch { return `<code>$${tex}$</code>` }
  })
  return html
}

const markdownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  fence: '```',
  hr: '---',
  bulletListMarker: '-',
})
markdownService.addRule('mathBlock', {
  filter: (node) => node.nodeType === 1 && (node as HTMLElement).getAttribute('data-math-block') !== null,
  replacement: (_content, node) => {
    const tex = (node as HTMLElement).getAttribute('data-math-block') || ''
    return `\n$$\n${tex}\n$$\n`
  },
})
markdownService.addRule('mathInline', {
  filter: (node) => node.nodeType === 1 && (node as HTMLElement).getAttribute('data-math-inline') !== null,
  replacement: (_content, node) => {
    const tex = (node as HTMLElement).getAttribute('data-math-inline') || ''
    return `$${tex}$`
  },
})
markdownService.addRule('wikiLink', {
  filter: (node) => node.nodeType === 1 && (node as HTMLElement).getAttribute('data-wiki-link') !== null,
  replacement: (_content, node) => {
    const name = (node as HTMLElement).getAttribute('data-wiki-link') || ''
    return `[[${name}]]`
  },
})
export default Editor
