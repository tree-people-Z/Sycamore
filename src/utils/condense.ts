import { chatCompletionStream } from './openai'
import type { EditorSettings } from '../constants'
import { estimateTokens } from './token-counter'
import type { Message } from '../hooks/useConversations'

const CONDENSE_THRESHOLD = 3
const MIN_TOKEN_TO_CONDENSE = 100

export function getCondensableMessages(
  messages: Message[],
  condensedUntil: number,
  keepLatest: number,
): number[] {
  const indices: number[] = []
  const start = Math.max(condensedUntil + 1, 0)
  const end = messages.length - keepLatest
  for (let i = start; i < end; i++) {
    if (messages[i].role === 'assistant' && estimateTokens(messages[i].content) > MIN_TOKEN_TO_CONDENSE) {
      indices.push(i)
    }
  }
  return indices
}

export async function shouldCondense(
  messages: Message[],
  condensedUntil: number,
  settings: EditorSettings,
): Promise<boolean> {
  if (!settings.enableCondense) return false
  const condensable = messages.filter((m, i) =>
    i > condensedUntil && m.role === 'assistant' &&
    estimateTokens(m.content) > MIN_TOKEN_TO_CONDENSE
  )
  return condensable.length >= CONDENSE_THRESHOLD
}

export async function condenseMessages(
  messages: Message[],
  indices: number[],
  settings: EditorSettings,
  onProgress?: (index: number, summary: string) => void,
): Promise<Map<number, string>> {
  const result = new Map<number, string>()

  const prompt = `请将以下对话内容压缩为简洁的摘要，用于节省 token 使用量。

压缩原则：
1. 保留代码块、数据、结论、TODO 等关键信息
2. 简化过程描述和中间思考
3. 使用清晰的段落或要点组织内容
4. 控制在 200 字以内

原始内容：
{content}

请输出摘要：`

  for (const idx of indices) {
    const content = messages[idx].content || ''
    try {
      let summary = ''
      const finalPrompt = prompt.replace('{content}', content)
      const opts = {
        baseUrl: settings.apiBaseUrl,
        apiKey: settings.apiKey,
        model: settings.condenseModel || settings.apiModel,
        maxTokens: Math.min(settings.apiMaxTokens, 1024),
        temperature: 0.3,
      }
      await chatCompletionStream(
        [{ role: 'user', content: finalPrompt }],
        opts,
        (token) => { summary += token },
      )
      if (summary.trim()) {
        result.set(idx, summary.trim())
        onProgress?.(idx, summary.trim())
      }
    } catch {
      // skip failed condensation
    }
  }
  return result
}