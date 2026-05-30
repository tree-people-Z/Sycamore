import { useState, useRef, useEffect } from 'react'
import { X, Send, Bot, User, FileDown, Check, Plus } from 'lucide-react'
import { chatCompletionStream } from '../utils/openai'
import { marked } from 'marked'
import mermaid from 'mermaid'
import type { EditorSettings } from '../constants'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AiChatPanelProps {
  onClose: () => void
  getDocumentContent: () => string
  settings: EditorSettings
  insertText: (text: string) => void
  docKey: string
  selectedText: string
  replaceSelection: (text: string) => void
}

function loadChatHistory(key: string): Message[] {
  try {
    const saved = localStorage.getItem(`chat-history-${key}`)
    return saved ? JSON.parse(saved) : []
  } catch { return [] }
}

function saveChatHistory(key: string, msgs: Message[]) {
  try { localStorage.setItem(`chat-history-${key}`, JSON.stringify(msgs)) }
  catch {}
}

const chatHistoryRef = new Map<string, Message[]>()
function setChatHistory(key: string, msgs: Message[]) {
  chatHistoryRef.set(key, msgs)
  if (chatHistoryRef.size > 50) {
    const firstKey = chatHistoryRef.keys().next().value
    if (firstKey !== undefined) chatHistoryRef.delete(firstKey)
  }
}

function renderMarkdown(content: string): string {
  const html = marked.parse(content) as string
  return html.replace(/<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
    `<pre class="mermaid-placeholder">图表加载中...</pre>`)
}

function AiChatPanel({ onClose, getDocumentContent, settings, insertText, docKey, selectedText, replaceSelection }: AiChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>(() => chatHistoryRef.get(docKey) || loadChatHistory(docKey))
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const activeKeyRef = useRef(docKey)
  const mermaidRenderedRef = useRef(false)

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: 'default' })
    mermaidRenderedRef.current = false
  }, [])

  useEffect(() => {
    if (mermaidRenderedRef.current || !listRef.current) return
    const placeholders = listRef.current.querySelectorAll('.mermaid-placeholder')
    if (!placeholders.length) return
    mermaidRenderedRef.current = true
    placeholders.forEach(async (el) => {
      const codeEl = el.previousElementSibling?.querySelector('code.language-mermaid')
      const code = codeEl?.textContent?.trim()
      if (!code) return
      const id = `mermaid-chat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      try {
        const { svg } = await mermaid.render(id, code)
        const parent = el.parentElement
        if (parent) {
          const wrapper = document.createElement('div')
          wrapper.className = 'mermaid-chat-preview'
          wrapper.innerHTML = svg
          parent.replaceChild(wrapper, el)
        }
      } catch {
        el.textContent = '图表渲染失败'
        el.className = 'mermaid-error'
      }
    })
  }, [messages])

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages])

  useEffect(() => {
    saveChatHistory(activeKeyRef.current, messages)
  }, [messages])

  useEffect(() => {
    const prev = activeKeyRef.current
    if (prev !== docKey) {
      saveChatHistory(prev, messages)
      setChatHistory(prev, messages)
      const saved = chatHistoryRef.get(docKey) || loadChatHistory(docKey)
      setMessages(saved)
      activeKeyRef.current = docKey
    }
  }, [docKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const selText = selectedText.trim()
  const hasSelection = selText.length > 0
  const placeholder = !settings.apiKey ? '请先在设置中配置 API Key' : '输入消息，AI 会读取当前文档和选中内容...'

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading || !settings.apiKey) return
    setInput('')
    const userMsg: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])
    try {
      const docStr = getDocumentContent().trim()
      const selStr = selText
      const sysMsg = `你工作在 Sycamore 写作软件中，当前文档（Markdown）：\n"""\n${docStr || '（空文档）'}\n"""`
        + (selStr ? `\n用户选中了以下文字：\n"""\n${selStr}\n"""` : '')
        + (selStr && selStr.length < docStr.length ? `\n注意：用户选中的只是文档的一部分，修改后保持与上下文连贯，不要改动其他部分。` : '')
        + `\n\n【输出铁律】\n\n修改/润色/翻译/改写/续写类请求→只输出最终文本。严禁以下行为：`
        + `\n× 任何前缀说明："这是修改后的版本"、"按照您的要求"、"修改建议"、"好的"、"当然"`
        + `\n× 分段小标题如"修改建议："、"改进版："、"优化后："、"修改结果："`
        + `\n× 用 \`\`\` 代码块包裹输出`
        + `\n× 在原文字上标注修改（不需要对比说明）`
        + `\n× 结尾补充"如果有需要进一步调整"、"希望"、"请告诉我"等无用后缀`
        + `\n→ 从第一个字到最后一个字，就是可直接拿过去用的纯内容。\n\n咨询/分析/总结/续写类请求→正常回答，保持简洁。\n\n如果用户要求生成图表（表格、柱状图、饼图、流程图等），请用 Mermaid 语法输出图表代码，并用 \`\`\`mermaid 代码块包裹。始终使用 Markdown 格式。`
      const allMsgs = [{ role: 'system', content: sysMsg }, ...messages.map(m => ({ role: m.role, content: m.content })), { role: 'user', content: text }]
      let aiContent = ''
      await chatCompletionStream(
        allMsgs as any,
        { baseUrl: settings.apiBaseUrl, apiKey: settings.apiKey, model: settings.apiModel, maxTokens: settings.apiMaxTokens, temperature: settings.apiTemperature },
        (token) => {
          aiContent += token
          setMessages(prev => {
            const next = [...prev]
            next[next.length - 1] = { role: 'assistant', content: aiContent }
            return next
          })
        },
      )
    } catch { setMessages(prev => [...prev, { role: 'assistant', content: '请求失败，请检查 API 设置' }]) }
    setLoading(false)
  }

  const handleNewChat = () => {
    setChatHistory(docKey, [])
    saveChatHistory(docKey, [])
    setMessages([])
  }

  return (
    <div className="w-full h-full bg-[var(--color-surface)] flex flex-col">
      <div className="h-10 flex items-center justify-between px-3 border-b border-[var(--color-border)] flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <Bot size={14} className="text-[var(--color-accent)]" />
          <span className="text-xs font-medium text-[var(--color-text)]">AI 助手</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={handleNewChat}
            className="w-7 h-7 flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] rounded-md transition-colors"
            title="新建对话">
            <Plus size={15} />
          </button>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] rounded-md transition-colors">
            <X size={15} />
          </button>
        </div>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-xs text-[var(--color-text-muted)] text-center pt-6">
            发送消息开始对话，AI 会自动判断是咨询还是改写需求
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-[var(--color-accent-10)]' : 'bg-[var(--color-hover)]'}`}>
              {msg.role === 'user' ? <User size={13} className="text-[var(--color-accent)]" /> : <Bot size={13} className="text-[var(--color-text-secondary)]" />}
            </div>
            <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ai-chat-msg ${
              msg.role === 'user' ? 'ai-chat-user-bg text-white' : 'ai-chat-assistant-bg text-[var(--color-text)]'
            }`}>
              {msg.role === 'assistant'
                ? <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                : msg.content}
              {msg.role === 'assistant' && (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => insertText(msg.content)}
                    className="flex items-center gap-1.5 px-2 py-1 text-[11px] rounded-md bg-[var(--color-accent-10)] text-[var(--color-accent)] hover:opacity-80 transition-opacity">
                    <FileDown size={11} /> 插入
                  </button>
                  <button onClick={() => replaceSelection(msg.content)}
                    className="flex items-center gap-1.5 px-2 py-1 text-[11px] rounded-md bg-green-500/10 text-green-600 dark:text-green-400 hover:opacity-80 transition-opacity">
                    <Check size={11} /> {hasSelection ? '替换选中' : '替换全文'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[var(--color-hover)] flex items-center justify-center flex-shrink-0">
              <Bot size={13} className="text-[var(--color-text-secondary)]" />
            </div>
            <div className="bg-[var(--color-bg)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--color-text-secondary)] flex items-center gap-1">
              <span className="animate-pulse">●</span>
              <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>●</span>
              <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>●</span>
            </div>
          </div>
        )}
      </div>

      {hasSelection && (
        <div className="px-3 py-2 border-t border-[var(--color-border)] bg-[var(--color-accent-10)]/30 border-l-2 border-l-[var(--color-accent)]">
          <p className="text-[11px] text-[var(--color-accent)] truncate flex items-center gap-1.5">
            <span className="font-medium">📝 选中 {selText.length}字</span>
            <span className="text-[var(--color-accent)]/60">&middot;</span>
            <span className="text-[var(--color-accent)]/70">{selText.slice(0, 60)}{selText.length > 60 ? '...' : ''}</span>
          </p>
        </div>
      )}

      <div className="flex-shrink-0 border-t border-[var(--color-border)] p-3">
        <div className="flex gap-2">
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder={placeholder}
            className="flex-1 h-9 px-3 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg outline-none text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] transition-colors" />
          <button onClick={handleSend} disabled={loading || !settings.apiKey}
            className="w-8 h-8 flex items-center justify-center bg-[var(--color-accent)] text-white rounded-lg hover:opacity-80 transition-opacity disabled:opacity-40">
            <Send size={13} />
          </button>
        </div>
        <div className="flex items-center justify-end mt-1.5">
          <p className="text-[9px] text-[var(--color-text-muted)]">{settings.apiKey ? settings.apiModel : '未配置 API'}</p>
        </div>
      </div>
    </div>
  )
}

export default AiChatPanel