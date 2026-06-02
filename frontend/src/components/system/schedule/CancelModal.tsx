'use client'
import { useState } from 'react'
import { Ban, X } from 'lucide-react'
import { toast } from 'sonner'
import { useCancelSession } from '@/hooks/system/useSessions'
import type { Session } from '@/types/system/session'

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

interface Props {
  session:  Session | null
  onClose:  () => void
  onDone:   () => void
}

export function CancelModal({ session, onClose, onDone }: Props) {
  const cancel = useCancelSession()
  const [cancelledBy, setCancelledBy] = useState<'student' | 'teacher' | 'admin'>('admin')
  const [reason,      setReason]      = useState('')

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
