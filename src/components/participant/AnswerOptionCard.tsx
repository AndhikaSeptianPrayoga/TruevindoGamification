import { Check } from 'lucide-react'
import type { AnswerOption } from '@shared/types/game'

interface AnswerOptionCardProps {
  option: AnswerOption
  text: string
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
}

// Only the letter badge carries the option color; every card surface stays a
// uniform white so all four options read consistently.
const badges: Record<AnswerOption, string> = {
  A: 'bg-[#ef233c] text-white shadow-[0_12px_28px_rgba(239,35,60,0.28)]',
  B: 'bg-[#1d4ed8] text-white shadow-[0_12px_28px_rgba(29,78,216,0.28)]',
  C: 'bg-[#d97706] text-white shadow-[0_12px_28px_rgba(217,119,6,0.24)]',
  D: 'bg-[#0f766e] text-white shadow-[0_12px_28px_rgba(15,118,110,0.24)]',
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
      className={`relative min-h-[118px] rounded-[30px] border px-5 py-5 text-left transition-all duration-200 ${
        selected
          ? 'scale-[1.02] border-slate-950/10 bg-slate-950 text-white shadow-float ring-4 ring-signal/20'
          : 'border-slate-200/85 bg-white text-slate-900 shadow-[0_16px_36px_rgba(15,23,42,0.07)] hover:-translate-y-0.5 hover:border-signal/35 hover:shadow-[0_22px_52px_rgba(29,78,216,0.12)] active:scale-[0.98]'
      } ${disabled && !selected ? 'cursor-not-allowed opacity-45' : ''} ${
        disabled ? 'cursor-default' : ''
      }`}
      aria-label={`Choose option ${option}: ${text}`}
    >
      {selected ? (
        <span className="animate-pop-in absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-950 shadow-lg">
          <Check className="h-5 w-5" strokeWidth={3} />
        </span>
      ) : null}
      <div className="flex items-center gap-4">
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl font-display text-2xl font-bold ${
            selected ? 'bg-white/12 text-white' : badges[option]
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
