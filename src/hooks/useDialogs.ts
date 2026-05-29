import { useState, useCallback, useRef } from 'react'

export type UnsavedResult = 'save' | 'discard' | 'cancel'

export interface DialogState {
  type: 'unsaved'
  resolve: (value: UnsavedResult) => void
}

export function useDialogs() {
  const [dialogState, setDialogState] = useState<DialogState | null>(null)
  const dialogRef = useRef<DialogState | null>(null)

  const showUnsavedDialog = useCallback((): Promise<UnsavedResult> => {
    return new Promise(resolve => {
      const state: DialogState = { type: 'unsaved', resolve }
      dialogRef.current = state
      setDialogState(state)
    })
  }, [])

  const showSaveDialog = useCallback(async (defaultName?: string, startingPath?: string): Promise<string | null> => {
    return await window.electronAPI?.showSaveFileDialog(defaultName, startingPath) ?? null
  }, [])

  const showOpenDialog = useCallback(async (startingPath?: string): Promise<string | null> => {
    return await window.electronAPI?.showOpenFileDialog(startingPath) ?? null
  }, [])

  const showFolderDialog = useCallback(async (): Promise<string | null> => {
    return await window.electronAPI?.showFolderPickerDialog() ?? null
  }, [])

  const closeDialog = useCallback((result?: UnsavedResult | null) => {
    const state = dialogRef.current
    if (state && 'resolve' in state) {
      state.resolve(result ?? 'cancel')
    }
    dialogRef.current = null
    setDialogState(null)
  }, [])

  return { dialogState, showUnsavedDialog, showSaveDialog, showOpenDialog, showFolderDialog, closeDialog }
}