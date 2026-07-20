'use client'
import { useI18n } from '@/lib/system/i18n'

export type QcRange = 'this_month' | 'all_time'

const TEAL = '#0d9488'

export function RangeToggle({ value, onChange }: { value: QcRange; onChange: (v: QcRange) => void }) {
  const { t } = useI18n()
  const opts: { key: QcRange; label: string }[] = [
    { key: 'this_month', label: t('qualityControl.range.thisMonth') },
    { key: 'all_time',   label: t('qualityControl.range.allTime') },
  ]
  return (
    <div className="inline-flex items-center rounded-full p-0.5" style={{ background: 'rgba(0,0,0,0.05)' }}>
      {opts.map(o => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors"
          style={value === o.key ? { background: '#fff', color: TEAL, boxShadow: '0 1px 2px rgba(0,0,0,0.08)' } : { color: 'rgb(90 100 112)' }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Round avatar with initials. */
export function Avatar({ name, size = 32, ring }: { name: string | null; size?: number; ring?: string }) {
  const initial = (name ?? '?').trim().charAt(0).toUpperCase() || '?'
  return (
    <span
      className="inline-grid place-items-center rounded-full font-semibold shrink-0"
      style={{
        width: size, height: size, fontSize: size * 0.4,
        background: '#F1F5F9', color: 'rgb(11 31 58)',
        border: ring ? `2px solid ${ring}` : '1px solid rgb(var(--border-default,229 233 240))',
      }}
    >
      {initial}
    </span>
  )
}
