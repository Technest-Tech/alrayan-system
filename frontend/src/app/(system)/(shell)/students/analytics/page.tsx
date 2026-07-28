'use client'

import { useEffect, useState } from 'react'
import {
  Archive,
  ArchiveRestore,
  CalendarClock,
  CalendarRange,
  ChartNoAxesCombined,
  CircleDollarSign,
  Clock3,
  ClockAlert,
  PackageOpen,
  PauseCircle,
  Percent,
  RotateCcw,
  Settings2,
  ShieldAlert,
  TimerReset,
  UserCheck,
  UserRoundPlus,
  UsersRound,
} from 'lucide-react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import {
  AnalyticsMetricCard,
  AnalyticsMetricSkeleton,
} from '@/components/system/student-analytics/AnalyticsMetricCard'
import {
  ChartsSkeleton,
  LifecycleCharts,
  StudentAnalyticsCharts,
} from '@/components/system/student-analytics/StudentAnalyticsCharts'
import { StudentAnalyticsTable } from '@/components/system/student-analytics/StudentAnalyticsTable'
import { useStudentAnalytics } from '@/hooks/system/useStudentAnalytics'
import { formatMoney } from '@/lib/money'
import type { StudentAnalyticsFilters } from '@/types/system/studentAnalytics'

const initialFilters: StudentAnalyticsFilters = {
  period: 'all',
  q: '',
  status: '',
  teacher_id: '',
  page: 1,
  per_page: 20,
  sort: 'name',
  direction: 'asc',
}

function SectionHeading({
  title,
  period,
}: {
  title: string
  period: StudentAnalyticsFilters['period']
}) {
  const periodLabel = {
    all: 'All time',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
    '12m': 'Last 12 months',
  }[period]

  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-lg font-bold tracking-tight text-slate-950">{title}</h2>
      <span className="text-[11px] font-medium text-slate-400">{periodLabel}</span>
    </div>
  )
}

export default function StudentsAnalyticsPage() {
  const [filters, setFilters] = useState(initialFilters)
  const [search, setSearch] = useState('')
  const [showCharts, setShowCharts] = useState(true)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setFilters(current => current.q === search ? current : { ...current, q: search, page: 1 })
    }, 300)
    return () => window.clearTimeout(timeout)
  }, [search])

  const query = useStudentAnalytics(filters)
  const data = query.data

  function updateFilters(next: Partial<StudentAnalyticsFilters>) {
    setFilters(current => ({ ...current, ...next }))
  }

  const primaryCurrency = data?.charts.currencies[0]?.key
  const tariff = data?.overview.average_tariff_by_currency.find(
    item => item.currency === primaryCurrency,
  ) ?? data?.overview.average_tariff_by_currency[0]
  const tariffValue = tariff
    ? `${formatMoney(tariff.minor, tariff.currency)}/h`
    : '—'

  return (
    <div className="pb-8">
      <PageHeader
        title="Students Analytics"
        description="Student lifecycle, package health, activity, and detailed records in one view."
        actions={
          <label className="relative">
            <CalendarRange size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={filters.period}
              onChange={event => updateFilters({
                period: event.target.value as StudentAnalyticsFilters['period'],
                page: 1,
              })}
              className="h-10 min-w-44 rounded-xl border bg-white pl-9 pr-3 text-xs font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10"
              style={{ borderColor: 'rgb(var(--border-default))' }}
              aria-label="Analytics period"
            >
              <option value="all">All time</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="12m">Last 12 months</option>
            </select>
          </label>
        }
      />

      {query.isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <ShieldAlert className="mx-auto text-red-500" size={28} />
          <h2 className="mt-3 text-sm font-bold text-red-900">Students analytics could not be loaded</h2>
          <p className="mt-1 text-xs text-red-700/70">
            {query.error instanceof Error ? query.error.message : 'Please try again.'}
          </p>
          <button
            type="button"
            onClick={() => query.refetch()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white"
          >
            <RotateCcw size={14} />
            Retry
          </button>
        </div>
      ) : (
        <>
          <section aria-label="Student overview">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {!data ? Array.from({ length: 7 }, (_, index) => <AnalyticsMetricSkeleton key={index} />) : (
                <>
                  <AnalyticsMetricCard label="Total Students" value={data.overview.total_students.toLocaleString()} helper="Overall" icon={UsersRound} color="#2563EB" />
                  <AnalyticsMetricCard label="Active Students" value={data.overview.active_students.toLocaleString()} helper={`${data.overview.total_students ? Math.round(data.overview.active_students / data.overview.total_students * 100) : 0}% of students`} icon={UserCheck} color="#12B981" />
                  <AnalyticsMetricCard label="Inactive Students" value={data.overview.inactive_students.toLocaleString()} helper={`${data.overview.archived_students.toLocaleString()} archived`} icon={PauseCircle} color="#D89B23" />
                  <AnalyticsMetricCard label="Average Package Hours" value={`${data.overview.average_package_hours.toLocaleString()}h`} helper="Overall" icon={Clock3} color="#A855F7" />
                  <AnalyticsMetricCard label="Average Tariff" value={tariffValue} helper={data.overview.average_tariff_by_currency.length > 1 ? `Primary currency · ${tariff?.currency}` : 'Overall'} icon={CircleDollarSign} color="#6D5DD3" />
                  <AnalyticsMetricCard label="Total Lessons" value={data.overview.total_lessons.toLocaleString()} helper="Overall" icon={CalendarClock} color="#F97316" />
                  <AnalyticsMetricCard label="Avg Lessons / Student" value={data.overview.average_lessons_per_student.toLocaleString()} helper="Overall" icon={ChartNoAxesCombined} color="#EC268F" />
                </>
              )}
            </div>
          </section>

          <section className="mt-6 space-y-4" aria-label="Stopped students analytics">
            <SectionHeading title="Stopped students" period={filters.period} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              {!data ? Array.from({ length: 7 }, (_, index) => <AnalyticsMetricSkeleton key={index} compact />) : (
                <>
                  <AnalyticsMetricCard compact label="Currently stopped" value={data.stopped.currently_stopped} icon={PauseCircle} color="#E5A12C" />
                  <AnalyticsMetricCard compact label="Stopped (period)" value={data.stopped.stopped_period} icon={ClockAlert} color="#EF4444" />
                  <AnalyticsMetricCard compact label="Returned (period)" value={data.stopped.returned_period} icon={RotateCcw} color="#12B981" />
                  <AnalyticsMetricCard compact label="Return rate" value={`${data.stopped.return_rate}%`} icon={Percent} color="#3B82F6" />
                  <AnalyticsMetricCard compact label="Avg. pause duration" value={`${data.stopped.average_pause_days} days`} icon={TimerReset} color="#A855F7" />
                  <AnalyticsMetricCard compact label="Upcoming returns" value={data.stopped.upcoming_returns} icon={CalendarClock} color="#0EA5B7" />
                  <AnalyticsMetricCard compact label="Overdue returns" value={data.stopped.overdue_returns} icon={ShieldAlert} color="#F97316" />
                </>
              )}
            </div>
            {data ? <LifecycleCharts reasons={data.stopped.reasons} monthly={data.stopped.monthly} type="stopped" /> : <div className="h-[338px] animate-pulse rounded-2xl bg-white" />}
          </section>

          <section className="mt-7 space-y-4" aria-label="Archived students analytics">
            <SectionHeading title="Archived students" period={filters.period} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              {!data ? Array.from({ length: 7 }, (_, index) => <AnalyticsMetricSkeleton key={index} compact />) : (
                <>
                  <AnalyticsMetricCard compact label="Currently archived" value={data.archived.currently_archived} icon={Archive} color="#64748B" />
                  <AnalyticsMetricCard compact label="Archived (period)" value={data.archived.archived_period} icon={PackageOpen} color="#E11D48" />
                  <AnalyticsMetricCard compact label="Reactivated (period)" value={data.archived.reactivated_period} icon={ArchiveRestore} color="#12B981" />
                  <AnalyticsMetricCard compact label="In grace window" value={data.archived.in_grace_window} icon={ShieldAlert} color="#3B82F6" />
                  <AnalyticsMetricCard compact label="Approaching archive" value={data.archived.approaching_archive} icon={TimerReset} color="#D89B23" />
                  <AnalyticsMetricCard compact label="At-risk new" value={data.archived.at_risk_new} icon={UserRoundPlus} color="#F97316" />
                  <AnalyticsMetricCard compact label="Archive rate" value={`${data.archived.archive_rate}%`} icon={Percent} color="#A855F7" />
                </>
              )}
            </div>
            {data ? <LifecycleCharts reasons={data.archived.reasons} monthly={data.archived.monthly} type="archived" /> : <div className="h-[338px] animate-pulse rounded-2xl bg-white" />}
          </section>

          <section className="mt-8 space-y-4" aria-label="Student analytics charts">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold tracking-tight text-slate-950">Analytics Charts</h2>
              <button
                type="button"
                onClick={() => setShowCharts(show => !show)}
                className="inline-flex h-9 items-center gap-2 rounded-lg border bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                style={{ borderColor: 'rgb(var(--border-default))' }}
                aria-expanded={showCharts}
              >
                <Settings2 size={14} />
                {showCharts ? 'Hide charts' : 'Show charts'}
              </button>
            </div>
            {showCharts && (!data ? <ChartsSkeleton /> : <StudentAnalyticsCharts data={data} />)}
          </section>

          <div className="mt-7">
            {!data ? (
              <div className="h-[520px] animate-pulse rounded-2xl border border-slate-200 bg-white" />
            ) : (
              <StudentAnalyticsTable
                records={data.records}
                teachers={data.filters.teachers}
                filters={filters}
                search={search}
                onSearchChange={setSearch}
                onFiltersChange={updateFilters}
                fetching={query.isFetching}
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}
