'use client'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { KpiCard } from '@/components/system/dashboard/KpiCard'
import { AlertsPanel } from '@/components/system/dashboard/AlertsPanel'
import { QuickActions } from '@/components/system/dashboard/QuickActions'
import { RecentActivity } from '@/components/system/dashboard/RecentActivity'
import { useDashboard, type RevenuePoint, type StudentPoint, type ExpenseSlice, type CancellationBar } from '@/hooks/system/useDashboard'
import { useSystemUser } from '@/components/system/shell/SystemShell'

function BarChart({ items, valueKey, labelKey, formatValue }: {
  items: Record<string, number | string>[]
  valueKey: string
  labelKey: string
  formatValue?: (v: number) => string
}) {
  const max = Math.max(...items.map(i => Number(i[valueKey])), 1)
  return (
    <div className="space-y-1.5">
      {items.map((item, i) => {
        const val = Number(item[valueKey])
        const pct = (val / max) * 100
        return (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-20 shrink-0 truncate opacity-60 text-right">{item[labelKey]}</div>
            <div className="flex-1 rounded-full overflow-hidden h-2" style={{ background: 'rgb(var(--surface-card-2))' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'rgb(var(--accent))' }} />
            </div>
            <div className="w-16 shrink-0 opacity-70">{formatValue ? formatValue(val) : val}</div>
          </div>
        )
      })}
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgb(var(--surface-card))', border: '1px solid rgb(var(--border-default))' }}>
      <div className="text-sm font-semibold mb-4">{title}</div>
      {children}
    </div>
  )
}

function AdminDashboard() {
  const { data, isLoading } = useDashboard()
  const kpis    = data?.kpis
  const alerts  = data?.alerts ?? []
  const activity = data?.recent_activity ?? []
  const charts  = data?.charts

  return (
    <>
      <PageHeader title="Dashboard" description="A snapshot of your academy." />

      {/* KPI grid — 8 cards across 2 rows of 4 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
        <KpiCard
          label="Active students"
          value={kpis?.active_students ?? 0}
          delta={kpis?.active_students_delta ? `+${kpis.active_students_delta} this month` : undefined}
          loading={isLoading}
        />
        <KpiCard
          label="Trial students"
          value={kpis?.trial_students ?? 0}
          delta={kpis?.trial_students_delta ? `+${kpis.trial_students_delta} this month` : undefined}
          loading={isLoading}
        />
        <KpiCard
          label="Paused"
          value={kpis?.paused_students ?? 0}
          loading={isLoading}
        />
        <KpiCard
          label="Suspended"
          value={kpis?.suspended_students ?? 0}
          loading={isLoading}
        />
        <KpiCard
          label="Today's sessions"
          value={kpis?.today_sessions ?? 0}
          loading={isLoading}
        />
        <KpiCard
          label="Revenue this month"
          value={kpis?.month_revenue?.USD != null ? `$${(kpis.month_revenue.USD / 100).toLocaleString()}` : '—'}
          loading={isLoading}
        />
        <KpiCard
          label="Outstanding"
          value={kpis?.outstanding?.USD != null ? `$${(kpis.outstanding.USD / 100).toLocaleString()}` : '—'}
          sub="overdue invoices"
          loading={isLoading}
        />
        <KpiCard
          label="Conversion rate"
          value={kpis?.conversion_rate != null ? `${Math.round(kpis.conversion_rate * 100)}%` : '—'}
          sub="month over month"
          loading={isLoading}
        />
      </div>

      {/* Alerts + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <AlertsPanel alerts={alerts} loading={isLoading} />
        <QuickActions />
      </div>

      {/* Charts — 2×2 grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <ChartCard title="Revenue — last 12 months">
          {isLoading
            ? <div className="h-24 animate-pulse rounded" style={{ background: 'rgb(var(--surface-card-2))' }} />
            : charts?.revenue_12m?.length
              ? <BarChart
                  items={charts.revenue_12m as unknown as Record<string, number | string>[]}
                  labelKey="month"
                  valueKey="amount"
                  formatValue={v => `$${(v / 100).toLocaleString()}`}
                />
              : <p className="text-xs opacity-40">No data yet.</p>
          }
        </ChartCard>

        <ChartCard title="Student growth — last 12 months">
          {isLoading
            ? <div className="h-24 animate-pulse rounded" style={{ background: 'rgb(var(--surface-card-2))' }} />
            : charts?.student_growth_12m?.length
              ? <BarChart
                  items={charts.student_growth_12m as unknown as Record<string, number | string>[]}
                  labelKey="month"
                  valueKey="count"
                />
              : <p className="text-xs opacity-40">No data yet.</p>
          }
        </ChartCard>

        <ChartCard title="Expenses — last 30 days">
          {isLoading
            ? <div className="h-24 animate-pulse rounded" style={{ background: 'rgb(var(--surface-card-2))' }} />
            : charts?.expenses_breakdown_30d?.length
              ? <BarChart
                  items={charts.expenses_breakdown_30d as unknown as Record<string, number | string>[]}
                  labelKey="category"
                  valueKey="amount"
                  formatValue={v => `$${(v / 100).toLocaleString()}`}
                />
              : <p className="text-xs opacity-40">No expenses recorded.</p>
          }
        </ChartCard>

        <ChartCard title="Cancellation reasons">
          {isLoading
            ? <div className="h-24 animate-pulse rounded" style={{ background: 'rgb(var(--surface-card-2))' }} />
            : charts?.cancellation_reasons?.length
              ? <BarChart
                  items={charts.cancellation_reasons as unknown as Record<string, number | string>[]}
                  labelKey="reason"
                  valueKey="count"
                />
              : <p className="text-xs opacity-40">No cancellations.</p>
          }
        </ChartCard>
      </div>

      {/* Recent activity */}
      <div className="mt-4">
        <RecentActivity items={activity} loading={isLoading} />
      </div>
    </>
  )
}

function TeacherDashboard() {
  const user = useSystemUser()
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
      <p className="opacity-50 mt-1 text-sm">{today}</p>

      <div className="mt-8 space-y-4">
        <div
          className="rounded-2xl p-6"
          style={{ background: 'rgb(var(--surface-card, 255 255 255))', border: '1px solid rgb(var(--border-default, 229 233 240))' }}
        >
          <p className="font-semibold">Today&apos;s sessions (0)</p>
          <p className="text-sm opacity-40 mt-3">No sessions scheduled for today.</p>
        </div>
        <div
          className="rounded-2xl p-6"
          style={{ background: 'rgb(var(--surface-card, 255 255 255))', border: '1px solid rgb(var(--border-default, 229 233 240))' }}
        >
          <p className="font-semibold">Pending session reports (0)</p>
          <p className="text-sm opacity-40 mt-3">You&apos;re all caught up.</p>
        </div>
        <div
          className="rounded-2xl p-6 flex items-center justify-between"
          style={{ background: 'rgb(var(--surface-card, 255 255 255))', border: '1px solid rgb(var(--border-default, 229 233 240))' }}
        >
          <div>
            <p className="font-semibold">Salary statement</p>
            <p className="text-sm opacity-40 mt-1">Current month not yet calculated.</p>
          </div>
          <button
            className="px-4 py-2 rounded-xl text-sm font-medium border hover:bg-black/5 transition-colors"
            style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}
          >
            View
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const user = useSystemUser()
  if (user?.role === 'teacher') return <TeacherDashboard />
  return <AdminDashboard />
}
