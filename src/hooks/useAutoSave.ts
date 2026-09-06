import { useEffect, useRef } from 'react'

export function useAutoSave(
  enabled: boolean,
  intervalSeconds: number,
  saveFn: () => Promise<void | boolean>,
  getModified: () => boolean,
) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const saveFnRef = useRef(saveFn)
  const getModifiedRef = useRef(getModified)

  saveFnRef.current = saveFn
  getModifiedRef.current = getModified

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (!enabled || intervalSeconds <= 0) return
    timerRef.current = setInterval(() => {
      if (getModifiedRef.current()) saveFnRef.current()
    }, intervalSeconds * 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [enabled, intervalSeconds])
}
