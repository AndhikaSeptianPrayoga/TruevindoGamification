import { useEffect, useRef, useState } from 'react'
import { sound } from '@/utils/sound'

interface CountdownOverlayProps {
  /** Called once the 3-2-1-GO sequence finishes. */
  onDone: () => void
}

/**
 * Full-screen "get ready" standby that counts 3 → 2 → 1 → GO before the
 * question is revealed. Plays a tick per number and a whoosh on GO.
 */
export function CountdownOverlay({ onDone }: CountdownOverlayProps) {
  const [step, setStep] = useState(3) // 3, 2, 1, then 0 = GO
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    if (step > 0) {
      sound.tick()
      sound.vibrate(20)
    } else {
      sound.whoosh()
      sound.vibrate(60)
    }

    const delay = step > 0 ? 850 : 650
    const timer = setTimeout(() => {
      if (step > 0) {
        setStep((current) => current - 1)
      } else {
        onDoneRef.current()
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [step])

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md">
      <p className="mb-6 text-sm font-semibold uppercase tracking-[0.45em] text-white/70">
        Get Ready
      </p>
      <div
        key={step}
        className="animate-pop-in font-display font-black leading-none text-white drop-shadow-2xl"
        style={{ fontSize: 'clamp(6rem, 22vw, 13rem)' }}
      >
        {step > 0 ? step : 'GO'}
      </div>
    </div>
  )
}
