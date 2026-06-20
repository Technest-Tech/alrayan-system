'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { MoneyDisplay } from '@/components/system/primitives/MoneyDisplay'
import { useProfitLoss } from '@/hooks/system/useProfitLoss'
import { useI18n } from '@/lib/system/i18n'
import type { PnlMonthRow } from '@/types/system/pnl'

function Cell({ value, base }: { value: number; base: string }) {
  return <td className="px-3 py-2.5 text-right text-sm"><MoneyDisplay value={value} currency={base} /></td>
}

export default function ProfitLossPage() {
  const { t } = useI18n()
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const from = `${year}-01-01`
  const to   = `${year}-12-31`
  const { data, isLoading } = useProfitLoss(from, to)

  const rows: PnlMonthRow[] = data?.monthly ?? []
  const totals = data?.totals
  const base   = data?.base_currency ?? 'EGP'

  const rowDefs: Array<{ key: keyof PnlMonthRow; labelKey: string; cls?: string }> = [
    { key: 'revenue',    labelKey: 'accounting.profitLoss.revenue',   cls: 'font-medium' },
    { key: 'salaries',   labelKey: 'accounting.profitLoss.salaries',  cls: 'text-orange-600' },
    { key: 'bonuses',    labelKey: 'accounting.profitLoss.bonuses',   cls: 'text-orange-500' },
    { key: 'expenses',   labelKey: 'accounting.profitLoss.expenses',  cls: 'text-orange-500' },
    { key: 'net_profit', labelKey: 'accounting.profitLoss.netProfit', cls: 'font-bold text-green-600' },
  ]

  return (
    <>
      <PageHeader title={t('accounting.profitLoss.title')} description={t('accounting.profitLoss.subtitle', { currency: base })} />

      <div className="flex items-center gap-3 mt-6">
        <label className="text-sm font-medium">{t('accounting.common.year')}</label>
        <select value={year} onChange={e => setYear(Number(e.target.value))}
          className="rounded-lg border px-3 py-1.5 text-sm" style={{ borderColor: 'rgb(var(--border-default))' }}>
          {[currentYear, currentYear - 1, currentYear - 2].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl" style={{ border: '1px solid rgb(var(--border-default))' }}>
        <table className="min-w-full text-sm">
          <thead style={{ background: 'rgb(var(--surface-card-2))' }}>
            <tr>
              <th className="px-4 py-3 text-left font-medium w-28">{t('accounting.common.category')}</th>
              {rows.map(r => <th key={r.month} className="px-3 py-3 text-right font-medium whitespace-nowrap">{r.month_label}</th>)}
              <th className="px-4 py-3 text-right font-medium">{t('common.total')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} style={{ borderTop: '1px solid rgb(var(--border-default))' }}>
                {Array.from({ length: 14 }).map((_, j) => (
                  <td key={j} className="px-3 py-2.5"><div className="h-4 w-16 animate-pulse rounded" style={{ background: 'rgb(var(--surface-card-2))' }} /></td>
                ))}
              </tr>
            ))}
            {!isLoading && rowDefs.map(def => (
              <tr key={def.key} className={def.cls} style={{ borderTop: '1px solid rgb(var(--border-default))' }}>
                <td className="px-4 py-2.5 font-medium">{t(def.labelKey)}</td>
                {rows.map(r => <Cell key={r.month} value={r[def.key] as number} base={base} />)}
                <Cell value={(totals?.[def.key as keyof typeof totals] as number) ?? 0} base={base} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data?.note && <p className="mt-3 text-xs opacity-40">{data.note}</p>}
    </>
  )
}
