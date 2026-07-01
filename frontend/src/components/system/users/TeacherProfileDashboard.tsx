'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Mail, Phone, Users, GraduationCap, Clock, DollarSign, Award, CalendarDays,
  CalendarCheck, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, MessageSquare, Mail as MailIcon,
  Wallet, FileWarning,
} from 'lucide-react'
import { useTeacherProfileStats } from '@/hooks/system/useTeacherReports'
import TeacherRace from '@/components/system/users/TeacherRace'
import type { DirectoryUser, TeacherProfile } from '@/types/system/user-directory'
import { useI18n } from '@/lib/system/i18n'

const TEAL = 'rgb(14 124 90)'
const NAVY = 'rgb(11 31 58)'
const MUTED = 'rgb(90 100 112)'
const BLUE = 'rgb(37 99 235)'
const GREEN = 'rgb(22 163 74)'
const RED = 'rgb(220 38 38)'

const CUR: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', EGP: 'E£', SAR: 'SAR ', AED: 'AED ', MAD: 'MAD ', QAR: 'QAR ', OMR: 'OMR ', KWD: 'KWD ' }
const sym = (c?: string) => CUR[c ?? 'USD'] ?? `${c} `
const money = (minor: number, c?: string) => `${sym(c)}${(minor / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const PALETTE = ['#0E7C5A', '#0B1F3A', '#1E5AAB', '#7C3AED', '#B45309', '#BE185D', '#C05621']
const initials = (n: string) => n.split(' ').slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')
function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (name.charCodeAt(i) + ((h << 5) - h)) | 0
  return PALETTE[Math.abs(h) % PALETTE.length]
}
const DAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()
const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Percentage delta of cur vs prev, or null when there's no comparable baseline. */
function delta(cur: number, prev: number): number | null {
  if (!prev) return null
  return Math.round(((cur - prev) / prev) * 100)
}

export default function TeacherProfileDashboard({ user, selfView = false }: { user: DirectoryUser; selfView?: boolean }) {
  const { t } = useI18n()
  const router = useRouter()
  const profile = user.role === 'teacher' ? (user.profile as TeacherProfile | null) : null
  const teacherId = profile?.id ?? null

  const [monthDate, setMonthDate] = useState(() => { const d = new Date(); d.setDate(1); return d })
  const monthParam = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`
  const { data: stats, isLoading } = useTeacherProfileStats(teacherId, monthParam)

  const week = useMemo(() => {
    const today = new Date()
    const sunday = new Date(today)
    sunday.setDate(today.getDate() - today.getDay())
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(sunday); d.setDate(sunday.getDate() + i); return d })
  }, [])

  const today = new Date()
  const cur = stats?.currency
  const color = avatarColor(user.name)

  return (
    <div className="space-y-5">
      {/* Month navigator */}
      <div className="inline-flex items-center gap-1 rounded-xl border bg-white px-1.5 py-1.5" style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
        <span className="px-2" style={{ color: TEAL }}><CalendarDays size={16} /></span>
        <button onClick={() => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="p-1.5 rounded-lg hover:bg-black/5"><ChevronLeft size={16} /></button>
        <span className="px-3 text-sm font-semibold tabular-nums" style={{ color: NAVY }}>{monthDate.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</span>
        <button onClick={() => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="p-1.5 rounded-lg hover:bg-black/5"><ChevronRight size={16} /></button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT */}
        <div className="lg:col-span-9 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Profile card */}
            <div className="md:col-span-5 relative rounded-2xl p-6 overflow-hidden" style={{ border: `1px solid rgb(14 124 90 / 0.25)`, background: 'linear-gradient(135deg, #ffffff, rgb(234 246 240))' }}>
              <Corners />
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    {user.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.photo_url} alt={user.name} className="w-20 h-20 rounded-full object-cover" style={{ border: `3px solid ${TEAL}` }} />
                    ) : (
                      <div className="flex items-center justify-center w-20 h-20 rounded-full text-2xl font-bold" style={{ background: `color-mix(in srgb, ${color} 18%, white)`, color, border: `3px solid ${TEAL}` }}>
                        {initials(user.name)}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-white" style={{ background: TEAL, border: '2px solid #fff' }}>
                      <GraduationCap size={13} />
                    </span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: NAVY }}>{user.name}</h2>
                    <div className="flex items-center gap-2 my-1.5">
                      <span className="h-px w-5" style={{ background: 'rgb(14 124 90 / 0.4)' }} />
                      <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: TEAL }}>{t('users.profileTeacherRole')}</span>
                      <span className="h-px w-5" style={{ background: 'rgb(14 124 90 / 0.4)' }} />
                    </div>
                    <div className="space-y-1 text-xs" style={{ color: MUTED }}>
                      {user.email && <p className="flex items-center gap-1.5"><Mail size={12} /> {user.email}</p>}
                      {(user.whatsapp ?? user.phone) && <p className="flex items-center gap-1.5"><Phone size={12} /> {user.whatsapp ?? user.phone}</p>}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center shrink-0">
                  <span style={{ color: TEAL }}><Users size={16} /></span>
                  <span className="text-2xl font-bold leading-tight" style={{ color: NAVY }}>{stats?.total_students ?? '—'}</span>
                  <span className="text-[9px] uppercase tracking-wide" style={{ color: MUTED }}>{t('users.profileStudentsLabel')}</span>
                </div>
              </div>
            </div>

            {/* Stat cards */}
            <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatCard icon={<Users size={16} />} accent={TEAL} label={t('users.profileTotalStudents')}
                value={String(stats?.total_students ?? '—')}
                note={stats ? `${stats.active_students} ${t('users.profileActive')} · ${stats.non_active_students} ${t('users.profileNonActive')}` : undefined} />
              <StatCard icon={<Clock size={16} />} accent={BLUE} label={t('users.profileHoursThisMonth')}
                value={stats ? `${stats.hours_this_month.toFixed(1)}h` : '—'}
                deltaPct={stats ? delta(stats.hours_this_month, stats.hours_last_month) : null}
                note={stats ? `${t('users.profileVsLastMonth')} ${stats.hours_last_month.toFixed(1)}h` : undefined} />
              <StatCard icon={<DollarSign size={16} />} accent={GREEN} label={t('users.profileRevenueThisMonth')}
                value={stats ? money(stats.revenue_minor, cur) : '—'}
                deltaPct={stats ? delta(stats.revenue_minor, stats.revenue_last_minor) : null}
                note={stats ? `${t('users.profileVsLastMonth')} ${money(stats.revenue_last_minor, cur)}` : undefined} />
              <StatCard icon={<CalendarDays size={16} />} accent={TEAL} label={t('users.profileHoursToday')}
                value={stats ? `${stats.hours_today.toFixed(1)}h` : '—'}
                deltaPct={stats ? delta(stats.hours_today, stats.hours_prev_week_day) : null}
                note={stats ? `${t('users.profileVsLastWeek')} ${stats.hours_prev_week_day.toFixed(1)}h` : undefined} />
              <StatCard icon={<CalendarCheck size={16} />} accent={BLUE} label={t('users.profileHoursLast7Days')}
                value={stats ? `${stats.hours_last_7.toFixed(1)}h` : '—'}
                deltaPct={stats ? delta(stats.hours_last_7, stats.hours_prev_7) : null}
                note={stats ? `${t('users.profileVsPrevious7Days')} ${stats.hours_prev_7.toFixed(1)}h` : undefined} />
              <StatCard icon={<Award size={16} />} accent={GREEN} label={t('users.profileLessonQuality')}
                value={stats ? `${stats.quality_score}%` : '—'}
                sub={stats ? `(${stats.quality_reviews_30d} ${t('users.profileReviews')})` : undefined}
                note={stats ? (stats.quality_reviews_30d === 0 ? t('users.profileAllPerfect') : t('users.profileBasedOnReviews')) : undefined} />
            </div>
          </div>

          {/* Teacher Race */}
          <TeacherRace currentTeacherId={teacherId} month={monthParam} />
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-3 space-y-4">
          {/* Week calendar */}
          <div className="rounded-2xl border p-5 bg-white" style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
            <div className="grid grid-cols-7 gap-1 text-center">
              {week.map((d, i) => {
                const isToday = sameDay(d, today)
                const count = stats?.calendar?.[dateKey(d)] ?? 0
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className="text-[9px] font-medium" style={{ color: MUTED }}>{DAY[i]}</span>
                    <span className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold" style={isToday ? { background: NAVY, color: '#fff' } : { color: NAVY }}>
                      {d.getDate()}
                    </span>
                    <span className="text-[10px] font-semibold" style={{ color: count ? TEAL : 'transparent' }}>{count || '·'}</span>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-4 border-t flex items-center justify-between" style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
              <span className="text-sm font-semibold" style={{ color: NAVY }}>{t('users.profileToday')}</span>
              <div className="flex items-center gap-3 text-xs" style={{ color: MUTED }}>
                <span className="inline-flex items-center gap-1"><CalendarCheck size={13} style={{ color: GREEN }} /> {stats?.today.attended ?? 0}</span>
                <span className="inline-flex items-center gap-1"><Clock size={13} style={{ color: BLUE }} /> {stats?.today.scheduled ?? 0}</span>
              </div>
            </div>

            {/* Today's lessons */}
            {isLoading ? (
              <p className="py-8 text-center text-xs" style={{ color: MUTED }}>{t('common.loading')}</p>
            ) : (stats?.today.lessons.length ?? 0) === 0 ? (
              <div className="py-8 flex flex-col items-center gap-2 text-xs" style={{ color: MUTED }}>
                <CalendarDays size={24} className="opacity-30" />
                {t('users.profileNoUpcoming')}
              </div>
            ) : (
              <ul className="mt-3 space-y-2">
                {stats!.today.lessons.map((l) => (
                  <li key={l.id} className="flex items-center justify-between rounded-lg px-3 py-2 text-xs" style={{ background: 'rgb(248 250 252)' }}>
                    <div>
                      <p className="font-medium" style={{ color: NAVY }}>{l.student ?? t('users.lesson')}</p>
                      <p style={{ color: MUTED }}>{new Date(l.time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} · {l.duration_min}m</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: 'rgb(37 99 235 / 0.1)', color: BLUE }}>{l.status}</span>
                  </li>
                ))}
              </ul>
            )}
            <button onClick={() => router.push('/calendar')} className="mt-4 w-full text-sm font-semibold inline-flex items-center justify-between" style={{ color: NAVY }}>
              {t('users.viewFullCalendar')} <ChevronRight size={14} />
            </button>
          </div>

          {selfView ? (
            /* Salary + pending reports (teacher's own view) */
            <div className="rounded-2xl border p-5 bg-white space-y-4" style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-xs" style={{ color: MUTED }}>
                  <FileWarning size={15} style={{ color: (stats?.pending_reports ?? 0) > 0 ? RED : GREEN }} />
                  {t('teacher.dashboard.pendingReports')}
                </span>
                <span className="text-sm font-bold" style={{ color: (stats?.pending_reports ?? 0) > 0 ? RED : NAVY }}>
                  {stats?.pending_reports ?? 0}
                </span>
              </div>
              <button
                onClick={() => router.push('/teacher/salary')}
                className="w-full pt-3 border-t text-sm font-semibold inline-flex items-center justify-between"
                style={{ color: NAVY, borderColor: 'rgb(var(--border-default,229 233 240))' }}
              >
                <span className="inline-flex items-center gap-1.5"><Wallet size={14} /> {t('teacher.dashboard.salaryStatement')}</span>
                <ChevronRight size={14} />
              </button>
            </div>
          ) : (
            /* Messages (admin view) */
            <div className="rounded-2xl border p-5 bg-white" style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
              <h3 className="text-sm font-bold inline-flex items-center gap-2" style={{ color: NAVY }}>
                <MessageSquare size={15} style={{ color: MUTED }} /> {t('users.profileMessages')}
              </h3>
              <div className="py-8 flex flex-col items-center gap-2 text-xs" style={{ color: MUTED }}>
                <MailIcon size={24} className="opacity-30" />
                {t('common.comingSoon')}
              </div>
              <button onClick={() => router.push('/users')} className="w-full pt-3 border-t text-sm font-semibold inline-flex items-center justify-between" style={{ color: NAVY, borderColor: 'rgb(var(--border-default,229 233 240))' }}>
                <span className="inline-flex items-center gap-1.5"><Users size={14} /> {t('users.profileViewContacts')}</span> <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, accent, label, value, deltaPct, note, sub }: {
  icon: React.ReactNode; accent: string; label: string; value: string
  deltaPct?: number | null; note?: string; sub?: string
}) {
  const up = (deltaPct ?? 0) >= 0
  return (
    <div className="rounded-xl border p-4 bg-white" style={{ borderColor: `color-mix(in srgb, ${accent} 22%, transparent)` }}>
      <div className="flex items-center justify-between">
        <span className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ background: `color-mix(in srgb, ${accent} 12%, white)`, color: accent }}>{icon}</span>
        {deltaPct != null && (
          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold" style={{ color: up ? GREEN : RED }}>
            {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{Math.abs(deltaPct)}%
          </span>
        )}
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-wide mt-3" style={{ color: MUTED }}>{label}</p>
      <p className="text-xl font-bold mt-0.5" style={{ color: NAVY }}>
        {value}{sub && <span className="text-[11px] font-normal ml-1 opacity-50">{sub}</span>}
      </p>
      {note && <p className="text-[10px] mt-1" style={{ color: MUTED }}>{note}</p>}
    </div>
  )
}

function Corners() {
  const s = { borderColor: TEAL } as const
  return (
    <>
      <span className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 rounded-tl" style={s} />
      <span className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 rounded-tr" style={s} />
      <span className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 rounded-bl" style={s} />
      <span className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 rounded-br" style={s} />
    </>
  )
}
