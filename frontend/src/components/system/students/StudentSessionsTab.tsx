'use client'
import { useState } from 'react'
import {
  Video, CalendarDays, ChevronRight, FlaskConical, BookOpen,
  Clock, Check, AlertCircle, Filter,
} from 'lucide-react'
import { useStudentSessions } from '@/hooks/system/useSessions'
import { SessionDrawer } from '@/components/system/schedule/SessionDrawer'
import { TrialReportModal } from '@/components/system/students/TrialReportModal'
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

/* A session is a trial if it has no recurring pattern */
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

/* ─── regular session row ──────────────────────────────── */
function SessionRow({ session, onOpen }: { session: Session; onOpen: (s: Session) => void }) {
  return (
    <button
      onClick={() => onOpen(session)}
      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-left transition-all hover:shadow-md group"
      style={{
        background: '#fff',
        border: '1px solid rgb(var(--border-default,229 233 240))',
        opacity: session.status === 'cancelled' || session.status === 'rescheduled' ? 0.55 : 1,
      }}
    >
      {/* Date icon */}
      <div className="flex items-center justify-center w-11 h-11 rounded-2xl shrink-0 transition-transform group-hover:scale-105"
        style={{ background: 'rgb(30 90 171 / 0.06)' }}>
        <CalendarDays size={18} style={{ color: 'rgb(30 90 171)' }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="text-sm font-semibold" style={{ color: 'rgb(11 31 58)' }}>
            {formatDay(session.scheduled_start)}
          </span>
          <span className="text-xs" style={{ color: 'rgb(90 100 112)' }}>
            {formatTime(session.scheduled_start)} – {formatTime(session.scheduled_end)}
          </span>
          <StatusBadge status={session.status} />
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

      <ChevronRight size={15} className="shrink-0 opacity-30 group-hover:opacity-60 transition-opacity" />
    </button>
  )
}

/* ─── stats bar ────────────────────────────────────────── */
function StatBar({ sessions }: { sessions: Session[] }) {
  const attended  = sessions.filter(s => s.status === 'attended').length
  const absent    = sessions.filter(s => s.status === 'absent').length
  const scheduled = sessions.filter(s => s.status === 'scheduled' || s.status === 'pending_substitute').length
  const total     = sessions.length

  if (total === 0) return null

  return (
    <div className="grid grid-cols-3 gap-3 rounded-2xl p-4"
      style={{ background: '#fff', border: '1px solid rgb(var(--border-default,229 233 240))' }}>
      <div className="text-center">
        <p className="text-xl font-bold" style={{ color: 'rgb(14 124 90)' }}>{attended}</p>
        <p className="text-[10px] uppercase tracking-widest font-semibold mt-0.5" style={{ color: 'rgb(90 100 112)' }}>Attended</p>
      </div>
      <div className="text-center" style={{ borderLeft: '1px solid rgb(var(--border-default,229 233 240))', borderRight: '1px solid rgb(var(--border-default,229 233 240))' }}>
        <p className="text-xl font-bold" style={{ color: 'rgb(30 90 171)' }}>{scheduled}</p>
        <p className="text-[10px] uppercase tracking-widest font-semibold mt-0.5" style={{ color: 'rgb(90 100 112)' }}>Upcoming</p>
      </div>
      <div className="text-center">
        <p className="text-xl font-bold" style={{ color: absent > 0 ? 'rgb(220 38 38)' : 'rgb(107 114 128)' }}>{absent}</p>
        <p className="text-[10px] uppercase tracking-widest font-semibold mt-0.5" style={{ color: 'rgb(90 100 112)' }}>Missed</p>
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
  const [selected,     setSelected]     = useState<Session | null>(null)
  const [drawerOpen,   setDrawerOpen]   = useState(false)
  const [trialSession, setTrialSession] = useState<Session | null>(null)
  const [trialOpen,    setTrialOpen]    = useState(false)
  const [filter,       setFilter]       = useState<FilterTab>('all')

  const allSessions = (data as { data?: Session[] } | undefined)?.data ?? []

  /* split trials from regular — trial sessions have no schedule pattern */
  const trialSessions   = allSessions.filter(isTrial)
  const regularSessions = allSessions.filter(s => !isTrial(s))

  /* filter regular sessions */
  const filteredRegular = regularSessions.filter(s => {
    if (filter === 'upcoming') return isUpcoming(s)
    if (filter === 'past')     return !isUpcoming(s)
    return true
  })

  const upcomingCount = regularSessions.filter(isUpcoming).length
  const pastCount     = regularSessions.filter(s => !isUpcoming(s)).length

  function openTrial(s: Session) { setTrialSession(s); setTrialOpen(true) }
  function openSession(s: Session) { setSelected(s); setDrawerOpen(true) }

  /* ── loading skeleton ── */
  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse max-w-3xl">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 rounded-2xl bg-gray-100" />
        ))}
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
            {/* section header */}
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

            {/* trial banner */}
            <div className="mb-3 px-3 py-2.5 rounded-xl flex items-start gap-2"
              style={{ background: 'rgb(14 124 90 / 0.05)', border: '1px solid rgb(14 124 90 / 0.15)' }}>
              <FlaskConical size={13} className="shrink-0 mt-0.5" style={{ color: 'rgb(14 124 90)' }} />
              <p className="text-xs" style={{ color: 'rgb(14 124 90)' }}>
                Trial sessions are one-off evaluation classes. Fill the trial report after the class to send a professional assessment to the parent.
              </p>
            </div>

            <div className="space-y-2">
              {trialSessions.map(s => (
                <TrialRow key={s.id} session={s} onOpen={openTrial} />
              ))}
            </div>
          </section>
        )}

        {/* ── Regular sessions section ── */}
        {regularSessions.length > 0 && (
          <section>
            {/* section header + filter */}
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
                {/* upcoming sub-group */}
                {filter === 'all' && upcomingCount > 0 && (
                  <>
                    <p className="text-[10px] font-semibold uppercase tracking-widest px-1 mb-2"
                      style={{ color: 'rgb(14 124 90)' }}>
                      Upcoming · {upcomingCount}
                    </p>
                    {filteredRegular.filter(isUpcoming).map(s => (
                      <SessionRow key={s.id} session={s} onOpen={openSession} />
                    ))}
                    {pastCount > 0 && (
                      <p className="text-[10px] font-semibold uppercase tracking-widest px-1 mt-4 mb-2"
                        style={{ color: 'rgb(90 100 112)' }}>
                        Past · {pastCount}
                      </p>
                    )}
                    {filteredRegular.filter(s => !isUpcoming(s)).map(s => (
                      <SessionRow key={s.id} session={s} onOpen={openSession} />
                    ))}
                  </>
                )}
                {filter !== 'all' && filteredRegular.map(s => (
                  <SessionRow key={s.id} session={s} onOpen={openSession} />
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
    </>
  )
}
