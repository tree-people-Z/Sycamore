import { Image } from '@tiptap/extension-image'

export const CustomImage = Image.extend({
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: '' },
      title: { default: null },
      width: { default: null },
      height: { default: null },
    }
  },

  renderHTML({ node }) {
    const attrs: Record<string, string> = {
      src: node.attrs.src,
      alt: node.attrs.alt || '',
    }
    if (node.attrs.title) attrs.title = node.attrs.title
    if (node.attrs.width) attrs.width = node.attrs.width
    if (node.attrs.height) attrs.height = node.attrs.height
    return ['img', attrs]
  },
})
