import { useState, useCallback } from 'react'
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

export function saveSettings(settings: EditorSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // ignore storage errors
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<EditorSettings>(loadSettings)

  const handleSettingsChange = useCallback((newSettings: EditorSettings) => {
    setSettings(newSettings)
    saveSettings(newSettings)
  }, [])

  return { settings, handleSettingsChange }
}
