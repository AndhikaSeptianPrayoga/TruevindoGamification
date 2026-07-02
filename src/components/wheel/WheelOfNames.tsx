import { useEffect, useRef, useState } from 'react'
import type { WheelEntry, WheelSpinPayload } from '@shared/types/wheel'

interface WheelOfNamesProps {
  entries: WheelEntry[]
  /** Latest spin broadcast; the wheel animates once per spinId. */
  spin?: WheelSpinPayload | null
  /** Called when the local spin animation finishes. */
  onSpinEnd?: (payload: WheelSpinPayload) => void
}

// Slice palette — dark enough for white labels, aligned with the brand accents.
const SLICE_COLORS = [
  '#ef233c',
  '#1d4ed8',
  '#d97706',
  '#0f766e',
  '#7c3aed',
  '#db2777',
  '#0e7490',
  '#4d7c0f',
]

const RADIUS = 180
const LABEL_RADIUS = 168

function sliceLabel(name: string) {
  return name.length > 14 ? `${name.slice(0, 13)}…` : name
}

function labelFontSize(count: number) {
  if (count <= 8) return 16
  if (count <= 12) return 14
  if (count <= 20) return 12
  return 10
}

function slicePath(index: number, total: number) {
  const step = (2 * Math.PI) / total
  const start = -Math.PI / 2 + index * step
  const end = start + step
  const x1 = Math.cos(start) * RADIUS
  const y1 = Math.sin(start) * RADIUS
  const x2 = Math.cos(end) * RADIUS
  const y2 = Math.sin(end) * RADIUS
  const largeArc = step > Math.PI ? 1 : 0
  return `M 0 0 L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2} Z`
}

export function WheelOfNames({ entries, spin, onSpinEnd }: WheelOfNamesProps) {
  const [rotation, setRotation] = useState(0)
  const [animationMs, setAnimationMs] = useState(0)
  const processedSpinRef = useRef(0)
  const onSpinEndRef = useRef(onSpinEnd)
  onSpinEndRef.current = onSpinEnd

  useEffect(() => {
    if (!spin || spin.spinId <= processedSpinRef.current || entries.length === 0) {
      return
    }
    processedSpinRef.current = spin.spinId

    // Rotate forward so the winner slice's center lands under the top pointer.
    const step = 360 / entries.length
    const winnerCenterDeg = (spin.winnerIndex + 0.5) * step
    setRotation((previous) => {
      const currentMod = ((previous % 360) + 360) % 360
      const targetMod = (360 - winnerCenterDeg + 360) % 360
      const delta = ((targetMod - currentMod + 360) % 360) + spin.extraSpins * 360
      return previous + delta
    })
    setAnimationMs(spin.durationMs)

    const timer = setTimeout(() => onSpinEndRef.current?.(spin), spin.durationMs + 150)
    return () => clearTimeout(timer)
  }, [spin, entries.length])

  const count = entries.length
  const fontSize = labelFontSize(count)

  return (
    <div className="relative mx-auto w-full max-w-[440px]">
      <svg
        viewBox="-200 -200 400 400"
        role="img"
        aria-label={
      count === 0
            ? 'Empty wheel of names'
            : `Wheel of names with ${count} ${count === 1 ? 'entry' : 'entries'}`
        }
        className="block h-auto w-full drop-shadow-[0_24px_48px_rgba(15,23,42,0.18)]"
      >
        {/* Rotating wheel */}
        <g
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: animationMs
              ? `transform ${animationMs}ms cubic-bezier(0.12, 0.64, 0.06, 1)`
              : 'none',
          }}
        >
          {count === 0 ? (
            <circle r={RADIUS} fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2" />
          ) : count === 1 ? (
            <circle r={RADIUS} fill={SLICE_COLORS[0]} />
          ) : (
            entries.map((entry, index) => (
              <path
                key={entry.id}
                d={slicePath(index, count)}
                fill={SLICE_COLORS[index % SLICE_COLORS.length]}
                stroke="#ffffff"
                strokeWidth="2"
              />
            ))
          )}

          {count > 0
            ? entries.map((entry, index) => {
                const step = 360 / count
                const centerDeg = -90 + (index + 0.5) * step
                return (
                  <g key={`label-${entry.id}`} transform={`rotate(${centerDeg})`}>
                    <text
                      x={LABEL_RADIUS}
                      y="0"
                      textAnchor="end"
                      dominantBaseline="middle"
                      fill="#ffffff"
                      fontSize={fontSize}
                      fontWeight="700"
                      style={{ paintOrder: 'stroke' }}
                      stroke="rgba(15,23,42,0.35)"
                      strokeWidth="0.6"
                    >
                      {sliceLabel(entry.name)}
                    </text>
                  </g>
                )
              })
            : null}
        </g>

        {/* Hub */}
        <circle r="30" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
        <circle r="8" fill="#0f172a" />

        {/* Fixed pointer at the top */}
        <polygon points="-14,-196 14,-196 0,-166" fill="#0f172a" stroke="#ffffff" strokeWidth="2" />
      </svg>

      {count === 0 ? (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-10 text-center text-sm font-semibold text-slate-500">
          Add names to start the wheel
        </p>
      ) : null}
    </div>
  )
}
