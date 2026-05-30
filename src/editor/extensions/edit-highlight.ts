import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export const editHighlightKey = new PluginKey('editHighlight')

export const EditHighlightPlugin = Extension.create({
  name: 'editHighlight',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: editHighlightKey,
        state: {
          init() { return DecorationSet.empty },
          apply(tr, set) {
            const meta = tr.getMeta('editHighlight')
            if (meta === 'clear') return DecorationSet.empty
            if (meta && meta.from !== undefined && meta.to !== undefined) {
              const deco = Decoration.inline(meta.from, meta.to, { class: 'ai-edit-highlight' })
              return DecorationSet.create(tr.doc, [deco])
            }
            return set.map(tr.mapping, tr.doc)
          },
        },
        props: {
          decorations(state) {
            return this.getState(state)
          },
        },
      }),
    ]
  },
})