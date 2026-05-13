'use client'
import { useState } from 'react'
import type { Session } from '@/types/system/session'
import { useCancelSession } from '@/hooks/system/useSessions'

interface Props {
  session: Session
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CancelSessionDialog({ session, open, onClose, onSuccess }: Props) {
  const [cancelledBy, setCancelledBy]           = useState<'student' | 'teacher' | 'admin'>('admin')
  const [cancellationReason, setCancellationReason] = useState('')
  const cancel = useCancelSession()

  if (!open) return null

  const handleConfirm = () => {
    cancel.mutate(
      { id: session.id, cancelled_by: cancelledBy, cancellation_reason: cancellationReason || undefined },
      { onSuccess }
    )
  }

  return (
    <>
      <div className="fixed inset-0 z-70 bg-black/30" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-80 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background rounded-lg shadow-xl border p-6 space-y-4">
        <h3 className="font-semibold text-lg">Cancel session</h3>
        <p className="text-sm text-muted-foreground">
          {session.student?.name} · {new Date(session.scheduled_start).toLocaleString()}
        </p>

        <div>
          <label className="text-sm font-medium">Cancelled by</label>
          <div className="flex gap-3 mt-2">
            {(['student', 'teacher', 'admin'] as const).map(v => (
              <label key={v} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="cancelled_by"
                  value={v}
                  checked={cancelledBy === v}
                  onChange={() => setCancelledBy(v)}
                />
                <span className="text-sm capitalize">{v}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">
            Reason {cancelledBy === 'admin' ? '(required)' : '(optional)'}
          </label>
          <textarea
            className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm resize-none"
            rows={3}
            placeholder="Reason for cancellation…"
            value={cancellationReason}
            onChange={e => setCancellationReason(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm rounded border hover:bg-muted">
            Back
          </button>
          <button
            onClick={handleConfirm}
            disabled={cancel.isPending || (cancelledBy === 'admin' && !cancellationReason.trim())}
            className="flex-1 py-2 text-sm rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
          >
            {cancel.isPending ? 'Cancelling…' : 'Confirm cancel'}
          </button>
        </div>
      </div>
    </>
  )
}
