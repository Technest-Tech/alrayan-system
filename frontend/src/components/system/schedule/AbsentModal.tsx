'use client'
import { useState } from 'react'
import { X, GraduationCap, XCircle, CheckCircle2, Ban } from 'lucide-react'
import { toast } from 'sonner'
import { useMarkAttendance } from '@/hooks/system/useSessions'
import type { Session } from '@/types/system/session'

/**
 * 2-step "Mark absent" modal that captures whose fault the absence was and,
 * for student absences, whether an apology was received in time.
 *
 * Quota rules applied:
 *   teacher absent                    → not counted (free_teacher)
 *   student absent + apologized       → not counted (free_excused)
 *   student absent + no apology       → counted    (counted_no_show)
 */
export function AbsentModal({
  session, onClose, onSubmitted,
}: {
  session: Session
  onClose: () => void
  onSubmitted?: () => void
}) {
  const mark = useMarkAttendance()
  const [step, setStep] = useState<1 | 2>(1)
  const [reason, setReason] = useState('')

  async function finalize(absent_by: 'teacher' | 'student', apology_received: boolean | null) {
    try {
      await mark.mutateAsync({
        id:                  session.id,
        status:              'absent',
        cancelled_by:        absent_by,
        cancellation_reason: reason || undefined,
        apology_received:    apology_received ?? false,
      })
      const tail =
        absent_by === 'teacher'    ? 'teacher absent — not counted from quota.' :
        apology_received           ? 'student excused — not counted from quota.' :
                                     'student no-show — counted as used.'
      toast.success(`Marked absent: ${tail}`)
      onSubmitted?.()
      onClose()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to mark absent.'
      toast.error(msg)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6"
        style={{ border: '1px solid rgb(var(--border-default,229 233 240))' }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold" style={{ color: 'rgb(11 31 58)' }}>
            {step === 1 ? 'Who was absent?' : 'Did the student apologize in time?'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs mb-4" style={{ color: 'rgb(120 130 140)' }}>
          {step === 1
            ? "This decides whether the session is consumed from the student's monthly quota."
            : 'Apology received at least 6 hours before the session = not counted. Otherwise counted as no-show.'}
        </p>

        {step === 1 && (
          <div className="space-y-2">
            <button
              onClick={() => finalize('teacher', null)}
              disabled={mark.isPending}
              className="w-full flex items-start gap-3 p-4 rounded-xl border text-left hover:bg-amber-50 transition-colors disabled:opacity-50"
              style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgb(254 243 199)', color: 'rgb(146 64 14)' }}>
                <GraduationCap size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'rgb(11 31 58)' }}>Teacher absent</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgb(120 130 140)' }}>
                  Logged in billing history. <span className="font-semibold text-amber-700">Not consumed from quota.</span>
                </p>
              </div>
            </button>
            <button
              onClick={() => setStep(2)}
              disabled={mark.isPending}
              className="w-full flex items-start gap-3 p-4 rounded-xl border text-left hover:bg-red-50 transition-colors disabled:opacity-50"
              style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgb(254 226 226)', color: 'rgb(153 27 27)' }}>
                <XCircle size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'rgb(11 31 58)' }}>Student absent</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgb(120 130 140)' }}>
                  Outcome depends on whether they apologized in time.
                </p>
              </div>
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-2">
            <button
              onClick={() => finalize('student', true)}
              disabled={mark.isPending}
              className="w-full flex items-start gap-3 p-4 rounded-xl border text-left hover:bg-blue-50 transition-colors disabled:opacity-50"
              style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgb(219 234 254)', color: 'rgb(30 64 175)' }}>
                <CheckCircle2 size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'rgb(11 31 58)' }}>Yes — apology received in time</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgb(120 130 140)' }}>
                  Logged in billing. <span className="font-semibold text-blue-700">Not consumed from quota.</span>
                </p>
              </div>
            </button>
            <button
              onClick={() => finalize('student', false)}
              disabled={mark.isPending}
              className="w-full flex items-start gap-3 p-4 rounded-xl border text-left hover:bg-red-50 transition-colors disabled:opacity-50"
              style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgb(254 226 226)', color: 'rgb(153 27 27)' }}>
                <Ban size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'rgb(11 31 58)' }}>No — no-show</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgb(120 130 140)' }}>
                  Logged in billing. <span className="font-semibold text-red-700">Consumed from quota.</span>
                </p>
              </div>
            </button>
            <button
              onClick={() => setStep(1)}
              disabled={mark.isPending}
              className="w-full mt-2 px-3 py-2 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-50"
            >
              ← Back
            </button>
          </div>
        )}

        <div className="mt-4">
          <label className="block text-xs font-medium mb-1" style={{ color: 'rgb(120 130 140)' }}>
            Note (optional)
          </label>
          <input
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. internet issue, sick…"
            disabled={mark.isPending}
            className="w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}
          />
        </div>
      </div>
    </div>
  )
}
