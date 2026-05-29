import UnsavedDialog from './UnsavedDialog'
import type { DialogState, UnsavedResult } from '../hooks/useDialogs'

interface DialogsProps {
  dialogState: DialogState | null
  onSaveCurrent: () => Promise<void>
  onClose: (result?: UnsavedResult | null) => void
}

function Dialogs({ dialogState, onSaveCurrent, onClose }: DialogsProps) {
  if (!dialogState) return null

  return (
    <UnsavedDialog
      onSave={async () => { await onSaveCurrent(); onClose('save') }}
      onDiscard={() => onClose('discard')}
      onCancel={() => onClose('cancel')}
    />
  )
}

export default Dialogs