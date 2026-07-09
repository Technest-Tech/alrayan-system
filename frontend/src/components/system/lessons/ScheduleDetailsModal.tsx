'use client'
import { X as XIcon, User, GraduationCap, CalendarDays, Clock, BookOpen, FileText, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Lesson } from '@/types/system/lesson'
import { useDeleteLesson, useDeleteLessonSchedule } from '@/hooks/system/useLessons'
import { useI18n } from '@/lib/system/i18n'

const BORDER   = 'rgb(var(--border-default,229 233 240))'
const NAVY     = 'rgb(11 31 58)'
const MUTED    = 'rgb(90 100 112)'
const TEAL_600 = '#0d9488'

interface Props {
  lesson: Lesson | null
  open: boolean
  onClose: () => void
  onAddReport: (lesson: Lesson) => void
  onEditSchedule: (scheduleId: number) => void
  onChanged: () => void
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl px-3.5 py-3" style={{ background: '#F8FAFC', border: `1px solid ${BORDER}` }}>
      <div className="flex items-center gap-1.5 mb-1 text-xs" style={{ color: MUTED }}>
        <span className="opacity-60">{icon}</span> {label}
      </div>
      <div className="text-sm font-semibold" style={{ color: NAVY }}>{value}</div>
    </div>
  )
}

export function ScheduleDetailsModal({ lesson, open, onClose, onAddReport, onEditSchedule, onChanged }: Props) {
  const { t } = useI18n()
  const deleteLesson   = useDeleteLesson()
  const deleteSchedule = useDeleteLessonSchedule()

  if (!open || !lesson) return null

  const d = new Date(lesson.scheduled_at)
  const dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const timeLabel = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  const durLabel  = `${Math.floor(lesson.duration_minutes / 60)}h${lesson.duration_minutes % 60 ? ` ${lesson.duration_minutes % 60}m` : ''}`

  async function handleDeleteOccurrence() {
    if (!lesson) return
    if (!confirm(t('lessons.scheduleDetails.confirmDeleteOccurrence'))) return
    await deleteLesson.mutateAsync(lesson.id)
    toast.success(t('lessons.scheduleDetails.toastOccurrenceDeleted'))
    onChanged(); onClose()
  }

  async function handleDeleteSchedule() {
    if (!lesson?.schedule_id) return
    if (!confirm(t('lessons.scheduleDetails.confirmDeleteSchedule'))) return
    await deleteSchedule.mutateAsync(lesson.schedule_id)
    toast.success(t('lessons.scheduleDetails.toastScheduleDeleted'))
    onChanged(); onClose()
  }

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4" style={{ background: 'rgba(11,31,58,0.35)' }} onClick={onClose}>
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }} onClick={e => e.stopPropagation()}>
        <div className="h-0.5" style={{ background: `linear-gradient(to right, #7C3AED, #A78BFA, transparent)` }} />
        <div className="px-6 pt-5 pb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold" style={{ color: NAVY }}>{t('lessons.scheduleDetails.title')}</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/5" aria-label={t('lessons.close')}>
              <XIcon size={16} style={{ color: MUTED }} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <Info icon={<User size={13} />}          label={t('lessons.form.fieldStudent')} value={lesson.student?.name ?? '—'} />
            <Info icon={<GraduationCap size={13} />} label={t('common.teacher')}            value={lesson.teacher?.name ?? '—'} />
            <Info icon={<CalendarDays size={13} />}  label={t('common.date')}               value={dateLabel} />
            <Info icon={<Clock size={13} />}         label={t('lessons.schedule.startTime')} value={timeLabel} />
            <Info icon={<Clock size={13} />}         label={t('common.duration')}           value={durLabel} />
            <Info icon={<BookOpen size={13} />}      label={t('lessons.form.fieldSubject')}  value={lesson.subject?.name ?? '—'} />
          </div>

          {/* Add report — turns the occurrence into a delivered lesson */}
          <button
            onClick={() => onAddReport(lesson)}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 mb-3"
            style={{ background: TEAL_600 }}
          >
            <FileText size={15} /> {t('lessons.scheduleDetails.addReport')}
          </button>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => lesson.schedule_id && onEditSchedule(lesson.schedule_id)}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium border transition-colors hover:bg-black/[0.03]"
              style={{ borderColor: BORDER, color: NAVY }}
            >
              <Pencil size={14} /> {t('lessons.scheduleDetails.editSchedule')}
            </button>
            <button
              onClick={handleDeleteOccurrence}
              disabled={deleteLesson.isPending}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium border transition-colors hover:bg-red-50 disabled:opacity-50"
              style={{ borderColor: '#FECACA', color: '#DC2626' }}
            >
              <Trash2 size={14} /> {t('lessons.scheduleDetails.deleteOccurrence')}
            </button>
            <button
              onClick={handleDeleteSchedule}
              disabled={deleteSchedule.isPending}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: '#DC2626' }}
            >
              <Trash2 size={14} /> {t('lessons.scheduleDetails.deleteSchedule')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
