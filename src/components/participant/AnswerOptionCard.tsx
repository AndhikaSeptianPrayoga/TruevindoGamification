import type { AnswerOption } from '@shared/types/game'

interface AnswerOptionCardProps {
  option: AnswerOption
  text: string
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
}

const accents: Record<AnswerOption, string> = {
  A: 'from-[#ef233c]/16 via-white to-transparent',
  B: 'from-[#1d4ed8]/16 via-white to-transparent',
  C: 'from-[#f59e0b]/18 via-white to-transparent',
  D: 'from-[#0f766e]/16 via-white to-transparent',
}

export function AnswerOptionCard({
  option,
  text,
  selected,
  disabled,
  onClick,
}: AnswerOptionCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-[28px] border px-5 py-5 text-left transition duration-200 ${
        selected
          ? 'border-slate-900/10 bg-slate-950 text-white shadow-float'
          : 'border-slate-200/85 bg-gradient-to-br text-slate-900 shadow-[0_16px_36px_rgba(15,23,42,0.07)] hover:-translate-y-0.5 hover:border-signal/35 hover:shadow-[0_22px_52px_rgba(29,78,216,0.12)]'
      } ${accents[option]} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <div className="flex items-start gap-4">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-2xl font-display text-lg font-semibold ${
            selected ? 'bg-white/10 text-white' : 'bg-slate-950 text-white'
          }`}
        >
          {option}
        </span>
        <span className="text-sm leading-7 md:text-base">{text}</span>
      </div>
    </button>
  )
}
