import type { AnswerDistribution } from '@shared/types/game'
import { CheckCircle2 } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts'

interface AnswerDistributionChartProps {
  data: AnswerDistribution[]
}

const CORRECT_COLOR = '#16a34a'
const INCORRECT_COLOR = '#f59e0b'
const NEUTRAL_COLOR = '#94a3b8'

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
          <span className="status-chip-success flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold">
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
                  fill={hasReveal ? (item.isCorrect ? CORRECT_COLOR : INCORRECT_COLOR) : '#2563eb'}
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
                  ? 'status-chip-success'
                  : 'status-chip-warning'
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
