'use client'
import { useState, useMemo } from 'react'
import {
  CalendarDays, Clock, AlertTriangle, FileText, Search, X,
  ChevronRight, CheckCircle2, XCircle, Ban,
  Edit3, Video, GraduationCap, Loader2, Sparkles,
} from 'lucide-react'
import { SessionDrawer } from '@/components/system/schedule/SessionDrawer'
import { ConflictBanner } from '@/components/system/schedule/ConflictBanner'
import { CalendarView } from '@/components/system/schedule/CalendarView'
import { AbsentModal } from '@/components/system/schedule/AbsentModal'
import { RescheduleModal } from '@/components/system/schedule/RescheduleModal'
import { CancelModal } from '@/components/system/schedule/CancelModal'
import { SessionEventPopup } from '@/components/system/schedule/SessionEventPopup'
import { TeacherAvailabilityModal } from '@/components/system/schedule/TeacherAvailabilityModal'
import { SessionReportModal } from '@/components/system/students/SessionReportModal'
import {
  useSessions,
  useSessionConflicts,
  useMarkAttendance,
} from '@/hooks/system/useSessions'
import { useTeachers } from '@/hooks/system/useTeachers'
import type { Session, SessionStatus, QuotaImpact } from '@/types/system/session'
import { toast } from 'sonner'

/* ─── Quota-impact label config ───────────────────────────────────────── */
const QUOTA_META: Record<QuotaImpact, { label: string; bg: string; fg: string; tip: string }> = {
  counted:          { label: 'Counted',          bg: 'rgb(220 252 231)', fg: 'rgb(21 128 61)',  tip: 'Consumed from monthly quota' },
  counted_no_show:  { label: 'Counted (no-show)',bg: 'rgb(254 226 226)', fg: 'rgb(153 27 27)',  tip: 'Student absent without apology — counted as used' },
  free_teacher:     { label: 'Free (teacher)',   bg: 'rgb(254 243 199)', fg: 'rgb(146 64 14)',  tip: 'Teacher absent — not counted from quota' },
  free_excused:     { label: 'Free (excused)',   bg: 'rgb(219 234 254)', fg: 'rgb(30 64 175)',  tip: 'Student apologized in time — not counted' },
  free:             { label: 'Free',             bg: 'rgb(243 244 246)', fg: 'rgb(75 85 99)',   tip: 'Does not count against quota' },
}

function QuotaBadge({ impact, status }: { impact: QuotaImpact; status: SessionStatus }) {
  // Don't show a billing badge for sessions that haven't been marked yet
  if (status === 'scheduled' || status === 'rescheduled' || status === 'pending_substitute') return null
  const m = QUOTA_META[impact]
  return (
    <span
      title={m.tip}
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: m.bg, color: m.fg }}
    >
      {m.label}
    </span>
  )
}

/* ─── Utils ────────────────────────────────────────────────────────────── */
function toYmd(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function formatTime12(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}
function formatDay(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}
function durationMin(start: string, end: string) {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
}
function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
}

/* ─── Stat card ────────────────────────────────────────────────────────── */
function StatCard({ icon, label, value, accent }: {
  icon: React.ReactNode; label: string; value: number; accent: string
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 rounded-xl border"
      style={{ background: '#fff', borderColor: 'rgb(var(--border-default,229 233 240))' }}
    >
      <div
        className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
        style={{ background: `color-mix(in srgb, ${accent} 10%, transparent)`, color: accent }}
      >
        {icon}
      </div>
      <div>
        <p className="text-xl font-semibold leading-none" style={{ color: 'rgb(11 31 58)' }}>{value}</p>
        <p className="text-xs mt-0.5" style={{ color: 'rgb(90 100 112)' }}>{label}</p>
      </div>
    </div>
  )
}

/* ─── Status pill ──────────────────────────────────────────────────────── */
const STATUS_META: Record<SessionStatus, { label: string; bg: string; fg: string; dot: string }> = {
  scheduled:          { label: 'Scheduled', bg: 'rgb(219 234 254)', fg: 'rgb(30 64 175)',  dot: 'rgb(59 130 246)' },
  attended:           { label: 'Attended',  bg: 'rgb(220 252 231)', fg: 'rgb(21 128 61)',  dot: 'rgb(34 197 94)' },
  absent:             { label: 'Absent',    bg: 'rgb(254 226 226)', fg: 'rgb(153 27 27)',  dot: 'rgb(239 68 68)' },
  cancelled:          { label: 'Cancelled', bg: 'rgb(243 244 246)', fg: 'rgb(75 85 99)',   dot: 'rgb(156 163 175)' },
  rescheduled:        { label: 'Rescheduled', bg: 'rgb(254 243 199)', fg: 'rgb(146 64 14)', dot: 'rgb(245 158 11)' },
  pending_substitute: { label: 'Needs Sub', bg: 'rgb(255 237 213)', fg: 'rgb(154 52 18)',  dot: 'rgb(249 115 22)' },
}

function StatusBadge({ status }: { status: SessionStatus }) {
  const m = STATUS_META[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: m.bg, color: m.fg }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.dot }} />
      {m.label}
    </span>
  )
}

/* ─── Session card ─────────────────────────────────────────────────────── */
function SessionCard({
  session,
  onOpen,
  onRequestAbsent,
  onReschedule,
  onCancel,
  onAttendWithReport,
  accentColor,
  highlight,
}: {
  session: Session
  onOpen: () => void
  onRequestAbsent: (s: Session) => void
  onReschedule: (s: Session) => void
  onCancel: (s: Session) => void
  onAttendWithReport: (s: Session) => void
  accentColor?: string
  highlight?: boolean
}) {
  const mark = useMarkAttendance()
  const start = session.scheduled_start
  const end = session.scheduled_end
  const dur = durationMin(start, end)
  const studentName = session.student?.name ?? '—'
  const teacherName = session.teacher?.name ?? 'Unassigned'

  const canAct     = session.status === 'scheduled' || session.status === 'pending_substitute'
  const needsReport = session.status === 'attended' && !session.has_report

  async function doAttend() {
    try {
      await mark.mutateAsync({ id: session.id, status: 'attended' })
      toast.success('Marked attended.')
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to update.')
    }
  }

  return (
    <div
      className="rounded-xl border bg-white transition-shadow hover:shadow-sm"
      style={{
        borderColor: highlight ? accentColor : 'rgb(var(--border-default,229 233 240))',
        boxShadow: highlight ? `0 0 0 1px ${accentColor}40` : undefined,
      }}
    >
      <div className="flex items-stretch">
        {/* Left accent bar */}
        {accentColor && (
          <div className="w-1 rounded-l-xl shrink-0" style={{ background: accentColor }} />
        )}

        {/* Time block */}
        <div className="flex flex-col items-center justify-center px-4 py-3 border-r shrink-0 min-w-[110px]"
          style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
          <p className="text-sm font-bold leading-tight" style={{ color: 'rgb(11 31 58)' }}>
            {formatTime12(start)}
          </p>
          <p className="text-[11px]" style={{ color: 'rgb(120 130 140)' }}>{formatTime12(end)}</p>
          <p className="text-[10px] mt-1 px-1.5 py-0.5 rounded-full font-medium"
            style={{ background: 'rgb(243 244 246)', color: 'rgb(90 100 112)' }}>
            {dur} min
          </p>
        </div>

        {/* Main */}
        <div className="flex-1 px-4 py-3 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold truncate" style={{ color: 'rgb(11 31 58)' }}>
                  {studentName}
                </p>
                <StatusBadge status={session.status} />
                <QuotaBadge impact={session.quota_impact} status={session.status} />
                {needsReport && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: 'rgb(254 243 199)', color: 'rgb(146 64 14)' }}>
                    <FileText size={10} /> Report due
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs flex-wrap" style={{ color: 'rgb(90 100 112)' }}>
                <span className="inline-flex items-center gap-1"><GraduationCap size={12} />{teacherName}</span>
                {session.zoom_join_url && (
                  <a
                    href={session.zoom_join_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:underline"
                    style={{ color: 'rgb(30 90 171)' }}
                  >
                    <Video size={12} /> Zoom
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 flex-wrap mt-2">
            {canAct && (
              <>
                <ActionButton
                  icon={<CheckCircle2 size={13} />}
                  label="Attended"
                  color="rgb(21 128 61)"
                  bg="rgb(220 252 231)"
                  loading={mark.isPending}
                  onClick={doAttend}
                />
                <ActionButton
                  icon={<FileText size={13} />}
                  label="+ Report"
                  color="rgb(21 128 61)"
                  bg="rgb(187 247 208)"
                  loading={mark.isPending}
                  onClick={() => onAttendWithReport(session)}
                />
                <ActionButton
                  icon={<XCircle size={13} />}
                  label="Absent"
                  color="rgb(153 27 27)"
                  bg="rgb(254 226 226)"
                  loading={mark.isPending}
                  onClick={() => onRequestAbsent(session)}
                />
                <ActionButton
                  icon={<AlertTriangle size={13} />}
                  label="Reschedule"
                  color="rgb(146 64 14)"
                  bg="rgb(254 243 199)"
                  onClick={() => onReschedule(session)}
                />
                <ActionButton
                  icon={<Ban size={13} />}
                  label="Cancel"
                  color="rgb(75 85 99)"
                  bg="rgb(243 244 246)"
                  onClick={() => onCancel(session)}
                />
              </>
            )}
            {needsReport && (
              <ActionButton
                icon={<FileText size={13} />}
                label="Fill Report"
                color="#fff"
                bg="rgb(146 64 14)"
                onClick={() => onAttendWithReport(session)}
              />
            )}
            <button
              onClick={onOpen}
              className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
              style={{ color: 'rgb(90 100 112)' }}
            >
              <Edit3 size={12} /> Open
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ActionButton({ icon, label, color, bg, onClick, loading }: {
  icon: React.ReactNode; label: string; color: string; bg: string; onClick: () => void; loading?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
      style={{ background: bg, color }}
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : icon}
      {label}
    </button>
  )
}

/* ─── Section ──────────────────────────────────────────────────────────── */
function Section({
  title, count, accent, icon, sessions, onOpen, onRequestAbsent,
  onReschedule, onCancel, onAttendWithReport,
  defaultOpen = true, highlight = false,
}: {
  title: string
  count: number
  accent: string
  icon: React.ReactNode
  sessions: Session[]
  onOpen: (s: Session) => void
  onRequestAbsent: (s: Session) => void
  onReschedule: (s: Session) => void
  onCancel: (s: Session) => void
  onAttendWithReport: (s: Session) => void
  defaultOpen?: boolean
  highlight?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  if (count === 0) return null
  return (
    <div className="mb-5">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 mb-2 group"
      >
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md"
          style={{ background: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent }}>
          {icon}
        </span>
        <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: 'rgb(11 31 58)' }}>{title}</h2>
        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold"
          style={{ background: accent, color: '#fff' }}>{count}</span>
        <div className="flex-1 border-t ml-1" style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }} />
        <ChevronRight size={14} className="text-gray-400 transition-transform"
          style={{ transform: open ? 'rotate(90deg)' : 'rotate(0)' }} />
      </button>
      {open && (
        <div className="space-y-2">
          {sessions.map(s => (
            <SessionCard key={s.id} session={s}
              onOpen={() => onOpen(s)}
              onReschedule={onReschedule}
              onCancel={onCancel}
              onAttendWithReport={onAttendWithReport}
              onRequestAbsent={onRequestAbsent}
              accentColor={highlight ? accent : undefined} highlight={highlight} />
          ))}
        </div>
      )}
    </div>
  )
}


/* ─── Page ─────────────────────────────────────────────────────────────── */
export default function SchedulePage() {
  const [date, setDate] = useState(() => new Date())
  const [selected,         setSelected]         = useState<Session | null>(null)
  const [calendarSession,  setCalendarSession]  = useState<Session | null>(null)
  const [absentTarget,     setAbsentTarget]     = useState<Session | null>(null)
  const [rescheduleTarget, setRescheduleTarget] = useState<Session | null>(null)
  const [cancelTarget,     setCancelTarget]     = useState<Session | null>(null)
  const [reportTarget,     setReportTarget]     = useState<Session | null>(null)
  const [availabilityOpen, setAvailabilityOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [teacherId, setTeacherId] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const dateStr = toYmd(date)

  const { data: result, isLoading, refetch } = useSessions({
    from: `${dateStr}T00:00:00Z`,
    to:   `${dateStr}T23:59:59Z`,
    teacher_id: teacherId || undefined,
    status: statusFilter || undefined,
    per_page: 200,
  })
  const { data: conflicts } = useSessionConflicts()
  const { data: teachersData } = useTeachers({ per_page: 100 })

  const sessions: Session[] = (result as any)?.data ?? []

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return sessions
    const q = searchTerm.toLowerCase()
    return sessions.filter(s =>
      s.student?.name?.toLowerCase().includes(q) ||
      s.teacher?.name?.toLowerCase().includes(q),
    )
  }, [sessions, searchTerm])

  /* ── Group sessions by status bucket ── */
  const now = Date.now()
  const inTwoHours = now + 2 * 60 * 60 * 1000

  const groups = useMemo(() => {
    const live: Session[] = []
    const next2h: Session[] = []
    const needs: Session[] = []
    const later: Session[] = []
    const done: Session[] = []
    const sorted = [...filtered].sort((a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime())
    for (const s of sorted) {
      const start = new Date(s.scheduled_start).getTime()
      const end   = new Date(s.scheduled_end).getTime()
      const isToday = isSameDay(new Date(s.scheduled_start), new Date())
      const isSelectedToday = isSameDay(date, new Date())

      // LIVE NOW — only meaningful when viewing today
      if (isSelectedToday && start <= now && end >= now && s.status === 'scheduled') {
        live.push(s); continue
      }
      // Needs action: attended but no report, or past scheduled (no-mark)
      if (s.status === 'attended' && !s.has_report) { needs.push(s); continue }
      if (isToday && start < now && s.status === 'scheduled') { needs.push(s); continue }
      // Done buckets
      if (['attended', 'absent', 'cancelled', 'rescheduled'].includes(s.status)) { done.push(s); continue }
      // Next 2 hours
      if (isSelectedToday && start > now && start <= inTwoHours) { next2h.push(s); continue }
      // Later
      later.push(s)
    }
    return { live, next2h, needs, later, done }
  }, [filtered, date, now, inTwoHours])

  const todayCount = sessions.length
  const liveCount = groups.live.length
  const pendingReports = groups.needs.filter(s => s.status === 'attended').length
  const noShows = sessions.filter(s => s.status === 'absent').length

  return (
    <>
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'rgb(11 31 58)' }}>Schedule</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgb(90 100 112)' }}>
            Day-by-day list of sessions — mark attendance and write reports inline.
          </p>
        </div>
        <button
          onClick={() => setAvailabilityOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 shrink-0"
          style={{ background: 'rgb(30 90 171)', color: '#fff' }}
        >
          <Sparkles size={14} />
          Teacher availabilities
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard icon={<CalendarDays size={16} />} label="Sessions on this day" value={todayCount} accent="rgb(30 90 171)" />
        <StatCard icon={<Clock size={16} />}        label="Live now"               value={liveCount}     accent="rgb(14 124 90)" />
        <StatCard icon={<FileText size={16} />}     label="Pending reports"        value={pendingReports} accent="rgb(146 64 14)" />
        <StatCard icon={<AlertTriangle size={16} />} label="No-shows today"        value={noShows}        accent="rgb(220 38 38)" />
      </div>

      <ConflictBanner />

      {/* Filters */}
      <div className="rounded-xl border bg-white p-3 mb-5 flex items-center gap-2 flex-wrap"
        style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search student or teacher…"
            className="w-full rounded-lg border bg-white pl-9 pr-9 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-gray-400"
            style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>

        <select
          value={teacherId}
          onChange={e => setTeacherId(e.target.value)}
          className="px-3 py-1.5 rounded-lg border bg-white text-sm"
          style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}
        >
          <option value="">All teachers</option>
          {(teachersData as any)?.data?.map((t: any) => (
            <option key={t.id} value={t.id}>{t.name ?? t.user?.name}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg border bg-white text-sm"
          style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}
        >
          <option value="">All statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="attended">Attended</option>
          <option value="absent">Absent</option>
          <option value="cancelled">Cancelled</option>
          <option value="pending_substitute">Needs Sub</option>
        </select>
      </div>

      {/* Calendar (visual day view — always rendered, even when empty) */}
      <div className="mb-6">
        <CalendarView
          sessions={filtered}
          loading={isLoading}
          onEventClick={setCalendarSession}
          date={date}
          onDateChange={setDate}
          editable
        />
      </div>

      {/* Action sections */}
      <div className="mb-2">
        <h2 className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: 'rgb(11 31 58)' }}>
          Quick actions
        </h2>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
          <Loader2 size={22} className="animate-spin" />
          <p className="text-sm">Loading sessions…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <CalendarDays size={22} className="text-gray-300" />
          </div>
          <p className="text-sm text-gray-500 font-medium">No sessions for this day</p>
          {(searchTerm || teacherId || statusFilter) && (
            <button onClick={() => { setSearchTerm(''); setTeacherId(''); setStatusFilter('') }}
              className="text-sm text-emerald-600 hover:underline">Clear filters</button>
          )}
        </div>
      ) : (
        <>
          <Section
            title="Live now"
            count={groups.live.length}
            accent="rgb(14 124 90)"
            icon={<Clock size={13} />}
            sessions={groups.live}
            onOpen={setSelected}
            onRequestAbsent={setAbsentTarget}
            onReschedule={setRescheduleTarget}
            onCancel={setCancelTarget}
            onAttendWithReport={setReportTarget}
            highlight
          />
          <Section
            title="Next 2 hours"
            count={groups.next2h.length}
            accent="rgb(30 90 171)"
            icon={<Clock size={13} />}
            sessions={groups.next2h}
            onOpen={setSelected}
            onRequestAbsent={setAbsentTarget}
            onReschedule={setRescheduleTarget}
            onCancel={setCancelTarget}
            onAttendWithReport={setReportTarget}
          />
          <Section
            title="Needs action"
            count={groups.needs.length}
            accent="rgb(146 64 14)"
            icon={<AlertTriangle size={13} />}
            sessions={groups.needs}
            onOpen={setSelected}
            onRequestAbsent={setAbsentTarget}
            onReschedule={setRescheduleTarget}
            onCancel={setCancelTarget}
            onAttendWithReport={setReportTarget}
          />
          <Section
            title="Later"
            count={groups.later.length}
            accent="rgb(90 100 112)"
            icon={<CalendarDays size={13} />}
            sessions={groups.later}
            onOpen={setSelected}
            onRequestAbsent={setAbsentTarget}
            onReschedule={setRescheduleTarget}
            onCancel={setCancelTarget}
            onAttendWithReport={setReportTarget}
          />
          <Section
            title="Done"
            count={groups.done.length}
            accent="rgb(120 130 140)"
            icon={<CheckCircle2 size={13} />}
            sessions={groups.done}
            onOpen={setSelected}
            onRequestAbsent={setAbsentTarget}
            onReschedule={setRescheduleTarget}
            onCancel={setCancelTarget}
            onAttendWithReport={setReportTarget}
            defaultOpen={false}
          />
        </>
      )}

      <SessionEventPopup
        session={calendarSession}
        onClose={() => setCalendarSession(null)}
        onReschedule={s => { setCalendarSession(null); setRescheduleTarget(s) }}
        onCancel={s => { setCalendarSession(null); setCancelTarget(s) }}
        onAbsent={s => { setCalendarSession(null); setAbsentTarget(s) }}
        onAttendWithReport={s => { setCalendarSession(null); setReportTarget(s) }}
        onViewDetails={s => { setCalendarSession(null); setSelected(s) }}
      />

      <SessionDrawer
        session={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onUpdate={refetch}
      />

      {absentTarget && (
        <AbsentModal
          session={absentTarget}
          onClose={() => setAbsentTarget(null)}
          onSubmitted={refetch}
        />
      )}

      <RescheduleModal
        session={rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        onDone={() => { setRescheduleTarget(null); refetch() }}
      />

      <CancelModal
        session={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onDone={() => { setCancelTarget(null); refetch() }}
      />

      <SessionReportModal
        session={reportTarget}
        open={reportTarget !== null}
        studentName={reportTarget?.student?.name ?? ''}
        onClose={() => setReportTarget(null)}
        onSubmitted={() => { setReportTarget(null); refetch() }}
      />

      <TeacherAvailabilityModal
        open={availabilityOpen}
        onClose={() => setAvailabilityOpen(false)}
      />
    </>
  )
}
