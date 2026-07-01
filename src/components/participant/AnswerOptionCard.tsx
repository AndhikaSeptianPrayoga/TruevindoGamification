import type { AnswerOption } from '@shared/types/game'

interface AnswerOptionCardProps {
  option: AnswerOption
  text: string
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
}

const accents: Record<
  AnswerOption,
  {
    surface: string
    badge: string
    ring: string
  }
> = {
  A: {
    surface: 'from-[#ef233c]/18 via-white to-white',
    badge: 'bg-[#ef233c] text-white shadow-[0_12px_28px_rgba(239,35,60,0.28)]',
    ring: 'hover:border-[#ef233c]/40 hover:shadow-[0_22px_52px_rgba(239,35,60,0.16)]',
  },
  B: {
    surface: 'from-[#1d4ed8]/18 via-white to-white',
    badge: 'bg-[#1d4ed8] text-white shadow-[0_12px_28px_rgba(29,78,216,0.28)]',
    ring: 'hover:border-[#1d4ed8]/40 hover:shadow-[0_22px_52px_rgba(29,78,216,0.16)]',
  },
  C: {
    surface: 'from-[#f59e0b]/20 via-white to-white',
    badge: 'bg-[#d97706] text-white shadow-[0_12px_28px_rgba(217,119,6,0.24)]',
    ring: 'hover:border-[#f59e0b]/42 hover:shadow-[0_22px_52px_rgba(245,158,11,0.15)]',
  },
  D: {
    surface: 'from-[#0f766e]/18 via-white to-white',
    badge: 'bg-[#0f766e] text-white shadow-[0_12px_28px_rgba(15,118,110,0.24)]',
    ring: 'hover:border-[#0f766e]/38 hover:shadow-[0_22px_52px_rgba(15,118,110,0.14)]',
  },
}

export function AnswerOptionCard({
  option,
  text,
  selected,
  disabled,
  onClick,
}: AnswerOptionCardProps) {
  const accent = accents[option]

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`min-h-[118px] rounded-[30px] border px-5 py-5 text-left transition duration-200 ${
        selected
          ? 'border-slate-950/10 bg-slate-950 text-white shadow-float ring-4 ring-slate-950/5'
          : 'border-slate-200/85 bg-white text-slate-900 shadow-[0_16px_36px_rgba(15,23,42,0.07)] hover:-translate-y-0.5 hover:border-signal/35 hover:shadow-[0_22px_52px_rgba(29,78,216,0.12)]'
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      aria-label={`Choose option ${option}: ${text}`}
    >
      <div className="flex items-center gap-4">
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl font-display text-2xl font-bold ${
            selected ? 'bg-white/12 text-white' : accent.badge
          }`}
        >
          {option}
        </span>
        <span className={`text-base font-semibold leading-7 md:text-lg ${selected ? 'text-white' : 'text-slate-950'}`}>
          {text}
        </span>
      </div>
    </button>
  )
}
