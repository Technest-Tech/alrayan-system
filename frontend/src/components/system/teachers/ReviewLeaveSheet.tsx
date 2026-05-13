'use client'
import { useState } from 'react'
import { X, Check, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { TeacherLeave } from '@/types/system/teacher'
import { useApproveLeave, useRejectLeave } from '@/hooks/system/useTeacherLeaves'
import { StatusBadge } from '@/components/system/primitives/StatusBadge'
import { ApiError } from '@/lib/system/api'

interface ReviewLeaveSheetProps {
  leave: TeacherLeave | null
  onClose: () => void
}

export function ReviewLeaveSheet({ leave, onClose }: ReviewLeaveSheetProps) {
  const [reviewNote, setReviewNote] = useState('')
  const approve = useApproveLeave()
  const reject  = useRejectLeave()

  if (!leave) return null

  async function handleApprove() {
    if (!leave) return
    try {
      await approve.mutateAsync({ id: leave.id, review_note: reviewNote || undefined })
      toast.success('Leave approved.')
      onClose()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to approve leave.')
    }
  }

  async function handleReject() {
    if (!leave) return
    try {
      await reject.mutateAsync({ id: leave.id, review_note: reviewNote || undefined })
      toast.success('Leave rejected.')
      onClose()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to reject leave.')
    }
  }

  const isPending = leave.status === 'pending'
  const isBusy    = approve.isPending || reject.isPending

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div
        className="relative ml-auto h-full w-full max-w-md flex flex-col shadow-xl overflow-y-auto"
        style={{ background: 'rgb(var(--surface-bg, 244 246 250))' }}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ background: 'rgb(var(--surface-card, 255 255 255))', borderColor: 'rgb(var(--border-default, 229 233 240))' }}
        >
          <h2 className="font-semibold">Leave request</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/5 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-5">
          <div
            className="rounded-xl p-5 space-y-3"
            style={{ background: 'rgb(var(--surface-card, 255 255 255))', border: '1px solid rgb(var(--border-default, 229 233 240))' }}
          >
            {leave.teacher_name && (
              <div>
                <p className="text-xs font-semibold opacity-50 uppercase tracking-wide">Teacher</p>
                <p className="font-medium">{leave.teacher_name}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold opacity-50 uppercase tracking-wide">Start</p>
                <p className="font-medium">{leave.start_date}</p>
              </div>
              <div>
                <p className="text-xs font-semibold opacity-50 uppercase tracking-wide">End</p>
                <p className="font-medium">{leave.end_date}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold opacity-50 uppercase tracking-wide">Reason</p>
              <p className="text-sm mt-0.5">{leave.reason}</p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold opacity-50 uppercase tracking-wide">Status</p>
              <StatusBadge value={leave.status} />
            </div>
          </div>

          {leave.review_note && (
            <div
              className="rounded-xl p-4 text-sm"
              style={{ background: 'rgb(var(--surface-card, 255 255 255))', border: '1px solid rgb(var(--border-default, 229 233 240))' }}
            >
              <p className="text-xs font-semibold opacity-50 uppercase tracking-wide mb-1">Review note</p>
              <p>{leave.review_note}</p>
              {leave.reviewed_by_name && (
                <p className="text-xs opacity-40 mt-1">— {leave.reviewed_by_name}</p>
              )}
            </div>
          )}

          {isPending && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Review note (optional)</label>
              <textarea
                rows={3}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Add a note visible to the teacher…"
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)]"
                style={{ borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }}
              />
            </div>
          )}
        </div>

        {isPending && (
          <div
            className="shrink-0 px-6 py-4 border-t flex items-center gap-3 justify-end"
            style={{ borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }}
          >
            <button
              onClick={handleReject}
              disabled={isBusy}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
              style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}
            >
              <XCircle size={15} />
              Reject
            </button>
            <button
              onClick={handleApprove}
              disabled={isBusy}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
              style={{ background: 'rgb(14 124 90)' }}
            >
              <Check size={15} />
              Approve
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
