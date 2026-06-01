'use client'
import { useState, useEffect } from 'react'
import { CalendarClock, X } from 'lucide-react'
import { toast } from 'sonner'
import { useRescheduleSession } from '@/hooks/system/useSessions'
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

export function RescheduleModal({ session, onClose, onDone }: Props) {
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
