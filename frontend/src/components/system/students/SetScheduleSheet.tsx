'use client'
import { X, CalendarDays } from 'lucide-react'
import { RecurringPatternBuilder } from '@/components/system/schedule/RecurringPatternBuilder'
import type { StudentDetail } from '@/types/system/student'

interface Props {
  student: StudentDetail
  open: boolean
  onClose: () => void
}

export function SetScheduleSheet({ student, open, onClose }: Props) {
  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-[rgb(11,31,58)]/30 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col shadow-2xl overflow-hidden"
        style={{ background: 'rgb(var(--surface-bg,244 246 250))', borderLeft: '1px solid rgb(var(--border-default,229 233 240))' }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-4 border-b shrink-0"
          style={{ background: '#fff', borderColor: 'rgb(var(--border-default,229 233 240))' }}
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-xl"
            style={{ background: 'rgb(14 124 90 / 0.1)' }}>
            <CalendarDays size={16} style={{ color: 'rgb(14 124 90)' }} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'rgb(11 31 58)' }}>Set Weekly Timetable</p>
            <p className="text-xs" style={{ color: 'rgb(90 100 112)' }}>{student.name} · {student.sessions_per_month} sessions/month</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto p-1.5 rounded-lg hover:bg-black/5 transition-colors opacity-50 hover:opacity-100"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          <RecurringPatternBuilder
            studentId={student.id}
            timezone={student.timezone}
            sessionsPerMonth={student.sessions_per_month}
            sessionDurationMin={student.session_duration_min}
            onSaved={onClose}
            onCancel={onClose}
          />
        </div>
      </div>
    </>
  )
}
