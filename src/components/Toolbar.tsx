import { useState, useRef, useEffect } from 'react'
import {
  FilePlus, Save, FolderOpen, Moon, Sun, Leaf,
  Bold, Italic, Strikethrough, Underline, Code, Link2,
  Type, Quote, List, ListOrdered,
  Table, Image, Minus, FileCode, Undo2, Redo2,
  Sigma, MoreHorizontal, Settings, Home,
  Highlighter, FileDown, Palette,
} from 'lucide-react'
import type { InlineFormatType, BlockFormatType } from '../types'
import { HEADING_ENTRIES } from '../types'
import { COLORS } from '../constants'

interface ToolbarProps {
  theme: 'light' | 'dark' | 'sycamore'
  onNew: () => void
  onSave: () => void
  onToggleTheme: () => void
  onSettings?: () => void
  onHome?: () => void
  onToggleSidebar?: () => void
  onFormat?: (type: InlineFormatType, url?: string) => void
  onBlock?: (type: BlockFormatType) => void
  onUndo?: () => void
  onRedo?: () => void
  onExportHtml?: () => void
  onExportPdf?: () => void
}

function ColorPicker({ onFormat, btn }: { onFormat?: (type: InlineFormatType, url?: string) => void; btn: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])
  return (
    <div className="relative inline-flex" ref={ref}>
      <button onClick={() => setOpen(v => !v)} className={btn} title="文字颜色">
        <Palette size={14} />
      </button>
      {open && (
          <div className="absolute top-full left-0 mt-0.5 bg-[var(--color-surface)] rounded-lg shadow-xl border border-[var(--color-border)] p-2 z-50" style={{ width: '152px' }}>
            <div className="flex flex-wrap gap-1">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => { onFormat?.('color', c); setOpen(false) }}
                  className="w-7 h-7 rounded-md border border-[var(--color-border)] hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
            <input
              type="text"
              placeholder="#hex"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value.trim()
                  if (val) { onFormat?.('color', val); setOpen(false) }
                }
              }}
              className="w-full mt-1.5 px-2 py-1 text-[10px] font-mono bg-[var(--color-bg)] border border-[var(--color-border)] rounded outline-none text-[var(--color-text)]"
            />
          </div>
      )}
    </div>
  )
}

function Toolbar({
  theme,
  onNew,
  onSave,
  onToggleTheme,
  onSettings,
  onHome,
  onToggleSidebar,
  onFormat,
  onBlock,
  onUndo,
  onRedo,
  onExportHtml,
  onExportPdf,
}: ToolbarProps) {
  const [showHeading, setShowHeading] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const headingRef = useRef<HTMLDivElement>(null)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headingRef.current && !headingRef.current.contains(e.target as Node)) {
        setShowHeading(false)
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const btn = 'w-7 h-7 flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] rounded-md transition-colors text-xs'
  const separator = 'w-px h-5 bg-[var(--color-border)] mx-1.5'

  return (
    <div className="h-10 bg-[var(--color-bg)] border-b border-[var(--color-border)] flex items-center px-2.5 gap-0.5 select-none flex-shrink-0 relative">
      {/* Home */}
      {onHome && (
        <button onClick={onHome} className={btn} title="主页">
          <Home size={15} />
        </button>
      )}

      {/* File operations */}
      <button onClick={onNew} className={btn} title="新建 (⌘N)"><FilePlus size={15} /></button>
      <button onClick={onSave} className={btn} title="保存 (⌘S)"><Save size={15} /></button>

      <div className={separator} />

      {/* Sidebar toggle */}
      {onToggleSidebar && (
        <button onClick={onToggleSidebar} className={btn} title="浏览文件" data-sidebar-toggle="true">
          <FolderOpen size={15} />
        </button>
      )}

      <div className={separator} />

      {/* Undo / Redo */}
      <button onClick={onUndo} className={btn} title="撤销 (⌘Z)"><Undo2 size={14} /></button>
      <button onClick={onRedo} className={btn} title="重做 (⌘⇧Z)"><Redo2 size={14} /></button>

      <div className={separator} />

      {/* Heading dropdown */}
      <div className="relative" ref={headingRef}>
        <button className={btn} title="标题" onClick={() => setShowHeading(v => !v)}><Type size={15} /></button>
        {showHeading && (
          <div className="absolute top-full left-0 mt-0.5 bg-[var(--color-surface)] rounded-lg shadow-xl border border-[var(--color-border)] py-1 min-w-[160px] z-50 animate-in">
            {HEADING_ENTRIES.map(h => (
              <button
                key={h.level}
                className="w-full px-3 py-1.5 text-xs text-left text-[var(--color-text)] hover:bg-[var(--color-hover)] flex items-center gap-2 transition-colors"
                onClick={() => { onBlock?.(h.level); setShowHeading(false) }}
              >
                <span className="font-mono text-[var(--color-text-secondary)] w-6">{h.shortcut}</span>
                <span>{h.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Inline formatting */}
      <button onClick={() => onFormat?.('bold')} className={btn} title="加粗 (⌘B)"><Bold size={14} /></button>
      <button onClick={() => onFormat?.('italic')} className={btn} title="斜体 (⌘I)"><Italic size={14} /></button>
      <button onClick={() => onFormat?.('strikethrough')} className={btn} title="删除线"><Strikethrough size={14} /></button>
      <button onClick={() => onFormat?.('underline')} className={btn} title="下划线"><Underline size={14} /></button>
      <ColorPicker onFormat={onFormat} btn={btn} />
      <button onClick={() => onFormat?.('highlight')} className={btn} title="高亮"><Highlighter size={14} /></button>
      <button onClick={() => onFormat?.('code')} className={btn} title="行内代码"><Code size={14} /></button>
      <button onClick={() => onFormat?.('link')} className={btn} title="链接"><Link2 size={14} /></button>

      <div className={separator} />

      {/* Block elements */}
      <button onClick={() => onBlock?.('quote')} className={btn} title="引用"><Quote size={14} /></button>
      <button onClick={() => onBlock?.('ul')} className={btn} title="无序列表"><List size={14} /></button>
      <button onClick={() => onBlock?.('ol')} className={btn} title="有序列表"><ListOrdered size={14} /></button>
      <button onClick={() => onBlock?.('codeblock')} className={btn} title="代码块"><FileCode size={14} /></button>

      <div className={separator} />

      {/* More menu - advanced features */}
      <div className="relative" ref={moreRef}>
        <button className={btn} title="更多" onClick={() => setShowMoreMenu(v => !v)}>
          <MoreHorizontal size={15} />
        </button>
        {showMoreMenu && (
          <div className="absolute top-full right-0 mt-0.5 bg-[var(--color-surface)] rounded-lg shadow-xl border border-[var(--color-border)] py-1 min-w-[180px] z-50 animate-in">
            <button
              onClick={() => { onBlock?.('table'); setShowMoreMenu(false) }}
              className="w-full px-3 py-2 text-xs text-left text-[var(--color-text)] hover:bg-[var(--color-hover)] flex items-center gap-2.5 transition-colors"
            >
              <Table size={14} className="text-[var(--color-text-secondary)]" />
              <span>表格</span>
            </button>
            <button
              onClick={() => { onFormat?.('image'); setShowMoreMenu(false) }}
              className="w-full px-3 py-2 text-xs text-left text-[var(--color-text)] hover:bg-[var(--color-hover)] flex items-center gap-2.5 transition-colors"
            >
              <Image size={14} className="text-[var(--color-text-secondary)]" />
              <span>插入图片</span>
            </button>
            <button
              onClick={() => { onBlock?.('hr'); setShowMoreMenu(false) }}
              className="w-full px-3 py-2 text-xs text-left text-[var(--color-text)] hover:bg-[var(--color-hover)] flex items-center gap-2.5 transition-colors"
            >
              <Minus size={14} className="text-[var(--color-text-secondary)]" />
              <span>分隔线</span>
            </button>
            <button
              onClick={() => { onBlock?.('math'); setShowMoreMenu(false) }}
              className="w-full px-3 py-2 text-xs text-left text-[var(--color-text)] hover:bg-[var(--color-hover)] flex items-center gap-2.5 transition-colors"
            >
              <Sigma size={14} className="text-[var(--color-text-secondary)]" />
              <span>数学公式</span>
            </button>
            <div className="h-px bg-[var(--color-border)] my-1" />
            <button
              onClick={() => { onExportHtml?.(); setShowMoreMenu(false) }}
              className="w-full px-3 py-2 text-xs text-left text-[var(--color-text)] hover:bg-[var(--color-hover)] flex items-center gap-2.5 transition-colors"
            >
              <FileDown size={14} className="text-[var(--color-text-secondary)]" />
              <span>导出 HTML</span>
            </button>
            <button
              onClick={() => { onExportPdf?.(); setShowMoreMenu(false) }}
              className="w-full px-3 py-2 text-xs text-left text-[var(--color-text)] hover:bg-[var(--color-hover)] flex items-center gap-2.5 transition-colors"
            >
              <FileDown size={14} className="text-[var(--color-text-secondary)]" />
              <span>导出 PDF</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex-1" />

      {/* Settings */}
      {onSettings && (
        <button onClick={onSettings} className={btn} title="设置">
          <Settings size={15} />
        </button>
      )}

      {/* Theme toggle */}
      <button onClick={onToggleTheme} className={btn} data-theme-toggle title={
        theme === 'light' ? '深色模式' : theme === 'dark' ? '梧桐主题' : '浅色模式'
      }>
        {theme === 'light' ? <Moon size={15} /> : theme === 'dark' ? <Sun size={15} /> : <Leaf size={15} />}
      </button>
    </div>
  )
}

export default Toolbar
