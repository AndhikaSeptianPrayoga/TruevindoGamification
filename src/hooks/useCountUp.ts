import { useEffect, useRef, useState } from 'react'

/**
 * Animates a number from 0 up to `target` with an ease-out curve.
 * Used for a tasteful "points earned" count-up on the result screen.
 */
export function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0)
  const frameRef = useRef<number | undefined>(undefined)
  const startRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (target <= 0) {
      setValue(0)
      return
    }

    startRef.current = undefined

    const animate = (now: number) => {
      if (startRef.current === undefined) {
        startRef.current = now
      }
      const elapsed = now - startRef.current
      const t = Math.min(1, elapsed / durationMs)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      setValue(Math.round(target * eased))
      if (t < 1) {
        frameRef.current = requestAnimationFrame(animate)
      }
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [target, durationMs])

  return value
}
