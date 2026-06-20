'use client'
import { X, BookOpen } from 'lucide-react'
import { LessonForm } from './LessonForm'
import type { Lesson } from '@/types/system/lesson'
import { useI18n } from '@/lib/system/i18n'

const BORDER   = 'rgb(var(--border-default,229 233 240))'
const NAVY     = 'rgb(11 31 58)'
const TEAL_50  = '#F0FDFA'
const TEAL_600 = '#0d9488'

interface Prefill {
  scheduledAt?:     string
  durationMinutes?: number
  teacherId?:       number
  studentId?:       number
}

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  lesson?:  Lesson       // if provided, runs in edit mode
  prefill?: Prefill      // pre-fill date/duration/participants when creating
  onSuccess?: () => void
}

export function CreateLessonDialog({ open, onOpenChange, lesson, prefill, onSuccess }: Props) {
  const { t } = useI18n()
  if (!open) return null

  function handleSuccess() {
    onSuccess?.()
    onOpenChange(false)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-black/40 z-50"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
          style={{ background: '#fff', boxShadow: '0 20px 60px rgb(0 0 0 / 0.18)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10" style={{ borderColor: BORDER }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: TEAL_50 }}>
                <BookOpen size={14} style={{ color: TEAL_600 }} />
              </div>
              <h2 className="text-base font-semibold" style={{ color: NAVY }}>
                {lesson ? t('lessons.detail.editLesson') : t('lessons.form.createLesson')}
              </h2>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
              aria-label={t('lessons.close')}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            <LessonForm
              initialValues={lesson}
              prefill={prefill}
              onSuccess={handleSuccess}
              onCancel={() => onOpenChange(false)}
            />
          </div>
        </div>
      </div>
    </>
  )
}
