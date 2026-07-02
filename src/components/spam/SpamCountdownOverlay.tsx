import { useEffect, useRef } from 'react'
import { sound } from '@/utils/sound'

interface SpamCountdownOverlayProps {
  /** Whole seconds until GO (0 = show "GO!"). Driven by the server clock. */
  secondsLeft: number
}

/**
 * Full-screen synchronized 3-2-1-GO standby for the Spamming Game. Unlike the
 * quiz countdown, the number here is computed from the server's `startsAt`
 * timestamp plus the measured clock offset, so admin and every player see the
 * exact same digit at the exact same moment.
 */
export function SpamCountdownOverlay({ secondsLeft }: SpamCountdownOverlayProps) {
  const lastShownRef = useRef<number | null>(null)

  useEffect(() => {
    if (lastShownRef.current === secondsLeft) {
      return
    }
    lastShownRef.current = secondsLeft
    if (secondsLeft > 0) {
      sound.tick()
      sound.vibrate(20)
    } else {
      sound.whoosh()
      sound.vibrate(60)
    }
  }, [secondsLeft])

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md">
      <p className="mb-6 text-sm font-semibold uppercase tracking-[0.45em] text-white/70">
        Get Ready
      </p>
      <div
        key={secondsLeft}
        className="animate-pop-in font-display font-black leading-none text-white drop-shadow-2xl"
        style={{ fontSize: 'clamp(6rem, 22vw, 13rem)' }}
      >
        {secondsLeft > 0 ? secondsLeft : 'GO!'}
      </div>
    </div>
  )
}
