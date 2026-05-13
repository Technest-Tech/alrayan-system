interface KpiCardProps {
  label:    string
  value:    string | number
  delta?:   string
  sub?:     string
  loading?: boolean
}

export function KpiCard({ label, value, delta, sub, loading }: KpiCardProps) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-1"
      style={{ background: 'rgb(var(--surface-card, 255 255 255))', border: '1px solid rgb(var(--border-default, 229 233 240))' }}
    >
      <p className="text-xs font-medium opacity-50 uppercase tracking-wide">{label}</p>
      {loading ? (
        <div className="h-8 w-16 rounded-lg bg-black/5 animate-pulse" />
      ) : (
        <p className="text-3xl font-bold tabular-nums">{value}</p>
      )}
      {delta && (
        <p className="text-xs opacity-50">{delta}</p>
      )}
      {sub && (
        <p className="text-xs opacity-40">{sub}</p>
      )}
    </div>
  )
}
