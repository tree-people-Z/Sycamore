import { useState, useCallback, useRef, useEffect } from 'react'

export interface Message {
  role: 'user' | 'assistant'
  content: string
  condensedContent?: string
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
  condensedUntil: number
  docKey: string
}

const INDEX_KEY = 'conversations-index'

interface IndexEntry { id: string; title: string; updatedAt: number; docKey: string }

function loadIndex(): IndexEntry[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveIndex(list: IndexEntry[]) {
  try { localStorage.setItem(INDEX_KEY, JSON.stringify(list)) } catch {}
}

function loadConversation(id: string): Conversation | null {
  try {
    const raw = localStorage.getItem(`conversation-${sanitizeId(id)}`)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveConversation(conv: Conversation) {
  try { localStorage.setItem(`conversation-${sanitizeId(conv.id)}`, JSON.stringify(conv)) } catch {}
}

function sanitizeId(id: string) {
  return id.replace(/[^a-zA-Z0-9-]/g, '')
}

function genId(): string {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
}

function makeTitle(messages: Message[]): string {
  for (const m of messages) {
    if (m.role === 'user') {
      const t = m.content.trim().slice(0, 40)
      return t.length < m.content.trim().length ? t + '…' : t
    }
  }
  return '新对话'
}

export function saveConversationDirect(conv: Conversation) {
  saveConversation(conv)
  const list = loadIndex()
  const entry = list.find(e => e.id === conv.id)
  if (entry) { entry.title = conv.title; entry.updatedAt = conv.updatedAt; entry.docKey = conv.docKey }
  saveIndex(list)
}

export function useConversations(docKey: string) {
  const [index, setIndex] = useState(() => loadIndex().filter(e => e.docKey === docKey))
  const [activeId, setActiveId] = useState<string>(() => index[0]?.id || '')
  const activeRef = useRef(activeId)

  // refresh from localStorage and filter by docKey
  const syncIndex = useCallback((list?: IndexEntry[]) => {
    const src = list || loadIndex()
    setIndex(src.filter(e => e.docKey === docKey))
  }, [docKey])

  useEffect(() => {
    const filtered = loadIndex().filter(e => e.docKey === docKey)
    setIndex(filtered)
    if (filtered.length > 0) {
      setActiveId(filtered[0].id)
    } else {
      const conv: Conversation = {
        id: genId(), title: '对话 1', messages: [],
        createdAt: Date.now(), updatedAt: Date.now(), condensedUntil: -1, docKey,
      }
      saveConversation(conv)
      const entry: IndexEntry = { id: conv.id, title: conv.title, updatedAt: conv.updatedAt, docKey }
      const all = [entry, ...loadIndex()]
      saveIndex(all)
      syncIndex(all)
      setActiveId(conv.id)
    }
  }, [docKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const getActive = useCallback((): Conversation | null => {
    return activeId ? loadConversation(activeId) : null
  }, [activeId])

  const create = useCallback((docKey: string) => {
    const list = loadIndex()
    const docConvs = list.filter(e => e.docKey === docKey)
    const conv: Conversation = {
      id: genId(), title: `对话 ${docConvs.length + 1}`, messages: [],
      createdAt: Date.now(), updatedAt: Date.now(), condensedUntil: -1, docKey,
    }
    saveConversation(conv)
    const entry: IndexEntry = { id: conv.id, title: conv.title, updatedAt: conv.updatedAt, docKey }
    const all = [entry, ...list]
    saveIndex(all)
    syncIndex(all)
    setActiveId(conv.id)
    return conv
  }, [syncIndex])

  const switchTo = useCallback((id: string) => {
    setActiveId(id)
    activeRef.current = id
  }, [])

  const del = useCallback((id: string) => {
    const key = sanitizeId(id)
    localStorage.removeItem(`conversation-${key}`)
    localStorage.removeItem(`chat-history-${key}`)
    const list = loadIndex().filter(e => e.id !== id)
    saveIndex(list)
    if (activeId === id) {
      const sameDoc = list.filter(e => e.docKey === docKey)
      setActiveId(sameDoc[0]?.id || list[0]?.id || '')
    }
    syncIndex(list)
  }, [activeId, docKey, syncIndex])

  const addMessage = useCallback((convId: string, msg: Message) => {
    const conv = loadConversation(convId)
    if (!conv) return
    conv.messages.push(msg)
    conv.updatedAt = Date.now()
    conv.title = makeTitle(conv.messages)
    saveConversation(conv)
    const list = loadIndex()
    const entry = list.find(e => e.id === convId)
    if (entry) { entry.title = conv.title; entry.updatedAt = conv.updatedAt }
    saveIndex(list)
    syncIndex(list)
  }, [syncIndex])

  const updateLastMessage = useCallback((convId: string, content: string) => {
    const conv = loadConversation(convId)
    if (!conv || conv.messages.length === 0) return
    conv.messages[conv.messages.length - 1].content = content
    saveConversation(conv)
  }, [])

  const setCondensedUntil = useCallback((convId: string, idx: number) => {
    const conv = loadConversation(convId)
    if (!conv) return
    conv.condensedUntil = idx
    saveConversation(conv)
  }, [])

  const rename = useCallback((convId: string, title: string) => {
    const conv = loadConversation(convId)
    if (!conv) return
    conv.title = title
    saveConversation(conv)
    const list = loadIndex()
    const entry = list.find(e => e.id === convId)
    if (entry) entry.title = title
    saveIndex(list)
    syncIndex(list)
  }, [syncIndex])

  return {
    index,
    activeId,
    getActive,
    create,
    switchTo,
    del,
    addMessage,
    updateLastMessage,
    setCondensedUntil,
    rename,
  }
}