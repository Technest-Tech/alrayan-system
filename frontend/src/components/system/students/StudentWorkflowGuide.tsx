'use client'
import { useState } from 'react'
import { Check, ChevronRight, X, Sparkles } from 'lucide-react'
import { useStudentSessions } from '@/hooks/system/useSessions'
import { useSchedulePatterns } from '@/hooks/system/useSchedulePatterns'
import type { StudentDetail } from '@/types/system/student'
import type { Session } from '@/types/system/session'
import { useI18n } from '@/lib/system/i18n'

const DISMISS_KEY = (id: number) => `student_guide_dismissed_${id}`

type StepStatus = 'done' | 'current' | 'upcoming'

interface Props {
  student:          StudentDetail
  onScheduleTrial:  () => void
  onGoToSessions:   () => void
  onActivate:       () => void
  onSetSchedule:    () => void
}

export function StudentWorkflowGuide({ student, onScheduleTrial, onGoToSessions, onActivate, onSetSchedule }: Props) {
  const { t } = useI18n()
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY(student.id)) === '1' } catch { return false }
  })

  const { data: sessionsData } = useStudentSessions(student.id)
  const { data: patterns = [] } = useSchedulePatterns(student.id)

  const sessions: Session[] = (sessionsData as { data?: Session[] } | undefined)?.data ?? []
  const hasAnySession      = sessions.length > 0
  const hasAttendedSession = sessions.some(s => s.status === 'attended') || student.status !== 'trial'
  const isActivated        = student.status !== 'trial'
  const hasPatterns        = Array.isArray(patterns) && patterns.length > 0
  const allDone            = isActivated && hasPatterns

  function dismiss() {
    try { localStorage.setItem(DISMISS_KEY(student.id), '1') } catch {}
    setDismissed(true)
  }

  if (dismissed || allDone) return null

  const steps = [
    {
      id: 'created',
      title: t('students.guideStep1'),
      detail: t('students.guideStep1Detail'),
      actionLabel: '',
      onAction: () => {},
      done: true,
    },
    {
      id: 'trial_scheduled',
      title: t('students.guideStep2'),
      detail: t('students.guideStep2Detail'),
      actionLabel: t('students.guideStep2Action'),
      onAction: onScheduleTrial,
      done: hasAnySession,
    },
    {
      id: 'trial_attended',
      title: t('students.guideStep3'),
      detail: t('students.guideStep3Detail'),
      actionLabel: t('students.guideStep3Action'),
      onAction: onGoToSessions,
      done: hasAttendedSession,
    },
    {
      id: 'activate',
      title: t('students.guideStep4'),
      detail: t('students.guideStep4Detail'),
      actionLabel: t('students.guideStep4Action'),
      onAction: onActivate,
      done: isActivated,
    },
    {
      id: 'timetable',
      title: t('students.guideStep5'),
      detail: t('students.guideStep5Detail'),
      actionLabel: t('students.guideStep5Action'),
      onAction: onSetSchedule,
      done: hasPatterns,
    },
  ]

  const currentIndex = steps.findIndex(s => !s.done)
  const currentStep  = currentIndex >= 0 ? steps[currentIndex] : null

  function statusOf(index: number): StepStatus {
    if (steps[index].done)      return 'done'
    if (index === currentIndex) return 'current'
    return 'upcoming'
  }

  return (
    <div
      className="rounded-2xl overflow-hidden mb-4"
      style={{ border: '1px solid rgb(var(--border-default,229 233 240))', background: '#fff', boxShadow: '0 1px 6px rgb(11 31 58 / 0.04)' }}
    >
      {/* Top accent line */}
      <div className="h-0.5" style={{ background: 'linear-gradient(90deg, rgb(14 124 90), rgb(30 90 171))' }} />

      <div className="px-5 py-4">
        {/* Header row */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center justify-center w-6 h-6 rounded-lg shrink-0"
            style={{ background: 'rgb(14 124 90 / 0.1)' }}>
            <Sparkles size={12} style={{ color: 'rgb(14 124 90)' }} />
          </div>
          <p className="text-xs font-semibold flex-1" style={{ color: 'rgb(11 31 58)' }}>
            {t('students.guideTitle')}
            {currentStep && (
              <span className="font-normal ml-1" style={{ color: 'rgb(90 100 112)' }}>
                · {currentStep.title}
              </span>
            )}
          </p>
          <button
            onClick={dismiss}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors hover:bg-red-50 hover:border-red-200 hover:text-red-600"
            style={{ borderColor: 'rgb(var(--border-default,229 233 240))', color: 'rgb(156 163 175)' }}
          >
            <X size={11} />
            {t('common.dismiss')}
          </button>
        </div>

        {/* Horizontal stepper */}
        <div className="flex items-start">
          {steps.map((step, index) => {
            const status  = statusOf(index)
            const isLast  = index === steps.length - 1

            return (
              <div key={step.id} className="flex items-start flex-1 min-w-0">
                {/* Step node */}
                <div className="flex flex-col items-center flex-1 min-w-0">
                  {/* Circle */}
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all"
                    style={
                      status === 'done'    ? { background: 'rgb(14 124 90)', color: '#fff' } :
                      status === 'current' ? { background: 'rgb(11 31 58)',  color: '#fff', boxShadow: '0 0 0 3px rgb(14 124 90 / 0.2)' } :
                                             { background: 'rgb(229 233 240)', color: 'rgb(156 163 175)' }
                    }
                  >
                    {status === 'done'
                      ? <Check size={13} strokeWidth={2.5} />
                      : <span className="text-[10px] font-bold">{index + 1}</span>
                    }
                  </div>
                  {/* Label */}
                  <p
                    className="text-[11px] font-medium mt-1 text-center leading-tight"
                    style={{
                      color: status === 'done'    ? 'rgb(14 124 90)' :
                             status === 'current' ? 'rgb(11 31 58)'  :
                                                    'rgb(156 163 175)',
                    }}
                  >
                    {step.title}
                  </p>
                </div>

                {/* Connector line */}
                {!isLast && (
                  <div
                    className="flex-shrink-0 mt-3.5"
                    style={{
                      width: 'calc(100% - 28px)',
                      height: 2,
                      flex: '0 0 auto',
                      minWidth: 12,
                      maxWidth: 40,
                      borderRadius: 1,
                      background: status === 'done' ? 'rgb(14 124 90 / 0.4)' : 'rgb(229 233 240)',
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Current step detail */}
        {currentStep && (
          <div
            className="mt-4 flex items-center gap-3 rounded-xl px-3.5 py-3"
            style={{ background: 'rgb(14 124 90 / 0.05)', border: '1px solid rgb(14 124 90 / 0.12)' }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold mb-0.5" style={{ color: 'rgb(11 31 58)' }}>
                {t('students.guideNext')} {currentStep.title}
              </p>
              <p className="text-xs" style={{ color: 'rgb(90 100 112)' }}>{currentStep.detail}</p>
            </div>
            {currentStep.actionLabel && (
              <button
                onClick={currentStep.onAction}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white shrink-0 transition-opacity hover:opacity-90"
                style={{ background: 'rgb(11 31 58)' }}
              >
                {currentStep.actionLabel}
                <ChevronRight size={11} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
