import { Node, mergeAttributes, nodeInputRule } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

export interface MathInlineOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mathInline: {
      setMathInline: (tex: string) => ReturnType
    }
  }
}

export const MathInline = Node.create<MathInlineOptions>({
  name: 'mathInline',

  group: 'inline',

  inline: true,

  atom: true,

  addOptions() {
    return { HTMLAttributes: {} }
  },

  addAttributes() {
    return {
      tex: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-math-inline]' }]
  },

  renderHTML({ node }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, { 'data-math-inline': node.attrs.tex })]
  },

  addCommands() {
    return {
      setMathInline: (tex: string) => ({ commands }) => {
        return commands.insertContent({ type: this.name, attrs: { tex } })
      },
    }
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: /(?<=^|[^$])\$(.+?)\$(?=[^$]|$)/s,
        type: this.type,
        getAttributes: (match) => {
          const tex = match[1]
          if (!tex || !tex.trim()) return null
          return { tex: tex.trim() }
        },
      }),
    ]
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('mathInlinePaste'),
        props: {
          transformPastedText: (text) => {
            return text.replace(/\$(.+?)\$/g, (_match: string, tex: string) => {
              if (/[\\^{}_]/.test(tex)) return tex
              return _match
            })
          },
        },
      }),
    ]
  },
})
