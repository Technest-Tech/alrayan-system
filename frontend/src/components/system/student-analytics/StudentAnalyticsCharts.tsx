'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Activity,
  BarChart3,
  Box,
  CalendarDays,
  CircleDollarSign,
  TrendingUp,
  UsersRound,
  WalletCards,
} from 'lucide-react'
import type {
  AnalyticsValue,
  StudentAnalyticsMonthPoint,
  StudentAnalyticsResponse,
} from '@/types/system/studentAnalytics'

const GRID = '#E7EBF1'
const tooltipStyle = {
  border: `1px solid ${GRID}`,
  borderRadius: 12,
  boxShadow: '0 12px 28px rgba(15,23,42,.08)',
  fontSize: 11,
}

function monthLabel(month: string) {
  const [year, monthIndex] = month.split('-').map(Number)
  return new Date(year, monthIndex - 1, 1).toLocaleDateString('en-US', { month: 'short' })
}

function ChartShell({
  title,
  subtitle,
  value,
  valueLabel,
  icon: Icon,
  color,
  background,
  children,
}: {
  title: string
  subtitle: string
  value?: string | number
  valueLabel?: string
  icon: typeof Activity
  color: string
  background: string
  children: React.ReactNode
}) {
  return (
    <article
      className="min-w-0 overflow-hidden rounded-2xl border p-5 shadow-[0_12px_36px_rgba(15,23,42,0.04)]"
      style={{ borderColor: `${color}18`, background }}
    >
      <header className="mb-3 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-lg"
            style={{ backgroundColor: color, boxShadow: `0 8px 18px ${color}30` }}
          >
            <Icon size={17} />
          </span>
          <div className="min-w-0">
            <h3 className="text-[13px] font-bold leading-tight" style={{ color }}>{title}</h3>
            <p className="mt-0.5 text-[10px] text-slate-500">{subtitle}</p>
          </div>
        </div>
        {value !== undefined && (
          <div className="shrink-0 text-right">
            <p className="text-[22px] font-bold tracking-tight tabular-nums" style={{ color }}>{value}</p>
            <p className="text-[10px] text-slate-500">{valueLabel}</p>
          </div>
        )}
      </header>
      <div className="h-[220px] min-w-0">{children}</div>
    </article>
  )
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center text-xs font-medium text-slate-400">
      No data for this period
    </div>
  )
}

function DonutChart({ data, colors }: { data: AnalyticsValue[]; colors: string[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  if (!total) return <EmptyChart />

  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          innerRadius={52}
          outerRadius={76}
          paddingAngle={1}
          stroke="transparent"
          isAnimationActive={false}
        >
          {data.map((item, index) => <Cell key={`${item.label}-${index}`} fill={colors[index % colors.length]} />)}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} formatter={(value) => Number(value).toLocaleString()} />
        <Legend
          iconType="circle"
          iconSize={7}
          wrapperStyle={{ fontSize: 10, color: '#64748B' }}
          formatter={(value) => <span className="text-slate-500">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

function SimpleBars({ data, color }: { data: AnalyticsValue[]; color: string }) {
  if (!data.some(item => item.value > 0)) return <EmptyChart />
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
      <BarChart data={data} margin={{ top: 12, right: 4, bottom: 0, left: -28 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#64748B' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: `${color}0B` }} />
        <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} maxBarSize={42} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function MonthlyBars({ data, color }: { data: StudentAnalyticsMonthPoint[]; color: string }) {
  const rows = data.map(point => ({ ...point, label: monthLabel(point.month) }))
  if (!rows.some(item => (item.value ?? 0) > 0)) return <EmptyChart />
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
      <BarChart data={rows} margin={{ top: 12, right: 4, bottom: 0, left: -28 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#64748B' }} tickLine={false} axisLine={false} interval={1} />
        <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="value" fill={color} radius={[5, 5, 0, 0]} maxBarSize={24} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function ActivityLines({ data }: { data: StudentAnalyticsMonthPoint[] }) {
  const rows = data.map(point => ({ ...point, label: monthLabel(point.month) }))
  if (!rows.some(item => (item.lessons ?? 0) > 0 || (item.active_students ?? 0) > 0)) return <EmptyChart />
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
      <LineChart data={rows} margin={{ top: 12, right: 8, bottom: 0, left: -28 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#64748B' }} tickLine={false} axisLine={false} interval={1} />
        <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10 }} />
        <Line type="monotone" dataKey="active_students" name="Active students" stroke="#12A897" strokeWidth={2.2} dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="lessons" name="Lessons" stroke="#11B4CF" strokeWidth={2.2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

function LessonsArea({ data }: { data: StudentAnalyticsMonthPoint[] }) {
  const rows = data.map(point => ({ ...point, label: monthLabel(point.month) }))
  if (!rows.some(item => (item.value ?? 0) > 0)) return <EmptyChart />
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
      <AreaChart data={rows} margin={{ top: 12, right: 8, bottom: 0, left: -28 }}>
        <defs>
          <linearGradient id="student-lessons-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#EC268F" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#EC268F" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#64748B' }} tickLine={false} axisLine={false} interval={1} />
        <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="value" stroke="#EC268F" strokeWidth={2.2} fill="url(#student-lessons-area)" dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function AverageLessons({ data }: { data: StudentAnalyticsMonthPoint[] }) {
  const rows = data.map(point => ({ ...point, label: monthLabel(point.month) }))
  if (!rows.some(item => (item.value ?? 0) > 0)) return <EmptyChart />
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
      <BarChart data={rows} margin={{ top: 12, right: 4, bottom: 0, left: -28 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#64748B' }} tickLine={false} axisLine={false} interval={1} />
        <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value) => Number(value).toFixed(1)} />
        <Bar dataKey="value" fill="#64748B" radius={[5, 5, 0, 0]} maxBarSize={24} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function StudentAnalyticsCharts({ data }: { data: StudentAnalyticsResponse }) {
  const lessonsThisMonth = data.charts.lessons_per_month.at(-1)?.value ?? 0
  const activeThisMonth = data.charts.active_students_per_month.at(-1)?.value ?? 0
  const averageThisMonth = data.charts.average_lessons_per_student.at(-1)?.value ?? 0
  const currenciesTotal = data.charts.currencies.reduce((sum, item) => sum + item.value, 0)
  const packageTotal = data.charts.package_sizes.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <ChartShell
        title="Student Status"
        subtitle="Active vs inactive"
        value={data.overview.active_students.toLocaleString()}
        valueLabel="Active"
        icon={UsersRound}
        color="#08A66B"
        background="linear-gradient(145deg, #F0FFF8 0%, #F7FFFB 100%)"
      >
        <DonutChart data={data.charts.status} colors={['#12B981', '#F59E0B', '#4F7DE8', '#64748B']} />
      </ChartShell>

      <ChartShell
        title="Students by Currency"
        subtitle="Currency distribution"
        value={currenciesTotal.toLocaleString()}
        valueLabel="Total"
        icon={WalletCards}
        color="#3468E8"
        background="linear-gradient(145deg, #F0F5FF 0%, #F7FAFF 100%)"
      >
        <DonutChart data={data.charts.currencies} colors={['#16B981', '#3468E8', '#F59E0B', '#A855F7']} />
      </ChartShell>

      <ChartShell
        title="Students by Package Size"
        subtitle="Package hours distribution"
        value={packageTotal.toLocaleString()}
        valueLabel="Packages"
        icon={Box}
        color="#9333EA"
        background="linear-gradient(145deg, #F8F2FF 0%, #FCFAFF 100%)"
      >
        <SimpleBars data={data.charts.package_sizes} color="#9866E8" />
      </ChartShell>

      <ChartShell
        title="Activity Trend"
        subtitle="Last 13 months"
        value={lessonsThisMonth.toLocaleString()}
        valueLabel="This month"
        icon={Activity}
        color="#0EA5B7"
        background="linear-gradient(145deg, #EDFCFD 0%, #F7FFFF 100%)"
      >
        <ActivityLines data={data.charts.activity} />
      </ChartShell>

      <ChartShell
        title="Lessons per Month"
        subtitle="Last 13 months"
        value={data.overview.total_lessons.toLocaleString()}
        valueLabel="Total"
        icon={CalendarDays}
        color="#E91E78"
        background="linear-gradient(145deg, #FFF1F7 0%, #FFF9FC 100%)"
      >
        <LessonsArea data={data.charts.lessons_per_month} />
      </ChartShell>

      <ChartShell
        title="Package Utilization"
        subtitle="Hours usage overview"
        icon={CircleDollarSign}
        color="#F97316"
        background="linear-gradient(145deg, #FFF8E8 0%, #FFFCF6 100%)"
      >
        <DonutChart data={data.charts.package_utilization} colors={['#16B981', '#27C3A8', '#F59E0B', '#EF4444']} />
      </ChartShell>

      <ChartShell
        title="Active Students / Month"
        subtitle="Last 13 months"
        value={activeThisMonth.toLocaleString()}
        valueLabel="This month"
        icon={TrendingUp}
        color="#0DAA92"
        background="linear-gradient(145deg, #EEFCF7 0%, #F8FFFC 100%)"
      >
        <MonthlyBars data={data.charts.active_students_per_month} color="#2FBBA9" />
      </ChartShell>

      <ChartShell
        title="Avg Lessons per Student"
        subtitle="Last 13 months"
        value={Number(averageThisMonth).toFixed(1)}
        valueLabel="This month"
        icon={BarChart3}
        color="#5D6B7E"
        background="linear-gradient(145deg, #F5F7FA 0%, #FBFCFD 100%)"
      >
        <AverageLessons data={data.charts.average_lessons_per_student} />
      </ChartShell>
    </div>
  )
}

export function LifecycleCharts({
  reasons,
  monthly,
  type,
}: {
  reasons: AnalyticsValue[]
  monthly: StudentAnalyticsMonthPoint[]
  type: 'stopped' | 'archived'
}) {
  const isStopped = type === 'stopped'
  const reasonColor = isStopped ? '#F59E0B' : '#64748B'
  const negativeColor = isStopped ? '#EF4444' : '#64748B'
  const positiveColor = '#12B981'
  const rows = monthly.map(point => ({ ...point, label: monthLabel(point.month) }))

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <article className="rounded-2xl border bg-white p-5" style={{ borderColor: GRID }}>
        <h3 className="text-sm font-bold text-slate-900">{isStopped ? 'Stops by reason' : 'Archives by reason'}</h3>
        <p className="mt-1 text-[11px] text-slate-400">
          {isStopped ? 'Why students stopped' : 'Why students were archived'}
        </p>
        <div className="mt-4 h-[260px]">
          {!reasons.some(item => item.value > 0) ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
              <BarChart data={reasons} layout="vertical" margin={{ top: 4, right: 18, bottom: 0, left: 20 }}>
                <CartesianGrid stroke={GRID} strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9, fill: '#94A3B8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} axisLine={false} width={100} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: `${reasonColor}0B` }} />
                <Bar dataKey="value" fill={reasonColor} radius={[0, 6, 6, 0]} maxBarSize={38} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </article>

      <article className="rounded-2xl border bg-white p-5" style={{ borderColor: GRID }}>
        <h3 className="text-sm font-bold text-slate-900">
          {isStopped ? 'Stopped vs returned' : 'Archived vs reactivated'}
        </h3>
        <p className="mt-1 text-[11px] text-slate-400">Monthly trend</p>
        <div className="mt-4 h-[260px]">
          {!rows.some(item => (item.negative ?? 0) > 0 || (item.positive ?? 0) > 0) ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
              <BarChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
                <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#64748B' }} tickLine={false} axisLine={false} interval={1} />
                <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="positive" name={isStopped ? 'Returned' : 'Reactivated'} fill={positiveColor} radius={[5, 5, 0, 0]} maxBarSize={32} isAnimationActive={false} />
                <Bar dataKey="negative" name={isStopped ? 'Stopped' : 'Archived'} fill={negativeColor} radius={[5, 5, 0, 0]} maxBarSize={32} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </article>
    </div>
  )
}

export function ChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="h-[302px] animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
          <div className="h-9 w-40 rounded-xl bg-slate-100" />
          <div className="mt-8 h-[190px] rounded-xl bg-slate-50" />
        </div>
      ))}
    </div>
  )
}
