'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { KpiCard } from '@/components/system/dashboard/KpiCard'
import { MonthPicker } from '@/components/system/payroll/MonthPicker'
import { HoursAcrossMonths, TopTeachersChart, BestDaysChart } from '@/components/system/analytics/AnalyticsCharts'
import { TeacherBalanceTable } from '@/components/system/analytics/TeacherBalanceTable'
import { TeacherMonthModal } from '@/components/system/analytics/TeacherMonthModal'
import { FxRatesStrip } from '@/components/system/analytics/FxRatesStrip'
import { useAnalytics, useSetTeacherExclusion } from '@/hooks/system/useAnalytics'
import { useSystemUser } from '@/components/system/shell/SystemShell'
import { can } from '@/lib/system/permissions'
import { formatMoney } from '@/lib/money'
import { useI18n } from '@/lib/system/i18n'
import type { CurrencyTotal } from '@/types/system/analytics'

function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** KPI card that lists a money figure per currency (never converted to a single currency). */
function MoneyKpiCard({ label, totals, field, suffix = '', loading }: {
  label: string
  totals: CurrencyTotal[]
  field: 'income_minor' | 'avg_rate_minor'
  suffix?: string
  loading?: boolean
}) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-1" style={{ background: 'rgb(var(--surface-card))', border: '1px solid rgb(var(--border-default))' }}>
      <p className="text-xs font-medium opacity-50 uppercase tracking-wide">{label}</p>
      {loading ? (
        <div className="h-8 w-24 rounded-lg bg-black/5 animate-pulse" />
      ) : totals.length === 0 ? (
        <p className="text-3xl font-bold tabular-nums">—</p>
      ) : totals.length === 1 ? (
        <p className="text-3xl font-bold tabular-nums">{formatMoney(totals[0][field], totals[0].currency)}{suffix}</p>
      ) : (
        <div className="flex flex-col gap-0.5 mt-0.5">
          {totals.map(tc => (
            <p key={tc.currency} className="text-xl font-bold tabular-nums leading-tight">
              {formatMoney(tc[field], tc.currency)}{suffix}
            </p>
          ))}
        </div>
      )}
    </div>
  )
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
  const totals = kpis?.totals_by_currency ?? []

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

      {/* KPIs — money stays in each teacher's own currency */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MoneyKpiCard label={t('analytics.totalIncome')} totals={totals} field="income_minor" loading={isLoading} />
        <KpiCard
          label={t('analytics.totalHours')}
          value={kpis ? `${kpis.total_hours.toFixed(2)}h` : '—'}
          sub={kpis ? t('analytics.hoursAverage', { n: kpis.avg_hours_per_teacher.toFixed(2) }) : undefined}
          loading={isLoading}
        />
        <MoneyKpiCard label={t('analytics.avgRate')} totals={totals} field="avg_rate_minor" suffix="/h" loading={isLoading} />
      </div>

      {/* Live exchange rates → EGP */}
      <div className="mt-4">
        <FxRatesStrip />
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
