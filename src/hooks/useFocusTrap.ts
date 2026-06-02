import { useEffect, useRef } from 'react'

export function useFocusTrap(active: boolean) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active) return

    const el = ref.current
    if (!el) return

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    const previouslyFocused = document.activeElement as HTMLElement

    const getFocusable = () => Array.from(el.querySelectorAll<HTMLElement>(focusableSelector))
      .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null)

    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const focusable = getFocusable()
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    const timer = setTimeout(() => {
      const focusable = getFocusable()
      if (focusable.length > 0) focusable[0].focus()
    }, 50)

    document.addEventListener('keydown', trap)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', trap)
      previouslyFocused?.focus()
    }
  }, [active])

  return ref
}
