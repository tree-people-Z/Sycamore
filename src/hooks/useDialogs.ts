import { useState, useCallback, useRef } from 'react'

export type UnsavedResult = 'save' | 'discard' | 'cancel'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ResolveFn = (value: any) => void
export type DialogType = 'unsaved' | 'open' | 'save' | 'folder' | null

export interface DialogState {
  type: 'unsaved'
  resolve: (value: UnsavedResult) => void
}

export interface FileDialogState {
  type: 'open' | 'save' | 'folder'
  resolve: (value: string | null) => void
  defaultName?: string
  startingPath?: string
}

export type AnyDialogState = DialogState | FileDialogState

export function useDialogs() {
  const [dialogState, setDialogState] = useState<AnyDialogState | null>(null)
  const dialogRef = useRef<AnyDialogState | null>(null)

  const showUnsavedDialog = useCallback((): Promise<UnsavedResult> => {
    return new Promise(resolve => {
      const state: DialogState = { type: 'unsaved', resolve }
      dialogRef.current = state
      setDialogState(state)
    })
  }, [])

  const showSaveDialog = useCallback((defaultName?: string, startingPath?: string): Promise<string | null> => {
    return new Promise(resolve => {
      const state: FileDialogState = { type: 'save', resolve, defaultName, startingPath }
      dialogRef.current = state
      setDialogState(state)
    })
  }, [])

  const showOpenDialog = useCallback((startingPath?: string): Promise<string | null> => {
    return new Promise(resolve => {
      const state: FileDialogState = { type: 'open', resolve, startingPath }
      dialogRef.current = state
      setDialogState(state)
    })
  }, [])

  const showFolderDialog = useCallback((startingPath?: string): Promise<string | null> => {
    return new Promise(resolve => {
      const state: FileDialogState = { type: 'folder', resolve, startingPath }
      dialogRef.current = state
      setDialogState(state)
    })
  }, [])

  const closeDialog = useCallback((result?: UnsavedResult | string | null) => {
    const state = dialogRef.current
    if (state && 'resolve' in state) {
      (state.resolve as ResolveFn)(result ?? null)
    }
    dialogRef.current = null
    setDialogState(null)
  }, [])

  return { dialogState, showUnsavedDialog, showSaveDialog, showOpenDialog, showFolderDialog, closeDialog }
}
