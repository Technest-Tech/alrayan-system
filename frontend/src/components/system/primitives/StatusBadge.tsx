'use client'
import { useI18n } from '@/lib/system/i18n'

const VARIANTS: Record<string, { key: string; bg: string; color: string }> = {
  active:     { key: 'status.active',     bg: 'rgb(var(--status-success,14 124 90)/0.12)',  color: 'rgb(var(--status-success,14 124 90))' },
  inactive:   { key: 'status.inactive',   bg: 'rgb(var(--status-neutral,90 100 112)/0.12)', color: 'rgb(var(--status-neutral,90 100 112))' },
  paid:       { key: 'status.paid',       bg: 'rgb(var(--status-success,14 124 90)/0.12)',  color: 'rgb(var(--status-success,14 124 90))' },
  unpaid:     { key: 'status.unpaid',     bg: 'rgb(var(--status-danger,166 39 30)/0.12)',   color: 'rgb(var(--status-danger,166 39 30))' },
  overdue:    { key: 'status.overdue',    bg: 'rgb(var(--status-danger,166 39 30)/0.12)',   color: 'rgb(var(--status-danger,166 39 30))' },
  pending:    { key: 'status.pending',    bg: 'rgb(var(--status-warning,154 113 23)/0.12)', color: 'rgb(var(--status-warning,154 113 23))' },
  cancelled:  { key: 'status.cancelled',  bg: 'rgb(var(--status-neutral,90 100 112)/0.12)', color: 'rgb(var(--status-neutral,90 100 112))' },
  draft:      { key: 'status.draft',      bg: 'rgb(var(--status-neutral,90 100 112)/0.12)', color: 'rgb(var(--status-neutral,90 100 112))' },
  published:  { key: 'status.published',  bg: 'rgb(var(--status-info,30 90 171)/0.12)',     color: 'rgb(var(--status-info,30 90 171))' },
  trial:      { key: 'status.trial',      bg: 'rgb(var(--status-info,30 90 171)/0.12)',     color: 'rgb(var(--status-info,30 90 171))' },
}

interface StatusBadgeProps {
  value: string
  label?: string
}

export function StatusBadge({ value, label }: StatusBadgeProps) {
  const { t } = useI18n()
  const variant = VARIANTS[value.toLowerCase()]

  const text = label ?? (variant ? t(variant.key) : value)
  const bg = variant?.bg ?? 'rgb(var(--status-neutral,90 100 112)/0.12)'
  const color = variant?.color ?? 'rgb(var(--status-neutral,90 100 112))'

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: bg, color }}
    >
      {text}
    </span>
  )
}
