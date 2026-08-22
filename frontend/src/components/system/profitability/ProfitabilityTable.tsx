'use client'
import { useMemo, useState } from 'react'
import { ArrowUpDown, EyeOff, Megaphone, HeartHandshake, PiggyBank, TriangleAlert } from 'lucide-react'
import { formatMoney } from '@/lib/money'
import { useI18n } from '@/lib/system/i18n'
import type { ProfitabilityReport, ProfitabilityRow } from '@/types/system/profitability'

type SortKey = 'name' | 'income' | 'hours' | 'rate' | 'cost' | 'margin' | 'net'
type SortDir = 'asc' | 'desc'

/** Icons echo the old report's emoji column headers, one per deduction slot. */
const DEDUCTION_ICONS = [Megaphone, HeartHandshake, PiggyBank]

function SortHeader({ label, active, dir, onClick }: {
  label: string; active: boolean; dir: SortDir; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 font-medium whitespace-nowrap ${active ? 'opacity-100' : 'opacity-60 hover:opacity-90'}`}
    >
      {label}
      <ArrowUpDown size={11} className={active ? '' : 'opacity-40'} />
      {active && <span className="text-[9px]">{dir === 'asc' ? '▲' : '▼'}</span>}
    </button>
  )
}

/**
 * A deduction column header: its label plus the percentage, editable in place
 * for users who may change settings. Committing on blur/Enter keeps us from
 * firing a save (and a full report recompute) on every keystroke.
 */
function PercentHeader({ label, percent, index, editable, onCommit }: {
  label: string
  percent: number
  index: number
  editable: boolean
  onCommit: (percent: number) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const Icon = DEDUCTION_ICONS[index] ?? PiggyBank

  function commit() {
    if (draft === null) return
    const next = Number(draft)
    setDraft(null)
    if (Number.isFinite(next) && next >= 0 && next <= 100 && next !== percent) onCommit(next)
  }

  return (
    <div className="inline-flex items-center gap-1.5 justify-end">
      <Icon size={13} className="opacity-50 shrink-0" />
      <span className="font-medium">{label}</span>
      {editable ? (
        <span className="inline-flex items-center gap-0.5 text-xs">
          (
          <input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={draft ?? String(percent)}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              if (e.key === 'Escape') setDraft(null)
            }}
            className="w-12 rounded border px-1 py-0.5 text-right tabular-nums"
            style={{ borderColor: 'rgb(var(--border-default))', background: 'rgb(var(--surface-card))' }}
          />
          %)
        </span>
      ) : (
        <span className="text-xs opacity-60 tabular-nums">({percent}%)</span>
      )}
    </div>
  )
}

function Money({ minor, currency, className = '' }: { minor: number; currency: string; className?: string }) {
  return <span className={`tabular-nums ${className}`}>{formatMoney(minor, currency)}</span>
}

export function ProfitabilityTable({ report, canEditSettings, onPercentChange, onRowClick }: {
  report: ProfitabilityReport
  canEditSettings: boolean
  onPercentChange: (key: string, percent: number) => void
  onRowClick?: (teacherId: number) => void
}) {
  const { t } = useI18n()
  const [sortKey, setSortKey] = useState<SortKey>('net')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const { rows, totals, currency, cost_currency: costCcy, deductions } = report

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir(key === 'name' ? 'asc' : 'desc') }
  }

  const sorted = useMemo(() => {
    const value = (r: ProfitabilityRow): number | string => {
      switch (sortKey) {
        case 'name':   return r.name
        case 'income': return r.income_minor
        case 'hours':  return r.hours
        case 'rate':   return r.rate_minor
        case 'cost':   return r.cost_report_minor
        case 'margin': return r.gross_margin_minor
        default:       return r.net_profit_minor
      }
    }
    return [...rows].sort((a, b) => {
      const av = value(a), bv = value(b)
      const c = typeof av === 'string' ? av.localeCompare(bv as string) : av - (bv as number)
      return sortDir === 'asc' ? c : -c
    })
  }, [rows, sortKey, sortDir])

  const colCount = 7 + deductions.length

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgb(var(--surface-card))', border: '1px solid rgb(var(--border-default))' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid rgb(var(--border-default))', background: 'rgb(var(--surface-card-2))' }}>
              <th className="px-4 py-3 text-left"><SortHeader label={t('profitability.teacher')} active={sortKey === 'name'} dir={sortDir} onClick={() => toggleSort('name')} /></th>
              <th className="px-4 py-3 text-right"><SortHeader label={t('profitability.income')} active={sortKey === 'income'} dir={sortDir} onClick={() => toggleSort('income')} /></th>
              <th className="px-4 py-3 text-right"><SortHeader label={t('profitability.hours')} active={sortKey === 'hours'} dir={sortDir} onClick={() => toggleSort('hours')} /></th>
              <th className="px-4 py-3 text-right"><SortHeader label={t('profitability.rate')} active={sortKey === 'rate'} dir={sortDir} onClick={() => toggleSort('rate')} /></th>
              <th className="px-4 py-3 text-right"><SortHeader label={t('profitability.teacherCost')} active={sortKey === 'cost'} dir={sortDir} onClick={() => toggleSort('cost')} /></th>
              <th className="px-4 py-3 text-right"><SortHeader label={t('profitability.grossMargin')} active={sortKey === 'margin'} dir={sortDir} onClick={() => toggleSort('margin')} /></th>
              {deductions.map((d, i) => (
                <th key={d.key} className="px-4 py-3 text-right">
                  <PercentHeader
                    label={d.label}
                    percent={d.percent}
                    index={i}
                    editable={canEditSettings}
                    onCommit={pct => onPercentChange(d.key, pct)}
                  />
                </th>
              ))}
              <th className="px-4 py-3 text-right"><SortHeader label={t('profitability.netProfit')} active={sortKey === 'net'} dir={sortDir} onClick={() => toggleSort('net')} /></th>
            </tr>
          </thead>

          <tbody>
            {sorted.length === 0 && (
              <tr><td colSpan={colCount} className="px-4 py-10 text-center opacity-50">{t('profitability.noData')}</td></tr>
            )}
            {sorted.map(r => (
              <tr
                key={r.teacher_id}
                onClick={() => onRowClick?.(r.teacher_id)}
                className={`transition-colors hover:bg-black/[0.02] ${onRowClick ? 'cursor-pointer' : ''}`}
                style={{ borderBottom: '1px solid rgb(var(--border-default))', opacity: r.excluded ? 0.5 : 1 }}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium whitespace-nowrap">{r.name}</span>
                    {r.excluded && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: 'rgb(var(--surface-card-2))', color: 'rgb(var(--status-neutral))' }}>
                        <EyeOff size={10} /> {t('analytics.excludedFromTotals')}
                      </span>
                    )}
                    {r.partial && (
                      <span title={t('profitability.partialRow')}><TriangleAlert size={12} className="text-amber-500" /></span>
                    )}
                  </div>
                </td>

                {/* Income — converted, with the currencies it was actually billed in underneath. */}
                <td className="px-4 py-3 text-right">
                  <Money minor={r.income_minor} currency={currency} />
                  {r.income_by_currency.length > 0 && (
                    <div className="text-[10px] opacity-45 tabular-nums">
                      {r.income_by_currency.map(s => formatMoney(s.amount_minor, s.currency)).join(' · ')}
                    </div>
                  )}
                </td>

                <td className="px-4 py-3 text-right tabular-nums">{r.hours.toFixed(1)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatMoney(r.rate_minor, r.rate_currency)}</td>

                {/* Teacher cost — the salary-ladder payout, shown in its own currency too. */}
                <td className="px-4 py-3 text-right">
                  <Money minor={r.cost_report_minor} currency={currency} />
                  {costCcy !== currency && (
                    <div className="text-[10px] opacity-45 tabular-nums">{formatMoney(r.cost_minor, costCcy)}</div>
                  )}
                </td>

                <td className="px-4 py-3 text-right"><Money minor={r.gross_margin_minor} currency={currency} className="font-medium" /></td>

                {r.deductions.map(d => (
                  <td key={d.key} className="px-4 py-3 text-right opacity-70"><Money minor={d.amount_minor} currency={currency} /></td>
                ))}

                <td className="px-4 py-3 text-right">
                  <Money
                    minor={r.net_profit_minor}
                    currency={currency}
                    className={`font-bold ${r.net_profit_minor >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                  />
                  {r.margin_pct !== null && (
                    <div className="text-[10px] opacity-45 tabular-nums">{r.margin_pct}% {t('profitability.marginShort')}</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr className="font-semibold text-white" style={{ background: 'rgb(11 31 58)' }}>
              <td className="px-4 py-4">{t('profitability.totals')}</td>
              <td className="px-4 py-4 text-right"><Money minor={totals.income_minor} currency={currency} /></td>
              <td className="px-4 py-4 text-right tabular-nums">{totals.hours.toFixed(1)}</td>
              <td className="px-4 py-4 text-right tabular-nums">
                {totals.avg_rate_minor > 0 ? `${formatMoney(totals.avg_rate_minor, costCcy)} *` : '—'}
              </td>
              <td className="px-4 py-4 text-right"><Money minor={totals.cost_minor} currency={currency} /></td>
              <td className="px-4 py-4 text-right"><Money minor={totals.gross_margin_minor} currency={currency} /></td>
              {totals.deductions.map(d => (
                <td key={d.key} className="px-4 py-4 text-right"><Money minor={d.amount_minor} currency={currency} /></td>
              ))}
              <td className="px-4 py-4 text-right">
                <Money minor={totals.net_profit_minor} currency={currency} className="text-emerald-300 text-base" />
                {totals.partner_share_minor !== null && (
                  <div className="text-[11px] font-normal opacity-70 tabular-nums">
                    {formatMoney(totals.partner_share_minor, currency)} {t('profitability.perPartner', { count: String(totals.partner_count) })}
                  </div>
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="px-4 py-2 text-[11px] opacity-50 flex flex-wrap gap-x-4 gap-y-1" style={{ borderTop: '1px solid rgb(var(--border-default))' }}>
        <span>* {t('profitability.blendedRate')}</span>
        <span>{t('profitability.percentagesNote')}</span>
      </div>
    </div>
  )
}
