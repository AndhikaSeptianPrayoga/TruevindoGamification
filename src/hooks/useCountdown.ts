import { useEffect, useMemo, useState } from 'react'

export function useCountdown(deadlineAt?: string | null, durationSeconds = 20) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!deadlineAt) {
      return undefined
    }

    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, 250)

    return () => window.clearInterval(timer)
  }, [deadlineAt])

  return useMemo(() => {
    if (!deadlineAt) {
      return {
        remainingMs: 0,
        remainingSeconds: 0,
        progress: 0,
      }
    }

    const deadline = new Date(deadlineAt).getTime()
    const remainingMs = Math.max(0, deadline - now)
    const durationMs = Math.max(durationSeconds, 1) * 1000
    const progress = Math.max(0, Math.min(100, Math.round((remainingMs / durationMs) * 100)))

    return {
      remainingMs,
      remainingSeconds: Math.ceil(remainingMs / 1000),
      progress,
    }
  }, [deadlineAt, durationSeconds, now])
}
