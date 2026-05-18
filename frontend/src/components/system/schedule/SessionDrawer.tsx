'use client'
import { useState } from 'react'
import { X, Video, CalendarDays, Clock, User, FileText, AlertTriangle } from 'lucide-react'
import type { Session } from '@/types/system/session'
import { useMarkAttendance } from '@/hooks/system/useSessions'
import { SessionReportForm } from '@/components/system/session-reports/SessionReportForm'
import { RescheduleSheet } from './RescheduleSheet'
import { CancelSessionDialog } from './CancelSessionDialog'

interface Props {
  session: Session | null
  open: boolean
  onClose: () => void
  onUpdate?: () => void
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  scheduled:          { label: 'Scheduled',       bg: 'rgb(14 124 90 / 0.08)',  color: 'rgb(14 124 90)' },
  attended:           { label: 'Attended',         bg: 'rgb(30 90 171 / 0.08)', color: 'rgb(30 90 171)' },
  absent:             { label: 'Absent',           bg: 'rgb(220 38 38 / 0.08)', color: 'rgb(220 38 38)' },
  cancelled:          { label: 'Cancelled',        bg: 'rgb(107 114 128 / 0.1)', color: 'rgb(107 114 128)' },
  rescheduled:        { label: 'Rescheduled',      bg: 'rgb(217 119 6 / 0.08)', color: 'rgb(180 83 9)' },
  pending_substitute: { label: 'Needs substitute', bg: 'rgb(234 88 12 / 0.08)', color: 'rgb(194 65 12)' },
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
}

const border = { borderColor: 'rgb(var(--border-default,229 233 240))' }

export function SessionDrawer({ session, open, onClose, onUpdate }: Props) {
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [cancelOpen,     setCancelOpen]     = useState(false)
  const markAttendance = useMarkAttendance()

  if (!open || !session) return null

  const cfg    = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.cancelled
  const canMark = session.status === 'scheduled' || session.status === 'pending_substitute'
  const showReport = session.status === 'attended'

  function mark(status: 'attended' | 'absent') {
    markAttendance.mutate(
      { id: session!.id, status },
      { onSuccess: () => { onUpdate?.(); onClose() } },
    )
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-[rgb(11,31,58)]/30 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col shadow-2xl overflow-hidden"
        style={{ background: 'rgb(var(--surface-bg,244 246 250))', borderLeft: '1px solid rgb(var(--border-default,229 233 240))' }}
      >

        {/* ── Header ── */}
        <div className="shrink-0 px-5 py-4 border-b" style={{ background: '#fff', ...border }}>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
              style={{ background: 'rgb(14 124 90 / 0.08)' }}>
              <CalendarDays size={18} style={{ color: 'rgb(14 124 90)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight" style={{ color: 'rgb(11 31 58)' }}>
                {formatDay(session.scheduled_start)}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgb(90 100 112)' }}>
                {formatTime(session.scheduled_start)} – {formatTime(session.scheduled_end)} · {session.duration_min} min
              </p>
              <span
                className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                style={{ background: cfg.bg, color: cfg.color }}
              >
                {cfg.label}
              </span>
            </div>
            <button onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-black/5 transition-colors opacity-50 hover:opacity-100 shrink-0">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* People */}
          <div className="rounded-2xl p-4 space-y-2.5" style={{ background: '#fff', border: '1px solid rgb(var(--border-default,229 233 240))' }}>
            <p className="text-[11px] font-semibold uppercase tracking-widest opacity-40">Participants</p>
            {session.student?.name && (
              <div className="flex items-center gap-2 text-sm">
                <User size={13} className="opacity-40 shrink-0" />
                <span style={{ color: 'rgb(11 31 58)' }}>{session.student.name}</span>
              </div>
            )}
            {session.teacher?.name && (
              <div className="flex items-center gap-2 text-sm">
                <User size={13} className="opacity-40 shrink-0" />
                <span style={{ color: 'rgb(11 31 58)' }}>{session.teacher.name}</span>
                <span className="text-[11px] opacity-40">(teacher)</span>
              </div>
            )}
          </div>

          {/* Zoom */}
          {session.zoom_join_url && (
            <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1px solid rgb(var(--border-default,229 233 240))' }}>
              <p className="text-[11px] font-semibold uppercase tracking-widest opacity-40 mb-2">Zoom</p>
              <div className="flex items-center gap-2">
                <Video size={13} className="opacity-40 shrink-0" />
                <span className="text-xs truncate flex-1" style={{ color: 'rgb(30 90 171)' }}>{session.zoom_join_url}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(session.zoom_join_url!)}
                  className="text-[11px] px-2 py-1 rounded-lg border font-medium hover:bg-black/5 transition-colors shrink-0"
                  style={border}
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          {/* Quick actions — only for schedulable statuses */}
          {canMark && (
            <div className="rounded-2xl p-4 space-y-3" style={{ background: '#fff', border: '1px solid rgb(var(--border-default,229 233 240))' }}>
              <p className="text-[11px] font-semibold uppercase tracking-widest opacity-40">Quick actions</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => mark('attended')}
                  disabled={markAttendance.isPending}
                  className="px-3 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                  style={{ background: 'rgb(14 124 90 / 0.08)', color: 'rgb(14 124 90)', border: '1px solid rgb(14 124 90 / 0.2)' }}
                >
                  Mark attended
                </button>
                <button
                  onClick={() => mark('absent')}
                  disabled={markAttendance.isPending}
                  className="px-3 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                  style={{ background: 'rgb(220 38 38 / 0.08)', color: 'rgb(220 38 38)', border: '1px solid rgb(220 38 38 / 0.2)' }}
                >
                  Mark absent
                </button>
                <button
                  onClick={() => setRescheduleOpen(true)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold transition-colors hover:bg-black/5"
                  style={{ border: '1px solid rgb(var(--border-default,229 233 240))', color: 'rgb(11 31 58)' }}
                >
                  Reschedule
                </button>
                <button
                  onClick={() => setCancelOpen(true)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                  style={{ background: 'rgb(220 38 38 / 0.06)', color: 'rgb(220 38 38)', border: '1px solid rgb(220 38 38 / 0.15)' }}
                >
                  Cancel session
                </button>
              </div>
            </div>
          )}

          {/* Overdue alert */}
          {session.report_overdue_at && !session.has_report && (
            <div className="flex items-start gap-2.5 rounded-xl px-3 py-2.5"
              style={{ background: 'rgb(234 88 12 / 0.08)', border: '1px solid rgb(234 88 12 / 0.2)' }}>
              <AlertTriangle size={13} className="shrink-0 mt-0.5" style={{ color: 'rgb(194 65 12)' }} />
              <p className="text-xs" style={{ color: 'rgb(194 65 12)' }}>
                Session report overdue since {new Date(session.report_overdue_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}

          {/* Session report */}
          <div className="rounded-2xl p-4 space-y-3" style={{ background: '#fff', border: '1px solid rgb(var(--border-default,229 233 240))' }}>
            <div className="flex items-center gap-2">
              <FileText size={13} className="opacity-40" />
              <p className="text-[11px] font-semibold uppercase tracking-widest opacity-40">Session report</p>
            </div>

            {showReport ? (
              <SessionReportForm
                session={session}
                onSubmitted={() => { onUpdate?.() }}
              />
            ) : (
              <p className="text-xs" style={{ color: 'rgb(156 163 175)' }}>
                {session.status === 'scheduled' || session.status === 'pending_substitute'
                  ? 'Available after the session is marked as attended.'
                  : 'No report for this session.'}
              </p>
            )}
          </div>

        </div>
      </div>

      <RescheduleSheet
        session={session}
        open={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
        onSuccess={() => { setRescheduleOpen(false); onUpdate?.(); onClose() }}
      />
      <CancelSessionDialog
        session={session}
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onSuccess={() => { setCancelOpen(false); onUpdate?.(); onClose() }}
      />
    </>
  )
}
