import { Node, mergeAttributes, nodeInputRule } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

export interface WikiLinkOptions {
  HTMLAttributes: Record<string, unknown>
  onNavigate?: (pageName: string) => void
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    wikiLink: {
      setWikiLink: (pageName: string) => ReturnType
    }
  }
}

export const WikiLink = Node.create<WikiLinkOptions>({
  name: 'wikiLink',

  group: 'inline',

  inline: true,

  atom: true,

  addOptions() {
    return { HTMLAttributes: {} }
  },

  addAttributes() {
    return {
      pageName: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'a[data-wiki-link]' }]
  },

  renderHTML({ node }) {
    return [
      'a',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-wiki-link': node.attrs.pageName,
        href: `#/page/${encodeURIComponent(node.attrs.pageName)}`,
        class: 'wiki-link',
      }),
      node.attrs.pageName,
    ]
  },

  addCommands() {
    return {
      setWikiLink: (pageName: string) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: { pageName },
        })
      },
    }
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: /\[\[([^\]]+)\]\]/s,
        type: this.type,
        getAttributes: (match) => {
          const pageName = match[1]
          if (!pageName || !pageName.trim()) return null
          return { pageName: pageName.trim() }
        },
      }),
    ]
  },

  addProseMirrorPlugins() {
    const onNavigate = this.options.onNavigate
    return [
      new Plugin({
        key: new PluginKey('wikiLinkClick'),
        props: {
          handleClick: (_view, _pos, event) => {
            const target = event.target as HTMLElement
            const linkEl = target.closest?.('[data-wiki-link]') as HTMLElement | null
            if (linkEl && onNavigate) {
              const pageName = linkEl.getAttribute('data-wiki-link') || ''
              onNavigate(pageName)
              return true
            }
            return false
          },
        },
      }),
    ]
  },
})
