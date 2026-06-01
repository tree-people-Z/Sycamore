import type { TauriAPI } from './tauri-api'

declare global {
  interface Window {
    electronAPI?: TauriAPI
  }
}

export {}
