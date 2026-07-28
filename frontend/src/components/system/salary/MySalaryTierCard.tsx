'use client'
import { TrendingUp } from 'lucide-react'
import { formatMoney } from '@/lib/money'
import { useI18n } from '@/lib/system/i18n'
import { useMySalaryTier } from '@/hooks/system/useSalaryTiers'
import { TierBadge, tierTint } from './TierBadge'
import type { MySalaryTier } from '@/types/system/salaryTiers'

function rangeLabel(min: number, max: number | null): string {
  return max === null ? `${min}h+` : `${min}–${max}h`
}

/**
 * The teacher's own rung on the ladder: hours taught this month, the rate they
 * have earned for the whole month, and how many hours away the next rate is.
 */
export function MySalaryTierCard({ month, compact = false }: { month?: string; compact?: boolean }) {
  const { t } = useI18n()
  const { data, isLoading, error } = useMySalaryTier(month)

  if (isLoading) {
    return <div className="h-[260px] rounded-2xl animate-pulse" style={{ background: 'rgb(var(--surface-card-2))' }} />
  }
  if (error || !data) return null

  const d: MySalaryTier = data
  const total = d.ladder.length

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgb(var(--surface-card))', border: '1px solid rgb(var(--border-default))' }}>
      {/* Current level */}
      <div className="px-5 py-5" style={{ background: `rgb(14 124 90 / ${Math.min(tierTint(d.tier.index, total), 0.16)})` }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium opacity-50 uppercase tracking-wide">{t('salaryTiers.myLevel')}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <TierBadge index={d.tier.index} total={total} />
              <span className="text-sm opacity-60 tabular-nums">{rangeLabel(d.tier.min_hours, d.tier.max_hours)}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold tabular-nums leading-none">{formatMoney(d.rate_minor, d.currency)}</p>
            <p className="text-[11px] opacity-50 mt-1">{t('salaryTiers.perHour')}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5">
          <div>
            <p className="text-xl font-bold tabular-nums">{d.hours.toFixed(2)}h</p>
            <p className="text-[11px] opacity-50">{t('salaryTiers.hoursThisMonth')}</p>
          </div>
          <div>
            <p className="text-xl font-bold tabular-nums">{d.lessons}</p>
            <p className="text-[11px] opacity-50">{t('salaryTiers.lessonsThisMonth')}</p>
          </div>
          <div>
            <p className="text-xl font-bold tabular-nums">{formatMoney(d.salary_minor, d.currency)}</p>
            <p className="text-[11px] opacity-50">{t('salaryTiers.earnedSoFar')}</p>
          </div>
        </div>
      </div>

      {/* Distance to the next rung */}
      <div className="px-5 py-4" style={{ borderTop: '1px solid rgb(var(--border-default))' }}>
        {d.next_tier ? (
          <>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <TrendingUp size={13} />
                {t('salaryTiers.hoursToNext', {
                  n: d.hours_to_next.toFixed(1),
                  rate: formatMoney(d.next_tier.rate_minor, d.currency),
                })}
              </span>
              <span className="opacity-40 tabular-nums">{d.progress_pct}%</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgb(var(--surface-card-2))' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${d.progress_pct}%`, background: 'rgb(14 124 90)' }}
              />
            </div>
            <div className="flex justify-between text-[10px] opacity-40 mt-1.5 tabular-nums">
              <span>{d.tier.min_hours}h</span>
              <span>{d.next_tier.min_hours}h</span>
            </div>
          </>
        ) : (
          <p className="text-sm font-medium text-center py-1">{t('salaryTiers.atTopTier')}</p>
        )}
      </div>

      {/* The whole ladder, with the teacher's rung marked */}
      {!compact && <div className="px-5 py-4" style={{ borderTop: '1px solid rgb(var(--border-default))' }}>
        <p className="text-xs font-semibold uppercase tracking-wide opacity-40 mb-2.5">{t('salaryTiers.theLadder')}</p>
        <div className="space-y-1">
          {d.ladder.map(tier => {
            const current = tier.index === d.tier.index
            const passed  = tier.index < d.tier.index
            return (
              <div
                key={tier.index}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-sm"
                style={{
                  background: current ? `rgb(14 124 90 / 0.10)` : 'transparent',
                  fontWeight: current ? 600 : 400,
                  opacity: current ? 1 : passed ? 0.75 : 0.45,
                }}
              >
                <span className="tabular-nums">{rangeLabel(tier.min_hours, tier.max_hours)}</span>
                <span className="tabular-nums">{formatMoney(tier.rate_minor, tier.currency)}/h</span>
              </div>
            )
          })}
        </div>
      </div>}

      {/* Recent months — the ladder as a track record */}
      {!compact && d.history.length > 0 && (
        <div className="px-5 py-4" style={{ borderTop: '1px solid rgb(var(--border-default))' }}>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-40 mb-2.5">{t('salaryTiers.recentMonths')}</p>
          <div className="space-y-1.5">
            {[...d.history].reverse().map(point => (
              <div key={point.month} className="flex items-center justify-between text-sm">
                <span className="opacity-60">{point.label}</span>
                <div className="flex items-center gap-2">
                  <span className="tabular-nums opacity-60">{point.hours.toFixed(1)}h</span>
                  <TierBadge index={point.tier_index} total={total} size="sm" />
                  <span className="tabular-nums font-medium w-20 text-right">
                    {formatMoney(point.salary_minor, d.currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
