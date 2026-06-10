import { useState, useRef, useEffect, memo } from 'react'
import { ChevronDown, Sparkles } from 'lucide-react'

export interface ProviderOption {
  label: string
  url: string
}

interface AiProviderDropdownProps {
  providers: readonly ProviderOption[]
  value: string
  onChange: (url: string) => void
  onCustom: () => void
}

function AiProviderDropdown({ providers, value, onChange, onCustom }: AiProviderDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = providers.find(p => p.url === value)

  useEffect(() => {
    if (!open) return
    const dismiss = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', dismiss)
    return () => document.removeEventListener('mousedown', dismiss)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full h-9 px-3 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg flex items-center justify-between text-[var(--color-text)] hover:border-[var(--color-accent)] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-[var(--color-accent)]" />
          <span>{current?.label || value.replace(/https?:\/\//, '').replace(/\/v1$/, '') || '自定义'}</span>
        </div>
        <ChevronDown size={14} className={`text-[var(--color-text-muted)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl z-50 py-1 max-h-60 overflow-y-auto conv-list-dropdown">
          {providers.map(p => (
            <button key={p.url}
              onClick={() => { onChange(p.url); setOpen(false) }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors ${
                value === p.url
                  ? 'text-[var(--color-accent)] bg-[var(--color-accent-10)]'
                  : 'text-[var(--color-text)] hover:bg-[var(--color-hover)]'
              }`}
            >
              <Sparkles size={12} className={value === p.url ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'} />
              <span>{p.label}</span>
            </button>
          ))}
          <div className="h-px bg-[var(--color-border)] mx-2 my-1" />
          <button
            onClick={() => { onCustom(); setOpen(false) }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] transition-colors"
          >
            <span>自定义...</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default memo(AiProviderDropdown)
