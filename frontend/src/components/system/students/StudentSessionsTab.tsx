'use client'
import { useState, useEffect, useRef } from 'react'
import {
  Video, CalendarDays, ChevronRight, FlaskConical, BookOpen,
  Clock, Check, AlertCircle, Filter, MoreVertical,
  CalendarClock, Ban, UserCheck, UserX, FileText, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useStudentSessions, useMarkAttendance, useRescheduleSession, useCancelSession } from '@/hooks/system/useSessions'
import { SessionDrawer } from '@/components/system/schedule/SessionDrawer'
import { AbsentModal } from '@/components/system/schedule/AbsentModal'
import { TrialReportModal } from '@/components/system/students/TrialReportModal'
import { SessionReportModal } from '@/components/system/students/SessionReportModal'
import type { Session } from '@/types/system/session'

/* ─── constants ────────────────────────────────────────── */
const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  scheduled:          { label: 'Scheduled',       bg: 'rgb(14 124 90 / 0.08)',  color: 'rgb(14 124 90)' },
  attended:           { label: 'Attended',         bg: 'rgb(30 90 171 / 0.08)', color: 'rgb(30 90 171)' },
  absent:             { label: 'Absent',           bg: 'rgb(220 38 38 / 0.08)', color: 'rgb(220 38 38)' },
  cancelled:          { label: 'Cancelled',        bg: 'rgb(107 114 128 / 0.1)', color: 'rgb(107 114 128)' },
  rescheduled:        { label: 'Rescheduled',      bg: 'rgb(217 119 6 / 0.08)', color: 'rgb(180 83 9)' },
  pending_substitute: { label: 'Needs substitute', bg: 'rgb(234 88 12 / 0.08)', color: 'rgb(194 65 12)' },
}

type FilterTab = 'all' | 'upcoming' | 'past'

/* ─── helpers ──────────────────────────────────────────── */
function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}
function isUpcoming(s: Session) { return s.status === 'scheduled' || s.status === 'pending_substitute' }
function isTrial(s: Session) { return s.schedule_pattern_id === null }

/* ─── sub-components ───────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, bg: 'rgb(107 114 128 / 0.1)', color: 'rgb(107 114 128)' }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  )
}

/* Quota-impact pill — hidden for sessions that haven't been marked yet. */
function QuotaBadge({ session }: { session: Session }) {
  if (session.status === 'scheduled' || session.status === 'rescheduled' || session.status === 'pending_substitute') return null
  const cfg = (() => {
    switch (session.quota_impact) {
      case 'counted':         return { label: 'Counted',       bg: 'rgb(220 252 231)', fg: 'rgb(21 128 61)',  tip: 'Consumed from monthly quota' }
      case 'counted_no_show': return { label: 'No-show',       bg: 'rgb(254 226 226)', fg: 'rgb(153 27 27)',  tip: 'Student absent without apology — counted as used' }
      case 'free_teacher':    return { label: 'Free (teacher)',bg: 'rgb(254 243 199)', fg: 'rgb(146 64 14)',  tip: 'Teacher absent — not counted from quota' }
      case 'free_excused':    return { label: 'Free (excused)',bg: 'rgb(219 234 254)', fg: 'rgb(30 64 175)',  tip: 'Student apologized in time — not counted' }
      default:                return { label: 'Free',          bg: 'rgb(243 244 246)', fg: 'rgb(75 85 99)',   tip: 'Does not count against quota' }
    }
  })()
  return (
    <span title={cfg.tip}
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide"
      style={{ background: cfg.bg, color: cfg.fg }}>
      {cfg.label}
    </span>
  )
}

/* ─── trial session row ────────────────────────────────── */
function TrialRow({ session, onOpen }: { session: Session; onOpen: (s: Session) => void }) {
  const upcoming = isUpcoming(session)
  const hasReport = session.has_report

  return (
    <button
      onClick={() => onOpen(session)}
      className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-left transition-all hover:shadow-md group"
      style={{
        background: '#fff',
        border: '1px solid rgb(14 124 90 / 0.25)',
        opacity: session.status === 'cancelled' ? 0.55 : 1,
      }}
    >
      {/* Icon column */}
      <div className="flex items-center justify-center w-11 h-11 rounded-2xl shrink-0 transition-transform group-hover:scale-105"
        style={{ background: 'linear-gradient(135deg, rgb(14 124 90 / 0.12), rgb(30 90 171 / 0.08))' }}>
        <FlaskConical size={18} style={{ color: 'rgb(14 124 90)' }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
            style={{ background: 'rgb(14 124 90 / 0.08)', color: 'rgb(14 124 90)' }}>
            <FlaskConical size={9} />
            Trial
          </span>
          <span className="text-sm font-semibold" style={{ color: 'rgb(11 31 58)' }}>
            {formatDay(session.scheduled_start)}
          </span>
          <span className="text-xs" style={{ color: 'rgb(90 100 112)' }}>
            {formatTime(session.scheduled_start)} – {formatTime(session.scheduled_end)}
          </span>
          <StatusBadge status={session.status} />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs" style={{ color: 'rgb(90 100 112)' }}>
            {session.teacher?.name ?? 'Unassigned'} · {session.duration_min} min
          </span>
          {hasReport ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgb(30 90 171 / 0.08)', color: 'rgb(30 90 171)' }}>
              <Check size={9} />Report submitted
            </span>
          ) : !upcoming && session.status === 'attended' ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgb(220 38 38 / 0.08)', color: 'rgb(220 38 38)' }}>
              <AlertCircle size={9} />Report pending
            </span>
          ) : null}
        </div>
      </div>

      {/* CTA hint */}
      <div className="shrink-0 flex items-center gap-1.5">
        {!hasReport && session.status === 'attended' && (
          <span className="hidden sm:inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-lg"
            style={{ background: 'rgb(14 124 90)', color: '#fff' }}>
            Fill Report
          </span>
        )}
        <ChevronRight size={15} className="opacity-30 group-hover:opacity-60 transition-opacity" />
      </div>
    </button>
  )
}

/* ─── session actions menu ─────────────────────────────── */
interface SessionRowProps {
  session: Session
  onOpen: (s: Session) => void
  onReschedule: (s: Session) => void
  onCancel: (s: Session) => void
  onMarkAttended: (s: Session) => void
  onMarkWithReport: (s: Session) => void
  onMarkAbsent: (s: Session) => void
}

function SessionRow({ session, onOpen, onReschedule, onCancel, onMarkAttended, onMarkWithReport, onMarkAbsent }: SessionRowProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos, setMenuPos]   = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  const canScheduleActions = session.status === 'scheduled' || session.status === 'pending_substitute'
  const canMarkAttend      = session.status !== 'cancelled' && session.status !== 'rescheduled'
  const isDimmed           = session.status === 'cancelled' || session.status === 'rescheduled'

  function handleMenuToggle(e: React.MouseEvent) {
    e.stopPropagation()
    if (menuOpen) { setMenuOpen(false); return }
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setMenuPos({ top: r.bottom + 4, left: r.right - 196 })
    }
    setMenuOpen(true)
  }

  function closeMenu() { setMenuOpen(false) }

  return (
    <div className="flex items-stretch rounded-2xl overflow-visible"
      style={{
        background: '#fff',
        border: '1px solid rgb(var(--border-default,229 233 240))',
        opacity: isDimmed ? 0.55 : 1,
      }}>

      {/* Clickable info area → opens drawer */}
      <button
        onClick={() => onOpen(session)}
        className="flex-1 flex items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-black/[0.015] group"
      >
        <div className="flex items-center justify-center w-11 h-11 rounded-2xl shrink-0 transition-transform group-hover:scale-105"
          style={{ background: 'rgb(30 90 171 / 0.06)' }}>
          <CalendarDays size={18} style={{ color: 'rgb(30 90 171)' }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-sm font-semibold" style={{ color: 'rgb(11 31 58)' }}>
              {formatDay(session.scheduled_start)}
            </span>
            <span className="text-xs" style={{ color: 'rgb(90 100 112)' }}>
              {formatTime(session.scheduled_start)} – {formatTime(session.scheduled_end)}
            </span>
            <StatusBadge status={session.status} />
            <QuotaBadge session={session} />
          </div>
          <p className="text-xs" style={{ color: 'rgb(90 100 112)' }}>
            {session.teacher?.name ?? 'Unassigned'} · {session.duration_min} min
            {session.zoom_join_url && <> · <span style={{ color: 'rgb(30 90 171)' }}>Zoom ready</span></>}
            {session.has_report && (
              <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgb(30 90 171 / 0.08)', color: 'rgb(30 90 171)' }}>
                <Check size={9} />Report
              </span>
            )}
          </p>
        </div>
      </button>

      {/* Divider */}
      <div className="w-px my-2 shrink-0" style={{ background: 'rgb(var(--border-default,229 233 240))' }} />

      {/* Actions menu trigger */}
      <button
        ref={btnRef}
        onClick={handleMenuToggle}
        title="Session actions"
        className="flex items-center justify-center w-10 shrink-0 transition-colors hover:bg-black/5 rounded-r-2xl"
      >
        <MoreVertical size={15} className="opacity-35 hover:opacity-70 transition-opacity" />
      </button>

      {/* Dropdown */}
      {menuOpen && menuPos && (
        <>
          <div className="fixed inset-0 z-[99]" onClick={closeMenu} />
          <div
            className="fixed z-[100] rounded-xl shadow-xl border py-1"
            style={{
              top: menuPos.top,
              left: menuPos.left,
              minWidth: 196,
              background: '#fff',
              borderColor: 'rgb(var(--border-default,229 233 240))',
            }}
          >
            {canScheduleActions && (
              <>
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
                  onClick={() => { onReschedule(session); closeMenu() }}>
                  <CalendarClock size={14} style={{ color: 'rgb(30 90 171)' }} />
                  <span style={{ color: 'rgb(11 31 58)' }}>Reschedule</span>
                </button>
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
                  onClick={() => { onCancel(session); closeMenu() }}>
                  <Ban size={14} style={{ color: 'rgb(220 38 38)' }} />
                  <span style={{ color: 'rgb(220 38 38)' }}>Cancel Session</span>
                </button>
              </>
            )}

            {canScheduleActions && canMarkAttend && (
              <div className="my-1 h-px mx-2" style={{ background: 'rgb(var(--border-default,229 233 240))' }} />
            )}

            {canMarkAttend && (
              <>
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
                  onClick={() => { onMarkAttended(session); closeMenu() }}>
                  <UserCheck size={14} style={{ color: 'rgb(14 124 90)' }} />
                  <span style={{ color: 'rgb(11 31 58)' }}>Mark Attended</span>
                </button>
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
                  onClick={() => { onMarkWithReport(session); closeMenu() }}>
                  <FileText size={14} style={{ color: 'rgb(14 124 90)' }} />
                  <span style={{ color: 'rgb(11 31 58)' }}>
                    Mark Attended
                    <span className="ml-1 text-[11px]" style={{ color: 'rgb(90 100 112)' }}>+ Report</span>
                  </span>
                </button>
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
                  onClick={() => { onMarkAbsent(session); closeMenu() }}>
                  <UserX size={14} style={{ color: 'rgb(220 38 38)' }} />
                  <span style={{ color: 'rgb(220 38 38)' }}>Mark Absent</span>
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/* ─── reschedule modal ─────────────────────────────────── */
function RescheduleModal({ session, onClose, onDone }: { session: Session | null; onClose: () => void; onDone: () => void }) {
  const reschedule = useRescheduleSession()
  const [dt, setDt] = useState('')

  useEffect(() => {
    if (session) setDt(session.scheduled_start.slice(0, 16))
  }, [session?.id])

  if (!session) return null

  async function handleSubmit() {
    try {
      await reschedule.mutateAsync({ id: session!.id, scheduled_start: new Date(dt).toISOString() })
      toast.success('Session rescheduled.')
      onDone()
    } catch {
      toast.error('Failed to reschedule session.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[rgb(11,31,58)]/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: '#fff', border: '1px solid rgb(var(--border-default,229 233 240))' }}>

        <div className="px-5 py-4 border-b flex items-center justify-between"
          style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
          <div className="flex items-center gap-2">
            <CalendarClock size={17} style={{ color: 'rgb(30 90 171)' }} />
            <p className="font-bold text-sm" style={{ color: 'rgb(11 31 58)' }}>Reschedule Session</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors opacity-40 hover:opacity-80">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-xs" style={{ color: 'rgb(90 100 112)' }}>
            Current: {formatDay(session.scheduled_start)} · {formatTime(session.scheduled_start)}
          </p>
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'rgb(90 100 112)' }}>
              New date &amp; time
            </label>
            <input
              type="datetime-local"
              value={dt}
              onChange={e => setDt(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[rgb(30,90,171)] transition-shadow"
              style={{ borderColor: 'rgb(var(--border-default,229 233 240))', background: '#fff', color: 'rgb(11 31 58)' }}
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t flex justify-end gap-3"
          style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
          <button onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium border hover:bg-black/5 transition-colors"
            style={{ borderColor: 'rgb(var(--border-default,229 233 240))', color: 'rgb(90 100 112)' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={!dt || reschedule.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all hover:opacity-90"
            style={{ background: 'rgb(30 90 171)', boxShadow: '0 2px 8px rgb(30 90 171 / 0.3)' }}>
            <CalendarClock size={14} />
            {reschedule.isPending ? 'Saving…' : 'Reschedule'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── cancel dialog ────────────────────────────────────── */
function CancelDialog({ session, onClose, onDone }: { session: Session | null; onClose: () => void; onDone: () => void }) {
  const cancel = useCancelSession()
  const [cancelledBy, setCancelledBy] = useState<'student' | 'teacher' | 'admin'>('admin')
  const [reason, setReason] = useState('')

  if (!session) return null

  async function handleSubmit() {
    try {
      await cancel.mutateAsync({ id: session!.id, cancelled_by: cancelledBy, cancellation_reason: reason || undefined })
      toast.success('Session cancelled.')
      onDone()
    } catch {
      toast.error('Failed to cancel session.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[rgb(11,31,58)]/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: '#fff', border: '1px solid rgb(var(--border-default,229 233 240))' }}>

        <div className="px-5 py-4 border-b flex items-center justify-between"
          style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
          <div className="flex items-center gap-2">
            <Ban size={17} style={{ color: 'rgb(220 38 38)' }} />
            <p className="font-bold text-sm" style={{ color: 'rgb(11 31 58)' }}>Cancel Session</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors opacity-40 hover:opacity-80">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs" style={{ color: 'rgb(90 100 112)' }}>
            {formatDay(session.scheduled_start)} · {formatTime(session.scheduled_start)}
          </p>

          <div>
            <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'rgb(90 100 112)' }}>
              Cancelled by
            </label>
            <div className="flex gap-2">
              {(['student', 'teacher', 'admin'] as const).map(who => (
                <button key={who} type="button"
                  onClick={() => setCancelledBy(who)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold border transition-all capitalize"
                  style={cancelledBy === who
                    ? { background: 'rgb(220 38 38 / 0.08)', color: 'rgb(220 38 38)', borderColor: 'rgb(220 38 38 / 0.3)' }
                    : { background: '#fff', color: 'rgb(90 100 112)', borderColor: 'rgb(var(--border-default,229 233 240))' }}>
                  {who}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'rgb(90 100 112)' }}>
              Reason (optional)
            </label>
            <textarea
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[rgb(220,38,38)] transition-shadow resize-none"
              style={{ borderColor: 'rgb(var(--border-default,229 233 240))', background: '#fff', color: 'rgb(11 31 58)' }}
              rows={2}
              placeholder="e.g. Student is travelling, teacher is unavailable…"
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t flex justify-end gap-3"
          style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
          <button onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium border hover:bg-black/5 transition-colors"
            style={{ borderColor: 'rgb(var(--border-default,229 233 240))', color: 'rgb(90 100 112)' }}>
            Go Back
          </button>
          <button onClick={handleSubmit} disabled={cancel.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all hover:opacity-90"
            style={{ background: 'rgb(220 38 38)', boxShadow: '0 2px 8px rgb(220 38 38 / 0.3)' }}>
            <Ban size={14} />
            {cancel.isPending ? 'Cancelling…' : 'Cancel Session'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── stats bar ────────────────────────────────────────── */
function StatBar({ sessions }: { sessions: Session[] }) {
  // Limit to the current calendar month so the numbers track the active quota cycle.
  const now = new Date()
  const monthSessions = sessions.filter(s => {
    const d = new Date(s.scheduled_start)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  })
  const total = monthSessions.length
  if (total === 0) return null

  const counted   = monthSessions.filter(s => s.counts_against_quota).length
  const free      = monthSessions.filter(s =>
    !s.counts_against_quota && (s.status === 'absent' || s.status === 'cancelled')
  ).length
  const upcoming  = monthSessions.filter(s => s.status === 'scheduled' || s.status === 'pending_substitute').length

  return (
    <div className="grid grid-cols-3 gap-3 rounded-2xl p-4"
      style={{ background: '#fff', border: '1px solid rgb(var(--border-default,229 233 240))' }}>
      <div className="text-center">
        <p className="text-xl font-bold" style={{ color: 'rgb(14 124 90)' }}>{counted}</p>
        <p className="text-[10px] uppercase tracking-widest font-semibold mt-0.5" style={{ color: 'rgb(90 100 112)' }}>
          Counted this month
        </p>
      </div>
      <div className="text-center" style={{ borderLeft: '1px solid rgb(var(--border-default,229 233 240))', borderRight: '1px solid rgb(var(--border-default,229 233 240))' }}>
        <p className="text-xl font-bold" style={{ color: 'rgb(30 90 171)' }}>{upcoming}</p>
        <p className="text-[10px] uppercase tracking-widest font-semibold mt-0.5" style={{ color: 'rgb(90 100 112)' }}>Upcoming</p>
      </div>
      <div className="text-center">
        <p className="text-xl font-bold" style={{ color: free > 0 ? 'rgb(146 64 14)' : 'rgb(107 114 128)' }}>{free}</p>
        <p className="text-[10px] uppercase tracking-widest font-semibold mt-0.5" style={{ color: 'rgb(90 100 112)' }}>
          Free (excused)
        </p>
      </div>
    </div>
  )
}

/* ─── main tab ─────────────────────────────────────────── */
interface Props {
  studentId:     number
  studentName:   string
  studentStatus: string
}

export function StudentSessionsTab({ studentId, studentName, studentStatus }: Props) {
  const { data, isLoading } = useStudentSessions(studentId)
  const markAttendance = useMarkAttendance()

  const [selected,       setSelected]       = useState<Session | null>(null)
  const [drawerOpen,     setDrawerOpen]     = useState(false)
  const [trialSession,   setTrialSession]   = useState<Session | null>(null)
  const [trialOpen,      setTrialOpen]      = useState(false)
  const [filter,         setFilter]         = useState<FilterTab>('all')
  const [actionSession,  setActionSession]  = useState<Session | null>(null)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [cancelOpen,     setCancelOpen]     = useState(false)
  const [reportOpen,     setReportOpen]     = useState(false)
  const [absentTarget,   setAbsentTarget]   = useState<Session | null>(null)

  const allSessions     = (data as { data?: Session[] } | undefined)?.data ?? []
  const trialSessions   = allSessions.filter(isTrial)
  const regularSessions = allSessions.filter(s => !isTrial(s))

  const filteredRegular = regularSessions.filter(s => {
    if (filter === 'upcoming') return isUpcoming(s)
    if (filter === 'past')     return !isUpcoming(s)
    return true
  })

  const upcomingCount = regularSessions.filter(isUpcoming).length
  const pastCount     = regularSessions.filter(s => !isUpcoming(s)).length

  function openTrial(s: Session)   { setTrialSession(s); setTrialOpen(true) }
  function openSession(s: Session) { setSelected(s); setDrawerOpen(true) }

  function handleReschedule(s: Session)   { setActionSession(s); setRescheduleOpen(true) }
  function handleCancel(s: Session)       { setActionSession(s); setCancelOpen(true) }
  function handleMarkWithReport(s: Session) { setActionSession(s); setReportOpen(true) }

  function handleMarkAttended(s: Session) {
    markAttendance.mutate(
      { id: s.id, status: 'attended' },
      { onSuccess: () => toast.success('Marked as attended.'), onError: () => toast.error('Failed to update.') },
    )
  }

  function handleMarkAbsent(s: Session) {
    // Open the 2-step popup so support records who was absent + apology status.
    // Result flows into quota math (counted vs free).
    setAbsentTarget(s)
  }

  /* ── loading skeleton ── */
  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse max-w-3xl">
        {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-2xl bg-gray-100" />)}
      </div>
    )
  }

  /* ── empty state ── */
  if (allSessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center max-w-3xl">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'linear-gradient(135deg, rgb(14 124 90 / 0.1), rgb(30 90 171 / 0.1))' }}>
          <Video size={26} style={{ color: 'rgb(14 124 90)' }} />
        </div>
        <p className="font-bold text-base mb-1.5" style={{ color: 'rgb(11 31 58)' }}>No sessions yet</p>
        <p className="text-sm max-w-xs" style={{ color: 'rgb(90 100 112)' }}>
          {studentStatus === 'trial'
            ? 'Schedule a trial class from the header above to get started.'
            : 'Sessions will appear here once scheduled.'}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6 max-w-3xl">

        {/* ── Stats overview (regular sessions only) ── */}
        {regularSessions.length > 0 && <StatBar sessions={regularSessions} />}

        {/* ── Trial sessions section ── */}
        {trialSessions.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgb(14 124 90 / 0.1)' }}>
                  <FlaskConical size={14} style={{ color: 'rgb(14 124 90)' }} />
                </div>
                <p className="text-sm font-bold" style={{ color: 'rgb(11 31 58)' }}>
                  Trial {trialSessions.length === 1 ? 'Class' : 'Classes'}
                </p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: 'rgb(14 124 90 / 0.1)', color: 'rgb(14 124 90)' }}>
                  {trialSessions.length}
                </span>
              </div>
              <div className="flex-1 h-px" style={{ background: 'rgb(14 124 90 / 0.12)' }} />
              <span className="text-[11px] font-medium" style={{ color: 'rgb(14 124 90)' }}>
                Click to view / fill report
              </span>
            </div>

            <div className="mb-3 px-3 py-2.5 rounded-xl flex items-start gap-2"
              style={{ background: 'rgb(14 124 90 / 0.05)', border: '1px solid rgb(14 124 90 / 0.15)' }}>
              <FlaskConical size={13} className="shrink-0 mt-0.5" style={{ color: 'rgb(14 124 90)' }} />
              <p className="text-xs" style={{ color: 'rgb(14 124 90)' }}>
                Trial sessions are one-off evaluation classes. Fill the trial report after the class to send a professional assessment to the parent.
              </p>
            </div>

            <div className="space-y-2">
              {trialSessions.map(s => <TrialRow key={s.id} session={s} onOpen={openTrial} />)}
            </div>
          </section>
        )}

        {/* ── Regular sessions section ── */}
        {regularSessions.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgb(30 90 171 / 0.08)' }}>
                  <BookOpen size={14} style={{ color: 'rgb(30 90 171)' }} />
                </div>
                <p className="text-sm font-bold" style={{ color: 'rgb(11 31 58)' }}>Sessions</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: 'rgb(30 90 171 / 0.08)', color: 'rgb(30 90 171)' }}>
                  {regularSessions.length}
                </span>
              </div>
              <div className="flex-1 h-px" style={{ background: 'rgb(var(--border-default,229 233 240))' }} />

              {/* filter tabs */}
              <div className="flex items-center gap-1 p-1 rounded-xl"
                style={{ background: 'rgb(var(--border-default,229 233 240) / 0.5)', border: '1px solid rgb(var(--border-default,229 233 240))' }}>
                <Filter size={11} className="ml-1 opacity-40" />
                {([
                  { key: 'all',      label: 'All',      count: regularSessions.length },
                  { key: 'upcoming', label: 'Upcoming', count: upcomingCount },
                  { key: 'past',     label: 'Past',     count: pastCount },
                ] as const).map(tab => (
                  <button key={tab.key} onClick={() => setFilter(tab.key)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                    style={filter === tab.key
                      ? { background: '#fff', color: 'rgb(11 31 58)', boxShadow: '0 1px 3px rgb(0 0 0 / 0.08)' }
                      : { color: 'rgb(90 100 112)' }}>
                    {tab.label}
                    <span className="px-1 rounded text-[9px]"
                      style={{ background: filter === tab.key ? 'rgb(30 90 171 / 0.08)' : 'transparent', color: 'rgb(90 100 112)' }}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {filteredRegular.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center rounded-2xl"
                style={{ background: '#fff', border: '1px solid rgb(var(--border-default,229 233 240))' }}>
                <Clock size={22} className="mb-2 opacity-20" />
                <p className="text-sm font-medium opacity-40">No {filter === 'upcoming' ? 'upcoming' : 'past'} sessions</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filter === 'all' && upcomingCount > 0 && (
                  <>
                    <p className="text-[10px] font-semibold uppercase tracking-widest px-1 mb-2"
                      style={{ color: 'rgb(14 124 90)' }}>
                      Upcoming · {upcomingCount}
                    </p>
                    {filteredRegular.filter(isUpcoming).map(s => (
                      <SessionRow key={s.id} session={s} onOpen={openSession}
                        onReschedule={handleReschedule} onCancel={handleCancel}
                        onMarkAttended={handleMarkAttended} onMarkWithReport={handleMarkWithReport}
                        onMarkAbsent={handleMarkAbsent} />
                    ))}
                    {pastCount > 0 && (
                      <p className="text-[10px] font-semibold uppercase tracking-widest px-1 mt-4 mb-2"
                        style={{ color: 'rgb(90 100 112)' }}>
                        Past · {pastCount}
                      </p>
                    )}
                    {filteredRegular.filter(s => !isUpcoming(s)).map(s => (
                      <SessionRow key={s.id} session={s} onOpen={openSession}
                        onReschedule={handleReschedule} onCancel={handleCancel}
                        onMarkAttended={handleMarkAttended} onMarkWithReport={handleMarkWithReport}
                        onMarkAbsent={handleMarkAbsent} />
                    ))}
                  </>
                )}
                {filter !== 'all' && filteredRegular.map(s => (
                  <SessionRow key={s.id} session={s} onOpen={openSession}
                    onReschedule={handleReschedule} onCancel={handleCancel}
                    onMarkAttended={handleMarkAttended} onMarkWithReport={handleMarkWithReport}
                    onMarkAbsent={handleMarkAbsent} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Session drawer (regular sessions) */}
      <SessionDrawer
        session={selected}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUpdate={() => setDrawerOpen(false)}
      />

      {/* Trial report modal */}
      <TrialReportModal
        session={trialSession}
        open={trialOpen}
        studentName={studentName}
        onClose={() => setTrialOpen(false)}
        onSubmitted={() => setTrialOpen(false)}
      />

      {/* Reschedule modal */}
      <RescheduleModal
        session={rescheduleOpen ? actionSession : null}
        onClose={() => setRescheduleOpen(false)}
        onDone={() => setRescheduleOpen(false)}
      />

      {/* Cancel dialog */}
      <CancelDialog
        session={cancelOpen ? actionSession : null}
        onClose={() => setCancelOpen(false)}
        onDone={() => setCancelOpen(false)}
      />

      {/* Session report modal (mark attended + report) */}
      <SessionReportModal
        session={actionSession}
        open={reportOpen}
        studentName={studentName}
        onClose={() => setReportOpen(false)}
        onSubmitted={() => setReportOpen(false)}
      />

      {/* 2-step Absent reason modal (drives quota math) */}
      {absentTarget && (
        <AbsentModal
          session={absentTarget}
          onClose={() => setAbsentTarget(null)}
        />
      )}
    </>
  )
}
