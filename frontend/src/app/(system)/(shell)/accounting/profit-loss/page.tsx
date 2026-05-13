'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { MoneyDisplay } from '@/components/system/primitives/MoneyDisplay'
import { useProfitLoss } from '@/hooks/system/useProfitLoss'
import type { PnlMonthRow } from '@/types/system/pnl'

function Cell({ value, base }: { value: number; base: string }) {
  return <td className="px-3 py-2.5 text-right text-sm"><MoneyDisplay value={value} currency={base} /></td>
}

export default function ProfitLossPage() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const from = `${year}-01-01`
  const to   = `${year}-12-31`
  const { data, isLoading } = useProfitLoss(from, to)

  const rows: PnlMonthRow[] = data?.monthly ?? []
  const totals = data?.totals
  const base   = data?.base_currency ?? 'EGP'

  const rowDefs: Array<{ key: keyof PnlMonthRow; label: string; cls?: string }> = [
    { key: 'revenue',    label: 'Revenue',    cls: 'font-medium' },
    { key: 'salaries',   label: 'Salaries',   cls: 'text-orange-600' },
    { key: 'bonuses',    label: 'Bonuses',    cls: 'text-orange-500' },
    { key: 'expenses',   label: 'Expenses',   cls: 'text-orange-500' },
    { key: 'net_profit', label: 'Net Profit', cls: 'font-bold text-green-600' },
  ]

  return (
    <>
      <PageHeader title="Profit & Loss" description={`Values in ${base}. FX at today's rate.`} />

      <div className="flex items-center gap-3 mt-6">
        <label className="text-sm font-medium">Year</label>
        <select value={year} onChange={e => setYear(Number(e.target.value))}
          className="rounded-lg border px-3 py-1.5 text-sm" style={{ borderColor: 'rgb(var(--border-default))' }}>
          {[currentYear, currentYear - 1, currentYear - 2].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl" style={{ border: '1px solid rgb(var(--border-default))' }}>
        <table className="min-w-full text-sm">
          <thead style={{ background: 'rgb(var(--surface-card-2))' }}>
            <tr>
              <th className="px-4 py-3 text-left font-medium w-28">Category</th>
              {rows.map(r => <th key={r.month} className="px-3 py-3 text-right font-medium whitespace-nowrap">{r.month_label}</th>)}
              <th className="px-4 py-3 text-right font-medium">Total</th>
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
                <td className="px-4 py-2.5 font-medium">{def.label}</td>
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
