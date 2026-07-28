import type { LucideIcon } from 'lucide-react'

interface AnalyticsMetricCardProps {
  label: string
  value: string | number
  helper?: string
  icon: LucideIcon
  color: string
  compact?: boolean
}

export function AnalyticsMetricCard({
  label,
  value,
  helper,
  icon: Icon,
  color,
  compact = false,
}: AnalyticsMetricCardProps) {
  return (
    <article
      className={[
        'rounded-2xl border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03),0_10px_30px_rgba(15,23,42,0.03)]',
        compact ? 'min-h-[126px] p-4' : 'min-h-[148px] p-5',
      ].join(' ')}
      style={{ borderColor: 'rgb(var(--border-default))' }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-semibold text-slate-600">{label}</p>
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
          style={{ color, backgroundColor: `${color}12` }}
        >
          <Icon size={16} strokeWidth={1.9} />
        </span>
      </div>
      <p className={`${compact ? 'mt-4 text-[24px]' : 'mt-6 text-[28px]'} font-bold tracking-tight text-slate-950 tabular-nums`}>
        {value}
      </p>
      {helper && (
        <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.08em] text-slate-400">
          {helper}
        </p>
      )}
    </article>
  )
}

export function AnalyticsMetricSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={[
        'animate-pulse rounded-2xl border bg-white',
        compact ? 'min-h-[126px] p-4' : 'min-h-[148px] p-5',
      ].join(' ')}
      style={{ borderColor: 'rgb(var(--border-default))' }}
    >
      <div className="h-3 w-24 rounded bg-slate-100" />
      <div className="mt-7 h-8 w-20 rounded bg-slate-100" />
      <div className="mt-2 h-2 w-16 rounded bg-slate-50" />
    </div>
  )
}
