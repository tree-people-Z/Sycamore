import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Send, Bot, User, FileDown, Check, Plus, Square, RefreshCw, Sparkles, Trash2, ChevronDown } from 'lucide-react'
import { chatCompletionStream } from '../utils/openai'
import { marked } from 'marked'
import mermaid from 'mermaid'
import type { EditorSettings } from '../constants'
import { useConversations, type Message } from '../hooks/useConversations'
import { estimateTokens } from '../utils/token-counter'
import { condenseMessages, getCondensableMessages } from '../utils/condense'

interface AiChatPanelProps {
  onClose: () => void
  getDocumentContent: () => string
  settings: EditorSettings
  insertText: (text: string) => void
  docKey: string
  selectedText: string
  replaceSelection: (text: string) => void
}

const QUICK_ACTIONS = [
  { label: '润色', prompt: '请润色这段文字，使其表达更流畅、专业，保持原意不变' },
  { label: '续写', prompt: '请根据上文自然地续写下一段，保持风格一致' },
  { label: '总结', prompt: '请用简洁的语言总结这段文字的核心内容' },
  { label: '翻译', prompt: '请将这段文字翻译成英文' },
  { label: '简化', prompt: '请用更简单通俗的语言重新表达这段文字' },
]

const CONTEXT_LIMIT = 128000

function renderMarkdown(content: string): string {
  const html = marked.parse(content) as string
  return html.replace(/<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
    (_, code) => `<div class="mermaid-block" data-mermaid="${encodeURIComponent(code)}">图表加载中...</div>`)
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${Math.floor(diff / 86400000)}天前`
}

function AiChatPanel({ onClose, getDocumentContent, settings, insertText, selectedText, replaceSelection, docKey }: AiChatPanelProps) {
  const {
    index: conversations,
    activeId,
    getActive,
    create: createConv,
    switchTo,
    del: deleteConv,
    addMessage,
    updateLastMessage,
    setCondensedUntil,
    rename,
  } = useConversations(docKey)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showConvList, setShowConvList] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const convListRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastUserMsgRef = useRef('')
  const condenseLockRef = useRef(false)
  const [inputTokens, setInputTokens] = useState(0)
  const [outputTokens, setOutputTokens] = useState(0)
  const activeConvRef = useRef(activeId)
  const [editingTitle, setEditingTitle] = useState(false)
  const [editTitleValue, setEditTitleValue] = useState('')

  useEffect(() => { activeConvRef.current = activeId }, [activeId])

  useEffect(() => {
    const conv = getActive()
    setMessages(conv?.messages || [])
    setInputTokens(0)
    setOutputTokens(0)
  }, [activeId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (convListRef.current && !convListRef.current.contains(e.target as Node)) {
        setShowConvList(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // mermaid rendering in chat messages
  useEffect(() => {
    if (!listRef.current) return
    const blocks = listRef.current.querySelectorAll('.mermaid-block[data-mermaid]')
    blocks.forEach(async (el) => {
      const raw = el.getAttribute('data-mermaid') || ''
      const code = decodeURIComponent(raw)
      el.removeAttribute('data-mermaid')
      if (!code.trim()) return
      const id = `mermaid-chat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      try {
        const { svg } = await mermaid.render(id, code)
        el.innerHTML = svg
        el.className = 'mermaid-chat-preview'
      } catch { el.innerHTML = `<pre class="mermaid-error">${code}</pre>` }
    })
  }, [messages])

  // background message condensation
  useEffect(() => {
    if (!settings.enableCondense || messages.length < 3 || condenseLockRef.current) return
    const activeConv = getActive()
    if (!activeConv) return
    const indices = getCondensableMessages(messages, activeConv.condensedUntil, settings.keepLatestCount)
    if (indices.length === 0) return
    condenseLockRef.current = true
    condenseMessages(messages, indices, settings, (idx, summary) => {
      messages[idx] = { ...messages[idx], condensedContent: summary }
      setMessages([...messages])
    }).then(() => {
      condenseLockRef.current = false
      if (indices.length > 0) {
        setCondensedUntil(activeConv.id, indices[indices.length - 1])
      }
    })
  }, [messages, settings.enableCondense, settings.keepLatestCount]) // eslint-disable-line react-hooks/exhaustive-deps

  const selText = selectedText.trim()
  const hasSelection = selText.length > 0
  const placeholder = !settings.apiKey ? '请先在设置中配置 API Key' : '提问、润色、翻译、续写、生成图表…'
  const totalTokens = inputTokens + outputTokens
  const nearLimit = totalTokens > CONTEXT_LIMIT * 0.8
  const activeConv = getActive()

  const buildMessagesForAI = useCallback((msgs: Message[], conv: typeof activeConv, isRetry: boolean): any[] => {
    const result: any[] = []
    const len = isRetry ? msgs.length - 1 : msgs.length
    for (let i = 0; i < len; i++) {
      const m = msgs[i]
      if (!isRetry && conv && i <= conv.condensedUntil && m.condensedContent) {
        result.push({ role: m.role, content: `[已压缩] ${m.condensedContent}` })
      } else if (m.condensedContent) {
        result.push({ role: m.role, content: m.condensedContent })
      } else {
        result.push({ role: m.role, content: m.content })
      }
    }
    return result
  }, [])

  const sendMessage = useCallback(async (userText: string, isRetry: boolean) => {
    if (!userText || !settings.apiKey) return

    let currentConvId = activeConvRef.current
    const conv = currentConvId ? getActive() : null
    if (!currentConvId || (conv && conv.docKey !== docKey) || (currentConvId && !conv)) {
      const newConv = createConv(docKey)
      currentConvId = newConv.id
      switchTo(newConv.id)
    }

    let updatedMessages: Message[]
    if (!isRetry) {
      lastUserMsgRef.current = userText
      updatedMessages = [...messages, { role: 'user', content: userText }]
      setMessages(updatedMessages)
      addMessage(currentConvId, { role: 'user', content: userText })
    } else {
      updatedMessages = messages
    }

    updatedMessages = [...updatedMessages, { role: 'assistant', content: '' }]
    setMessages(updatedMessages)
    addMessage(currentConvId, { role: 'assistant', content: '' })
    setLoading(true)
    const abort = new AbortController()
    abortRef.current = abort

    try {
      const docStr = getDocumentContent().trim()
      const contextMsg = `当前文档（Markdown）：\n"""\n${docStr || '（空文档）'}\n"""`
      const selMsg = selText ? `\n用户选中了以下文字：\n"""\n${selText}\n"""` : ''
      const rules = `\n\n【输出铁律】\n\n修改/润色/翻译/改写/续写类请求→只输出最终文本。严禁以下行为：`
        + `\n× 任何前缀说明、分段小标题、\`\`\` 代码块包裹、对比说明、无用后缀`
        + `\n→ 从第一个字到最后一个字，就是可直接拿过去用的纯内容。`
        + `\n\n如果用户要求生成图表，请用 Mermaid 语法输出图表代码，用 \`\`\`mermaid 代码块包裹。`
        + `\n咨询/分析/总结/续写类请求→正常回答，保持简洁。始终使用 Markdown 格式。`
      const sysMsg = `你工作在 Sycamore 写作软件中。${contextMsg}${selMsg}${rules}`

      const activeConv = getActive()
      const allMsgs: any[] = [{ role: 'system', content: sysMsg }]
      allMsgs.push(...buildMessagesForAI(updatedMessages, activeConv, isRetry))
      allMsgs.push({ role: 'user', content: userText })

      const inputTokenCount = estimateTokens(sysMsg) + updatedMessages.reduce((s, m) => s + estimateTokens(m.content), 0) + estimateTokens(userText)
      setInputTokens(prev => Math.max(prev, inputTokenCount))

      let aiContent = ''
      await chatCompletionStream(allMsgs, {
        baseUrl: settings.apiBaseUrl, apiKey: settings.apiKey, model: settings.apiModel,
        maxTokens: settings.apiMaxTokens, temperature: settings.apiTemperature,
      }, (token) => {
        aiContent += token
        setOutputTokens(estimateTokens(aiContent))
        setMessages(prev => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: aiContent }
          return next
        })
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        saveTimerRef.current = setTimeout(() => updateLastMessage(currentConvId, aiContent), 500)
      }, abort.signal)
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      updateLastMessage(currentConvId, aiContent)
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setMessages([...updatedMessages.slice(0, -1), { role: 'assistant', content: '请求失败，请检查 API 设置' }])
      }
    }
    setLoading(false)
    abortRef.current = null
  }, [messages, settings, docKey, selText, getActive, createConv, switchTo, addMessage, updateLastMessage, getDocumentContent, buildMessagesForAI])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text || loading || !settings.apiKey) return
    setInput('')
    sendMessage(text, false)
  }, [input, loading, settings.apiKey, sendMessage])

  const handleStop = useCallback(() => {
    abortRef.current?.abort()
    setLoading(false)
  }, [])

  const handleRegenerate = useCallback(() => {
    if (!lastUserMsgRef.current || messages.length < 2) return
    setMessages(prev => prev.slice(0, -1))
    sendMessage(lastUserMsgRef.current, true)
  }, [messages.length, sendMessage])

  const handleQuickAction = useCallback((prompt: string) => {
    const fullPrompt = hasSelection ? `${prompt}：\n"""\n${selText}\n"""` : prompt
    setInput(fullPrompt)
  }, [hasSelection, selText])

  const handleNewChat = useCallback(() => {
    createConv(docKey)
    setShowConvList(false)
  }, [createConv, docKey])

  const handleDeleteConv = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    deleteConv(id)
  }, [deleteConv])

  const handleSelectConv = useCallback((id: string) => {
    switchTo(id)
    setShowConvList(false)
  }, [switchTo])

  const handleRename = useCallback((title: string) => {
    rename(activeId, title.trim() || activeConv?.title || '对话')
    setEditingTitle(false)
  }, [activeId, activeConv?.title, rename])

  return (
    <div className="w-full h-full bg-[var(--color-surface)] flex flex-col">
      <div className="h-10 flex items-center gap-1 px-3 border-b border-[var(--color-border)] flex-shrink-0">
        <div className="relative flex-1" ref={convListRef}>
          <button
            onClick={() => setShowConvList(v => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-hover)] rounded-md px-2 py-1 transition-colors max-w-[240px]"
          >
            <Bot size={14} className="text-[var(--color-accent)] flex-shrink-0" />
            {editingTitle ? (
              <input autoFocus
                className="bg-transparent border-b border-[var(--color-accent)] outline-none text-xs font-medium w-24"
                value={editTitleValue}
                onChange={e => setEditTitleValue(e.target.value)}
                onBlur={() => handleRename(editTitleValue)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleRename(editTitleValue)
                  if (e.key === 'Escape') setEditingTitle(false)
                }}
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span className="truncate" onDoubleClick={() => { setEditTitleValue(activeConv?.title || ''); setEditingTitle(true) }}>
                {activeConv?.title || 'AI 助手'}
              </span>
            )}
            <ChevronDown size={12} className="text-[var(--color-text-muted)] flex-shrink-0" />
          </button>
          {showConvList && (
             <div className="absolute top-full left-0 mt-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl z-50 min-w-[200px] max-h-[300px] overflow-y-auto conv-list-dropdown">
              <div className="py-1">
                {conversations.map(c => (
                  <div key={c.id} onClick={() => handleSelectConv(c.id)}
                    className={`group flex items-center gap-2 px-3 py-2 text-xs cursor-pointer transition-colors ${c.id === activeId ? 'bg-[var(--color-accent-10)] text-[var(--color-accent)]' : 'text-[var(--color-text)] hover:bg-[var(--color-hover)]'}`}>
                    <Bot size={12} className="flex-shrink-0 opacity-60" />
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{c.title}</div>
                      <div className="text-[10px] text-[var(--color-text-muted)]">{timeAgo(c.updatedAt)}</div>
                    </div>
                    {conversations.length > 1 && (
                      <button onClick={(e) => handleDeleteConv(e, c.id)}
                        className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity flex-shrink-0">
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="border-t border-[var(--color-border)]">
                <button onClick={handleNewChat}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-hover)] transition-colors rounded-b-lg">
                  <Plus size={12} /> 新建对话
                </button>
              </div>
            </div>
          )}
        </div>
        <button onClick={onClose}
          className="w-7 h-7 flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] rounded-md transition-colors ml-auto">
          <X size={15} />
        </button>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-xs text-[var(--color-text-muted)] text-center pt-6">发送消息开始对话 · 支持提问、润色、翻译、续写、生成图表等</p>
        )}
        {messages.map((msg, i) => {
          const isLastAI = msg.role === 'assistant' && i === messages.length - 1 && !loading
          return (
          <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-[var(--color-accent-10)]' : 'bg-[var(--color-hover)]'}`}>
              {msg.role === 'user' ? <User size={13} className="text-[var(--color-accent)]" /> : <Bot size={13} className="text-[var(--color-text-secondary)]" />}
            </div>
            <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ai-chat-msg ${msg.role === 'user' ? 'ai-chat-user-bg text-white' : 'ai-chat-assistant-bg text-[var(--color-text)]'}`}>
              {msg.condensedContent && msg.content.length === 0 ? (
                <span className="text-[var(--color-text-muted)] italic text-xs">[已压缩] {msg.condensedContent}</span>
              ) : msg.role === 'assistant' ? (
                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
              ) : (
                msg.content
              )}
              {msg.role === 'assistant' && msg.content && (
                <div className="flex items-center gap-1.5 mt-2">
                  <button onClick={() => insertText(msg.content)} className="flex items-center gap-1.5 px-2 py-1 text-[11px] rounded-md bg-[var(--color-accent-10)] text-[var(--color-accent)] hover:opacity-80 transition-opacity">
                    <FileDown size={11} /> 插入
                  </button>
                  <div className="flex-1" />
                  {isLastAI && (
                    <button onClick={handleRegenerate} className="flex items-center gap-1.5 px-2 py-1 text-[11px] rounded-md bg-[var(--color-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
                      <RefreshCw size={11} /> 重新生成
                    </button>
                  )}
                  <div className="w-px h-4 bg-[var(--color-border)]" />
                  <button onClick={() => replaceSelection(msg.content)} className="flex items-center gap-1.5 px-2 py-1 text-[11px] rounded-md bg-green-500/10 text-green-600 dark:text-green-400 hover:opacity-80 transition-opacity">
                    <Check size={11} /> {hasSelection ? '替换选中' : '替换全文'}
                  </button>
                </div>
              )}
            </div>
          </div>
          )
        })}

        {loading && (
          <div className="flex gap-2.5 items-center">
            <div className="w-7 h-7 rounded-full bg-[var(--color-hover)] flex items-center justify-center flex-shrink-0">
              <Bot size={13} className="text-[var(--color-text-secondary)]" />
            </div>
            <div className="flex items-center gap-1">
              <span className="ai-typing-dot" />
              <span className="ai-typing-dot" />
              <span className="ai-typing-dot" />
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

      <div className="flex-shrink-0 px-3 pt-2">
        <div className="flex gap-1.5 flex-wrap">
          {QUICK_ACTIONS.map(a => (
            <button key={a.label} onClick={() => handleQuickAction(a.prompt)}
              className={`px-2 py-1 text-[10px] rounded-md border transition-colors ${hasSelection ? 'text-[var(--color-accent)] border-[var(--color-accent)]/30 hover:bg-[var(--color-accent-10)]' : 'text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-[var(--color-accent)]'}`}>
              <Sparkles size={10} className="inline mr-0.5" />{a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-shrink-0 border-t border-[var(--color-border)] p-3 pt-2">
        <div className="flex gap-2">
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder={placeholder}
            className="flex-1 h-9 px-3 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg outline-none text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] transition-colors" />
          {loading ? (
            <button onClick={handleStop}
              className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-lg hover:opacity-80 transition-opacity">
              <Square size={13} />
            </button>
          ) : (
            <button onClick={handleSend} disabled={!settings.apiKey}
              className="w-8 h-8 flex items-center justify-center bg-[var(--color-accent)] text-white rounded-lg hover:opacity-80 transition-opacity disabled:opacity-40">
              <Send size={13} />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between mt-1">
          {nearLimit && <p className="text-[9px] text-amber-500">⚠ 接近上下文限制</p>}
          <p className="text-[9px] text-[var(--color-text-muted)] ml-auto">
            {settings.apiKey ? `${settings.apiModel} · ${totalTokens.toLocaleString()} tokens` : '未配置 API'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default AiChatPanel