'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { MoneyDisplay } from '@/components/system/primitives/MoneyDisplay'
import { useRevenue } from '@/hooks/system/useRevenue'
import { useI18n } from '@/lib/system/i18n'

function rangeDefaults() {
  const to   = new Date()
  const from = new Date(to.getFullYear(), to.getMonth() - 11, 1)
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) }
}

export default function RevenuePage() {
  const { t } = useI18n()
  const [range] = useState(rangeDefaults)
  const { data, isLoading } = useRevenue(range.from, range.to)

  return (
    <>
      <PageHeader title={t('accounting.revenue.title')} description={t('accounting.revenue.subtitle')} />

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isLoading && [1, 2, 3].map(i => (
          <div key={i} className="rounded-2xl p-5 animate-pulse h-20" style={{ background: 'rgb(var(--surface-card))' }} />
        ))}
        {data?.totals.map(row => (
          <div key={row.currency} className="rounded-2xl p-5" style={{ background: 'rgb(var(--surface-card))', border: '1px solid rgb(var(--border-default))' }}>
            <div className="text-2xl font-bold"><MoneyDisplay value={Number(row.total_minor)} currency={row.currency} /></div>
            <div className="text-sm opacity-50 mt-1">{t('accounting.revenue.paymentsCount', { count: String(row.payment_count) })} · {row.currency}</div>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-sm font-semibold mb-3">{t('accounting.revenue.monthlyBreakdown')}</h2>
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgb(var(--border-default))' }}>
        <table className="w-full text-sm">
          <thead style={{ background: 'rgb(var(--surface-card-2))' }}>
            <tr>
              <th className="px-4 py-3 text-left font-medium">{t('accounting.common.month')}</th>
              <th className="px-4 py-3 text-left font-medium">{t('common.currency')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('common.total')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('accounting.revenue.egpEquiv')}</th>
            </tr>
          </thead>
          <tbody>
            {data?.by_month.map((row, i) => (
              <tr key={i} style={{ borderTop: '1px solid rgb(var(--border-default))' }}>
                <td className="px-4 py-3">{`${row.year}-${String(row.month).padStart(2,'0')}`}</td>
                <td className="px-4 py-3">{row.currency}</td>
                <td className="px-4 py-3 text-right"><MoneyDisplay value={Number(row.total_minor)} currency={row.currency} /></td>
                <td className="px-4 py-3 text-right opacity-60"><MoneyDisplay value={Number(row.base_minor)} currency="EGP" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-sm font-semibold mb-3">{t('accounting.revenue.byCourse')}</h2>
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgb(var(--border-default))' }}>
        <table className="w-full text-sm">
          <thead style={{ background: 'rgb(var(--surface-card-2))' }}>
            <tr>
              <th className="px-4 py-3 text-left font-medium">{t('common.course')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('common.total')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('accounting.revenue.payments')}</th>
            </tr>
          </thead>
          <tbody>
            {data?.by_course.map((row, i) => (
              <tr key={i} style={{ borderTop: '1px solid rgb(var(--border-default))' }}>
                <td className="px-4 py-3">{row.course_name}</td>
                <td className="px-4 py-3 text-right"><MoneyDisplay value={Number(row.total_minor)} currency={row.currency} /></td>
                <td className="px-4 py-3 text-right">{row.payment_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
