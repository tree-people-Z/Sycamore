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
  autoCheckUpdate: true,
  apiBaseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  apiModel: 'gpt-4o-mini',
  apiMaxTokens: 4096,
  apiTemperature: 0.7,
  enableCondense: true,
  keepLatestCount: 5,
  condenseModel: '',
}

export interface EditorSettings {
  fontSize: number
  editorWidth: number
  autoSave: boolean
  autoSaveInterval: number
  lineWrapping: boolean
  autoCheckUpdate: boolean
  apiBaseUrl: string
  apiKey: string
  apiModel: string
  apiMaxTokens: number
  apiTemperature: number
  enableCondense: boolean
  keepLatestCount: number
  condenseModel: string
  keybindings?: Record<string, string>
}

export function sanitizeFileName(title: string): string {
  return title.replace(/[<>:"/\\|?*]/g, '').trim() || '未命名笔记'
}

/** 快捷键默认值（主菜单与渲染层 keydown 共用的唯一事实来源） */
export const DEFAULT_KEYBINDINGS: Record<string, string> = {
  bold: 'CmdOrCtrl+B',
  italic: 'CmdOrCtrl+I',
  strikethrough: 'CmdOrCtrl+Shift+X',
  highlight: 'CmdOrCtrl+Shift+H',
  code: 'CmdOrCtrl+E',
  link: 'CmdOrCtrl+K',
  save: 'CmdOrCtrl+S',
  newFile: 'CmdOrCtrl+N',
  openFile: 'CmdOrCtrl+O',
  saveAs: 'CmdOrCtrl+Shift+S',
  undo: 'CmdOrCtrl+Z',
  redo: 'CmdOrCtrl+Shift+Z',
  exportHtml: 'CmdOrCtrl+Shift+H',
  exportPdf: 'CmdOrCtrl+Shift+P',
}
