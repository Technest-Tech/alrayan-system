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
import { MySalaryTierCard } from '@/components/system/salary/MySalaryTierCard'
import type { DirectoryUser, TeacherProfile } from '@/types/system/user-directory'

const CURRENCY_SYMBOL: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', EGP: 'E£', SAR: 'SAR ', AED: 'AED ',
  MAD: 'MAD ', QAR: 'QAR ', OMR: 'OMR ', KWD: 'KWD ',
}
const symbolFor = (code: string) => CURRENCY_SYMBOL[code] ?? `${code} `

/** Minor units → display amount, e.g. 12345 EUR → "€123.45". */
function money(minor: number, currency: string): string {
  return `${symbolFor(currency)}${(minor / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

/**
 * Amounts are kept per currency (converting them would invent numbers), so a
 * multi-currency total renders as "€1,200 · $340".
 */
function moneyByCurrency(map: Record<string, number> | undefined, empty: string): string {
  const entries = Object.entries(map ?? {}).filter(([, v]) => v > 0)
  if (entries.length === 0) return empty
  return entries.map(([code, minor]) => money(minor, code)).join(' · ')
}

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

      {/* KPI grid — 12 cards across 3 rows of 4 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
        <KpiCard
          label={t('dashboard.totalUsers')}
          value={kpis?.total_users ?? 0}
          sub={kpis ? t('dashboard.usersBreakdown', {
            students: String(kpis.total_students),
            teachers: String(kpis.total_teachers),
          }) : undefined}
          loading={isLoading}
        />
        <KpiCard
          label={t('dashboard.totalStudents')}
          value={kpis?.total_students ?? 0}
          sub={kpis ? t('dashboard.studentsBreakdown', {
            active: String(kpis.active_students),
            trial:  String(kpis.trial_students),
          }) : undefined}
          loading={isLoading}
        />
        <KpiCard
          label={t('dashboard.activeStudents')}
          value={kpis?.active_students ?? 0}
          delta={kpis?.active_students_delta ? t('dashboard.thisMonth', { n: String(kpis.active_students_delta) }) : undefined}
          loading={isLoading}
        />
        <KpiCard
          label={t('dashboard.teachers')}
          value={kpis?.total_teachers ?? 0}
          sub={kpis ? t('dashboard.teachersActive', { n: String(kpis.active_teachers) }) : undefined}
          loading={isLoading}
        />
        <KpiCard
          label={t('dashboard.trialStudents')}
          value={kpis?.trial_students ?? 0}
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
          label={t('dashboard.conversionRate')}
          value={kpis?.conversion_rate != null ? `${Math.round(kpis.conversion_rate * 100)}%` : '—'}
          sub={t('dashboard.momPercent')}
          loading={isLoading}
        />
        <KpiCard
          label={t('dashboard.lessonsToday')}
          value={kpis?.lessons_today ?? 0}
          sub={kpis ? t('dashboard.hoursValue', { h: kpis.hours_today.toFixed(1) }) : undefined}
          loading={isLoading}
        />
        <KpiCard
          label={t('dashboard.hoursMonth')}
          value={kpis ? kpis.hours_month.toFixed(1) : 0}
          sub={kpis ? t('dashboard.lastMonthHours', { h: kpis.hours_last_month.toFixed(1) }) : undefined}
          loading={isLoading}
        />
        <KpiCard
          label={t('dashboard.totalHours')}
          value={kpis ? kpis.hours_total.toFixed(1) : 0}
          sub={kpis ? t('dashboard.lessonsThisMonth', { n: String(kpis.lessons_month) }) : undefined}
          loading={isLoading}
        />
        <KpiCard
          label={t('dashboard.revenueMonth')}
          value={moneyByCurrency(kpis?.month_revenue, '—')}
          sub={t('dashboard.paidPackages')}
          loading={isLoading}
        />
      </div>

      {/* Outstanding sits on its own line so long multi-currency strings can breathe */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <KpiCard
          label={t('dashboard.outstanding')}
          value={moneyByCurrency(kpis?.outstanding, '—')}
          sub={t('dashboard.unpaidPackages')}
          loading={isLoading}
        />
        <KpiCard
          label={t('dashboard.revenueLastMonth')}
          value={moneyByCurrency(kpis?.last_month_revenue, '—')}
          sub={t('dashboard.paidPackages')}
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
        <ChartCard title={t('dashboard.hours12m')}>
          {isLoading
            ? <div className="h-24 animate-pulse rounded" style={{ background: 'rgb(var(--surface-card-2))' }} />
            : charts?.hours_12m?.some(p => p.hours > 0)
              ? <BarChart
                  items={charts.hours_12m as unknown as Record<string, number | string>[]}
                  labelKey="label"
                  valueKey="hours"
                  formatValue={v => `${v.toFixed(1)}h`}
                />
              : <p className="text-xs opacity-40">{t('dashboard.noData')}</p>
          }
        </ChartCard>

        <ChartCard title={t('dashboard.revenue12m', { currency: charts?.revenue_12m?.[0]?.currency ?? '' })}>
          {isLoading
            ? <div className="h-24 animate-pulse rounded" style={{ background: 'rgb(var(--surface-card-2))' }} />
            : charts?.revenue_12m?.some(p => p.amount > 0)
              ? <BarChart
                  items={charts.revenue_12m as unknown as Record<string, number | string>[]}
                  labelKey="label"
                  valueKey="amount"
                  formatValue={v => money(v, charts.revenue_12m[0]?.currency ?? 'USD')}
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
                  labelKey="label"
                  valueKey="active"
                />
              : <p className="text-xs opacity-40">{t('dashboard.noData')}</p>
          }
        </ChartCard>

        <ChartCard title={t('dashboard.lessonStatus30d')}>
          {isLoading
            ? <div className="h-24 animate-pulse rounded" style={{ background: 'rgb(var(--surface-card-2))' }} />
            : charts?.lesson_status_30d?.length
              ? <BarChart
                  items={charts.lesson_status_30d.map(s => ({
                    label: t(`dashboard.status.${s.status}`),
                    count: s.count,
                  }))}
                  labelKey="label"
                  valueKey="count"
                />
              : <p className="text-xs opacity-40">{t('dashboard.noLessons')}</p>
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
      <MySalaryTierCard compact />
      <TeacherProfileDashboard user={teacherAsDirectoryUser(user)} selfView />
    </div>
  )
}

export default function DashboardPage() {
  const user = useSystemUser()
  if (user?.role === 'teacher') return <TeacherDashboard />
  return <AdminDashboard />
}
