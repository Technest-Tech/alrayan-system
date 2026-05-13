const VARIANTS: Record<string, { label: string; bg: string; color: string }> = {
  active:     { label: 'Active',     bg: 'rgb(var(--status-success,14 124 90)/0.12)',  color: 'rgb(var(--status-success,14 124 90))' },
  inactive:   { label: 'Inactive',   bg: 'rgb(var(--status-neutral,90 100 112)/0.12)', color: 'rgb(var(--status-neutral,90 100 112))' },
  paid:       { label: 'Paid',       bg: 'rgb(var(--status-success,14 124 90)/0.12)',  color: 'rgb(var(--status-success,14 124 90))' },
  unpaid:     { label: 'Unpaid',     bg: 'rgb(var(--status-danger,166 39 30)/0.12)',   color: 'rgb(var(--status-danger,166 39 30))' },
  overdue:    { label: 'Overdue',    bg: 'rgb(var(--status-danger,166 39 30)/0.12)',   color: 'rgb(var(--status-danger,166 39 30))' },
  pending:    { label: 'Pending',    bg: 'rgb(var(--status-warning,154 113 23)/0.12)', color: 'rgb(var(--status-warning,154 113 23))' },
  cancelled:  { label: 'Cancelled',  bg: 'rgb(var(--status-neutral,90 100 112)/0.12)', color: 'rgb(var(--status-neutral,90 100 112))' },
  draft:      { label: 'Draft',      bg: 'rgb(var(--status-neutral,90 100 112)/0.12)', color: 'rgb(var(--status-neutral,90 100 112))' },
  published:  { label: 'Published',  bg: 'rgb(var(--status-info,30 90 171)/0.12)',     color: 'rgb(var(--status-info,30 90 171))' },
  trial:      { label: 'Trial',      bg: 'rgb(var(--status-info,30 90 171)/0.12)',     color: 'rgb(var(--status-info,30 90 171))' },
}

interface StatusBadgeProps {
  value: string
  label?: string
}

export function StatusBadge({ value, label }: StatusBadgeProps) {
  const variant = VARIANTS[value.toLowerCase()] ?? {
    label: label ?? value,
    bg: 'rgb(var(--status-neutral,90 100 112)/0.12)',
    color: 'rgb(var(--status-neutral,90 100 112))',
  }

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: variant.bg, color: variant.color }}
    >
      {label ?? variant.label}
    </span>
  )
}
