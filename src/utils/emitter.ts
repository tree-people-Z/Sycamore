type Listener = (...args: any[]) => void

const listeners = new Map<string, Set<Listener>>()

export function on(event: string, fn: Listener) {
  if (!listeners.has(event)) listeners.set(event, new Set())
  listeners.get(event)!.add(fn)
  return () => { listeners.get(event)?.delete(fn) }
}

export function emit(event: string, ...args: any[]) {
  listeners.get(event)?.forEach(fn => fn(...args))
}