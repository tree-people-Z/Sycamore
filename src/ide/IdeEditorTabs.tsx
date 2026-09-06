import { X, FolderOpen } from 'lucide-react'

export interface IdeTab {
  path: string
  name: string
  content: string
  savedContent: string
}

interface IdeEditorTabsProps {
  tabs: IdeTab[]
  activePath: string | null
  onActivate: (path: string) => void
  onClose: (path: string) => void
  onOpenExternally: () => void
}

export default function IdeEditorTabs({ tabs, activePath, onActivate, onClose, onOpenExternally }: IdeEditorTabsProps) {
  const btn = 'w-6 h-6 flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] rounded-md transition-colors'
  return (
    <div className="h-9 flex items-stretch border-b border-[var(--color-border)] bg-[var(--color-bg)] flex-shrink-0 select-none">
      <div className="flex-1 flex items-stretch overflow-x-auto">
        {tabs.map(tab => {
          const dirty = tab.content !== tab.savedContent
          const active = tab.path === activePath
          return (
            <div key={tab.path}
              role="button" tabIndex={0}
              onClick={() => onActivate(tab.path)}
              onKeyDown={e => { if (e.key === 'Enter') onActivate(tab.path) }}
              className={`group flex items-center gap-1.5 pl-3 pr-1.5 text-xs cursor-pointer border-r border-[var(--color-border)] transition-colors max-w-[200px] ${
                active
                  ? 'bg-[var(--color-surface)] text-[var(--color-text)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]'
              }`}>
              <span className="truncate">{tab.name}</span>
              {dirty && <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] flex-shrink-0" />}
              <button
                onClick={e => { e.stopPropagation(); onClose(tab.path) }}
                className="w-4 h-4 flex items-center justify-center rounded hover:bg-[var(--color-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex-shrink-0"
                title="关闭" aria-label={`关闭 ${tab.name}`}>
                <X size={11} />
              </button>
            </div>
          )
        })}
      </div>
      <div className="flex items-center px-2 border-l border-[var(--color-border)]">
        <button onClick={onOpenExternally} className={btn} title="打开外部代码文件" aria-label="打开外部代码文件">
          <FolderOpen size={13} />
        </button>
      </div>
    </div>
  )
}
