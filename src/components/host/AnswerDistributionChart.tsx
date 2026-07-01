import type { AnswerDistribution } from '@shared/types/game'
import { CheckCircle2 } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts'

interface AnswerDistributionChartProps {
  data: AnswerDistribution[]
}

const CORRECT_COLOR = '#1d4ed8'
const NEUTRAL_COLOR = '#cbd5e1'

export function AnswerDistributionChart({ data }: AnswerDistributionChartProps) {
  const correct = data.find((item) => item.isCorrect)
  const hasReveal = Boolean(correct)

  return (
    <div className="panel-elevated p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="kicker">Answer Analytics</p>
          <h3 className="mt-2 font-display text-2xl font-semibold text-slate-950">Option Distribution</h3>
        </div>
        {hasReveal ? (
          <span className="flex items-center gap-2 rounded-full border border-signal/20 bg-signal/10 px-4 py-2 text-sm font-semibold text-signal">
            <CheckCircle2 className="h-4 w-4" />
            Correct answer: {correct?.option}
          </span>
        ) : null}
      </div>

      <div className="mt-5 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke="rgba(148, 163, 184, 0.22)" vertical={false} />
            <XAxis dataKey="option" stroke="#64748b" />
            <YAxis stroke="#64748b" allowDecimals={false} />
            <Bar dataKey="count" radius={[14, 14, 0, 0]}>
              <LabelList dataKey="count" position="top" fill="#0f172a" fontSize={14} />
              {data.map((item) => (
                <Cell
                  key={item.option}
                  fill={hasReveal ? (item.isCorrect ? CORRECT_COLOR : NEUTRAL_COLOR) : '#ef233c'}
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
                  ? 'border-signal/25 bg-signal/10 text-signal'
                  : 'border-slate-200/80 bg-white/80 text-slate-600'
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
