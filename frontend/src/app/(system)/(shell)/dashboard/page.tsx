'use client'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { KpiCard } from '@/components/system/dashboard/KpiCard'
import { AlertsPanel } from '@/components/system/dashboard/AlertsPanel'
import { QuickActions } from '@/components/system/dashboard/QuickActions'
import { RecentActivity } from '@/components/system/dashboard/RecentActivity'
import { useDashboard } from '@/hooks/system/useDashboard'
import { useSystemUser } from '@/components/system/shell/SystemShell'
import { useI18n } from '@/lib/system/i18n'
import TeacherRace from '@/components/system/users/TeacherRace'
import TeacherProfileDashboard from '@/components/system/users/TeacherProfileDashboard'
import type { DirectoryUser, TeacherProfile } from '@/types/system/user-directory'

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
  const { t } = useI18n()
  const kpis     = data?.kpis
  const alerts   = data?.alerts ?? []
  const activity = data?.recent_activity ?? []
  const charts   = data?.charts

  return (
    <>
      <PageHeader title={t('dashboard.title')} description={t('dashboard.description')} />

      {/* KPI grid — 8 cards across 2 rows of 4 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
        <KpiCard
          label={t('dashboard.activeStudents')}
          value={kpis?.active_students ?? 0}
          delta={kpis?.active_students_delta ? t('dashboard.thisMonth', { n: String(kpis.active_students_delta) }) : undefined}
          loading={isLoading}
        />
        <KpiCard
          label={t('dashboard.trialStudents')}
          value={kpis?.trial_students ?? 0}
          delta={kpis?.trial_students_delta ? t('dashboard.thisMonth', { n: String(kpis.trial_students_delta) }) : undefined}
          loading={isLoading}
        />
        <KpiCard
          label={t('dashboard.paused')}
          value={kpis?.paused_students ?? 0}
          loading={isLoading}
        />
        <KpiCard
          label={t('dashboard.suspended')}
          value={kpis?.suspended_students ?? 0}
          loading={isLoading}
        />
        <KpiCard
          label={t('dashboard.todaySessions')}
          value={kpis?.today_sessions ?? 0}
          loading={isLoading}
        />
        <KpiCard
          label={t('dashboard.revenueMonth')}
          value={kpis?.month_revenue?.USD != null ? `$${(kpis.month_revenue.USD / 100).toLocaleString()}` : '—'}
          loading={isLoading}
        />
        <KpiCard
          label={t('dashboard.outstanding')}
          value={kpis?.outstanding?.USD != null ? `$${(kpis.outstanding.USD / 100).toLocaleString()}` : '—'}
          sub={t('dashboard.overdueInvoices')}
          loading={isLoading}
        />
        <KpiCard
          label={t('dashboard.conversionRate')}
          value={kpis?.conversion_rate != null ? `${Math.round(kpis.conversion_rate * 100)}%` : '—'}
          sub={t('dashboard.momPercent')}
          loading={isLoading}
        />
      </div>

      {/* Teacher Race */}
      <div className="mt-4">
        <TeacherRace currentTeacherId={null} />
      </div>

      {/* Alerts + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <AlertsPanel alerts={alerts} loading={isLoading} />
        <QuickActions />
      </div>

      {/* Charts — 2×2 grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <ChartCard title={t('dashboard.revenue12m')}>
          {isLoading
            ? <div className="h-24 animate-pulse rounded" style={{ background: 'rgb(var(--surface-card-2))' }} />
            : charts?.revenue_12m?.length
              ? <BarChart
                  items={charts.revenue_12m as unknown as Record<string, number | string>[]}
                  labelKey="month"
                  valueKey="amount"
                  formatValue={v => `$${(v / 100).toLocaleString()}`}
                />
              : <p className="text-xs opacity-40">{t('dashboard.noData')}</p>
          }
        </ChartCard>

        <ChartCard title={t('dashboard.studentGrowth12m')}>
          {isLoading
            ? <div className="h-24 animate-pulse rounded" style={{ background: 'rgb(var(--surface-card-2))' }} />
            : charts?.student_growth_12m?.length
              ? <BarChart
                  items={charts.student_growth_12m as unknown as Record<string, number | string>[]}
                  labelKey="month"
                  valueKey="active"
                />
              : <p className="text-xs opacity-40">{t('dashboard.noData')}</p>
          }
        </ChartCard>

        <ChartCard title={t('dashboard.expenses30d')}>
          {isLoading
            ? <div className="h-24 animate-pulse rounded" style={{ background: 'rgb(var(--surface-card-2))' }} />
            : charts?.expenses_breakdown_30d?.length
              ? <BarChart
                  items={charts.expenses_breakdown_30d as unknown as Record<string, number | string>[]}
                  labelKey="category"
                  valueKey="amount"
                  formatValue={v => `$${(v / 100).toLocaleString()}`}
                />
              : <p className="text-xs opacity-40">{t('dashboard.noExpenses')}</p>
          }
        </ChartCard>

        <ChartCard title={t('dashboard.cancellationReasons')}>
          {isLoading
            ? <div className="h-24 animate-pulse rounded" style={{ background: 'rgb(var(--surface-card-2))' }} />
            : charts?.cancellation_reasons?.length
              ? <BarChart
                  items={charts.cancellation_reasons as unknown as Record<string, number | string>[]}
                  labelKey="reason"
                  valueKey="count"
                />
              : <p className="text-xs opacity-40">{t('dashboard.noCancellations')}</p>
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

/** Adapt the authenticated teacher (AuthUser) into the DirectoryUser shape the
 *  reusable TeacherProfileDashboard expects. Only role + profile.id are load-bearing;
 *  the rest feed the header card. */
function teacherAsDirectoryUser(user: NonNullable<ReturnType<typeof useSystemUser>>): DirectoryUser {
  const profile: TeacherProfile = {
    id: user.teacher_id!,
    qualifications: null,
    payment_method: null,
    hourly_rate: null,
    currency: null,
    accepts_new_students: null,
    teachable_course_ids: null,
    is_active: user.is_active,
    students_count: null,
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    whatsapp: user.whatsapp ?? null,
    role: 'teacher',
    status: 'active',
    is_active: user.is_active,
    language: user.language ?? null,
    birthday: user.birthday ?? null,
    gender: user.gender ?? null,
    photo_url: user.photo_url ?? null,
    notes: null,
    documents: null,
    last_login_at: null,
    invite_pending: false,
    profile,
    created_at: null,
  }
}

function TeacherDashboard() {
  const user = useSystemUser()
  const { locale, t } = useI18n()
  const today = new Date().toLocaleDateString(
    locale === 'fr' ? 'fr-FR' : 'en-US',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
  )

  // No linked teacher profile → we can't load teacher stats.
  if (!user?.teacher_id) {
    return (
      <div>
        <h1 className="text-2xl font-bold">{t('dashboard.welcome', { name: user?.name ?? '' })}</h1>
        <p className="opacity-50 mt-1 text-sm">{today}</p>
        <p className="mt-8 text-sm opacity-60">{t('teacher.dashboard.noProfile')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">{t('dashboard.welcome', { name: user.name })}</h1>
        <p className="opacity-50 mt-1 text-sm">{today}</p>
      </div>
      <TeacherProfileDashboard user={teacherAsDirectoryUser(user)} selfView />
    </div>
  )
}

export default function DashboardPage() {
  const user = useSystemUser()
  if (user?.role === 'teacher') return <TeacherDashboard />
  return <AdminDashboard />
}
