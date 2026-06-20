'use client'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useSessionConflicts } from '@/hooks/system/useSessions'
import { useI18n } from '@/lib/system/i18n'

export function ConflictBanner() {
  const { t } = useI18n()
  const { data: conflicts } = useSessionConflicts()
  if (!conflicts || conflicts.length === 0) return null

  return (
    <div
      className="flex items-center justify-between rounded-xl px-4 py-3"
      style={{ background: 'rgb(234 88 12 / 0.07)', border: '1px solid rgb(234 88 12 / 0.22)' }}
    >
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-lg shrink-0" style={{ background: 'rgb(234 88 12 / 0.12)' }}>
          <AlertTriangle size={13} style={{ color: 'rgb(194 65 12)' }} />
        </div>
        <p className="text-sm font-medium" style={{ color: 'rgb(154 52 18)' }}>
          {conflicts.length === 1
            ? t('schedule.conflictBanner.detectedSingular', { count: String(conflicts.length) })
            : t('schedule.conflictBanner.detectedPlural',   { count: String(conflicts.length) })}
        </p>
      </div>
      <Link
        href="/schedule/conflicts"
        className="flex items-center gap-1 text-xs font-semibold shrink-0 transition-opacity hover:opacity-70"
        style={{ color: 'rgb(194 65 12)' }}
      >
        {t('schedule.conflictBanner.review')} <ArrowRight size={12} />
      </Link>
    </div>
  )
}
