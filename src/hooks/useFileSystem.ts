import { useState, useCallback, useEffect, useRef } from 'react'
import type { FolderEntry } from '../types'
import { LINKED_FOLDER_KEY } from '../constants'

export function useFileSystem(showFolderDialog: () => Promise<string | null>) {
  const [folderPath, setFolderPath] = useState<string | null>(null)
  const [folderEntries, setFolderEntries] = useState<FolderEntry[]>([])
  const [linkedFolderPath, setLinkedFolderPath] = useState<string | null>(
    () => localStorage.getItem(LINKED_FOLDER_KEY),
  )
  const pendingLinkRef = useRef(false)

  const loadFolder = useCallback(async (path: string) => {
    const entries = await window.electronAPI?.readDirectoryRecursive(path)
    return entries || []
  }, [])

  useEffect(() => {
    if (linkedFolderPath && !pendingLinkRef.current) {
      loadFolder(linkedFolderPath).then(entries => {
        setFolderPath(linkedFolderPath)
        setFolderEntries(entries)
      })
    }
  }, [linkedFolderPath, loadFolder])

  const handleLinkFolder = useCallback(async () => {
    const result = await showFolderDialog()
    if (result) {
      pendingLinkRef.current = true
      localStorage.setItem(LINKED_FOLDER_KEY, result)
      const entries = await loadFolder(result)
      setLinkedFolderPath(result)
      setFolderPath(result)
      setFolderEntries(entries)
      pendingLinkRef.current = false
    }
  }, [showFolderDialog, loadFolder])

  const handleUnlinkFolder = useCallback(() => {
    localStorage.removeItem(LINKED_FOLDER_KEY)
    setLinkedFolderPath(null)
    setFolderPath(null)
    setFolderEntries([])
  }, [])

  const handleRefreshFolder = useCallback(async () => {
    if (!linkedFolderPath) return
    const entries = await loadFolder(linkedFolderPath)
    setFolderEntries(entries)
  }, [linkedFolderPath, loadFolder])

  return {
    folderPath,
    folderEntries,
    linkedFolderPath,
    setFolderEntries,
    setFolderPath,
    handleLinkFolder,
    handleUnlinkFolder,
    handleRefreshFolder,
  }
}
