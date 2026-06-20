'use client'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useTrials } from '@/hooks/system/useTrials'
import { useI18n } from '@/lib/system/i18n'

export default function TrialsPage() {
  const { t } = useI18n()
  const { data, isLoading } = useTrials()

  const steps = [
    { labelKey: 'accounting.trials.booked',       value: data?.total_booked   ?? 0, color: '#6366f1' },
    { labelKey: 'accounting.trials.completed',    value: data?.completed      ?? 0, color: '#8b5cf6' },
    { labelKey: 'accounting.trials.enrolled',     value: data?.enrolled       ?? 0, color: '#22c55e' },
    { labelKey: 'accounting.trials.notConverted', value: data?.not_converted  ?? 0, color: '#f97316' },
  ]

  return (
    <>
      <PageHeader title={t('accounting.trials.title')} description={t('accounting.trials.subtitle')} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
        {steps.map(s => (
          <div key={s.labelKey} className="rounded-2xl p-5" style={{ background: 'rgb(var(--surface-card))', border: '1px solid rgb(var(--border-default))' }}>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{isLoading ? '…' : s.value}</div>
            <div className="text-sm opacity-50 mt-1">{t(s.labelKey)}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className="text-3xl font-bold text-green-600">{data?.conversion_rate ?? 0}%</span>
        <span className="text-sm opacity-50">{t('accounting.trials.conversionRate')}</span>
      </div>

      {data?.best_teacher && (
        <p className="mt-2 text-sm opacity-60">
          {t('accounting.trials.bestTeacher')}: <strong>{data.best_teacher.name}</strong> ({t('accounting.trials.enrolledCount', { count: String(data.best_teacher.enrolled_count) })})
        </p>
      )}

      <h2 className="mt-8 text-sm font-semibold mb-3">{t('accounting.common.monthlyTrend')}</h2>
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgb(var(--border-default))' }}>
        <table className="w-full text-sm">
          <thead style={{ background: 'rgb(var(--surface-card-2))' }}>
            <tr>
              <th className="px-4 py-3 text-left font-medium">{t('accounting.common.month')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('accounting.trials.booked')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('accounting.trials.enrolled')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('accounting.trials.conversion')}</th>
            </tr>
          </thead>
          <tbody>
            {data?.monthly_trend.map((row, i) => (
              <tr key={i} style={{ borderTop: '1px solid rgb(var(--border-default))' }}>
                <td className="px-4 py-3">{row.month}</td>
                <td className="px-4 py-3 text-right">{row.booked}</td>
                <td className="px-4 py-3 text-right">{row.enrolled}</td>
                <td className="px-4 py-3 text-right">{row.conversion_rate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
