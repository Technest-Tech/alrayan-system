'use client'
import { useState } from 'react'
import { Medal, Crown } from 'lucide-react'
import { useI18n } from '@/lib/system/i18n'
import type { QcTopTeacher } from '@/types/system/qualityControl'
import { ratingColor, ratingFor } from '@/types/system/qualityControl'
import { RangeToggle, Avatar, type QcRange } from './RangeToggle'

const BORDER = 'rgb(var(--border-default,229 233 240))'
const NAVY   = 'rgb(11 31 58)'
const MUTED  = 'rgb(90 100 112)'
const GOLD   = '#C9A24B'

export function TopTeachersPanel({ thisMonth, allTime }: { thisMonth: QcTopTeacher[]; allTime: QcTopTeacher[] }) {
  const { t } = useI18n()
  const [range, setRange] = useState<QcRange>('this_month')
  const list = range === 'this_month' ? thisMonth : allTime

  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: BORDER, background: 'rgb(var(--surface-card,255 255 255))' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Medal size={16} style={{ color: GOLD }} />
          <h3 className="text-sm font-semibold" style={{ color: NAVY }}>{t('qualityControl.topTeachers.title')}</h3>
        </div>
        <RangeToggle value={range} onChange={setRange} />
      </div>

      {list.length === 0 ? (
        <p className="py-10 text-center text-sm" style={{ color: MUTED }}>{t('qualityControl.topTeachers.empty')}</p>
      ) : (
        <ul className="space-y-2">
          {list.map((entry, i) => {
            const color = ratingColor(ratingFor(entry.avg_score))
            const top = i === 0
            return (
              <li
                key={entry.teacher_id}
                className="flex items-center gap-3 rounded-xl px-3 py-2"
                style={top ? { background: 'rgba(201,162,75,0.08)', border: '1px solid rgba(201,162,75,0.3)' } : { border: `1px solid ${BORDER}` }}
              >
                <span className="w-4 shrink-0 grid place-items-center">
                  {top ? <Crown size={14} style={{ color: GOLD }} /> : <span className="text-xs font-semibold" style={{ color: MUTED }}>{i + 1}</span>}
                </span>
                <Avatar name={entry.teacher_name} size={30} ring={top ? GOLD : undefined} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate" style={{ color: NAVY }}>{entry.teacher_name ?? '—'}</p>
                  <p className="text-[11px]" style={{ color: MUTED }}>{t('qualityControl.topPerformers.evals', { count: String(entry.evaluations_count) })}</p>
                </div>
                <div className="w-24 shrink-0 hidden sm:block">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                    <div className="h-full rounded-full" style={{ width: `${entry.avg_score}%`, background: color }} />
                  </div>
                </div>
                <span className="text-sm font-bold tabular-nums shrink-0" style={{ color }}>{Math.round(entry.avg_score)}%</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
