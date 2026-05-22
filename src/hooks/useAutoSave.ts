import { useEffect, useRef } from 'react'

export function useAutoSave(
  enabled: boolean,
  intervalSeconds: number,
  saveFn: () => Promise<void>,
  getModified: () => boolean,
) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (!enabled || intervalSeconds <= 0) return
    timerRef.current = setInterval(() => {
      if (getModified()) saveFn()
    }, intervalSeconds * 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [enabled, intervalSeconds, saveFn, getModified])
}
