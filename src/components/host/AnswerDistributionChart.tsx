import type { AnswerDistribution } from '@shared/types/game'
import { CheckCircle2 } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts'

interface AnswerDistributionChartProps {
  data: AnswerDistribution[]
}

const CORRECT_COLOR = '#22c55e'
const NEUTRAL_COLOR = '#475569'

export function AnswerDistributionChart({ data }: AnswerDistributionChartProps) {
  const correct = data.find((item) => item.isCorrect)
  const hasReveal = Boolean(correct)

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Answer Analytics</p>
          <h3 className="mt-2 font-display text-2xl font-semibold text-white">Option Distribution</h3>
        </div>
        {hasReveal ? (
          <span className="flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200">
            <CheckCircle2 className="h-4 w-4" />
            Correct answer: {correct?.option}
          </span>
        ) : null}
      </div>

      <div className="mt-5 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke="rgba(148, 163, 184, 0.15)" vertical={false} />
            <XAxis dataKey="option" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" allowDecimals={false} />
            <Bar dataKey="count" radius={[14, 14, 0, 0]}>
              <LabelList dataKey="count" position="top" fill="#e2e8f0" fontSize={14} />
              {data.map((item) => (
                <Cell
                  key={item.option}
                  fill={hasReveal ? (item.isCorrect ? CORRECT_COLOR : NEUTRAL_COLOR) : '#0ea5a4'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {hasReveal ? (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {data.map((item) => (
            <div
              key={item.option}
              className={`flex items-center justify-between rounded-2xl border px-3 py-2 text-sm ${
                item.isCorrect
                  ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-100'
                  : 'border-white/10 bg-black/15 text-slate-300'
              }`}
            >
              <span className="font-semibold">
                {item.option}
                {item.isCorrect ? ' ✓' : ''}
              </span>
              <span>{item.count}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
