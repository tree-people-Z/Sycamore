export const LINKED_FOLDER_KEY = 'editor-linked-folder'
export const THEME_KEY = 'sycamore-theme'
export const SETTINGS_KEY = 'editor-settings'

export type Theme = 'light' | 'dark' | 'sycamore'

export const THEME_CYCLE: Record<Theme, Theme> = {
  light: 'dark',
  dark: 'sycamore',
  sycamore: 'light',
}

export const COLORS = [
  'red', 'orange', '#ff9500', '#ffcc00', '#28c840', '#34c759',
  '#5ac8fa', '#007aff', '#5856d6', '#af52de', '#ff2d55', '#8e8e93',
]

export const WORD_GOAL = 1000

export const DEFAULT_SETTINGS = {
  fontSize: 18,
  editorWidth: 800,
  autoSave: true,
  autoSaveInterval: 30,
  lineWrapping: true,
}

export function sanitizeFileName(title: string): string {
  return title.replace(/[<>:"/\\|?*]/g, '').trim() || '未命名笔记'
}
