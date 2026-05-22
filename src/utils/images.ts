import type { Editor } from '@tiptap/core'

export function handleImageFile(
  file: File,
  editor: Editor,
  insert: (editor: Editor, dataUrl: string, name: string) => void,
) {
  if (!file.type.startsWith('image/')) return
  const reader = new FileReader()
  reader.onload = () => {
    const dataUrl = reader.result as string
    insert(editor, dataUrl, file.name)
  }
  reader.readAsDataURL(file)
}

export function insertImage(editor: Editor, src: string, alt = '') {
  editor.chain().focus().setImage({ src, alt }).run()
}

export function hasImageItems(items: DataTransferItemList): boolean {
  return Array.from(items).some(item => item.type.startsWith('image/'))
}

export function getImageFiles(files: FileList): File[] {
  return Array.from(files).filter(f => f.type.startsWith('image/'))
}
