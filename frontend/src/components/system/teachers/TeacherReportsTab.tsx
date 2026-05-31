'use client'
import { useState } from 'react'
import { CalendarCheck, UserCheck, Clock, Plane, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useTeacherReportSummary, type MonthlySession, type ReportPeriod } from '@/hooks/system/useTeacherReports'

interface Props { teacherId: number | string }

// ── Formatters ─────────────────────────────────────────────────────────────────

function fCurrency(minor: number) {
  return (minor / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
function fPeriod(period: string) {
  const [y, m] = period.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleString('default', { month: 'short', year: 'numeric' })
}
function fMonthShort(period: string) {
  const [y, m] = period.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleString('default', { month: 'short' })
}

// ── Period tabs ────────────────────────────────────────────────────────────────

const PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: 30,  label: '30 days' },
  { value: 90,  label: '90 days' },
  { value: 180, label: '6 months' },
]

// ── KPI card ───────────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, accent }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; accent?: string
}) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'rgb(var(--surface-card, 255 255 255))', border: '1px solid rgb(var(--border-default, 229 233 240))' }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: accent ? `${accent}18` : 'rgb(var(--surface-card-2, 248 250 252))' }}>
        <span style={{ color: accent ?? 'rgb(90 100 112)' }}>{icon}</span>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider opacity-40 mb-1">{label}</p>
        <p className="text-3xl font-bold leading-none" style={accent ? { color: accent } : undefined}>{value}</p>
        {sub && <p className="text-xs opacity-40 mt-1.5 leading-relaxed">{sub}</p>}
      </div>
    </div>
  )
}

// ── Attendance ring ────────────────────────────────────────────────────────────

function AttendanceRing({ rate }: { rate: number | null }) {
  const r    = 36
  const circ = 2 * Math.PI * r
  const pct  = rate ?? 0
  const dash = (pct / 100) * circ
  const color = pct >= 80 ? '#0e7c5a' : pct >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex items-center justify-center">
      <svg width={96} height={96} viewBox="0 0 96 96">
        <circle cx={48} cy={48} r={r} fill="none" stroke="rgb(var(--border-default, 229 233 240))" strokeWidth={10} />
        <circle cx={48} cy={48} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          transform="rotate(-90 48 48)" style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text x={48} y={44} textAnchor="middle" fontSize={14} fontWeight={700} fill={color}>
          {rate !== null ? `${rate}%` : '—'}
        </text>
        <text x={48} y={58} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.4}>rate</text>
      </svg>
    </div>
  )
}

// ── Session breakdown ──────────────────────────────────────────────────────────

function SessionBreakdown({ attended, absent, cancelled, scheduled, total }: {
  attended: number; absent: number; cancelled: number; scheduled: number; total: number
}) {
  const rows = [
    { label: 'Attended',  value: attended,  color: '#0e7c5a' },
    { label: 'Scheduled', value: scheduled, color: '#94a3b8' },
    { label: 'Absent',    value: absent,    color: '#f59e0b' },
    { label: 'Cancelled', value: cancelled, color: '#ef4444' },
  ]
  return (
    <div className="rounded-2xl p-5 space-y-3" style={{ background: 'rgb(var(--surface-card, 255 255 255))', border: '1px solid rgb(var(--border-default, 229 233 240))' }}>
      <p className="text-[11px] font-semibold uppercase tracking-wider opacity-40">Session breakdown</p>
      <div className="space-y-2">
        {rows.map((r) => {
          const pct = total > 0 ? Math.round((r.value / total) * 100) : 0
          return (
            <div key={r.label} className="space-y-0.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium opacity-60">{r.label}</span>
                <span className="font-semibold tabular-nums">{r.value} <span className="opacity-40">({pct}%)</span></span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgb(var(--surface-card-2, 248 250 252))' }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: r.color }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Monthly bar chart ──────────────────────────────────────────────────────────

function MonthlyChart({ months }: { months: MonthlySession[] }) {
  const [hovered, setHovered] = useState<string | null>(null)
  if (!months.length) return null

  const maxTotal = Math.max(...months.map((m) => m.attended + m.absent + m.cancelled + m.scheduled), 1)
  const CHART_H = 120, BAR_W = 40, GAP = 20
  const GRID_LINES = 4

  return (
    <div className="rounded-2xl p-6" style={{ background: 'rgb(var(--surface-card, 255 255 255))', border: '1px solid rgb(var(--border-default, 229 233 240))' }}>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm font-semibold">Sessions trend</p>
        <div className="flex gap-3 text-[11px]">
          {[{ color: '#0e7c5a', label: 'Attended' }, { color: '#94a3b8', label: 'Scheduled' }, { color: '#f59e0b', label: 'Absent' }, { color: '#ef4444', label: 'Cancelled' }].map((l) => (
            <span key={l.label} className="flex items-center gap-1.5 opacity-60">
              <span className="w-2 h-2 rounded-sm inline-block" style={{ background: l.color }} />{l.label}
            </span>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <svg width={months.length * (BAR_W + GAP) - GAP} height={CHART_H + 40} className="overflow-visible">
          {/* Gridlines */}
          {Array.from({ length: GRID_LINES + 1 }).map((_, gi) => {
            const y = Math.round((gi / GRID_LINES) * CHART_H)
            return (
              <g key={gi}>
                <line x1={0} y1={y} x2={months.length * (BAR_W + GAP)} y2={y} stroke="rgb(var(--border-default, 229 233 240))" strokeWidth={1} strokeDasharray={gi === 0 ? '0' : '4 4'} />
                <text x={0} y={y - 3} fontSize={9} fill="currentColor" opacity={0.3}>{Math.round(maxTotal * (1 - gi / GRID_LINES))}</text>
              </g>
            )
          })}

          {/* Bars */}
          {months.map((m, i) => {
            const x      = i * (BAR_W + GAP)
            const isHov  = hovered === m.month
            const segs   = [{ v: m.attended, c: '#0e7c5a' }, { v: m.scheduled, c: '#94a3b8' }, { v: m.absent, c: '#f59e0b' }, { v: m.cancelled, c: '#ef4444' }]
            const totalH = Math.round(((m.attended + m.scheduled + m.absent + m.cancelled) / maxTotal) * CHART_H)
            let yOff = CHART_H
            return (
              <g key={m.month} onMouseEnter={() => setHovered(m.month)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'default' }}>
                {isHov && <rect x={x - 6} y={0} width={BAR_W + 12} height={CHART_H + 8} fill="rgb(0 0 0 / 0.03)" rx={6} />}
                {segs.map((s) => {
                  const h = Math.round((s.v / maxTotal) * CHART_H); yOff -= h
                  return h > 0 ? <rect key={s.c} x={x} y={yOff} width={BAR_W} height={h} fill={s.c} opacity={isHov ? 1 : 0.85} style={{ transition: 'opacity 0.15s' }} /> : null
                })}
                {totalH > 0 && <rect x={x} y={CHART_H - totalH} width={BAR_W} height={6} fill={segs.find((s) => s.v > 0)?.c ?? '#94a3b8'} rx={3} />}
                {isHov && totalH > 0 && (
                  <>
                    <rect x={x + BAR_W / 2 - 44} y={CHART_H - totalH - 56} width={88} height={46} rx={8} fill="rgb(15 23 42)" opacity={0.92} />
                    <text x={x + BAR_W / 2} y={CHART_H - totalH - 38} textAnchor="middle" fontSize={10} fill="white" opacity={0.7}>{fMonthShort(m.month)}</text>
                    <text x={x + BAR_W / 2} y={CHART_H - totalH - 22} textAnchor="middle" fontSize={10} fill="#34d399">✓ {m.attended} attended</text>
                  </>
                )}
                <text x={x + BAR_W / 2} y={CHART_H + 18} textAnchor="middle" fontSize={11} fill="currentColor" opacity={isHov ? 0.8 : 0.4} fontWeight={isHov ? 600 : 400}>
                  {fMonthShort(m.month)}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

// ── Payroll table ──────────────────────────────────────────────────────────────

function PayrollTable({ payrolls }: { payrolls: { period: string; base_salary_minor: number; net_salary_minor: number; status: string }[] }) {
  if (!payrolls.length) return null
  const STATUS: Record<string, { cls: string; dot: string }> = {
    approved:    { cls: 'text-emerald-700 bg-emerald-50', dot: 'bg-emerald-500' },
    transferred: { cls: 'text-blue-700 bg-blue-50',       dot: 'bg-blue-500' },
    pending:     { cls: 'text-amber-700 bg-amber-50',     dot: 'bg-amber-400' },
    rejected:    { cls: 'text-red-700 bg-red-50',         dot: 'bg-red-500' },
  }
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }}>
      <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}>
        <p className="text-sm font-semibold">Payroll history</p>
        <p className="text-xs opacity-40">Last {payrolls.length} periods</p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] font-semibold uppercase tracking-wider border-b" style={{ borderColor: 'rgb(var(--border-default, 229 233 240))', color: 'rgb(90 100 112)' }}>
            <th className="text-left px-5 py-3">Period</th>
            <th className="text-right px-5 py-3">Base</th>
            <th className="text-right px-5 py-3">Net</th>
            <th className="text-left px-5 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {payrolls.map((p) => {
            const s   = STATUS[p.status] ?? { cls: 'text-gray-600 bg-gray-100', dot: 'bg-gray-400' }
            const adj = p.net_salary_minor - p.base_salary_minor
            return (
              <tr key={p.period} className="border-b last:border-0 hover:bg-black/[0.02] transition-colors" style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}>
                <td className="px-5 py-3.5 font-medium">{fPeriod(p.period)}</td>
                <td className="px-5 py-3.5 text-right font-mono text-sm opacity-60">{fCurrency(p.base_salary_minor)}</td>
                <td className="px-5 py-3.5 text-right">
                  <span className="font-mono font-semibold">{fCurrency(p.net_salary_minor)}</span>
                  {adj !== 0 && (
                    <span className={`ml-1.5 text-[11px] font-medium ${adj > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {adj > 0 ? '+' : ''}{fCurrency(adj)}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${s.cls}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{p.status}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 rounded-2xl animate-pulse" style={{ background: 'rgb(var(--surface-card-2, 248 250 252))' }} />)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2].map((i) => <div key={i} className="h-52 rounded-2xl animate-pulse" style={{ background: 'rgb(var(--surface-card-2, 248 250 252))' }} />)}
      </div>
      <div className="h-64 rounded-2xl animate-pulse" style={{ background: 'rgb(var(--surface-card-2, 248 250 252))' }} />
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────

export function TeacherReportsTab({ teacherId }: Props) {
  const [period, setPeriod] = useState<ReportPeriod>(30)
  const { data, isLoading } = useTeacherReportSummary(teacherId, period)

  if (isLoading) return <Skeleton />
  if (!data) return null

  const { sessions, monthly_sessions, active_students, leave, payrolls } = data

  return (
    <div className="space-y-5">

      {/* Period selector */}
      <div className="rounded-2xl border flex items-center p-1 gap-1 w-fit" style={{ background: 'rgb(var(--surface-card, 255 255 255))', borderColor: 'rgb(var(--border-default, 229 233 240))' }}>
        {PERIODS.map((p) => (
          <button key={p.value} onClick={() => setPeriod(p.value)}
            className="px-4 py-1.5 rounded-xl text-sm font-semibold transition-all"
            style={period === p.value ? { background: 'rgb(14 124 90)', color: '#fff' } : { color: 'rgb(90 100 112)' }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard icon={<CalendarCheck size={18} />} label="Total sessions" value={sessions.total}
          sub={`${sessions.attended} attended · ${sessions.cancelled} cancelled`} accent="#0e7c5a" />
        <KpiCard icon={<Clock size={18} />} label="Hours taught" value={`${sessions.hours_taught}h`}
          sub="Attended sessions only" accent="#7c3aed" />
        <KpiCard icon={<UserCheck size={18} />} label="Active students" value={active_students}
          sub="Currently assigned" accent="#2563eb" />
        <KpiCard icon={<Plane size={18} />} label="Leave taken" value={`${leave.days_taken_this_year}d`}
          sub={leave.pending_requests > 0 ? `${leave.pending_requests} pending request${leave.pending_requests > 1 ? 's' : ''}` : 'This calendar year'}
          accent={leave.pending_requests > 0 ? '#f59e0b' : undefined} />
      </div>

      {/* Attendance ring + session breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl p-6 flex flex-col items-center justify-center gap-3" style={{ background: 'rgb(var(--surface-card, 255 255 255))', border: '1px solid rgb(var(--border-default, 229 233 240))' }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider opacity-40 self-start">Attendance rate</p>
          <AttendanceRing rate={sessions.attendance_rate} />
          <p className="text-xs opacity-40 text-center">
            {sessions.attendance_rate !== null
              ? `${sessions.attended} attended out of ${sessions.total} total`
              : 'No session data for this period'}
          </p>
        </div>
        <SessionBreakdown attended={sessions.attended} absent={sessions.absent} cancelled={sessions.cancelled} scheduled={sessions.scheduled} total={sessions.total} />
      </div>

      {/* Monthly trend */}
      {monthly_sessions.length > 0 && <MonthlyChart months={monthly_sessions} />}

      {/* Payroll */}
      {payrolls.length > 0 && <PayrollTable payrolls={payrolls} />}

      {sessions.total === 0 && monthly_sessions.length === 0 && payrolls.length === 0 && (
        <div className="rounded-2xl border py-16 text-center" style={{ borderColor: 'rgb(var(--border-default, 229 233 240))', borderStyle: 'dashed' }}>
          <CalendarCheck size={32} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium opacity-40">No data for this period</p>
          <p className="text-xs opacity-25 mt-1">Try selecting a longer time range</p>
        </div>
      )}
    </div>
  )
}
