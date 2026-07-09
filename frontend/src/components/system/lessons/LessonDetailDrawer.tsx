'use client'
import { useState } from 'react'
import { X, Pencil, Trash2, User, GraduationCap, Clock, CalendarDays, BookOpen, ChevronRight } from 'lucide-react'
import type { Lesson } from '@/types/system/lesson'
import { useDeleteLesson } from '@/hooks/system/useLessons'
import { LessonForm } from './LessonForm'
import { STATUS_PILL, STATUS_LABEL } from '@/lib/system/lessonStatus'
import { useI18n } from '@/lib/system/i18n'

/* Map lesson-status enum values → i18n keys (labels in lessonStatus.ts are not translated). */
const STATUS_KEY: Record<string, string> = {
  scheduled:            'status.scheduled',
  attended:             'status.attended',
  paid_absence:         'lessons.status.paidAbsence',
  absent:               'status.absent',
  trial:                'lessons.status.trial',
  free:                 'lessons.status.free',
  cancelled_by_student: 'lessons.status.cancelledByStudent',
  cancelled_by_teacher: 'lessons.status.cancelledByTeacher',
}

const BORDER   = 'rgb(var(--border-default,229 233 240))'
const NAVY     = 'rgb(11 31 58)'
const MUTED    = 'rgb(90 100 112)'
const TEAL_50  = '#F0FDFA'
const TEAL_100 = '#CCFBF1'
const TEAL_400 = '#2DD4BF'
const TEAL_600 = '#0d9488'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

function formatMinutes(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function Pill({ status }: { status: string }) {
  const { t } = useI18n()
  const s = STATUS_PILL[status as keyof typeof STATUS_PILL] ?? { bg: '#F3F4F6', color: '#6B7280' }
  const label = STATUS_KEY[status] ? t(STATUS_KEY[status]) : (STATUS_LABEL[status as keyof typeof STATUS_LABEL] ?? status)
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.color }}>
      {label}
    </span>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: `1px solid ${BORDER}` }}>
      <div className="mt-0.5 shrink-0 opacity-40">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs mb-0.5" style={{ color: MUTED }}>{label}</p>
        <div className="text-sm font-medium truncate" style={{ color: NAVY }}>{value}</div>
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mt-5 mb-3">
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${TEAL_100})` }} />
      <div className="flex items-center gap-1.5 shrink-0">
        <span style={{ color: TEAL_400, fontSize: 9, lineHeight: 1 }}>✦</span>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: MUTED }}>{children}</span>
        <span style={{ color: TEAL_400, fontSize: 9, lineHeight: 1 }}>✦</span>
      </div>
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${TEAL_100})` }} />
    </div>
  )
}

interface Props {
  lesson: Lesson | null
  open: boolean
  onClose: () => void
  onUpdate?: () => void
}

export function LessonDetailDrawer({ lesson, open, onClose, onUpdate }: Props) {
  const { t } = useI18n()
  const [editing, setEditing] = useState(false)
  const deleteLesson = useDeleteLesson()

  async function handleDelete() {
    if (!lesson) return
    if (!confirm(t('lessons.detail.deleteConfirm'))) return
    await deleteLesson.mutateAsync(lesson.id)
    onUpdate?.()
    onClose()
  }

  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-[480px] z-50 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: '#fff', boxShadow: '-4px 0 24px rgb(0 0 0 / 0.12)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: BORDER }}>
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: TEAL_50 }}>
              <BookOpen size={14} style={{ color: TEAL_600 }} />
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: NAVY }}>{t('lessons.detail.title')}</h2>
              {lesson && (
                <p className="text-sm mt-0.5" style={{ color: MUTED }}>
                  {lesson.student?.name ?? '—'} — {lesson.teacher?.name ?? '—'}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/5 transition-colors ml-4 shrink-0"
            aria-label={t('lessons.close')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        {lesson && !editing && (
          <div className="flex-1 overflow-y-auto px-5 pb-6">
            {/* Participants */}
            <SectionTitle>{t('lessons.form.sectionParticipants')}</SectionTitle>
            <InfoRow icon={<User size={14} />} label={t('lessons.form.fieldStudent')} value={lesson.student?.name ?? '—'} />
            <InfoRow icon={<GraduationCap size={14} />} label={t('common.teacher')} value={lesson.teacher?.name ?? '—'} />
            <InfoRow icon={<CalendarDays size={14} />} label={t('common.date')} value={formatDate(lesson.scheduled_at)} />
            <InfoRow icon={<Clock size={14} />} label={t('common.duration')} value={formatMinutes(lesson.duration_minutes)} />
            {lesson.added_by_name && (
              <InfoRow icon={<User size={14} />} label={t('lessons.detail.addedBy')} value={lesson.added_by_name} />
            )}

            {/* Package Progress */}
            <SectionTitle>{t('lessons.detail.packageProgress')}</SectionTitle>
            <div className="flex flex-wrap gap-2 mb-3">
              <Pill status={lesson.status} />
              {lesson.evaluation && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                  {lesson.evaluation.label}
                </span>
              )}
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{
                  background: lesson.package.status === 'paid' ? '#F0FDF4' : '#FEF2F2',
                  color: lesson.package.status === 'paid' ? '#15803D' : '#B91C1C',
                }}
              >
                {lesson.package.status === 'paid' ? t('lessons.detail.paid') : t('status.pending')}
              </span>
            </div>

            <div className="rounded-xl border p-4 space-y-2.5" style={{ borderColor: TEAL_100, background: TEAL_50 }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: MUTED }}>{t('lessons.detail.packageNumber')}</span>
                <span className="font-medium" style={{ color: NAVY }}>#{lesson.package.package_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: MUTED }}>{t('lessons.detail.sessionNumber')}</span>
                <span className="font-medium" style={{ color: NAVY }}>{lesson.session_number_hours}h</span>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs mb-1.5" style={{ color: MUTED }}>
                  <span>{t('lessons.detail.progress')}</span>
                  <span>
                    {lesson.package.consumed_hours}h / {lesson.package.package_hours}h
                    {' · '}
                    {Math.round(Math.min(100, (lesson.package.consumed_hours / lesson.package.package_hours) * 100))}%
                  </span>
                </div>
                <div className="h-2 rounded-full" style={{ background: 'rgb(229 233 240)' }}>
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      background: lesson.package.status === 'paid' ? TEAL_600 : '#EF4444',
                      width: `${Math.min(100, (lesson.package.consumed_hours / lesson.package.package_hours) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Admin config row */}
              <div className="pt-1">
                <div className="flex items-center justify-between text-xs" style={{ color: MUTED }}>
                  <span className="font-semibold uppercase tracking-wider">{t('lessons.detail.packageConfig')}</span>
                  <ChevronRight size={12} />
                </div>
                <div className="mt-2 flex gap-4 text-xs">
                  <span style={{ color: MUTED }}>{t('lessons.detail.tariff')}: <strong style={{ color: NAVY }}>{lesson.package.tariff_at_time / 100} {lesson.package.currency}</strong></span>
                  <span style={{ color: MUTED }}>{t('lessons.detail.hours')}: <strong style={{ color: NAVY }}>{lesson.package.package_hours}h</strong></span>
                </div>
              </div>
            </div>

            {/* Subject */}
            {lesson.subject && (
              <>
                <SectionTitle>{t('lessons.form.fieldSubject')}</SectionTitle>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm" style={{ background: '#F0FDF4', color: '#15803D' }}>
                  <BookOpen size={13} />
                  {lesson.subject.name}
                </span>
              </>
            )}

            {/* Subject details */}
            {lesson.subject?.fields && lesson.subject_details && Object.keys(lesson.subject_details).length > 0 && (
              <>
                <SectionTitle>{t('lessons.form.subjectDetailsTitle', { subject: lesson.subject.name })}</SectionTitle>
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: BORDER }}>
                  {lesson.subject.fields.map(f => (
                    <div key={f.key} className="flex justify-between px-4 py-2.5 text-sm" style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <span style={{ color: MUTED }}>{f.label}</span>
                      <span className="font-medium" style={{ color: NAVY }}>{lesson.subject_details?.[f.key] ?? '—'}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Lesson report */}
            {(lesson.content || lesson.notes || lesson.homework || lesson.souvenir_image) && (
              <>
                <SectionTitle>{t('lessons.form.sectionReport')}</SectionTitle>
                {lesson.notes && (
                  <div className="mb-3">
                    <p className="text-xs font-medium mb-1.5" style={{ color: MUTED }}>{t('common.notes')}</p>
                    <p className="text-sm p-3 rounded-xl" style={{ background: TEAL_50, color: NAVY, border: `1px solid ${TEAL_100}` }}>{lesson.notes}</p>
                  </div>
                )}
                {lesson.homework && (
                  <div className="mb-3">
                    <p className="text-xs font-medium mb-1.5" style={{ color: MUTED }}>{t('lessons.form.fieldHomework')}</p>
                    <p className="text-sm p-3 rounded-xl" style={{ background: TEAL_50, color: NAVY, border: `1px solid ${TEAL_100}` }}>{lesson.homework}</p>
                  </div>
                )}
                {lesson.souvenir_image && (
                  <div className="mb-3">
                    <p className="text-xs mb-1" style={{ color: MUTED }}>{t('lessons.form.souvenirImage')}</p>
                    <img
                      src={lesson.souvenir_image}
                      alt={t('lessons.form.souvenirImage')}
                      className="rounded-lg w-full object-cover max-h-48"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Edit mode */}
        {lesson && editing && (
          <div className="flex-1 overflow-y-auto px-5 pb-6">
            <LessonForm
              initialValues={lesson}
              onSuccess={() => { setEditing(false); onUpdate?.() }}
              onCancel={() => setEditing(false)}
            />
          </div>
        )}

        {/* Footer actions */}
        {lesson && !editing && (
          <div className="px-5 py-4 border-t flex gap-2 shrink-0" style={{ borderColor: BORDER }}>
            <button
              onClick={handleDelete}
              disabled={deleteLesson.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-red-50"
              style={{ color: '#DC2626', borderColor: '#FECACA' }}
            >
              <Trash2 size={14} />
              {t('common.delete')}
            </button>
            <button
              onClick={() => setEditing(true)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: '#0d9488' }}
            >
              <Pencil size={14} />
              {t('lessons.detail.editLesson')}
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
