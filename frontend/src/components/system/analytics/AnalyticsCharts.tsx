'use client'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { Clock, Trophy, CalendarDays } from 'lucide-react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useI18n } from '@/lib/system/i18n'
import type { HoursByMonthPoint, TopTeacher, BestDay, AnalyticsTeacherOption } from '@/types/system/analytics'

const INK        = 'rgb(11 31 58)'
const HOURS_CLR  = '#1E5AAB'
const GOLD       = '#C9A24B'
const GREEN      = '#0E7C5A'

const DAY_KEYS = ['days.sun', 'days.mon', 'days.tue', 'days.wed', 'days.thu', 'days.fri', 'days.sat'] as const

function ChartCard({ title, icon, right, children }: {
  title: React.ReactNode; icon?: React.ReactNode; right?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'rgb(var(--surface-card))', border: '1px solid rgb(var(--border-default))' }}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          {icon && <span style={{ color: GOLD }}>{icon}</span>}
          <h3 className="text-sm font-semibold truncate">{title}</h3>
        </div>
        {right}
      </div>
      {children}
    </div>
  )
}

function fmtMonth(ym: string, locale: string): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1, 1)
  return d.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', year: '2-digit' })
}

/* ─────────────── Hours Across Months ─────────────── */
export function HoursAcrossMonths({
  series, allTimeTotal, generatedAt, teachers, teacherId, onTeacherChange, loading,
}: {
  series: HoursByMonthPoint[]
  allTimeTotal: number
  generatedAt?: string
  teachers: AnalyticsTeacherOption[]
  teacherId: number | 'all'
  onTeacherChange: (v: number | 'all') => void
  loading?: boolean
}) {
  const { t, locale } = useI18n()

  const data = series.map(p => ({ ...p, label: fmtMonth(p.month, locale) }))
  const range = series.length
    ? `${fmtMonth(series[0].month, locale)} → ${fmtMonth(series[series.length - 1].month, locale)}`
    : ''
  const genTime = generatedAt
    ? new Date(generatedAt).toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <ChartCard
      icon={<Clock size={16} />}
      title={
        <span className="flex items-center gap-2">
          {t('analytics.hoursAcrossMonths')}
          <span className="inline-flex items-center gap-1 text-[10px] font-medium" style={{ color: GREEN }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: GREEN }} />
            {t('analytics.live')}
          </span>
        </span>
      }
      right={
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-lg font-bold tabular-nums" style={{ color: HOURS_CLR }}>
              {allTimeTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}h
            </div>
            <div className="text-[10px] opacity-50">{t('analytics.allTimeTotal')} {genTime}</div>
          </div>
          <Select value={String(teacherId)} onValueChange={v => onTeacherChange(v === 'all' ? 'all' : Number(v))}>
            <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('analytics.allTeachers')}</SelectItem>
              {teachers.map(tt => <SelectItem key={tt.id} value={String(tt.id)}>{tt.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      }
    >
      <div className="text-xs opacity-50 -mt-2 mb-3">{range}</div>
      {loading ? (
        <div className="h-64 rounded-xl animate-pulse" style={{ background: 'rgb(var(--surface-card-2))' }} />
      ) : data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-sm opacity-40">{t('analytics.noData')}</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id="grad-hours" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={HOURS_CLR} stopOpacity={0.35} />
                <stop offset="95%" stopColor={HOURS_CLR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border-default))" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: INK, opacity: 0.5 }} tickLine={false} axisLine={false} minTickGap={24} />
            <YAxis tick={{ fontSize: 10, fill: INK, opacity: 0.5 }} tickLine={false} axisLine={false} width={48}
              tickFormatter={(v: number) => `${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid rgb(var(--border-default))' }}
              formatter={(v) => [`${Number(v).toFixed(2)}h`, t('analytics.hours')]}
            />
            <Area type="monotone" dataKey="hours" stroke={HOURS_CLR} strokeWidth={2} fill="url(#grad-hours)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}

/* ─────────────── Top 5 Teachers by Hours ─────────────── */
export function TopTeachersChart({ data, loading }: { data: TopTeacher[]; loading?: boolean }) {
  const { t } = useI18n()
  const rows = [...data].sort((a, b) => a.hours - b.hours) // recharts horizontal bars draw bottom→top

  return (
    <ChartCard icon={<Trophy size={16} />} title={t('analytics.topTeachers')} right={<span className="text-[10px] opacity-50">{t('analytics.thisMonth')}</span>}>
      {loading ? (
        <div className="h-56 rounded-xl animate-pulse" style={{ background: 'rgb(var(--surface-card-2))' }} />
      ) : rows.length === 0 ? (
        <div className="h-56 flex items-center justify-center text-sm opacity-40">{t('analytics.noData')}</div>
      ) : (
        <ResponsiveContainer width="100%" height={224}>
          <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border-default))" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: INK, opacity: 0.5 }} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: INK, opacity: 0.7 }} tickLine={false} axisLine={false} width={90} />
            <Tooltip cursor={{ fill: 'rgb(var(--surface-card-2))' }}
              contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid rgb(var(--border-default))' }}
              formatter={(v) => [`${Number(v).toFixed(2)}h`, t('analytics.hours')]} />
            <Bar dataKey="hours" fill={GOLD} radius={[0, 6, 6, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}

/* ─────────────── Best Days by Lessons ─────────────── */
export function BestDaysChart({ data, totalLessons, loading }: { data: BestDay[]; totalLessons: number; loading?: boolean }) {
  const { t } = useI18n()
  const rows = [...data]
    .map(d => ({ ...d, label: t(DAY_KEYS[d.weekday]) }))
    .sort((a, b) => b.lessons - a.lessons)

  return (
    <ChartCard
      icon={<CalendarDays size={16} />}
      title={t('analytics.bestDays')}
      right={
        <div className="text-right shrink-0">
          <div className="text-lg font-bold tabular-nums" style={{ color: GREEN }}>{totalLessons.toLocaleString()}</div>
          <div className="text-[10px] opacity-50">{t('analytics.lessonsThisMonth')}</div>
        </div>
      }
    >
      {loading ? (
        <div className="h-56 rounded-xl animate-pulse" style={{ background: 'rgb(var(--surface-card-2))' }} />
      ) : (
        <ResponsiveContainer width="100%" height={224}>
          <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border-default))" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: INK, opacity: 0.6 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: INK, opacity: 0.5 }} tickLine={false} axisLine={false} width={40} allowDecimals={false} />
            <Tooltip cursor={{ fill: 'rgb(var(--surface-card-2))' }}
              contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid rgb(var(--border-default))' }}
              formatter={(v) => [`${v}`, t('analytics.lessons')]} />
            <Bar dataKey="lessons" radius={[6, 6, 0, 0]} barSize={30}>
              {rows.map((_, i) => <Cell key={i} fill={i === 0 ? GREEN : '#8FBFAE'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
