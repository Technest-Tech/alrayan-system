'use client'
import { useState } from 'react'
import { ChevronDown, Users } from 'lucide-react'
import { formatMoney } from '@/lib/money'
import { useI18n } from '@/lib/system/i18n'
import { TierBadge, tierTint } from './TierBadge'
import type { SalaryTierStats } from '@/types/system/salaryTiers'

/** One rung: the hour range, the rate it pays, and how the month is sitting on it. */
function TierRow({ tier, total, maxTeachers, currency }: {
  tier: SalaryTierStats
  total: number
  maxTeachers: number
  currency: string
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

  const fill  = maxTeachers > 0 ? (tier.teacher_count / maxTeachers) * 100 : 0
  const empty = tier.teacher_count === 0

  return (
    <div
      className="rounded-2xl overflow-hidden transition-colors"
      style={{
        background: 'rgb(var(--surface-card))',
        border: '1px solid rgb(var(--border-default))',
        opacity: empty ? 0.65 : 1,
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        disabled={empty}
        className="w-full text-left px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-3 disabled:cursor-default"
      >
        {/* Level + hour range */}
        <div className="flex items-center gap-3 min-w-[180px]">
          <TierBadge index={tier.index} total={total} />
          <div>
            <p className="text-sm font-semibold tabular-nums">{tier.label}</p>
            <p className="text-[11px] opacity-50">{t('salaryTiers.hoursPerMonth')}</p>
          </div>
        </div>

        {/* Rate — the headline number of the rung */}
        <div className="min-w-[110px]">
          <p className="text-2xl font-bold tabular-nums leading-none">
            {formatMoney(tier.rate_minor, currency)}
          </p>
          <p className="text-[11px] opacity-50 mt-1">{t('salaryTiers.perHour')}</p>
        </div>

        {/* How many teachers landed here this month */}
        <div className="flex-1 min-w-[160px]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="inline-flex items-center gap-1.5 opacity-60">
              <Users size={12} />
              {t('salaryTiers.teachersOnTier', { n: String(tier.teacher_count) })}
            </span>
            <span className="tabular-nums opacity-40">{tier.share_pct}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgb(var(--surface-card-2))' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${fill}%`, background: `rgb(14 124 90 / ${tierTint(tier.index, total)})` }}
            />
          </div>
        </div>

        {/* Month totals for the rung */}
        <div className="text-right min-w-[120px]">
          <p className="text-sm font-semibold tabular-nums">{formatMoney(tier.total_salary_minor, currency)}</p>
          <p className="text-[11px] opacity-50 tabular-nums">
            {t('salaryTiers.hoursTotal', { n: tier.total_hours.toFixed(1) })}
          </p>
        </div>

        {!empty && (
          <ChevronDown size={16} className={`opacity-40 transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Who is on this rung */}
      {open && tier.teachers.length > 0 && (
        <div className="px-5 pb-4" style={{ borderTop: '1px solid rgb(var(--border-default))' }}>
          <table className="w-full text-sm mt-2">
            <tbody>
              {tier.teachers.map(teacher => (
                <tr key={teacher.teacher_id} className="border-b last:border-0" style={{ borderColor: 'rgb(var(--border-default))' }}>
                  <td className="py-2 font-medium">{teacher.name}</td>
                  <td className="py-2 text-right tabular-nums opacity-70">{teacher.hours.toFixed(2)}h</td>
                  <td className="py-2 text-right tabular-nums opacity-70">
                    {t('salaryTiers.lessonsN', { n: String(teacher.lessons) })}
                  </td>
                  <td className="py-2 text-right tabular-nums font-medium">
                    {formatMoney(teacher.salary_minor, currency)}
                  </td>
                  <td className="py-2 text-right text-xs opacity-50 tabular-nums whitespace-nowrap">
                    {teacher.hours_to_next > 0
                      ? t('salaryTiers.hoursToNextShort', { n: teacher.hours_to_next.toFixed(1) })
                      : t('salaryTiers.topTier')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export function TierLadder({ tiers, currency, loading }: {
  tiers: SalaryTierStats[]
  currency: string
  loading?: boolean
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-[88px] rounded-2xl animate-pulse" style={{ background: 'rgb(var(--surface-card-2))' }} />
        ))}
      </div>
    )
  }

  const maxTeachers = Math.max(1, ...tiers.map(tier => tier.teacher_count))

  return (
    <div className="space-y-3">
      {tiers.map(tier => (
        <TierRow key={tier.index} tier={tier} total={tiers.length} maxTeachers={maxTeachers} currency={currency} />
      ))}
    </div>
  )
}
