import { useState, useEffect, useRef } from 'react'
import { onInputDialog } from '../utils/input-dialog'
import type { InputDialogRequest } from '../utils/input-dialog'

/** 全局输入对话框：配合 utils/input-dialog 的 showInputDialog 使用，App 中挂载一次 */
export default function GlobalInputDialog() {
  const [req, setReq] = useState<InputDialogRequest | null>(null)
  const [value, setValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return onInputDialog(request => {
      setReq(request)
      setValue(request.defaultValue ?? '')
      setSubmitting(false)
    })
  }, [])

  useEffect(() => {
    if (req) inputRef.current?.focus()
  }, [req])

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (e.target === backdropRef.current) finish(null) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  })

  const finish = (result: string | null) => {
    if (!req) return
    req.resolve(result)
    setReq(null)
  }

  const submit = () => {
    if (submitting) return
    setSubmitting(true)
    finish(value.trim())
  }

  if (!req) return null

  return (
    <div ref={backdropRef} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 dialog-overlay">
      <div className="bg-[var(--color-surface)] rounded-xl shadow-2xl border border-[var(--color-border)] w-[320px] p-4 dialog-panel">
        <div className="text-xs font-medium text-[var(--color-text)] mb-3">{req.title}</div>
        <input ref={inputRef} type="text" value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) submit()
            if (e.key === 'Escape') finish(null)
          }}
          className="w-full h-9 px-3 text-xs bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg outline-none text-[var(--color-text)] focus:border-[var(--color-accent)] transition-colors" />
        <div className="flex justify-end gap-2 mt-3">
          <button onClick={() => finish(null)}
            className="px-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">取消</button>
          <button onClick={submit} disabled={!value.trim() || submitting}
            className="px-3 py-1.5 text-xs rounded-lg bg-[var(--color-accent)] text-white hover:opacity-80 disabled:opacity-40 transition-opacity">确定</button>
        </div>
      </div>
    </div>
  )
}
