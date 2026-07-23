'use client'
import { use, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, ChevronsUpDown, ChevronRight, Mail, Phone, Clock, BookOpen, Package,
  GraduationCap, CheckCircle2, CalendarDays, CreditCard, Hash, Box,
} from 'lucide-react'
import { useDirectoryUser } from '@/hooks/system/useUserDirectory'
import { useStudentPackages } from '@/hooks/system/useStudentPackages'
import { useLessons } from '@/hooks/system/useLessons'
import type { StudentProfile, TeacherProfile } from '@/types/system/user-directory'
import type { Lesson } from '@/types/system/lesson'
import TeacherProfileDashboard from '@/components/system/users/TeacherProfileDashboard'
import { useI18n } from '@/lib/system/i18n'

const TEAL = 'rgb(14 124 90)'
const NAVY = 'rgb(11 31 58)'
const MUTED = 'rgb(90 100 112)'
const VIOLET = 'rgb(124 58 237)'
const BLUE = 'rgb(37 99 235)'

const CUR: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', EGP: 'E£', SAR: 'SAR ', AED: 'AED ', MAD: 'MAD ' }
const sym = (c?: string) => CUR[c ?? 'USD'] ?? `${c} `
const money = (minor: number, c?: string) => `${sym(c)}${(minor / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`

const PALETTE = ['#0E7C5A', '#0B1F3A', '#1E5AAB', '#7C3AED', '#B45309', '#BE185D', '#C05621']
const initials = (n: string) => n.split(' ').slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')
function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (name.charCodeAt(i) + ((h << 5) - h)) | 0
  return PALETTE[Math.abs(h) % PALETTE.length]
}
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useI18n()
  const { id } = use(params)
  const router = useRouter()
  const { data: user, isLoading } = useDirectoryUser(id)

  const studentProfile = user?.role === 'student' ? (user.profile as StudentProfile | null) : null
  const studentId = studentProfile?.id ?? null

  const { data: packages = [] } = useStudentPackages(studentId)
  const { data: lessonsPage } = useLessons(studentId ? ({ student_id: studentId, per_page: 200 } as never) : {})
  const lessons: Lesson[] = lessonsPage?.data ?? []

  const stats = useMemo(() => {
    const now = new Date()
    // #0 is a real lesson package now (the paid down payment), so it can be the current one —
    // it's the only package a freshly enrolled student has. Legacy 0-hour down payments can't.
    const current = [...packages].filter((p) => p.package_hours > 0).sort((a, b) => b.package_number - a.package_number)[0]
    const usedH = current?.consumed_hours ?? 0
    const totalH = current?.package_hours ?? 0
    const upcoming = lessons
      .filter((l) => l.status === 'scheduled' && new Date(l.scheduled_at) >= now)
      .sort((a, b) => +new Date(a.scheduled_at) - +new Date(b.scheduled_at))
    return {
      current, usedH, totalH,
      remainingH: Math.max(0, totalH - usedH),
      pct: totalH ? Math.round((usedH / totalH) * 100) : 0,
      todayCount: lessons.filter((l) => sameDay(new Date(l.scheduled_at), now)).length,
      total: lessonsPage?.meta?.total ?? lessons.length,
      completed: lessons.filter((l) => l.status === 'attended').length,
      upcoming: upcoming.slice(0, 5),
    }
  }, [packages, lessons, lessonsPage])

  const week = useMemo(() => {
    const today = new Date()
    const sunday = new Date(today)
    sunday.setDate(today.getDate() - today.getDay())
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(sunday); d.setDate(sunday.getDate() + i); return d })
  }, [])

  if (isLoading || !user) return <div className="py-20 text-center text-sm opacity-50">{t('common.loading')}</div>

  const isStudent = user.role === 'student'
  const today = new Date()
  const DAY = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  const currency = studentProfile?.currency ?? 'USD'
  const hourlyMinor = stats.current?.tariff_at_time ?? 0

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/users')} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-black/5" style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
          <ChevronLeft size={16} /> {t('users.backToUsers')}
        </button>
        <button onClick={() => router.push('/users')} className="inline-flex items-center justify-between gap-3 px-4 py-2 rounded-lg border text-sm min-w-64 hover:bg-black/5" style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
          <span className="font-medium" style={{ color: NAVY }}>{user.name} <span className="opacity-50">({user.role.toUpperCase()})</span></span>
          <ChevronsUpDown size={14} className="opacity-40" />
        </button>
      </div>

      {user.role === 'teacher' ? (
        <TeacherProfileDashboard user={user} />
      ) : !isStudent ? (
        <NonStudent user={user} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* LEFT */}
          <div className="lg:col-span-9 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Profile card */}
              <div className="md:col-span-5 relative rounded-2xl p-6 overflow-hidden" style={{ border: `1px solid rgb(14 124 90 / 0.25)`, background: 'linear-gradient(135deg, #ffffff, rgb(234 246 240))' }}>
                <Corners />
                <div className="flex items-start justify-between">
                  <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-center gap-4">
                    <div className="relative shrink-0">
                      <div className="flex items-center justify-center w-20 h-20 rounded-full text-2xl font-bold" style={{ background: `color-mix(in srgb, ${avatarColor(user.name)} 18%, white)`, color: avatarColor(user.name), border: `3px solid ${TEAL}` }}>
                        {initials(user.name)}
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-white" style={{ background: TEAL, border: '2px solid #fff' }}>
                        <GraduationCap size={13} />
                      </span>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold" style={{ color: NAVY }}>{user.name}</h2>
                      <div className="flex items-center gap-2 my-1.5">
                        <span className="h-px w-5" style={{ background: 'rgb(14 124 90 / 0.4)' }} />
                        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: TEAL }}>{user.role}</span>
                        <span className="h-px w-5" style={{ background: 'rgb(14 124 90 / 0.4)' }} />
                      </div>
                      <div className="space-y-1 text-xs" style={{ color: MUTED }}>
                        {user.email && <p className="flex items-center gap-1.5"><Mail size={12} /> {user.email}</p>}
                        {(user.whatsapp ?? user.phone) && <p className="flex items-center gap-1.5"><Phone size={12} /> {user.whatsapp ?? user.phone}</p>}
                        <p className="flex items-center gap-1.5"><Hash size={12} /> <span className="font-mono px-1.5 py-0.5 rounded text-[10px]" style={{ background: 'rgb(14 124 90 / 0.12)', color: TEAL }}>{slug(user.id, user.name)}</span></p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 shrink-0">
                    <MiniStat icon={<Clock size={14} />} value={stats.usedH.toFixed(1)} label={t('users.miniStatHours')} />
                    <MiniStat icon={<BookOpen size={14} />} value={String(stats.total)} label={t('users.miniStatLessons')} />
                  </div>
                </div>
              </div>

              {/* Stat tiles */}
              <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Tile icon={<Box size={16} />} label={t('users.currentPackage')} value={!stats.current ? '—' : stats.current.package_number === 0 ? t('users.downPayment') : `#${stats.current.package_number}`} />
                <Tile icon={<Clock size={16} />} label={t('users.remainingHours')} value={`${stats.remainingH.toFixed(1)}h`} sub={`of ${stats.totalH}h`} />
                <Tile icon={<BookOpen size={16} />} label={t('users.usedHours')} value={`${stats.usedH.toFixed(1)}h`} />
                <Tile icon={<CalendarDays size={16} />} label={t('users.lessonsToday')} value={String(stats.todayCount)} />
                <Tile icon={<GraduationCap size={16} />} label={t('users.totalLessons')} value={String(stats.total)} />
                <Tile icon={<CheckCircle2 size={16} />} label={t('users.completedLessons')} value={String(stats.completed)} />
              </div>
            </div>

            {/* Upcoming Lessons */}
            <div className="rounded-2xl border bg-white" style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
              <div className="px-5 py-4 flex items-center justify-between">
                <h3 className="text-sm font-bold inline-flex items-center gap-2" style={{ color: NAVY }}><Clock size={16} style={{ color: BLUE }} /> {t('users.upcomingLessons')}</h3>
                <button onClick={() => router.push('/calendar')} className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: BLUE }}>{t('common.viewAll')} <ChevronRight size={13} /></button>
              </div>
              {stats.upcoming.length === 0 ? (
                <div className="py-14 flex flex-col items-center gap-2 text-sm" style={{ color: MUTED }}>
                  <Clock size={26} className="opacity-30" />
                  {t('users.noUpcomingLessons')}
                </div>
              ) : (
                <ul className="border-t divide-y" style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
                  {stats.upcoming.map((l) => (
                    <li key={l.id} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium" style={{ color: NAVY }}>{l.subject?.name ?? t('users.lesson')}</p>
                        <p className="text-xs" style={{ color: MUTED }}>{new Date(l.scheduled_at).toLocaleString()} · {l.duration_minutes}m · {l.teacher?.name}</p>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'rgb(37 99 235 / 0.1)', color: BLUE }}>{l.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* RIGHT column */}
          <div className="lg:col-span-3 space-y-4">
            {/* Package Progress */}
            <div className="rounded-2xl border p-5" style={{ borderColor: `color-mix(in srgb, ${VIOLET} 25%, transparent)`, background: `color-mix(in srgb, ${VIOLET} 6%, #fff)` }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold inline-flex items-center gap-2" style={{ color: VIOLET }}>
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center text-white" style={{ background: VIOLET }}><Package size={13} /></span>
                  {t('users.packageProgress')}
                </h3>
                <span className="text-xs font-semibold" style={{ color: MUTED }}>{stats.current ? `#${stats.current.package_number}` : '—'}</span>
              </div>
              <div className="flex items-center gap-4">
                <Donut pct={stats.pct} color={VIOLET} />
                <div className="space-y-2 text-sm flex-1">
                  <Row label={t('users.packageUsed')} value={`${stats.usedH.toFixed(1)}h`} color={VIOLET} bold />
                  <Row label={t('users.packageRemaining')} value={`${stats.remainingH.toFixed(1)}h`} color={VIOLET} bold />
                  <div className="pt-2 mt-1 border-t flex items-center justify-between" style={{ borderColor: `color-mix(in srgb, ${VIOLET} 20%, transparent)` }}>
                    <span style={{ color: MUTED }}>{t('users.totalPackage')}</span>
                    <span className="font-bold" style={{ color: NAVY }}>{stats.totalH}h</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Calendar */}
            <div className="rounded-2xl border p-5" style={{ borderColor: `color-mix(in srgb, ${BLUE} 22%, transparent)`, background: `color-mix(in srgb, ${BLUE} 5%, #fff)` }}>
              <h3 className="text-sm font-bold inline-flex items-center gap-2 mb-4" style={{ color: BLUE }}>
                <CalendarDays size={15} /> {today.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
              </h3>
              <div className="grid grid-cols-7 gap-1 text-center">
                {week.map((d, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className="text-[10px]" style={{ color: MUTED }}>{DAY[i]}</span>
                    <span className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium" style={sameDay(d, today) ? { background: BLUE, color: '#fff' } : { color: NAVY }}>
                      {d.getDate()}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-4" style={{ color: MUTED }}>{t('users.calendarLessonsToday')} <span className="font-semibold" style={{ color: NAVY }}>{stats.todayCount} {t('users.lessonsUnit')}</span></p>
              <button onClick={() => router.push('/calendar')} className="text-sm font-semibold inline-flex items-center gap-1 mt-2" style={{ color: BLUE }}>{t('users.viewFullCalendar')} <ChevronRight size={14} /></button>
            </div>

            {/* Payments */}
            <div className="rounded-2xl border p-5" style={{ borderColor: 'rgb(14 124 90 / 0.22)', background: 'rgb(234 246 240)' }}>
              <h3 className="text-sm font-bold inline-flex items-center gap-2 mb-4" style={{ color: TEAL }}>
                <span className="w-6 h-6 rounded-lg flex items-center justify-center text-white" style={{ background: TEAL }}><CreditCard size={13} /></span>
                {t('users.paymentsSection')}
              </h3>
              <div className="flex items-center justify-between text-sm mb-3">
                <span style={{ color: MUTED }}>{t('users.tariff')}</span>
                <span className="font-bold" style={{ color: NAVY }}>{hourlyMinor ? `${money(hourlyMinor, currency)}/h` : '—'}</span>
              </div>
              {packages.length === 0 ? (
                <p className="text-xs opacity-50">{t('users.noPackagesYet')}</p>
              ) : (
                <ul className="space-y-2">
                  {[...packages].sort((a, b) => b.package_number - a.package_number).map((p) => {
                    const isCurrent = p.package_number === stats.current?.package_number
                    // tariff_at_time is the snapshotted charge for the whole package.
                    const price = p.tariff_at_time ?? 0
                    return (
                      <li key={p.id} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm" style={isCurrent ? { background: 'rgb(254 243 199)', border: '1px solid rgb(234 179 8 / 0.4)' } : { background: '#fff' }}>
                        <span className="font-medium" style={{ color: NAVY }}>{p.package_number === 0 ? t('users.downPayment') : `${t('users.packageLabel')}${p.package_number}`}</span>
                        <span className="font-bold tabular-nums" style={{ color: isCurrent ? 'rgb(161 98 7)' : TEAL }}>{money(price, p.currency ?? currency)}</span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* slug-style display id (mimics the reference ID chip, deterministic per user) */
function slug(id: number, name: string): string {
  const base = `${name}${id}`.toLowerCase().replace(/[^a-z0-9]/g, '')
  let h = 0
  for (let i = 0; i < base.length; i++) h = (base.charCodeAt(i) + ((h << 5) - h)) | 0
  return `${base.slice(0, 8)}${Math.abs(h).toString(36)}`.slice(0, 22)
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

function MiniStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span style={{ color: TEAL }}>{icon}</span>
      <span className="text-base font-bold leading-tight" style={{ color: NAVY }}>{value}</span>
      <span className="text-[9px] uppercase tracking-wide" style={{ color: MUTED }}>{label}</span>
    </div>
  )
}

function Tile({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border p-4 bg-white" style={{ borderColor: 'rgb(14 124 90 / 0.22)' }}>
      <div className="flex items-center justify-center w-9 h-9 rounded-lg mb-3" style={{ background: 'rgb(14 124 90 / 0.1)', color: TEAL }}>{icon}</div>
      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>{label}</p>
      <p className="text-xl font-bold mt-0.5" style={{ color: NAVY }}>{value}{sub && <span className="text-[11px] font-normal ml-1 opacity-50">{sub}</span>}</p>
    </div>
  )
}

function Row({ label, value, color, bold }: { label: string; value: string; color: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: MUTED }}>{label}</span>
      <span className={bold ? 'font-bold' : ''} style={{ color }}>{value}</span>
    </div>
  )
}

function Donut({ pct, color }: { pct: number; color: string }) {
  const r = 32, c = 2 * Math.PI * r, off = c - (pct / 100) * c
  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg viewBox="0 0 80 80" className="w-24 h-24 -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgb(229 233 240)" strokeWidth="9" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-base font-bold" style={{ color }}>{pct}%</span>
      </div>
    </div>
  )
}

function NonStudent({ user }: { user: NonNullable<ReturnType<typeof useDirectoryUser>['data']> }) {
  const { t } = useI18n()
  const teacher = user.role === 'teacher' ? (user.profile as TeacherProfile | null) : null
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="relative rounded-2xl p-6 overflow-hidden" style={{ border: `1px solid rgb(14 124 90 / 0.25)`, background: 'linear-gradient(135deg, #fff, rgb(234 246 240))' }}>
        <Corners />
        <div className="flex flex-col items-center text-center gap-3">
          <div className="flex items-center justify-center w-20 h-20 rounded-full text-2xl font-bold text-white" style={{ background: avatarColor(user.name) }}>{initials(user.name)}</div>
          <h2 className="text-lg font-bold" style={{ color: NAVY }}>{user.name}</h2>
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: TEAL }}>{user.role}</span>
          <div className="space-y-1 text-xs" style={{ color: MUTED }}>
            {user.email && <p className="flex items-center gap-1.5 justify-center"><Mail size={12} /> {user.email}</p>}
            {(user.whatsapp ?? user.phone) && <p className="flex items-center gap-1.5 justify-center"><Phone size={12} /> {user.whatsapp ?? user.phone}</p>}
          </div>
        </div>
      </div>
      <div className="lg:col-span-2 rounded-2xl border p-5 bg-white" style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: NAVY }}>{t('users.sectionDetails')}</h3>
        {teacher ? (
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <Info label={t('teachers.paymentMethod')} value={teacher.payment_method ?? '—'} />
            <Info label={t('teachers.hourlyRate')} value={teacher.hourly_rate != null ? String(teacher.hourly_rate) : '—'} />
            <Info label={t('users.statStudents')} value={teacher.students_count != null ? String(teacher.students_count) : '—'} />
            <Info label={t('users.qualifications')} value={teacher.qualifications ?? '—'} />
          </dl>
        ) : (
          <p className="text-sm" style={{ color: MUTED }}>{user.notes || t('users.noDetails')}</p>
        )}
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide" style={{ color: MUTED }}>{label}</dt>
      <dd className="font-medium" style={{ color: NAVY }}>{value}</dd>
    </div>
  )
}
