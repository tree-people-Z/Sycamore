import { useCallback, useEffect } from 'react'

export interface FileActionEntry {
  path: string
  name: string
  isDirectory: boolean
}

interface UseFileActionsOptions {
  onRefresh?: () => void
}

export function useContextMenuDismiss(
  contextMenu: unknown,
  onClose: () => void,
) {
  useEffect(() => {
    if (!contextMenu) return
    const dismiss = () => onClose()
    document.addEventListener('click', dismiss)
    document.addEventListener('scroll', dismiss, true)
    return () => {
      document.removeEventListener('click', dismiss)
      document.removeEventListener('scroll', dismiss, true)
    }
  }, [contextMenu, onClose])
}

export function useFileActions({ onRefresh }: UseFileActionsOptions) {
  const handleDelete = useCallback(async (entry: FileActionEntry) => {
    const name = entry.name.replace(/\.json$/i, '')
    if (entry.isDirectory) {
      const count = await window.electronAPI?.countDirectoryContents(entry.path) ?? 0
      if (count > 0 && !window.confirm(`文件夹"${name}"包含 ${count} 个文件，确定移到回收站吗？`)) return
    } else if (!window.confirm(`确定要删除"${name}"吗？`)) return
    await window.electronAPI?.deleteEntry(entry.path)
    onRefresh?.()
  }, [onRefresh])

  const handleRename = useCallback(async (entry: FileActionEntry) => {
    const oldName = entry.name.replace(/\.json$/i, '')
    const newName = window.prompt('输入新名称：', oldName)
    if (!newName || newName === oldName) return
    const dir = entry.path.replace(/[/\\][^/\\]+$/, '')
    const newPath = dir + '\\' + newName + (entry.isDirectory ? '' : '.json')
    await window.electronAPI?.renameEntry(entry.path, newPath)
    onRefresh?.()
  }, [onRefresh])

  const handleOpenFolder = useCallback(async (entry: FileActionEntry) => {
    await window.electronAPI?.openInExplorer(entry.path)
  }, [])

  const handleCopyPath = useCallback((entry: FileActionEntry) => {
    navigator.clipboard.writeText(entry.path)
  }, [])

  return { handleDelete, handleRename, handleOpenFolder, handleCopyPath }
}
