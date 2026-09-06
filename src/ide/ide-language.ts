import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { json } from '@codemirror/lang-json'
import { markdown } from '@codemirror/lang-markdown'
import { StreamLanguage, HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { c, cpp, java, csharp, kotlin, scala } from '@codemirror/legacy-modes/mode/clike'
import { go } from '@codemirror/legacy-modes/mode/go'
import { rust } from '@codemirror/legacy-modes/mode/rust'
import { shell } from '@codemirror/legacy-modes/mode/shell'
import { yaml } from '@codemirror/legacy-modes/mode/yaml'
import { lua } from '@codemirror/legacy-modes/mode/lua'
import { ruby } from '@codemirror/legacy-modes/mode/ruby'
import { standardSQL } from '@codemirror/legacy-modes/mode/sql'
import { xml } from '@codemirror/legacy-modes/mode/xml'
import type { Extension } from '@codemirror/state'

/** IDE 文件树展示的扩展名白名单（不含点，小写） */
export const CODE_FILE_EXTENSIONS = [
  'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs',
  'py', 'html', 'htm', 'css', 'scss', 'less',
  'json', 'md', 'markdown',
  'c', 'h', 'cpp', 'cc', 'hpp', 'java', 'cs', 'kt', 'scala',
  'go', 'rs', 'sh', 'bash', 'zsh', 'yaml', 'yml',
  'xml', 'sql', 'lua', 'rb', 'toml', 'ini',
]

const EXT_LANGUAGE: Record<string, string> = {
  js: 'javascript', jsx: 'javascript', mjs: 'javascript', cjs: 'javascript',
  ts: 'typescript', tsx: 'typescript',
  py: 'python',
  html: 'html', htm: 'html',
  css: 'css', scss: 'css', less: 'css',
  json: 'json',
  md: 'markdown', markdown: 'markdown',
  c: 'c', h: 'c', cpp: 'cpp', cc: 'cpp', hpp: 'cpp',
  java: 'java', cs: 'csharp', kt: 'kotlin', scala: 'scala',
  go: 'go', rs: 'rust',
  sh: 'shell', bash: 'shell', zsh: 'shell',
  yaml: 'yaml', yml: 'yaml',
  xml: 'xml', sql: 'sql', lua: 'lua', rb: 'ruby',
}

/** 扩展名 → 语言标识；无语言支持（纯文本）返回 null */
export function fileLanguageId(fileName: string): string | null {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  if (!ext || !fileName.includes('.')) return null
  return EXT_LANGUAGE[ext] ?? null
}

const STREAM_LANGUAGES: Record<string, () => StreamLanguage<unknown>> = {
  c: () => StreamLanguage.define(c),
  cpp: () => StreamLanguage.define(cpp),
  java: () => StreamLanguage.define(java),
  csharp: () => StreamLanguage.define(csharp),
  kotlin: () => StreamLanguage.define(kotlin),
  scala: () => StreamLanguage.define(scala),
  go: () => StreamLanguage.define(go),
  rust: () => StreamLanguage.define(rust),
  shell: () => StreamLanguage.define(shell),
  yaml: () => StreamLanguage.define(yaml),
  lua: () => StreamLanguage.define(lua),
  ruby: () => StreamLanguage.define(ruby),
  sql: () => StreamLanguage.define(standardSQL),
  xml: () => StreamLanguage.define(xml),
}

/** 文件名 → CodeMirror 语言扩展；无匹配返回 []（纯文本） */
export function getLanguageSupport(fileName: string): Extension[] {
  const lang = fileLanguageId(fileName)
  if (!lang) return []
  switch (lang) {
    case 'javascript': return [javascript({ jsx: true })]
    case 'typescript': return [javascript({ jsx: true, typescript: true })]
    case 'python': return [python()]
    case 'html': return [html()]
    case 'css': return [css()]
    case 'json': return [json()]
    case 'markdown': return [markdown()]
    default: {
      const stream = STREAM_LANGUAGES[lang]
      return stream ? [stream()] : []
    }
  }
}

/** 语法高亮配色：引用 --ide-* CSS 变量，自动跟随三套主题 */
const ideHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: 'var(--ide-kw)' },
  { tag: [t.controlKeyword, t.moduleKeyword], color: 'var(--ide-kw)', fontStyle: 'italic' },
  { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: 'var(--ide-var)' },
  { tag: [t.function(t.variableName), t.labelName], color: 'var(--ide-fn)' },
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: 'var(--ide-num)' },
  { tag: [t.definition(t.name), t.separator], color: 'var(--ide-var)' },
  { tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.self, t.namespace], color: 'var(--ide-type)' },
  { tag: [t.operator, t.operatorKeyword], color: 'var(--ide-op)' },
  { tag: [t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: 'var(--ide-str)' },
  { tag: [t.meta, t.comment], color: 'var(--ide-com)', fontStyle: 'italic' },
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: t.heading, fontWeight: 'bold', color: 'var(--ide-fn)' },
  { tag: [t.atom, t.bool, t.special(t.variableName)], color: 'var(--ide-num)' },
  { tag: t.processingInstruction, color: 'var(--ide-com)' },
  { tag: t.string, color: 'var(--ide-str)' },
  { tag: t.invalid, color: 'var(--ide-kw)' },
])

export const ideHighlight = syntaxHighlighting(ideHighlightStyle)
