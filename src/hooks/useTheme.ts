import { useState, useCallback, useEffect } from 'react'
import { flushSync } from 'react-dom'
import { THEME_KEY, THEME_CYCLE } from '../constants'
import type { Theme } from '../constants'

const VALID_THEMES: Theme[] = ['light', 'dark', 'sycamore']

function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY) as Theme | null
    // 非法值会让 THEME_CYCLE[prev] 变 undefined，主题切换永久卡死
    return saved && VALID_THEMES.includes(saved) ? saved : 'sycamore'
  } catch {
    return 'sycamore'
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  const cycleTheme = useCallback(() => {
    const apply = () => {
      setTheme(prev => {
        const t = THEME_CYCLE[prev]
        localStorage.setItem(THEME_KEY, t)
        return t
      })
    }
    if (document.startViewTransition) {
      document.startViewTransition(() => flushSync(apply))
    } else {
      apply()
    }
  }, [])

  useEffect(() => {
    const cleanup = window.electronAPI?.onToggleDarkMode(() => cycleTheme())
    return () => cleanup?.()
  }, [cycleTheme])

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark', 'sycamore-theme')
    if (theme === 'dark') root.classList.add('dark')
    if (theme === 'sycamore') root.classList.add('sycamore-theme')
  }, [theme])

  const darkMode = theme === 'dark'

  return { theme, darkMode, cycleTheme }
}
