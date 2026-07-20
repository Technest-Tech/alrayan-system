'use client'
import { Users } from 'lucide-react'
import { useI18n } from '@/lib/system/i18n'
import type { QcSupervisorActivity } from '@/types/system/qualityControl'
import { ratingColor, ratingFor } from '@/types/system/qualityControl'
import { Avatar } from './RangeToggle'

const BORDER = 'rgb(var(--border-default,229 233 240))'
const NAVY   = 'rgb(11 31 58)'
const MUTED  = 'rgb(90 100 112)'
const PURPLE = '#7C3AED'

export function SupervisorActivityPanel({ activity }: { activity: QcSupervisorActivity[] }) {
  const { t } = useI18n()

  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: BORDER, background: 'rgb(var(--surface-card,255 255 255))' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users size={16} style={{ color: PURPLE }} />
          <h3 className="text-sm font-semibold" style={{ color: NAVY }}>{t('qualityControl.supervisorActivity.title')}</h3>
        </div>
        <span className="text-xs" style={{ color: MUTED }}>
          {t('qualityControl.supervisorActivity.supervisorsCount', { count: String(activity.length) })}
        </span>
      </div>

      {activity.length === 0 ? (
        <p className="py-8 text-center text-sm" style={{ color: MUTED }}>{t('qualityControl.supervisorActivity.empty')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {activity.map(a => {
            const color = ratingColor(ratingFor(a.avg_score))
            return (
              <div key={a.quality_manager_id} className="flex items-center gap-3 rounded-xl border px-3 py-2.5" style={{ borderColor: BORDER }}>
                <Avatar name={a.name} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate" style={{ color: NAVY }}>{a.name ?? t('qualityControl.table.unknown')}</p>
                  <p className="text-[11px]" style={{ color: MUTED }}>
                    {t('qualityControl.supervisorActivity.count', { count: String(a.evaluations_count) })} · {t('qualityControl.supervisorActivity.avgScore', { value: String(Math.round(a.avg_score)) })}
                  </p>
                </div>
                <span className="text-sm font-bold tabular-nums shrink-0" style={{ color }}>{Math.round(a.avg_score)}%</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
