import UnsavedDialog from './UnsavedDialog'
import FilePicker from './FilePicker'
import type { AnyDialogState, FileDialogState, UnsavedResult } from '../hooks/useDialogs'

interface DialogsProps {
  dialogState: AnyDialogState | null
  onSaveCurrent: () => Promise<void>
  onClose: (result?: UnsavedResult | string | null) => void
}

function Dialogs({ dialogState, onSaveCurrent, onClose }: DialogsProps) {
  if (!dialogState) return null

  if (dialogState.type === 'unsaved') {
    return (
      <UnsavedDialog
        onSave={async () => { await onSaveCurrent(); onClose('save' as UnsavedResult) }}
        onDiscard={() => onClose('discard' as UnsavedResult)}
        onCancel={() => onClose('cancel' as UnsavedResult)}
      />
    )
  }

  const fileState = dialogState as FileDialogState
  return (
    <FilePicker
      mode={fileState.type}
      defaultName={fileState.defaultName}
      startingPath={fileState.startingPath}
      onSelect={(path) => onClose(path)}
      onClose={() => onClose(null)}
    />
  )
}

export default Dialogs
