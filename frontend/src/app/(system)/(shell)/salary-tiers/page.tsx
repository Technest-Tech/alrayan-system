'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { KpiCard } from '@/components/system/dashboard/KpiCard'
import { MonthPicker } from '@/components/system/payroll/MonthPicker'
import { TierLadder } from '@/components/system/salary/TierLadder'
import { useSalaryTiers } from '@/hooks/system/useSalaryTiers'
import { formatMoney } from '@/lib/money'
import { useI18n } from '@/lib/system/i18n'

function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function SalaryTiersPage() {
  const { t } = useI18n()
  const [month, setMonth] = useState(currentMonth())
  const { data, isLoading, error } = useSalaryTiers(month)
  const kpis = data?.kpis
  const currency = data?.currency ?? 'USD'

  return (
    <>
      <PageHeader
        title={t('salaryTiers.title')}
        description={t('salaryTiers.description')}
        actions={<MonthPicker value={month} onChange={setMonth} />}
      />

      {error ? (
        <div
          className="rounded-xl px-4 py-3 text-sm text-red-700"
          style={{ background: 'rgb(var(--status-danger) / 0.08)' }}
        >
          {t('salaryTiers.loadError')}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              label={t('salaryTiers.activeTeachers')}
              value={kpis?.active_teachers ?? 0}
              sub={kpis ? t('salaryTiers.ofTeachers', { n: String(kpis.teacher_count) }) : undefined}
              loading={isLoading}
            />
            <KpiCard
              label={t('salaryTiers.totalHours')}
              value={kpis ? `${kpis.total_hours.toFixed(2)}h` : '—'}
              sub={kpis ? t('salaryTiers.averageHours', { n: kpis.avg_hours.toFixed(2) }) : undefined}
              loading={isLoading}
            />
            <KpiCard
              label={t('salaryTiers.estimatedPayroll')}
              value={kpis ? formatMoney(kpis.total_salary_minor, currency) : '—'}
              sub={t('salaryTiers.beforeAdjustments')}
              loading={isLoading}
            />
            <KpiCard
              label={t('salaryTiers.averageRate')}
              value={kpis ? `${formatMoney(kpis.avg_rate_minor, currency)}/h` : '—'}
              sub={kpis?.top_tier_index != null
                ? t('salaryTiers.highestReached', { n: String(kpis.top_tier_index + 1) })
                : t('salaryTiers.noHoursYet')}
              loading={isLoading}
            />
          </div>

          <section className="mt-7">
            <div className="mb-3">
              <h2 className="text-lg font-semibold">{t('salaryTiers.ladderTitle')}</h2>
              <p className="text-sm opacity-50 mt-1">{t('salaryTiers.ladderDescription')}</p>
            </div>
            <TierLadder
              tiers={data?.tiers ?? []}
              currency={currency}
              loading={isLoading}
            />
          </section>
        </>
      )}
    </>
  )
}
