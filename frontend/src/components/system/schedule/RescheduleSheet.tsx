'use client'
import { useState } from 'react'
import type { Session } from '@/types/system/session'
import { useRescheduleSession } from '@/hooks/system/useSessions'
import { useReschedulePreview } from '@/hooks/system/useReschedulePreview'

interface Props {
  session: Session
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const CONFLICT_LABELS: Record<string, string> = {
  teacher_double_booking: 'Teacher already has a session at this time',
  teacher_on_leave:       'Teacher is on approved leave — this cannot be overridden',
  teacher_unavailable:    'Outside teacher's available hours',
}

export function RescheduleSheet({ session, open, onClose, onSuccess }: Props) {
  const [newStart, setNewStart] = useState(
    session.scheduled_start.slice(0, 16) // datetime-local format
  )
  const [forceConflicts, setForceConflicts] = useState(false)

  const reschedule = useRescheduleSession()
  const preview    = useReschedulePreview()

  if (!open) return null

  const conflicts    = (preview.data as any)?.conflicts ?? []
  const hasHardBlock = conflicts.some((c: any) => c.type === 'teacher_on_leave')

  const handlePreview = () => {
    preview.mutate({ sessionId: session.id, scheduledStart: new Date(newStart).toISOString() })
  }

  const handleSave = () => {
    reschedule.mutate(
      { id: session.id, scheduled_start: new Date(newStart).toISOString(), force_conflicts: forceConflicts },
      { onSuccess }
    )
  }

  return (
    <>
      <div className="fixed inset-0 z-60 bg-black/20" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-70 w-full max-w-sm bg-background shadow-2xl border-l flex flex-col p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Reschedule session</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted">×</button>
        </div>

        <div className="space-y-4 flex-1">
          <div>
            <label className="text-sm font-medium">New date & time</label>
            <input
              type="datetime-local"
              className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm"
              value={newStart}
              onChange={e => {
                setNewStart(e.target.value)
                setForceConflicts(false)
              }}
            />
          </div>

          <div className="text-xs text-muted-foreground">
            Duration: {session.duration_min} min (locked to student plan)
          </div>

          <button
            onClick={handlePreview}
            disabled={preview.isPending}
            className="text-sm px-3 py-1.5 rounded border hover:bg-muted w-full"
          >
            {preview.isPending ? 'Checking…' : 'Check conflicts'}
          </button>

          {conflicts.length > 0 && (
            <div className="rounded-md bg-orange-50 border border-orange-200 p-3 space-y-2">
              <div className="text-xs font-medium text-orange-800">⚠ Conflicts detected</div>
              {conflicts.map((c: any, i: number) => (
                <div key={i} className="text-xs text-orange-700">{CONFLICT_LABELS[c.type] ?? c.type}</div>
              ))}
              {!hasHardBlock && (
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={forceConflicts}
                    onChange={e => setForceConflicts(e.target.checked)}
                  />
                  <span className="text-xs font-medium text-orange-800">Save anyway (override)</span>
                </label>
              )}
            </div>
          )}

          {preview.data && conflicts.length === 0 && (
            <div className="rounded-md bg-green-50 border border-green-200 p-3 text-xs text-green-800">
              ✅ No conflicts — safe to reschedule
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t mt-4">
          <button onClick={onClose} className="flex-1 py-2 text-sm rounded border hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={reschedule.isPending || hasHardBlock || (conflicts.length > 0 && !forceConflicts && !preview.isIdle)}
            className="flex-1 py-2 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {reschedule.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </>
  )
}
