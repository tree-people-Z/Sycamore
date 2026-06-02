import { useState, useRef, useEffect } from 'react'
import { Palette } from 'lucide-react'
import { COLORS } from '../constants'

interface ColorPickerProps {
  onColor: (color: string) => void
  btnClass?: string
}

function ColorPicker({ onColor, btnClass = '' }: ColorPickerProps) {
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
      <button onClick={() => setOpen(v => !v)} className={btnClass} title="文字颜色" aria-label="文字颜色">
        <Palette size={14} />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-1 bg-[var(--color-surface)] rounded-lg shadow-xl border border-[var(--color-border)] p-2 z-50" style={{ width: '144px' }}>
          <div className="flex flex-wrap gap-1">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => { onColor(c); setOpen(false) }}
                className="w-6 h-6 rounded border border-[var(--color-border)] hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
                aria-label={`颜色 ${c}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ColorPicker
