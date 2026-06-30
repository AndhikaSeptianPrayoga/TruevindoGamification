import { useMemo } from 'react'

interface ConfettiProps {
  /** Number of confetti pieces to render. */
  pieces?: number
  className?: string
}

const COLORS = ['#38bdf8', '#22d3ee', '#a855f7', '#f59e0b', '#34d399', '#f472b6', '#facc15']

/**
 * Pure-CSS confetti burst — no dependencies. Renders absolutely-positioned
 * pieces that fall and spin via the `confetti-fall` keyframes in index.css.
 */
export function Confetti({ pieces = 80, className = '' }: ConfettiProps) {
  const items = useMemo(
    () =>
      Array.from({ length: pieces }, (_, index) => {
        const left = Math.random() * 100
        const delay = Math.random() * 2.5
        const duration = 3 + Math.random() * 2.5
        const size = 6 + Math.random() * 8
        const color = COLORS[index % COLORS.length]
        const drift = `${(Math.random() * 2 - 1) * 120}px`
        const rounded = Math.random() > 0.5
        return { id: index, left, delay, duration, size, color, drift, rounded }
      }),
    [pieces],
  )

  return (
    <div className={`pointer-events-none fixed inset-0 z-50 overflow-hidden ${className}`} aria-hidden>
      {items.map((item) => (
        <span
          key={item.id}
          className="confetti-piece absolute top-[-10vh]"
          style={{
            left: `${item.left}%`,
            width: `${item.size}px`,
            height: `${item.size * 1.4}px`,
            background: item.color,
            borderRadius: item.rounded ? '9999px' : '2px',
            animationDelay: `${item.delay}s`,
            animationDuration: `${item.duration}s`,
            // @ts-expect-error custom property consumed by the keyframes
            '--drift': item.drift,
          }}
        />
      ))}
    </div>
  )
}
