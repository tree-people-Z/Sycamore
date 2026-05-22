import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import tippy from 'tippy.js'
import type { Instance } from 'tippy.js'

import type { Editor } from '@tiptap/react'

export interface SlashMenuItem {
  title: string
  description: string
  icon?: string
  command: ({ editor, range }: { editor: Editor; range: { from: number; to: number } }) => void
}

export interface SlashMenuOptions {
  items: SlashMenuItem[]
  onShow?: () => void
  onHide?: () => void
}

export const SlashMenu = Extension.create<SlashMenuOptions>({
  name: 'slashMenu',

  addOptions() {
    return {
      items: [],
    }
  },

  addProseMirrorPlugins() {
    const editor = this.editor
    let popup: Instance | null = null
    let isActive = false

    const renderMenu = (from: number) => {
      if (popup) popup.destroy()

      const container = document.createElement('div')
      container.className = 'slash-menu'

      this.options.items.forEach((item) => {
        const btn = document.createElement('button')
        btn.className = 'slash-menu-item'
        btn.innerHTML = `<span>${item.icon || ''} ${item.title}</span><small>${item.description}</small>`
        btn.addEventListener('mousedown', (e) => {
          e.preventDefault()
          item.command({
            editor,
            range: { from, to: editor.state.selection.from },
          })
          editor.commands.focus()
          if (popup) popup.destroy()
          isActive = false
        })
        container.appendChild(btn)
      })

      popup = tippy('body', {
        content: container,
        placement: 'bottom-start',
        trigger: 'manual',
        interactive: true,
        showOnCreate: true,
        appendTo: document.body,
        onHidden: () => {
          isActive = false
          popup?.destroy()
          popup = null
        },
      })[0]
    }

    return [
      new Plugin({
        key: new PluginKey('slashMenu'),
        props: {
          handleKeyDown(_view, event) {
            if (isActive && event.key === 'Escape') {
              popup?.hide()
              isActive = false
              return true
            }
            if (isActive && event.key === 'Enter') {
              return true
            }
            return false
          },
        },
        view() {
          return {
            update(updatedView) {
              const { selection } = updatedView.state
              const { $from } = selection
              const pos = $from.pos

              const textBefore = updatedView.state.doc.textBetween(Math.max(0, pos - 50), pos)
              const slashMatch = textBefore.match(/\/(\w*)$/)

              if (slashMatch && selection.empty) {
                const from = pos - slashMatch[0].length
                if (!isActive) {
                  isActive = true
                  renderMenu(from)
                }
              } else {
                if (isActive) {
                  popup?.hide()
                  isActive = false
                }
              }
            },
            destroy() {
              if (popup) popup.destroy()
              popup = null
              isActive = false
            },
          }
        },
      }),
    ]
  },
})