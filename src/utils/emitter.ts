type Listener = (...args: unknown[]) => void

const listeners = new Map<string, Set<Listener>>()

export function on(event: string, fn: Listener) {
  if (!listeners.has(event)) listeners.set(event, new Set())
  const set = listeners.get(event)
  if (set) set.add(fn)
  return () => { listeners.get(event)?.delete(fn) }
}

export function emit(event: string, ...args: unknown[]) {
  listeners.get(event)?.forEach(fn => fn(...args))
}