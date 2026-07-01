interface StatCardProps {
  label: string
  value: string
  hint?: string
}

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="metric-tile">
      <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-600">{label}</p>
      <p className="mt-3 font-display text-3xl font-semibold text-slate-950">{value}</p>
      {hint ? <p className="mt-2 text-sm text-slate-700">{hint}</p> : null}
    </div>
  )
}
