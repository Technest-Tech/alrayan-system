'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import type { StudentDetail, StudentStatus } from '@/types/system/student'
import { StudentStatusBadge } from './StudentStatusBadge'
import { useStudentTransition } from '@/hooks/system/useStudents'
import { ApiError } from '@/lib/system/api'

const TRANSITIONS: Record<StudentStatus, StudentStatus[]> = {
  trial:     ['active', 'cancelled'],
  active:    ['paused', 'suspended', 'cancelled'],
  paused:    ['active', 'cancelled'],
  suspended: ['active', 'cancelled'],
  cancelled: [],
}

const BTN_STYLES: Record<string, string> = {
  active:    'bg-[rgb(14,124,90)] text-white hover:bg-[rgb(12,108,78)]',
  paused:    'bg-amber-500 text-white hover:bg-amber-600',
  suspended: 'bg-red-500 text-white hover:bg-red-600',
  cancelled: 'bg-gray-400 text-white hover:bg-gray-500',
}

const CANCELLATION_REASONS = [
  'No longer interested',
  'Price too high',
  'Schedule conflict',
  'Completed course',
  'Moved to another provider',
  'Other',
]

interface CancelModalProps {
  onConfirm: (reason: string, notes: string) => void
  onClose: () => void
  isLoading: boolean
}

function CancelModal({ onConfirm, onClose, isLoading }: CancelModalProps) {
  const [reason, setReason] = useState('')
  const [notes,  setNotes]  = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4"
        style={{ background: 'rgb(var(--surface-card, 255 255 255))' }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 opacity-40 hover:opacity-70">
          <X size={16} />
        </button>
        <h3 className="font-semibold">Cancel enrolment</h3>
        <div>
          <label className="block text-sm font-medium mb-1.5">Reason</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
            style={{ borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }}
          >
            <option value="">Select a reason…</option>
            {CANCELLATION_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Internal notes (optional)</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
            style={{ borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }}
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium border hover:bg-black/5 transition-colors"
            style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}
          >
            Back
          </button>
          <button
            onClick={() => onConfirm(reason, notes)}
            disabled={!reason || isLoading}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Cancelling…' : 'Confirm cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface StudentLifecycleBarProps {
  student: StudentDetail
}

export function StudentLifecycleBar({ student }: StudentLifecycleBarProps) {
  const [showCancel, setShowCancel] = useState(false)
  const transition = useStudentTransition(student.id)
  const allowed = TRANSITIONS[student.status] ?? []

  async function handleTransition(to: StudentStatus) {
    if (to === 'cancelled') { setShowCancel(true); return }
    try {
      await transition.mutateAsync({ to })
      toast.success(`Student moved to ${to}.`)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Transition failed.')
    }
  }

  async function handleCancel(reason: string, notes: string) {
    try {
      await transition.mutateAsync({ to: 'cancelled', reason, notes })
      toast.success('Enrolment cancelled.')
      setShowCancel(false)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Cancellation failed.')
    }
  }

  return (
    <>
      <div
        className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border"
        style={{ borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }}
      >
        <span className="text-sm font-medium opacity-60 mr-1">Status</span>
        <StudentStatusBadge status={student.status} />

        {allowed.length > 0 && (
          <>
            <span className="opacity-20 text-sm">|</span>
            {allowed.map((to) => (
              <button
                key={to}
                onClick={() => handleTransition(to)}
                disabled={transition.isPending}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors disabled:opacity-50 ${BTN_STYLES[to] ?? 'bg-gray-200'}`}
              >
                {to === 'cancelled' ? 'Cancel' : `Move to ${to}`}
              </button>
            ))}
          </>
        )}
      </div>

      {showCancel && (
        <CancelModal
          onConfirm={handleCancel}
          onClose={() => setShowCancel(false)}
          isLoading={transition.isPending}
        />
      )}
    </>
  )
}
