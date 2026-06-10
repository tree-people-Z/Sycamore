import { useState, useCallback, useRef } from 'react'
import { SETTINGS_KEY, DEFAULT_SETTINGS } from '../constants'
import type { EditorSettings } from '../constants'

export function loadSettings(): EditorSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
    }
  } catch {
    // ignore parse errors
  }
  return { ...DEFAULT_SETTINGS }
}

export function useSettings() {
  const [settings, setSettings] = useState<EditorSettings>(loadSettings)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSettingsChange = useCallback((newSettings: EditorSettings) => {
    setSettings(newSettings)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings))
      } catch {
        // ignore storage errors
      }
    }, 300)
  }, [])

  return { settings, handleSettingsChange }
}
