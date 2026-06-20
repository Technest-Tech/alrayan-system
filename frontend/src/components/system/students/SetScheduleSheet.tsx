'use client'
import { useState } from 'react'
import { X, CalendarDays } from 'lucide-react'
import { RecurringPatternBuilder } from '@/components/system/schedule/RecurringPatternBuilder'
import { useI18n } from '@/lib/system/i18n'
import type { StudentDetail } from '@/types/system/student'

interface Props {
  student: StudentDetail
  open: boolean
  onClose: () => void
}

export function SetScheduleSheet({ student, open, onClose }: Props) {
  const { t } = useI18n()
  const [includedSiblings, setIncludedSiblings] = useState<Set<number>>(new Set())

  function toggleSibling(id: number) {
    setIncludedSiblings(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (!open) return null

  const hasSiblings = student.student_type === 'child' && student.siblings.length > 0

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
            <p className="font-semibold text-sm" style={{ color: 'rgb(11 31 58)' }}>{t('students.weeklySchedule')}</p>
            <p className="text-xs" style={{ color: 'rgb(90 100 112)' }}>{student.name} · {student.sessions_per_month} {t('teachers.sessionsPerMonthShort')}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto p-1.5 rounded-lg hover:bg-black/5 transition-colors opacity-50 hover:opacity-100"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Sibling section — shown above the pattern builder for context */}
          {hasSiblings && (
            <div
              className="rounded-xl p-4 space-y-3"
              style={{ background: '#fff', border: '1px solid rgb(var(--border-default,229 233 240))' }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-widest opacity-40">{t('students.applyToSiblings')}</p>
              {student.siblings.map(sib => (
                <label key={sib.id} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={includedSiblings.has(sib.id)}
                    onChange={() => toggleSibling(sib.id)}
                    className="w-4 h-4 rounded accent-[rgb(14,124,90)] cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium group-hover:text-[rgb(14,124,90)] transition-colors" style={{ color: 'rgb(11 31 58)' }}>
                      {sib.name}
                    </p>
                    {sib.teacher_name && (
                      <p className="text-xs opacity-50">{sib.teacher_name}</p>
                    )}
                  </div>
                  {includedSiblings.has(sib.id) && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgb(14 124 90 / 0.1)', color: 'rgb(14 124 90)' }}>
                      {t('students.siblingIncluded')}
                    </span>
                  )}
                </label>
              ))}
              {includedSiblings.size > 0 && (
                <p className="text-[11px] opacity-40">
                  {t('students.applySiblingsHint')}
                </p>
              )}
            </div>
          )}

          <RecurringPatternBuilder
            studentId={student.id}
            timezone={student.timezone}
            sessionsPerMonth={student.sessions_per_month}
            sessionDurationMin={student.session_duration_min}
            additionalStudentIds={[...includedSiblings]}
            onSaved={onClose}
            onCancel={onClose}
          />
        </div>
      </div>
    </>
  )
}
