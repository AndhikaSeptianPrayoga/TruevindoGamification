import type { AnswerOption } from '@shared/types/game'

interface AnswerOptionCardProps {
  option: AnswerOption
  text: string
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
}

const accents: Record<AnswerOption, string> = {
  A: 'from-cyan-500/25 to-cyan-500/5',
  B: 'from-blue-500/25 to-blue-500/5',
  C: 'from-amber-500/25 to-amber-500/5',
  D: 'from-emerald-500/25 to-emerald-500/5',
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
          ? 'border-white bg-white text-ink shadow-2xl'
          : 'border-white/10 bg-gradient-to-br text-white hover:border-accent/60 hover:bg-white/10'
      } ${accents[option]} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black/20 font-display text-lg font-semibold">
          {option}
        </span>
        <span className="text-sm leading-7 md:text-base">{text}</span>
      </div>
    </button>
  )
}
