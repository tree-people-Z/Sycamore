import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react'
import { X, Type, Maximize, Save, RotateCcw, WrapText, Keyboard, Leaf } from 'lucide-react'
import { SETTINGS_KEY, DEFAULT_SETTINGS } from '../constants'

export type ShortcutAction =
  | 'bold' | 'italic' | 'strikethrough' | 'highlight' | 'code' | 'link'
  | 'save' | 'newFile' | 'openFile' | 'saveAs' | 'undo' | 'redo'
  | 'exportHtml' | 'exportPdf'

export interface EditorSettings {
  fontSize: number
  editorWidth: number
  autoSave: boolean
  autoSaveInterval: number
  lineWrapping: boolean
  keybindings?: Record<ShortcutAction, string>
}

const DEFAULT_KEYBINDINGS: Record<ShortcutAction, string> = {
  bold: 'CmdOrCtrl+B', italic: 'CmdOrCtrl+I', strikethrough: 'CmdOrCtrl+Shift+X',
  highlight: 'CmdOrCtrl+Shift+H', code: 'CmdOrCtrl+E', link: 'CmdOrCtrl+K',
  save: 'CmdOrCtrl+S', newFile: 'CmdOrCtrl+N', openFile: 'CmdOrCtrl+O',
  saveAs: 'CmdOrCtrl+Shift+S', undo: 'CmdOrCtrl+Z', redo: 'CmdOrCtrl+Shift+Z',
  exportHtml: 'CmdOrCtrl+Shift+H', exportPdf: 'CmdOrCtrl+Shift+P',
}

const SHORTCUT_LABELS: Record<ShortcutAction, string> = {
  bold: '加粗', italic: '斜体', strikethrough: '删除线', highlight: '高亮',
  code: '行内代码', link: '链接', save: '保存', newFile: '新建', openFile: '打开',
  saveAs: '另存为', undo: '撤销', redo: '重做', exportHtml: '导出 HTML', exportPdf: '导出 PDF',
}

const FULL_DEFAULTS: EditorSettings = { ...DEFAULT_SETTINGS, keybindings: { ...DEFAULT_KEYBINDINGS } } as EditorSettings

const GITHUB_SVG = <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
const LINK_SVG = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>

export function loadSettings(): EditorSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return { ...FULL_DEFAULTS, ...parsed, keybindings: { ...DEFAULT_KEYBINDINGS, ...(parsed.keybindings || {}) } }
    }
  } catch { /* ignore */ }
  return { ...FULL_DEFAULTS }
}

export function saveSettings(settings: EditorSettings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) }
  catch { /* ignore */ }
}

interface SettingsPanelProps {
  settings: EditorSettings
  onChange: (settings: EditorSettings) => void
  onClose: () => void
}

type TabKey = 'editor' | 'save' | 'shortcuts' | 'about'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'editor', label: '排版' },
  { key: 'save', label: '保存' },
  { key: 'shortcuts', label: '快捷键' },
  { key: 'about', label: '关于' },
]

function ResetBtn({ onReset, show }: { onReset: () => void; show: boolean }) {
  if (!show) return null
  return (
    <button onClick={onReset}
      className="w-5 h-5 flex items-center justify-center text-[#aeaeb2] hover:text-[#007aff] dark:hover:text-[#0a84ff] transition-colors" title="恢复默认">
      <RotateCcw size={12} />
    </button>
  )
}

function TabPanel({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <div className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: active ? '1fr' : '0fr' }}>
      <div className={`overflow-hidden transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-0'}`}>
        {children}
      </div>
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className={`w-10 h-5 rounded-full transition-colors relative ${value ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'}`}>
      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

function Slider({ value, onChange, min, max, step = 1, label }: {
  value: number; onChange: (v: number) => void; min: number; max: number; step?: number; label: string
}) {
  return (
    <>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full h-1.5 bg-[var(--color-border)] rounded-full appearance-none cursor-pointer accent-[var(--color-accent)]" />
      <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] mt-1">
        <span>{min}{label}</span>
        <span>{max}{label}</span>
      </div>
    </>
  )
}

function formatShortcut(key: string): string {
  const isMac = navigator.platform.includes('Mac')
  return key
    .replace(/CmdOrCtrl/g, isMac ? '⌘' : 'Ctrl+')
    .replace(/Cmd/g, isMac ? '⌘' : 'Ctrl+')
    .replace(/Ctrl/g, 'Ctrl+')
    .replace(/Shift/g, isMac ? '⇧' : 'Shift+')
    .replace(/Alt/g, isMac ? '⌥' : 'Alt+')
    .replace(/\++/g, '+')
    .replace(/\+$/, '')
}

function SettingsPanel({ settings, onChange, onClose }: SettingsPanelProps) {
  const [localSettings, setLocalSettings] = useState<EditorSettings>(settings)
  const [recording, setRecording] = useState<ShortcutAction | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('editor')
  const recordingRef = useRef<ShortcutAction | null>(null)

  useEffect(() => { recordingRef.current = recording }, [recording])

  const updateSetting = useCallback(<K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => {
    const updated = { ...localSettings, [key]: value }
    setLocalSettings(updated)
    onChange(updated)
  }, [localSettings, onChange])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const action = recordingRef.current
    if (!action) return
    e.preventDefault(); e.stopPropagation()
    const parts: string[] = []
    if (e.metaKey) parts.push('Cmd')
    else if (e.ctrlKey) parts.push('Ctrl')
    if (e.shiftKey) parts.push('Shift')
    if (e.altKey) parts.push('Alt')
    const key = e.key
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(key)) return
    if (!parts.length && key.length === 1 && key.match(/[a-z0-9]/i)) return
    let keyName = key
    if (key === ' ') keyName = 'Space'
    else if (key.length === 1) keyName = key.toUpperCase()
    parts.push(keyName)
    const shortcut = parts.join('+')
    updateSetting('keybindings', { ...(localSettings.keybindings || {}) as Record<ShortcutAction, string>, [action]: shortcut })
    setRecording(null); recordingRef.current = null
  }, [localSettings, updateSetting])

  useEffect(() => {
    if (!recording) return
    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [recording, handleKeyDown])

  const resetSetting = useCallback(<K extends keyof EditorSettings>(key: K) => {
    updateSetting(key, FULL_DEFAULTS[key])
  }, [updateSetting])

  const resetAll = () => {
    setLocalSettings(FULL_DEFAULTS); onChange(FULL_DEFAULTS)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dialog-overlay">
      <div className="bg-[var(--color-surface)] rounded-xl shadow-2xl border border-[var(--color-border)] w-[420px] max-h-[80vh] flex flex-col dialog-panel">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">设置</h2>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] rounded-md transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex border-b border-[var(--color-border)]">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors relative ${
                activeTab === tab.key ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }`}>
              {tab.label}
              {activeTab === tab.key && <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-[var(--color-accent)] rounded-full" />}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <TabPanel active={activeTab === 'editor'}>
            <div className="space-y-3">
              <div className="bg-[var(--color-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                <div className="flex items-center gap-2 mb-2">
                  <Type size={14} className="text-[var(--color-accent)]" />
                  <label className="text-xs font-medium text-[var(--color-text)]">字体大小</label>
                  <ResetBtn show={localSettings.fontSize !== FULL_DEFAULTS.fontSize} onReset={() => resetSetting('fontSize')} />
                  <span className="text-xs text-[var(--color-text-secondary)] ml-auto">{localSettings.fontSize}px</span>
                </div>
                <Slider value={localSettings.fontSize} onChange={v => updateSetting('fontSize', v)} min={12} max={28} label="px" />
              </div>

              <div className="bg-[var(--color-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                <div className="flex items-center gap-2 mb-2">
                  <Maximize size={14} className="text-[var(--color-accent)]" />
                  <label className="text-xs font-medium text-[var(--color-text)]">编辑器宽度</label>
                  <ResetBtn show={localSettings.editorWidth !== FULL_DEFAULTS.editorWidth} onReset={() => resetSetting('editorWidth')} />
                  <span className="text-xs text-[var(--color-text-secondary)] ml-auto">{localSettings.editorWidth}px</span>
                </div>
                <Slider value={localSettings.editorWidth} onChange={v => updateSetting('editorWidth', v)} min={600} max={1200} step={50} label="px" />
              </div>

              <div className="bg-[var(--color-bg)] rounded-xl p-4 border border-[var(--color-border)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <WrapText size={14} className="text-[var(--color-accent)]" />
                    <label className="text-xs font-medium text-[var(--color-text)]">自动换行</label>
                    <ResetBtn show={localSettings.lineWrapping !== FULL_DEFAULTS.lineWrapping} onReset={() => resetSetting('lineWrapping')} />
                  </div>
                  <Toggle value={localSettings.lineWrapping} onChange={v => updateSetting('lineWrapping', v)} />
                </div>
              </div>
            </div>
          </TabPanel>

          <TabPanel active={activeTab === 'save'}>
            <div className="bg-[var(--color-bg)] rounded-xl p-4 border border-[var(--color-border)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Save size={14} className="text-[var(--color-accent)]" />
                  <label className="text-xs font-medium text-[var(--color-text)]">自动保存</label>
                  <ResetBtn show={localSettings.autoSave !== FULL_DEFAULTS.autoSave} onReset={() => resetSetting('autoSave')} />
                </div>
                <Toggle value={localSettings.autoSave} onChange={v => updateSetting('autoSave', v)} />
              </div>

              {localSettings.autoSave && (
                <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-xs text-[var(--color-text-secondary)]">保存间隔</label>
                    <ResetBtn show={localSettings.autoSaveInterval !== FULL_DEFAULTS.autoSaveInterval} onReset={() => resetSetting('autoSaveInterval')} />
                  </div>
                  <div className="flex gap-2">
                    {[5, 15, 30, 60].map(interval => (
                      <button key={interval} onClick={() => updateSetting('autoSaveInterval', interval)}
                        className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${
                          localSettings.autoSaveInterval === interval
                            ? 'bg-[var(--color-accent)] text-white'
                            : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] border border-[var(--color-border)]'
                        }`}>
                        {interval}s
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabPanel>

          <TabPanel active={activeTab === 'shortcuts'}>
            <div className="bg-[var(--color-bg)] rounded-xl p-4 border border-[var(--color-border)]">
              <div className="flex items-center gap-2 mb-3">
                <Keyboard size={14} className="text-[var(--color-accent)]" />
                <label className="text-xs font-medium text-[var(--color-text)]">快捷键</label>
                <ResetBtn
                  show={Object.keys(DEFAULT_KEYBINDINGS).some(k =>
                    (localSettings.keybindings || {})[k as ShortcutAction] !== DEFAULT_KEYBINDINGS[k as ShortcutAction]
                  )}
                  onReset={() => {
                    const updated = { ...localSettings, keybindings: { ...DEFAULT_KEYBINDINGS } }
                    setLocalSettings(updated); onChange(updated)
                  }}
                />
              </div>
              <div className="space-y-0.5">
                {Object.entries(SHORTCUT_LABELS).map(([action, label]) => {
                  const isRecording = recording === action
                  const shortcut = (localSettings.keybindings || {})[action as ShortcutAction]
                  return (
                    <div key={action}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                        isRecording ? 'bg-[var(--color-accent-10)] ring-1 ring-[var(--color-accent)]' : 'hover:bg-[var(--color-surface)]'
                      }`}
                      onClick={() => {
                        if (isRecording) { setRecording(null); return }
                        setRecording(action as ShortcutAction)
                      }}>
                      <span className="text-xs text-[var(--color-text)]">{label}</span>
                      <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                        isRecording ? 'text-[var(--color-accent)] animate-pulse' : 'text-[var(--color-text-secondary)] bg-[var(--color-surface)] border border-[var(--color-border)]'
                      }`}>
                        {isRecording ? '按下快捷键...' : formatShortcut(shortcut || '')}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </TabPanel>

          <TabPanel active={activeTab === 'about'}>
            <div className="flex flex-col items-center py-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-alt)] flex items-center justify-center mb-4 shadow-lg"
                style={{ boxShadow: '0 8px 30px var(--color-accent-10)' }}>
                <Leaf size={26} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text)] mb-0.5">Sycamore</h3>
              <p className="text-xs text-[var(--color-text-muted)] mb-6">v1.0.0</p>

              <div className="w-full bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-[var(--color-text-secondary)]">作者</span>
                  <span className="text-xs text-[var(--color-text)] font-medium">Tree people</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-[var(--color-text-secondary)]">GitHub</span>
                  <a href="https://github.com/tree-people-Z" target="_blank" rel="noopener noreferrer"
                    className="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1">
                    {GITHUB_SVG} @tree-people-Z
                  </a>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-[var(--color-text-secondary)]">项目地址</span>
                  <a href="https://github.com/tree-people-Z/Sycamore" target="_blank" rel="noopener noreferrer"
                    className="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1">
                    {LINK_SVG} tree-people-Z/Sycamore
                  </a>
                </div>
              </div>
            </div>
          </TabPanel>
        </div>

        <div className="px-5 py-3 border-t border-[var(--color-border)] flex items-center justify-between">
          {activeTab !== 'about' ? (
            <button onClick={resetAll}
              className="px-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] hover:border-[var(--color-danger)] transition-colors">
              恢复默认
            </button>
          ) : <div />}
          <button onClick={onClose}
            className="px-4 py-1.5 text-xs rounded-lg bg-[var(--color-accent)] text-white hover:opacity-80 transition-opacity">
            完成
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPanel
