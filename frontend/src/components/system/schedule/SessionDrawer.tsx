'use client'
import { useState } from 'react'
import type { Session } from '@/types/system/session'
import { useMarkAttendance, useCancelSession } from '@/hooks/system/useSessions'
import { RescheduleSheet } from './RescheduleSheet'
import { CancelSessionDialog } from './CancelSessionDialog'

interface SessionDrawerProps {
  session: Session | null
  open: boolean
  onClose: () => void
  onUpdate?: () => void
}

const STATUS_LABELS: Record<string, string> = {
  scheduled:         '🟢 Scheduled',
  attended:          '✅ Attended',
  absent:            '❌ Absent',
  cancelled:         '⊘ Cancelled',
  rescheduled:       '🔄 Rescheduled',
  pending_substitute:'🟠 Needs substitute',
}

export function SessionDrawer({ session, open, onClose, onUpdate }: SessionDrawerProps) {
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [cancelOpen, setCancelOpen]         = useState(false)
  const markAttendance = useMarkAttendance()

  if (!open || !session) return null

  const mark = (status: 'attended' | 'absent') => {
    markAttendance.mutate({ id: session.id, status }, { onSuccess: () => { onUpdate?.(); onClose() } })
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl bg-background shadow-xl flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b">
          <div>
            <div className="text-sm text-muted-foreground">
              {new Date(session.scheduled_start).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div className="font-semibold text-lg">
              {new Date(session.scheduled_start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
              {' – '}
              {new Date(session.scheduled_end).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
            </div>
            <div className="text-sm">
              {session.student?.name} with {session.teacher?.name}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-muted text-lg">×</button>
        </div>

        <div className="p-4 space-y-4 flex-1">
          {/* Status */}
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase mb-1">Status</div>
            <div className="text-sm font-medium">{STATUS_LABELS[session.status] ?? session.status}</div>
          </div>

          {/* Zoom */}
          {session.zoom_join_url && (
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase mb-1">Zoom</div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-blue-600 truncate max-w-xs">{session.zoom_join_url}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(session.zoom_join_url!)}
                  className="text-xs px-2 py-0.5 rounded border hover:bg-muted"
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          {session.status === 'scheduled' && (
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase mb-2">Quick actions</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => mark('attended')}
                  disabled={markAttendance.isPending}
                  className="px-3 py-2 text-sm rounded-md bg-green-100 text-green-800 hover:bg-green-200 font-medium"
                >
                  Mark attended
                </button>
                <button
                  onClick={() => mark('absent')}
                  disabled={markAttendance.isPending}
                  className="px-3 py-2 text-sm rounded-md bg-red-100 text-red-800 hover:bg-red-200 font-medium"
                >
                  Mark absent
                </button>
                <button
                  onClick={() => setCancelOpen(true)}
                  className="px-3 py-2 text-sm rounded-md bg-muted hover:bg-muted/80 font-medium"
                >
                  Cancel session
                </button>
                <button
                  onClick={() => setRescheduleOpen(true)}
                  className="px-3 py-2 text-sm rounded-md border hover:bg-muted font-medium"
                >
                  Reschedule
                </button>
              </div>
            </div>
          )}

          {/* Report status */}
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase mb-1">Session report</div>
            {session.has_report ? (
              <div className="text-sm text-green-700">✅ Submitted</div>
            ) : session.status === 'attended' ? (
              <div className="text-sm text-orange-600">📝 Not yet submitted</div>
            ) : (
              <div className="text-sm text-muted-foreground">—</div>
            )}
          </div>

          {/* Overdue alert */}
          {session.report_overdue_at && !session.has_report && (
            <div className="rounded-md bg-orange-50 border border-orange-200 px-3 py-2 text-sm text-orange-800">
              ⚠ Report overdue since {new Date(session.report_overdue_at).toLocaleString()}
            </div>
          )}
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
