'use client'
import { useState } from 'react'
import { Trophy, Crown } from 'lucide-react'
import { useI18n } from '@/lib/system/i18n'
import type { QcTopTeacher } from '@/types/system/qualityControl'
import { ratingColor, ratingFor } from '@/types/system/qualityControl'
import { RangeToggle, Avatar, type QcRange } from './RangeToggle'

const BORDER = 'rgb(var(--border-default,229 233 240))'
const NAVY   = 'rgb(11 31 58)'
const MUTED  = 'rgb(90 100 112)'
const GOLD   = '#C9A24B'

// Podium display order: 2nd, 1st, 3rd — with the winner tallest in the centre.
const SLOTS: { rank: number; order: number; height: number; size: number }[] = [
  { rank: 2, order: 0, height: 56, size: 44 },
  { rank: 1, order: 1, height: 84, size: 60 },
  { rank: 3, order: 2, height: 40, size: 44 },
]

export function TopPerformersPanel({ thisMonth, allTime }: { thisMonth: QcTopTeacher[]; allTime: QcTopTeacher[] }) {
  const { t } = useI18n()
  const [range, setRange] = useState<QcRange>('this_month')
  const list = range === 'this_month' ? thisMonth : allTime

  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: BORDER, background: 'rgb(var(--surface-card,255 255 255))' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy size={16} style={{ color: GOLD }} />
          <h3 className="text-sm font-semibold" style={{ color: NAVY }}>{t('qualityControl.topPerformers.title')}</h3>
        </div>
        <RangeToggle value={range} onChange={setRange} />
      </div>

      {list.length === 0 ? (
        <p className="py-10 text-center text-sm" style={{ color: MUTED }}>{t('qualityControl.topPerformers.empty')}</p>
      ) : (
        <div className="flex items-end justify-center gap-4 pt-3">
          {SLOTS.map(slot => {
            const entry = list[slot.rank - 1]
            if (!entry) return <div key={slot.rank} className="w-16" />
            const color = ratingColor(ratingFor(entry.avg_score))
            return (
              <div key={slot.rank} className="flex flex-col items-center" style={{ order: slot.order }}>
                <div className="relative">
                  {slot.rank === 1 && <Crown size={16} className="absolute -top-4 left-1/2 -translate-x-1/2" style={{ color: GOLD }} />}
                  <Avatar name={entry.teacher_name} size={slot.size} ring={slot.rank === 1 ? GOLD : undefined} />
                </div>
                <p className="mt-2 text-xs font-semibold text-center max-w-[88px] truncate" style={{ color: NAVY }}>{entry.teacher_name ?? '—'}</p>
                <p className="text-sm font-bold tabular-nums" style={{ color }}>{Math.round(entry.avg_score)}%</p>
                <p className="text-[11px]" style={{ color: MUTED }}>{t('qualityControl.topPerformers.evals', { count: String(entry.evaluations_count) })}</p>
                <div
                  className="mt-1 w-14 rounded-t-lg grid place-items-center text-sm font-bold"
                  style={{ height: slot.height, background: 'rgba(201,162,75,0.12)', color: GOLD }}
                >
                  {slot.rank}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
