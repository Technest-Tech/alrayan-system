'use client'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useCancellations } from '@/hooks/system/useCancellations'
import { useI18n } from '@/lib/system/i18n'

export default function CancellationsPage() {
  const { t } = useI18n()
  const { data, isLoading } = useCancellations()

  return (
    <>
      <PageHeader title={t('accounting.cancellations.title')} description={t('accounting.cancellations.subtitle')} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <div className="rounded-2xl p-5" style={{ background: 'rgb(var(--surface-card))', border: '1px solid rgb(var(--border-default))' }}>
          <div className="text-3xl font-bold">{isLoading ? '…' : data?.total_cancelled ?? 0}</div>
          <div className="text-sm opacity-50 mt-1">{t('accounting.cancellations.totalCancelledPeriod')}</div>
        </div>
      </div>

      {data && Object.keys(data.by_reason).length > 0 && (
        <>
          <h2 className="mt-8 text-sm font-semibold mb-3">{t('accounting.cancellations.byReason')}</h2>
          <div className="space-y-2">
            {Object.entries(data.by_reason).sort(([,a],[,b]) => (b as number)-(a as number)).map(([reason, count]) => {
              const pct = data.total_cancelled > 0 ? Math.round(100 * (count as number) / data.total_cancelled) : 0
              return (
                <div key={reason} className="flex items-center gap-3">
                  <div className="w-44 text-sm truncate">{reason || t('accounting.common.unknown')}</div>
                  <div className="flex-1 rounded-full h-2" style={{ background: 'rgb(var(--surface-card-2))' }}>
                    <div className="h-2 rounded-full bg-orange-400" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-sm w-8 text-right">{count as number}</div>
                </div>
              )
            })}
          </div>
        </>
      )}

      <h2 className="mt-8 text-sm font-semibold mb-3">{t('accounting.cancellations.byTeacher')}</h2>
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgb(var(--border-default))' }}>
        <table className="w-full text-sm">
          <thead style={{ background: 'rgb(var(--surface-card-2))' }}>
            <tr>
              <th className="px-4 py-3 text-left font-medium">{t('common.teacher')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('accounting.cancellations.cancellations')}</th>
            </tr>
          </thead>
          <tbody>
            {data?.by_teacher.map((row, i) => (
              <tr key={i} style={{ borderTop: '1px solid rgb(var(--border-default))' }}>
                <td className="px-4 py-3">{row.teacher_name}</td>
                <td className="px-4 py-3 text-right">{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-sm font-semibold mb-3">{t('accounting.cancellations.monthlyRate')}</h2>
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgb(var(--border-default))' }}>
        <table className="w-full text-sm">
          <thead style={{ background: 'rgb(var(--surface-card-2))' }}>
            <tr>
              <th className="px-4 py-3 text-left font-medium">{t('accounting.common.month')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('accounting.cancellations.cancelled')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('accounting.cancellations.rate')}</th>
            </tr>
          </thead>
          <tbody>
            {data?.rate.map((row, i) => (
              <tr key={i} style={{ borderTop: '1px solid rgb(var(--border-default))' }}>
                <td className="px-4 py-3">{row.month_label}</td>
                <td className="px-4 py-3 text-right">{row.cancelled}</td>
                <td className="px-4 py-3 text-right">{row.cancellation_rate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
