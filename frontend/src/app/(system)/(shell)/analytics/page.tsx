'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { KpiCard } from '@/components/system/dashboard/KpiCard'
import { MonthPicker } from '@/components/system/payroll/MonthPicker'
import { HoursAcrossMonths, TopTeachersChart, BestDaysChart } from '@/components/system/analytics/AnalyticsCharts'
import { TeacherBalanceTable } from '@/components/system/analytics/TeacherBalanceTable'
import { TeacherMonthModal } from '@/components/system/analytics/TeacherMonthModal'
import { useAnalytics, useSetTeacherExclusion } from '@/hooks/system/useAnalytics'
import { useSystemUser } from '@/components/system/shell/SystemShell'
import { can } from '@/lib/system/permissions'
import { formatMoney } from '@/lib/money'
import { useI18n } from '@/lib/system/i18n'

function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function AnalyticsPage() {
  const { t } = useI18n()
  const user = useSystemUser()
  const canEdit = !!user && can(user, 'teachers.edit')

  const [month, setMonth] = useState(currentMonth())
  const [teacherId, setTeacherId] = useState<number | 'all'>('all')
  const [modalTeacher, setModalTeacher] = useState<number | null>(null)

  const { data, isLoading } = useAnalytics(month, teacherId)
  const setExclusion = useSetTeacherExclusion()

  const kpis = data?.kpis
  const currency = data?.currency ?? 'EUR'

  async function handleToggleExclude(id: number, excluded: boolean) {
    try {
      await setExclusion.mutateAsync({ teacherId: id, excluded })
      toast.success(excluded ? t('analytics.teacherExcluded') : t('analytics.teacherIncluded'))
    } catch {
      toast.error(t('analytics.updateError'))
    }
  }

  return (
    <>
      <PageHeader
        title={t('analytics.title')}
        description={t('analytics.description')}
        actions={<MonthPicker value={month} onChange={setMonth} />}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label={t('analytics.totalIncome')}
          value={kpis ? formatMoney(kpis.total_income_minor, currency) : '—'}
          loading={isLoading}
        />
        <KpiCard
          label={t('analytics.totalHours')}
          value={kpis ? `${kpis.total_hours.toFixed(2)}h` : '—'}
          sub={kpis ? t('analytics.hoursAverage', { n: kpis.avg_hours_per_teacher.toFixed(2) }) : undefined}
          loading={isLoading}
        />
        <KpiCard
          label={t('analytics.avgRate')}
          value={kpis ? `${formatMoney(kpis.avg_rate_minor, currency)}/h` : '—'}
          loading={isLoading}
        />
      </div>

      {/* Charts */}
      <div className="mt-6 space-y-4">
        <HoursAcrossMonths
          series={data?.hours_by_month.series ?? []}
          allTimeTotal={data?.hours_by_month.all_time_total ?? 0}
          generatedAt={data?.generated_at}
          teachers={data?.teachers ?? []}
          teacherId={teacherId}
          onTeacherChange={setTeacherId}
          loading={isLoading}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TopTeachersChart data={data?.top_teachers ?? []} loading={isLoading} />
          <BestDaysChart data={data?.best_days ?? []} totalLessons={kpis?.total_lessons ?? 0} loading={isLoading} />
        </div>
      </div>

      {/* Teacher Balance & Earnings */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-3">{t('analytics.teacherBalanceEarnings')}</h2>
        {isLoading ? (
          <div className="h-96 rounded-2xl animate-pulse" style={{ background: 'rgb(var(--surface-card-2))' }} />
        ) : (
          <TeacherBalanceTable
            balances={data?.teacher_balances ?? []}
            currency={currency}
            canEdit={canEdit}
            onRowClick={setModalTeacher}
            onToggleExclude={handleToggleExclude}
          />
        )}
      </div>

      <TeacherMonthModal
        teacherId={modalTeacher}
        month={month}
        open={modalTeacher != null}
        onClose={() => setModalTeacher(null)}
      />
    </>
  )
}
