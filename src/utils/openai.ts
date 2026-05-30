export async function chatCompletionStream(
  messages: { role: string; content: string }[],
  options: { baseUrl: string; apiKey: string; model: string; maxTokens: number; temperature: number },
  onToken: (token: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const url = `${options.baseUrl.replace(/\/+$/, '')}/chat/completions`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${options.apiKey}`,
    },
    body: JSON.stringify({
      model: options.model,
      messages,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      stream: true,
    }),
    signal,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${text || res.statusText}`)
  }
  const reader = res.body?.getReader()
  if (!reader) throw new Error('Response body not available')
  const decoder = new TextDecoder()
  let full = ''
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') break
        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content || ''
          if (content) {
            full += content
            onToken(content)
          }
        } catch {}
      }
    }
  }
  return full
}