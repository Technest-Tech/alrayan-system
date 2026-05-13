'use client'
import type { Session } from '@/types/system/session'
import { AttendanceMarker } from '@/components/system/attendance/AttendanceMarker'
import { SessionReportForm } from '@/components/system/session-reports/SessionReportForm'
import { useState } from 'react'

interface Props {
  sessions: Session[]
  onUpdate?: () => void
}

export function TodaySessionsList({ sessions, onUpdate }: Props) {
  const [reportOpen, setReportOpen] = useState<number | null>(null)

  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
        No sessions scheduled for today. 🎉
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sessions.map(s => (
        <div key={s.id} className="rounded-lg border p-4 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-medium">
                {new Date(s.scheduled_start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                {' — '}{s.student?.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {s.duration_min} min · {s.student?.timezone}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {s.zoom_join_url && (
                <a
                  href={s.zoom_join_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-2 py-1 rounded border hover:bg-muted"
                >
                  Open Zoom
                </a>
              )}
              <AttendanceMarker session={s} onUpdate={onUpdate} />
            </div>
          </div>

          {s.status === 'attended' && !s.has_report && (
            <div>
              {reportOpen === s.id ? (
                <div className="pt-2 border-t">
                  <SessionReportForm
                    session={s}
                    onSubmitted={() => { setReportOpen(null); onUpdate?.() }}
                  />
                </div>
              ) : (
                <button
                  onClick={() => setReportOpen(s.id)}
                  className="text-xs text-orange-700 underline"
                >
                  📝 Submit report
                </button>
              )}
            </div>
          )}

          {s.status === 'attended' && s.has_report && (
            <div className="text-xs text-green-700">✅ Report submitted</div>
          )}

          {s.report_overdue_at && !s.has_report && (
            <div className="text-xs text-orange-700">⚠ Report overdue</div>
          )}
        </div>
      ))}
    </div>
  )
}
