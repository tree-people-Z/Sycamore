import { memo } from 'react'
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
      onSave={async () => {
        // 保存失败时按取消处理，避免把失败当成已保存而丢失内容
        let ok = false
        try { ok = (await onSaveCurrent()) ?? false } catch { /* ignore */ }
        onClose(ok ? 'save' : 'cancel')
      }}
      onDiscard={() => onClose('discard')}
      onCancel={() => onClose('cancel')}
    />
  )
}

export default memo(Dialogs)