'use client'
import { useMemo, useState } from 'react'
import { ArrowUpDown, EyeOff, Eye } from 'lucide-react'
import { formatMoney } from '@/lib/money'
import { useI18n } from '@/lib/system/i18n'
import type { TeacherBalance } from '@/types/system/analytics'

/** Rate at or below this (minor units / hour) is flagged low. Currency-relative; tuned for the €2.50–4.00 band. */
const LOW_RATE_MINOR = 300

type SortKey = 'name' | 'hours' | 'rate'
type SortDir = 'asc' | 'desc'

function RatePill({ minor, currency }: { minor: number; currency: string }) {
  const low = minor > 0 && minor < LOW_RATE_MINOR
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tabular-nums"
      style={low
        ? { background: 'rgb(var(--status-danger)/0.12)', color: 'rgb(var(--status-danger))' }
        : { background: 'rgb(var(--surface-card-2))', color: 'rgb(11 31 58)', border: '1px solid rgb(var(--border-default))' }}
    >
      {minor > 0 ? `${formatMoney(minor, currency)}/h` : '—'}
    </span>
  )
}

function SortHeader({ label, active, dir, align, onClick }: {
  label: string; active: boolean; dir: SortDir; align?: 'right'; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 font-medium hover:opacity-100 ${active ? 'opacity-100' : 'opacity-60'} ${align === 'right' ? 'flex-row-reverse' : ''}`}
    >
      {label}
      <ArrowUpDown size={12} className={active ? '' : 'opacity-40'} />
      {active && <span className="text-[9px]">{dir === 'asc' ? '▲' : '▼'}</span>}
    </button>
  )
}

export function TeacherBalanceTable({
  balances, currency, canEdit, onRowClick, onToggleExclude,
}: {
  balances: TeacherBalance[]
  currency: string
  canEdit: boolean
  onRowClick: (teacherId: number) => void
  onToggleExclude: (teacherId: number, excluded: boolean) => void
}) {
  const { t } = useI18n()
  const [sortKey, setSortKey] = useState<SortKey>('hours')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir(key === 'name' ? 'asc' : 'desc') }
  }

  const sorted = useMemo(() => {
    const arr = [...balances]
    arr.sort((a, b) => {
      let c = 0
      if (sortKey === 'name') c = a.name.localeCompare(b.name)
      else if (sortKey === 'hours') c = a.hours - b.hours
      else c = a.rate_minor - b.rate_minor
      return sortDir === 'asc' ? c : -c
    })
    return arr
  }, [balances, sortKey, sortDir])

  const totals = useMemo(() => {
    const counted = balances.filter(b => !b.excluded)
    const income = counted.reduce((s, b) => s + b.income_minor, 0)
    const hours = counted.reduce((s, b) => s + b.hours, 0)
    return {
      hours,
      avgRateMinor: hours > 0 ? Math.round(income / hours) : 0,
      excludedCount: balances.length - counted.length,
    }
  }, [balances])

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgb(var(--surface-card))', border: '1px solid rgb(var(--border-default))' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left" style={{ borderBottom: '1px solid rgb(var(--border-default))' }}>
              <th className="px-4 py-3"><SortHeader label={t('analytics.teacherName')} active={sortKey === 'name'} dir={sortDir} onClick={() => toggleSort('name')} /></th>
              <th className="px-4 py-3 text-right"><SortHeader label={t('analytics.hours')} active={sortKey === 'hours'} dir={sortDir} align="right" onClick={() => toggleSort('hours')} /></th>
              <th className="px-4 py-3 text-right"><SortHeader label={t('analytics.rate')} active={sortKey === 'rate'} dir={sortDir} align="right" onClick={() => toggleSort('rate')} /></th>
              {canEdit && <th className="px-2 py-3 w-8" />}
            </tr>
          </thead>
          <tbody>
            {sorted.map(b => (
              <tr
                key={b.teacher_id}
                onClick={() => onRowClick(b.teacher_id)}
                className="cursor-pointer transition-colors hover:bg-black/[0.02]"
                style={{ borderBottom: '1px solid rgb(var(--border-default))', opacity: b.excluded ? 0.5 : 1 }}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{b.name}</span>
                    {b.excluded && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: 'rgb(var(--surface-card-2))', color: 'rgb(var(--status-neutral))' }}>
                        <EyeOff size={10} /> {t('analytics.excludedFromTotals')}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{b.hours.toFixed(2)}h</td>
                <td className="px-4 py-3 text-right"><RatePill minor={b.rate_minor} currency={b.currency} /></td>
                {canEdit && (
                  <td className="px-2 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => onToggleExclude(b.teacher_id, !b.excluded)}
                      title={b.excluded ? t('analytics.includeInTotals') : t('analytics.excludeFromTotals')}
                      className="p-1 rounded hover:bg-black/5 opacity-40 hover:opacity-100"
                    >
                      {b.excluded ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold" style={{ background: 'rgb(var(--surface-card-2))' }}>
              <td className="px-4 py-3">{t('analytics.total')}</td>
              <td className="px-4 py-3 text-right tabular-nums">{totals.hours.toFixed(2)}h</td>
              <td className="px-4 py-3 text-right tabular-nums">{totals.avgRateMinor > 0 ? `${formatMoney(totals.avgRateMinor, currency)} *` : '—'}</td>
              {canEdit && <td />}
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="px-4 py-2 text-[11px] opacity-50 flex flex-wrap gap-x-4 gap-y-1" style={{ borderTop: '1px solid rgb(var(--border-default))' }}>
        <span>* {t('analytics.average')}</span>
        {totals.excludedCount > 0 && (
          <span className="inline-flex items-center gap-1"><EyeOff size={11} /> {t('analytics.usersExcluded', { count: String(totals.excludedCount) })}</span>
        )}
      </div>
    </div>
  )
}
