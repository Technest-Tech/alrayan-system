'use client'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { MoneyDisplay } from '@/components/system/primitives/MoneyDisplay'
import { useCollection } from '@/hooks/system/useCollection'
import { useI18n } from '@/lib/system/i18n'

export default function CollectionPage() {
  const { t } = useI18n()
  const { data, isLoading } = useCollection()

  return (
    <>
      <PageHeader title={t('accounting.collection.title')} description={t('accounting.collection.subtitle')} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
        {[
          { labelKey: 'accounting.collection.collectionRate', value: data ? `${data.collection_rate}%` : '—' },
          { labelKey: 'accounting.collection.avgDaysDelay',   value: data ? `${data.average_days_delay.toFixed(1)}d` : '—' },
          { labelKey: 'accounting.collection.paidOnTime',     value: String(data?.paid_on_time ?? '—') },
          { labelKey: 'accounting.collection.unpaid',         value: String(data?.unpaid ?? '—') },
        ].map(kpi => (
          <div key={kpi.labelKey} className="rounded-2xl p-5" style={{ background: 'rgb(var(--surface-card))', border: '1px solid rgb(var(--border-default))' }}>
            <div className="text-2xl font-bold">{isLoading ? '…' : kpi.value}</div>
            <div className="text-sm opacity-50 mt-1">{t(kpi.labelKey)}</div>
          </div>
        ))}
      </div>

      {data && Object.keys(data.outstanding_minor_by_currency).length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold mb-3">{t('accounting.collection.outstandingInvoices')}</h2>
          <div className="flex gap-4 flex-wrap">
            {Object.entries(data.outstanding_minor_by_currency).map(([cur, minor]) => (
              <div key={cur} className="rounded-xl px-4 py-3" style={{ background: 'rgb(var(--surface-card))', border: '1px solid rgb(var(--border-default))' }}>
                <span className="font-semibold"><MoneyDisplay value={Number(minor)} currency={cur} /></span>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="mt-8 text-sm font-semibold mb-3">{t('accounting.common.monthlyTrend')}</h2>
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgb(var(--border-default))' }}>
        <table className="w-full text-sm">
          <thead style={{ background: 'rgb(var(--surface-card-2))' }}>
            <tr>
              <th className="px-4 py-3 text-left font-medium">{t('accounting.common.month')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('accounting.collection.collectionRate')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('accounting.collection.avgDelay')}</th>
            </tr>
          </thead>
          <tbody>
            {data?.trend.map((row, i) => (
              <tr key={i} style={{ borderTop: '1px solid rgb(var(--border-default))' }}>
                <td className="px-4 py-3">{row.month}</td>
                <td className="px-4 py-3 text-right">{row.collection_rate}%</td>
                <td className="px-4 py-3 text-right">{row.avg_days_delay.toFixed(1)}d</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
