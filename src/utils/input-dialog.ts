import { emit, on } from './emitter'

export interface InputDialogRequest {
  title: string
  defaultValue?: string
  resolve: (value: string | null) => void
}

/**
 * 全局输入对话框（Electron 不支持 window.prompt，调用会直接抛异常）。
 * 需要 App 中挂载 <GlobalInputDialog /> 来承载。
 */
export function showInputDialog(title: string, defaultValue = ''): Promise<string | null> {
  return new Promise(resolve => {
    emit('show-input-dialog', { title, defaultValue, resolve })
  })
}

export function onInputDialog(handler: (req: InputDialogRequest) => void): () => void {
  return on('show-input-dialog', (...args: unknown[]) => handler(args[0] as InputDialogRequest))
}
