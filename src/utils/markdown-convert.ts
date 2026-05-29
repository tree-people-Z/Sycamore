import { generateJSON } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import TextAlign from '@tiptap/extension-text-align'
import { common, createLowlight } from 'lowlight'
import { MathInline } from '../editor/extensions/math-inline'
import { MathBlock } from '../editor/extensions/math-block'
import { WikiLink } from '../editor/extensions/wiki-link'
import { CustomImage } from '../editor/extensions/image-extension'
import { marked } from 'marked'

const lowlight = createLowlight(common)

const extensions = [
  StarterKit.configure({ heading: { levels: [1, 2, 3, 4, 5, 6] }, codeBlock: false, link: false, underline: false }),
  Underline,
  Highlight.configure({ multicolor: true }),
  Link,
  Table.configure({ resizable: true }),
  TableRow, TableCell, TableHeader,
  CodeBlockLowlight.configure({ lowlight }),
  TextStyle, Color,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  MathInline, MathBlock, CustomImage, WikiLink,
]

export async function batchConvertMd(markdown: string): Promise<Record<string, unknown>> {
  const html = await marked.parse(markdown)
  return generateJSON(html, extensions) as Record<string, unknown>
}