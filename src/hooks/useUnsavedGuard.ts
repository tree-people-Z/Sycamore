import { useCallback } from 'react'
import type { UnsavedResult } from './useDialogs'

export function useUnsavedGuard(
  getModified: () => boolean,
  saveFile: () => Promise<void>,
  showUnsavedDialog: () => Promise<UnsavedResult>,
) {
  const confirmUnsaved = useCallback(async (): Promise<boolean> => {
    if (!getModified()) return true
    const action = await showUnsavedDialog()
    if (action === 'cancel') return false
    if (action === 'save') await saveFile()
    return true
  }, [getModified, saveFile, showUnsavedDialog])

  return confirmUnsaved
}
