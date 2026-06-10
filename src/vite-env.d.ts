/// <reference types="vite/client" />

declare module 'lucide-react'

interface Window {
  electronAPI?: import('./electron-api').ElectronAPI
}
