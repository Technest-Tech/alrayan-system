'use client'
import { useState } from 'react'
import { Video, CalendarDays, ChevronRight } from 'lucide-react'
import { useStudentSessions } from '@/hooks/system/useSessions'
import { SessionDrawer } from '@/components/system/schedule/SessionDrawer'
import type { Session } from '@/types/system/session'

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  scheduled:          { label: 'Scheduled',        bg: 'rgb(14 124 90 / 0.08)',  color: 'rgb(14 124 90)' },
  attended:           { label: 'Attended',          bg: 'rgb(30 90 171 / 0.08)', color: 'rgb(30 90 171)' },
  absent:             { label: 'Absent',            bg: 'rgb(220 38 38 / 0.08)', color: 'rgb(220 38 38)' },
  cancelled:          { label: 'Cancelled',         bg: 'rgb(107 114 128 / 0.1)', color: 'rgb(107 114 128)' },
  rescheduled:        { label: 'Rescheduled',       bg: 'rgb(217 119 6 / 0.08)', color: 'rgb(180 83 9)' },
  pending_substitute: { label: 'Needs substitute',  bg: 'rgb(234 88 12 / 0.08)', color: 'rgb(194 65 12)' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, bg: 'rgb(107 114 128 / 0.1)', color: 'rgb(107 114 128)' }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  )
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
}

interface Props {
  studentId: number
}

export function StudentSessionsTab({ studentId }: Props) {
  const { data, isLoading } = useStudentSessions(studentId)
  const [selected, setSelected] = useState<Session | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const sessions = (data as { data?: Session[] } | undefined)?.data ?? []

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse max-w-3xl">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 rounded-2xl bg-gray-100" />
        ))}
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'rgb(14 124 90 / 0.08)' }}>
          <Video size={22} style={{ color: 'rgb(14 124 90)' }} />
        </div>
        <p className="font-semibold text-sm" style={{ color: 'rgb(11 31 58)' }}>No sessions yet</p>
        <p className="text-xs mt-1" style={{ color: 'rgb(90 100 112)' }}>
          Sessions will appear here once scheduled.
        </p>
      </div>
    )
  }

  const upcoming = sessions.filter(s => s.status === 'scheduled' || s.status === 'pending_substitute')
  const past     = sessions.filter(s => s.status !== 'scheduled' && s.status !== 'pending_substitute')

  function open(s: Session) { setSelected(s); setDrawerOpen(true) }

  return (
    <>
      <div className="space-y-6 max-w-3xl">
        {upcoming.length > 0 && (
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgb(90 100 112)' }}>
              Upcoming ({upcoming.length})
            </p>
            <div className="space-y-2">
              {upcoming.map(s => <SessionRow key={s.id} session={s} onOpen={open} />)}
            </div>
          </section>
        )}

        {past.length > 0 && (
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgb(90 100 112)' }}>
              Past ({past.length})
            </p>
            <div className="space-y-2">
              {past.map(s => <SessionRow key={s.id} session={s} onOpen={open} />)}
            </div>
          </section>
        )}
      </div>

      <SessionDrawer
        session={selected}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUpdate={() => setDrawerOpen(false)}
      />
    </>
  )
}

function SessionRow({ session, onOpen }: { session: Session; onOpen: (s: Session) => void }) {
  const isCancelled = session.status === 'cancelled' || session.status === 'rescheduled'

  return (
    <button
      onClick={() => onOpen(session)}
      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-left transition-shadow hover:shadow-md"
      style={{
        background: '#fff',
        border: '1px solid rgb(var(--border-default,229 233 240))',
        opacity: isCancelled ? 0.6 : 1,
      }}
    >
      {/* Date column */}
      <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
        style={{ background: 'rgb(14 124 90 / 0.08)' }}>
        <CalendarDays size={16} style={{ color: 'rgb(14 124 90)' }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold" style={{ color: 'rgb(11 31 58)' }}>
            {formatDay(session.scheduled_start)}
          </span>
          <span className="text-xs" style={{ color: 'rgb(90 100 112)' }}>
            {formatTime(session.scheduled_start)} – {formatTime(session.scheduled_end)}
          </span>
          <StatusBadge status={session.status} />
        </div>
        <p className="text-xs mt-0.5" style={{ color: 'rgb(90 100 112)' }}>
          {session.teacher?.name ?? 'Unassigned'} · {session.duration_min} min
          {session.zoom_join_url && <> · <span style={{ color: 'rgb(30 90 171)' }}>Zoom ready</span></>}
        </p>
      </div>

      <ChevronRight size={15} className="shrink-0 opacity-30" />
    </button>
  )
}
