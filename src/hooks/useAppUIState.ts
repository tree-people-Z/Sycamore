import { useReducer, useCallback } from 'react'

interface UIState {
  showWelcome: boolean
  sidebarVisible: boolean
  sidebarPinned: boolean
  focusMode: boolean
  editorWide: boolean
  aiChatOpen: boolean
  showSettings: boolean
  showFormulaDialog: boolean
  showChartDialog: boolean
  showImageInput: boolean
  imageUrlInput: string
  selectedText: string
  welcomeKey: number
  docKey: string
}

type UIAction =
  | { type: 'setShowWelcome'; value: boolean }
  | { type: 'setSidebarVisible'; value: boolean }
  | { type: 'setSidebarPinned'; value: boolean }
  | { type: 'toggleFocusMode' }
  | { type: 'toggleEditorWide' }
  | { type: 'toggleAiChat' }
  | { type: 'setShowSettings'; value: boolean }
  | { type: 'setShowFormulaDialog'; value: boolean }
  | { type: 'setShowChartDialog'; value: boolean }
  | { type: 'setShowImageInput'; value: boolean }
  | { type: 'setImageUrlInput'; value: string }
  | { type: 'setSelectedText'; value: string }
  | { type: 'incrementWelcomeKey' }
  | { type: 'setDocKey'; value: string }
  | { type: 'closeSidebar' }
  | { type: 'openAiChat' }

const initialUIState: UIState = {
  showWelcome: true,
  sidebarVisible: false,
  sidebarPinned: false,
  focusMode: false,
  editorWide: false,
  aiChatOpen: false,
  showSettings: false,
  showFormulaDialog: false,
  showChartDialog: false,
  showImageInput: false,
  imageUrlInput: '',
  selectedText: '',
  welcomeKey: 0,
  docKey: 'untitled',
}

function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'setShowWelcome': return { ...state, showWelcome: action.value }
    case 'setSidebarVisible': return { ...state, sidebarVisible: action.value }
    case 'setSidebarPinned': return { ...state, sidebarPinned: action.value }
    case 'toggleFocusMode': return { ...state, focusMode: !state.focusMode }
    case 'toggleEditorWide': return { ...state, editorWide: !state.editorWide }
    case 'toggleAiChat': return { ...state, aiChatOpen: !state.aiChatOpen }
    case 'openAiChat': return { ...state, aiChatOpen: true }
    case 'setShowSettings': return { ...state, showSettings: action.value }
    case 'setShowFormulaDialog': return { ...state, showFormulaDialog: action.value }
    case 'setShowChartDialog': return { ...state, showChartDialog: action.value }
    case 'setShowImageInput': return { ...state, showImageInput: action.value }
    case 'setImageUrlInput': return { ...state, imageUrlInput: action.value }
    case 'setSelectedText': return { ...state, selectedText: action.value }
    case 'incrementWelcomeKey': return { ...state, welcomeKey: state.welcomeKey + 1 }
    case 'setDocKey': return { ...state, docKey: action.value }
    case 'closeSidebar': return { ...state, sidebarVisible: false, sidebarPinned: false }
  }
}

export function useAppUIState() {
  const [ui, dispatch] = useReducer(uiReducer, initialUIState)

  return {
    ui,
    setShowWelcome: useCallback((value: boolean) => dispatch({ type: 'setShowWelcome', value }), []),
    setSidebarVisible: useCallback((value: boolean) => dispatch({ type: 'setSidebarVisible', value }), []),
    setSidebarPinned: useCallback((value: boolean) => dispatch({ type: 'setSidebarPinned', value }), []),
    toggleFocusMode: useCallback(() => dispatch({ type: 'toggleFocusMode' }), []),
    toggleEditorWide: useCallback(() => dispatch({ type: 'toggleEditorWide' }), []),
    toggleAiChat: useCallback(() => dispatch({ type: 'toggleAiChat' }), []),
    openAiChat: useCallback(() => dispatch({ type: 'openAiChat' }), []),
    setShowSettings: useCallback((value: boolean) => dispatch({ type: 'setShowSettings', value }), []),
    setShowFormulaDialog: useCallback((value: boolean) => dispatch({ type: 'setShowFormulaDialog', value }), []),
    setShowChartDialog: useCallback((value: boolean) => dispatch({ type: 'setShowChartDialog', value }), []),
    setShowImageInput: useCallback((value: boolean) => dispatch({ type: 'setShowImageInput', value }), []),
    setImageUrlInput: useCallback((value: string) => dispatch({ type: 'setImageUrlInput', value }), []),
    setSelectedText: useCallback((value: string) => dispatch({ type: 'setSelectedText', value }), []),
    incrementWelcomeKey: useCallback(() => dispatch({ type: 'incrementWelcomeKey' }), []),
    setDocKey: useCallback((value: string) => dispatch({ type: 'setDocKey', value }), []),
    closeSidebar: useCallback(() => dispatch({ type: 'closeSidebar' }), []),
  }
}
