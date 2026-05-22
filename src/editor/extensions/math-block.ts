import { Node, mergeAttributes, nodeInputRule } from '@tiptap/core'

export interface MathBlockOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mathBlock: {
      setMathBlock: (tex: string) => ReturnType
    }
  }
}

export const MathBlock = Node.create<MathBlockOptions>({
  name: 'mathBlock',

  group: 'block',

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
    return [{ tag: 'div[data-math-block]' }]
  },

  renderHTML({ node }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, { 'data-math-block': node.attrs.tex })]
  },

  addCommands() {
    return {
      setMathBlock: (tex: string) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: { tex },
        })
      },
    }
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: /\$\$([\s\S]*?)\$\$/s,
        type: this.type,
        getAttributes: (match) => {
          const tex = match[1]
          if (!tex || !tex.trim()) return null
          return { tex: tex.trim() }
        },
      }),
    ]
  },
})
