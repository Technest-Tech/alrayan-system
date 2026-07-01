'use client'
import { useRef, useState } from 'react'
import { Mic, Upload, GraduationCap, BookOpen, BookMarked, Smile, Gamepad2, Brain } from 'lucide-react'
import { SearchableSelect } from './SearchableSelect'
import { toast } from 'sonner'
import { useLessonSubjects, useLessonEvaluations, useCreateLesson, useUpdateLesson } from '@/hooks/system/useLessons'
import { useTeachers } from '@/hooks/system/useTeachers'
import { useStudents } from '@/hooks/system/useStudents'
import { useMyStudents } from '@/hooks/system/useMyStudents'
import { useSystemUser } from '@/components/system/shell/SystemShell'
import type { Lesson, LessonStatus, StoreLessonPayload, TrialEvaluation } from '@/types/system/lesson'
import { LESSON_STATUSES } from '@/lib/system/lessonStatus'
import { useI18n } from '@/lib/system/i18n'

/* ── Design tokens ────────────────────────────────────────── */
const BORDER   = 'rgb(var(--border-default,229 233 240))'
const NAVY     = 'rgb(11 31 58)'
const MUTED    = 'rgb(90 100 112)'
const TEAL_50  = '#F0FDFA'
const TEAL_100 = '#CCFBF1'
const TEAL_400 = '#2DD4BF'
const TEAL_600 = '#0d9488'

const inp      = 'w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#0d9488] transition-shadow bg-white'
const inpStyle = { borderColor: BORDER }

/* ── Decorative section card ─────────────────────────────── */
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="relative rounded-2xl p-5" style={{ background: TEAL_50, border: `1px solid ${TEAL_100}` }}>
      {/* Corner diamonds */}
      {(['top-2.5 left-3', 'top-2.5 right-3', 'bottom-2.5 left-3', 'bottom-2.5 right-3'] as const).map(pos => (
        <span key={pos} className={`absolute ${pos} select-none pointer-events-none leading-none`} style={{ color: TEAL_400, fontSize: 13 }}>◇</span>
      ))}
      {/* Decorated title */}
      <div className="flex items-center gap-2 mb-5">
        <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${TEAL_100})` }} />
        <div className="flex items-center gap-2 shrink-0">
          <span style={{ color: TEAL_400, fontSize: 11, lineHeight: 1 }}>✦</span>
          <span className="text-sm font-semibold tracking-wide" style={{ color: NAVY }}>{title}</span>
          <span style={{ color: TEAL_400, fontSize: 11, lineHeight: 1 }}>✦</span>
        </div>
        <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${TEAL_100})` }} />
      </div>
      {children}
    </div>
  )
}

/* ── Form field wrapper ──────────────────────────────────── */
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium block mb-1.5" style={{ color: MUTED }}>
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

/* ── Form constants ──────────────────────────────────────── */
const STATUSES = LESSON_STATUSES

/* Map lesson-status enum values → i18n keys (labels come from lessonStatus.ts which we don't translate). */
const STATUS_KEY: Record<LessonStatus, string> = {
  attended:             'status.attended',
  paid_absence:         'lessons.status.paidAbsence',
  cancelled_by_student: 'lessons.status.cancelledByStudent',
  scheduled:            'status.scheduled',
  absent:               'status.absent',
  cancelled_by_teacher: 'lessons.status.cancelledByTeacher',
  trial:                'lessons.status.trial',
  free:                 'lessons.status.free',
}

const HOUR_OPTIONS   = [0, 1, 2, 3]
const MINUTE_OPTIONS = [0, 30]

/* ── Trial-lesson evaluation options ─────────────────────── */
const STUDENT_LEVELS    = ['Beginner', 'Elementary', 'Intermediate', 'Advanced']
const READING_ABILITIES = ['Cannot read', 'Weak', 'Average', 'Good', 'Excellent']
const BEHAVIOR_OPTS     = ['Cheerful', 'Calm', 'Shy', 'Confident', 'Quick Tempered', 'Distracted', 'Disciplined', 'Needs Encouragement']
const MOTIVATION_OPTS   = ['Loves Learning', 'Very Cooperative', 'Forced by Parents', 'Loses Focus Quickly', 'Loves Challenges', 'Prefers Play']
const LEARNING_OPTS     = ['Visual', 'Auditory', 'Kinesthetic', 'Quick Learner', 'Needs Repetition', 'Fears Mistakes']

/* Multi-select chip group used across the trial evaluation. */
function ChipGroup({
  title, icon, options, value, onChange, accent, accentBg,
}: {
  title: string
  icon: React.ReactNode
  options: string[]
  value: string[]
  onChange: (v: string[]) => void
  accent: string
  accentBg: string
}) {
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter(x => x !== o) : [...value, o])
  return (
    <div className="rounded-xl p-3" style={{ background: accentBg, border: `1px solid ${accent}22` }}>
      <div className="flex items-center gap-2 mb-2.5">
        <span style={{ color: accent }}>{icon}</span>
        <span className="text-sm font-semibold" style={{ color: NAVY }}>{title}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map(o => {
          const on = value.includes(o)
          return (
            <button
              key={o}
              type="button"
              onClick={() => toggle(o)}
              className="px-2.5 py-1 rounded-full text-xs font-medium border transition-colors"
              style={on
                ? { background: accent, color: '#fff', borderColor: accent }
                : { background: '#fff', color: accent, borderColor: `${accent}55` }}
            >
              {o}
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface Prefill {
  scheduledAt?:     string
  durationMinutes?: number
  teacherId?:       number
  studentId?:       number
}

interface Props {
  initialValues?: Lesson
  prefill?:       Prefill
  onSuccess?:     () => void
  onCancel?:      () => void
}

export function LessonForm({ initialValues, prefill, onSuccess, onCancel }: Props) {
  const { t } = useI18n()
  const isEdit = !!initialValues

  // A logged-in teacher can only create lessons for themselves + their own students.
  const user = useSystemUser()
  const isTeacher = user?.role === 'teacher'
  const myTeacherId = user?.teacher_id ?? null

  /* Teacher / student selection — declared early so the student list can filter by teacher. */
  const [teacherId, setTeacherId] = useState(
    initialValues ? String(initialValues.teacher_id)
    : prefill?.teacherId ? String(prefill.teacherId)
    : isTeacher && myTeacherId ? String(myTeacherId)
    : '',
  )
  const [studentId, setStudentId] = useState(initialValues ? String(initialValues.student_id) : prefill?.studentId ? String(prefill.studentId) : '')

  const { data: subjects    = [] } = useLessonSubjects()
  const { data: evaluations = [] } = useLessonEvaluations()
  const { data: teachersData }     = useTeachers({}, { enabled: !isTeacher })
  // Admins load students for the selected teacher; a teacher loads their own students.
  const { data: adminStudentsData } = useStudents({ per_page: 500, assigned_teacher_id: teacherId || undefined }, { enabled: !isTeacher })
  const { data: myStudents }        = useMyStudents({ enabled: isTeacher })
  const teachers = teachersData?.data ?? []
  const students = isTeacher ? (myStudents ?? []) : (adminStudentsData?.data ?? [])

  const createLesson = useCreateLesson()
  const updateLesson = useUpdateLesson()
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* ── Form state ─────────────────────────────────────────── */
  const [status,       setStatus]       = useState<LessonStatus>(initialValues?.status ?? 'scheduled')
  const [evaluationId, setEvaluationId] = useState(initialValues?.evaluation_id ? String(initialValues.evaluation_id) : '')
  const [subjectId,    setSubjectId]    = useState(initialValues?.subject_id ? String(initialValues.subject_id) : '')

  const initDate = initialValues
    ? new Date(initialValues.scheduled_at).toISOString().slice(0, 16)
    : prefill?.scheduledAt ? prefill.scheduledAt.slice(0, 16)
    : new Date().toISOString().slice(0, 16)
  const [scheduledAt, setScheduledAt] = useState(initDate)

  const prefillDur  = prefill?.durationMinutes ?? 60
  const initDurH    = initialValues ? Math.floor(initialValues.duration_minutes / 60) : Math.floor(prefillDur / 60)
  const initDurM    = initialValues ? initialValues.duration_minutes % 60             : prefillDur % 60
  const [durationH, setDurationH] = useState(initDurH)
  const [durationM, setDurationM] = useState(initDurM)

  const [content,        setContent]        = useState(initialValues?.content  ?? '')
  const [notes,          setNotes]          = useState(initialValues?.notes    ?? '')
  const [homework,       setHomework]       = useState(initialValues?.homework ?? '')
  const [souvenirImage,  setSouvenirImage]  = useState<File | null>(null)
  const [subjectDetails, setSubjectDetails] = useState<Record<string, string>>(initialValues?.subject_details ?? {})
  const [trial,          setTrial]          = useState<TrialEvaluation>(initialValues?.trial_evaluation ?? {})

  const selectedSubject = subjects.find(s => String(s.id) === subjectId)
  const setTrialField = <K extends keyof TrialEvaluation>(k: K, v: TrialEvaluation[K]) =>
    setTrial(p => ({ ...p, [k]: v }))

  /* ── Submit ─────────────────────────────────────────────── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!teacherId || !studentId || !scheduledAt) {
      toast.error(t('lessons.form.toastRequiredFields'))
      return
    }
    const durationMinutes = durationH * 60 + durationM
    if (durationMinutes === 0) { toast.error(t('lessons.form.toastDurationPositive')); return }

    const payload: StoreLessonPayload = {
      teacher_id:      Number(teacherId),
      student_id:      Number(studentId),
      scheduled_at:    new Date(scheduledAt).toISOString(),
      duration_minutes: durationMinutes,
      status,
      subject_id:      subjectId      ? Number(subjectId)      : null,
      evaluation_id:   evaluationId   ? Number(evaluationId)   : null,
      content:         content        || undefined,
      notes:           notes          || undefined,
      homework:        homework       || undefined,
      subject_details: Object.keys(subjectDetails).length ? subjectDetails : undefined,
      trial_evaluation: status === 'trial' && Object.keys(trial).length ? trial : undefined,
    }

    try {
      if (isEdit) {
        await updateLesson.mutateAsync({ id: initialValues.id, ...payload })
        toast.success(t('lessons.form.toastUpdated'))
      } else {
        await createLesson.mutateAsync(payload)
        toast.success(t('lessons.form.toastCreated'))
      }
      // Trial lessons send an evaluation report to the student's WhatsApp + email.
      // TODO: wire to the messaging integration; stubbed for now.
      if (status === 'trial') toast.info(t('lessons.form.trial.reportQueued'))
      onSuccess?.()
    } catch {
      toast.error(t('lessons.form.toastError'))
    }
  }

  const isPending = createLesson.isPending || updateLesson.isPending

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* ── Participants ─────────────────────────────────── */}
      <SectionCard title={t('lessons.form.sectionParticipants')}>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label={t('common.status')}>
            <SearchableSelect
              options={STATUSES.map(s => ({ value: s.value, label: t(STATUS_KEY[s.value]) }))}
              value={status}
              onChange={v => setStatus(v as LessonStatus)}
            />
          </Field>
          <Field label={t('lessons.form.fieldEvaluation')}>
            <SearchableSelect
              options={evaluations.map(ev => ({ value: String(ev.id), label: ev.label }))}
              value={evaluationId}
              onChange={setEvaluationId}
              placeholder={t('lessons.form.noneOption')}
              clearable
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('common.teacher')} required>
            {isTeacher ? (
              <div className={inp} style={{ ...inpStyle, background: '#f8fafc', color: NAVY }}>{user?.name}</div>
            ) : (
              <SearchableSelect
                options={teachers.map(tc => ({ value: String(tc.id), label: tc.name ?? t('lessons.teacherFallback', { id: String(tc.id) }) }))}
                value={teacherId}
                onChange={v => { if (v !== teacherId) setStudentId(''); setTeacherId(v) }}
                placeholder={t('lessons.form.selectTeacher')}
              />
            )}
          </Field>
          <Field label={t('lessons.form.fieldStudent')} required>
            <SearchableSelect
              options={students.map(s => ({ value: String(s.id), label: s.name }))}
              value={studentId}
              onChange={setStudentId}
              placeholder={teacherId && students.length === 0
                ? t('lessons.form.noStudentsForTeacher')
                : t('lessons.form.selectStudent')}
            />
          </Field>
        </div>
      </SectionCard>

      {/* ── Schedule ─────────────────────────────────────── */}
      <SectionCard title={t('lessons.form.sectionSchedule')}>
        <div className="grid grid-cols-[1fr_auto] gap-3 items-end mb-3">
          <Field label={t('lessons.form.fieldSubject')}>
            <SearchableSelect
              options={subjects.map(s => ({ value: String(s.id), label: s.name }))}
              value={subjectId}
              onChange={v => { setSubjectId(v); setSubjectDetails({}) }}
              placeholder={t('lessons.form.fieldSubject')}
              clearable
            />
          </Field>
          {/* Duration */}
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: MUTED }}>{t('common.duration')}</label>
            <div className="flex items-center gap-1.5">
              <select
                className="px-2.5 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#0d9488] bg-white"
                style={{ borderColor: BORDER }}
                value={durationH}
                onChange={e => setDurationH(Number(e.target.value))}
              >
                {HOUR_OPTIONS.map(h => <option key={h} value={h}>{t('lessons.form.hoursShort', { n: String(h) })}</option>)}
              </select>
              <span style={{ color: MUTED }}>:</span>
              <select
                className="px-2.5 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#0d9488] bg-white"
                style={{ borderColor: BORDER }}
                value={durationM}
                onChange={e => setDurationM(Number(e.target.value))}
              >
                {MINUTE_OPTIONS.map(m => <option key={m} value={m}>{t('lessons.form.minutesShort', { n: String(m).padStart(2,'0') })}</option>)}
              </select>
            </div>
          </div>
        </div>
        <Field label={t('common.date')} required>
          <input
            type="datetime-local"
            className={inp}
            style={inpStyle}
            value={scheduledAt}
            onChange={e => setScheduledAt(e.target.value)}
          />
        </Field>
      </SectionCard>

      {/* ── Subject-specific fields ───────────────────────── */}
      {selectedSubject?.fields && selectedSubject.fields.length > 0 && (
        <SectionCard title={t('lessons.form.subjectDetailsTitle', { subject: selectedSubject.name })}>
          <div className="space-y-3">
            {selectedSubject.fields.map(f => (
              <Field key={f.key} label={f.label}>
                {f.type === 'select' && f.options ? (
                  <SearchableSelect
                    options={f.options.map(o => ({ value: o, label: o }))}
                    value={subjectDetails[f.key] ?? ''}
                    onChange={v => setSubjectDetails(p => ({ ...p, [f.key]: v }))}
                    placeholder={t('lessons.form.selectOption')}
                    clearable
                  />
                ) : (
                  <input
                    type={f.type === 'number' ? 'number' : 'text'}
                    className={inp}
                    style={inpStyle}
                    value={subjectDetails[f.key] ?? ''}
                    onChange={e => setSubjectDetails(p => ({ ...p, [f.key]: e.target.value }))}
                  />
                )}
              </Field>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── Trial Lesson Evaluation (only for trial lessons) ── */}
      {status === 'trial' && (
        <SectionCard title={t('lessons.form.trial.sectionTitle')}>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium block mb-1.5" style={{ color: MUTED }}>
                <GraduationCap size={13} style={{ color: '#7C3AED' }} />{t('lessons.form.trial.studentLevel')}
              </label>
              <SearchableSelect
                options={STUDENT_LEVELS.map(o => ({ value: o, label: o }))}
                value={trial.student_level ?? ''}
                onChange={v => setTrialField('student_level', v)}
                placeholder={t('lessons.form.trial.selectLevel')}
                clearable
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium block mb-1.5" style={{ color: MUTED }}>
                <BookOpen size={13} style={{ color: TEAL_600 }} />{t('lessons.form.trial.readingAbility')}
              </label>
              <SearchableSelect
                options={READING_ABILITIES.map(o => ({ value: o, label: o }))}
                value={trial.reading_ability ?? ''}
                onChange={v => setTrialField('reading_ability', v)}
                placeholder={t('lessons.form.trial.selectReading')}
                clearable
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium block mb-1.5" style={{ color: MUTED }}>
                <BookMarked size={13} style={{ color: '#DB2777' }} />{t('lessons.form.trial.memorizationLevel')}
              </label>
              <input
                className={inp}
                style={inpStyle}
                value={trial.memorization_level ?? ''}
                onChange={e => setTrialField('memorization_level', e.target.value)}
                placeholder={t('lessons.form.trial.memorizationPlaceholder')}
              />
            </div>
          </div>

          <div className="space-y-3">
            <ChipGroup
              title={t('lessons.form.trial.behavior')}
              icon={<Smile size={15} />}
              options={BEHAVIOR_OPTS}
              value={trial.behavior ?? []}
              onChange={v => setTrialField('behavior', v)}
              accent="#B45309" accentBg="#FFFBEB"
            />
            <div className="grid grid-cols-2 gap-3">
              <ChipGroup
                title={t('lessons.form.trial.motivation')}
                icon={<Gamepad2 size={15} />}
                options={MOTIVATION_OPTS}
                value={trial.motivation ?? []}
                onChange={v => setTrialField('motivation', v)}
                accent="#15803D" accentBg="#F0FDF4"
              />
              <ChipGroup
                title={t('lessons.form.trial.learningStyle')}
                icon={<Brain size={15} />}
                options={LEARNING_OPTS}
                value={trial.learning_style ?? []}
                onChange={v => setTrialField('learning_style', v)}
                accent="#2563EB" accentBg="#EFF6FF"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('lessons.form.trial.expectations')}>
                <textarea
                  className={inp} style={inpStyle} rows={3}
                  placeholder={t('lessons.form.trial.expectationsPlaceholder')}
                  value={trial.expectations ?? ''}
                  onChange={e => setTrialField('expectations', e.target.value)}
                />
              </Field>
              <Field label={t('lessons.form.trial.teacherNotes')}>
                <textarea
                  className={inp} style={inpStyle} rows={3}
                  placeholder={t('lessons.form.trial.teacherNotesPlaceholder')}
                  value={trial.teacher_notes ?? ''}
                  onChange={e => setTrialField('teacher_notes', e.target.value)}
                />
              </Field>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── Lesson Report ─────────────────────────────────── */}
      <SectionCard title={t('lessons.form.sectionReport')}>
        {/* Content */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium" style={{ color: MUTED }}>{t('lessons.form.fieldContent')}</label>
            <button type="button" className="p-1 rounded-lg hover:bg-teal-100/60 transition-colors" aria-label={t('lessons.form.voiceInput')}>
              <Mic size={13} style={{ color: TEAL_400 }} />
            </button>
          </div>
          <textarea
            className={inp}
            style={inpStyle}
            rows={3}
            placeholder={t('lessons.form.contentPlaceholder')}
            value={content}
            onChange={e => setContent(e.target.value)}
          />
        </div>

        {/* Notes + Homework side by side */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium" style={{ color: MUTED }}>{t('common.notes')}</label>
              <div className="flex items-center gap-1">
                {initialValues?.notes && (
                  <button type="button" className="text-xs font-medium underline" style={{ color: TEAL_600 }} onClick={() => setNotes(initialValues.notes ?? '')}>
                    {t('lessons.form.useLast')}
                  </button>
                )}
                <button type="button" className="p-1 rounded-lg hover:bg-teal-100/60 transition-colors" aria-label={t('lessons.form.voiceInput')}>
                  <Mic size={13} style={{ color: TEAL_400 }} />
                </button>
              </div>
            </div>
            <textarea
              className={inp}
              style={inpStyle}
              rows={4}
              placeholder={t('lessons.form.notesPlaceholder')}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium" style={{ color: MUTED }}>{t('lessons.form.fieldHomework')}</label>
              <div className="flex items-center gap-1">
                {initialValues?.homework && (
                  <button type="button" className="text-xs font-medium underline" style={{ color: TEAL_600 }} onClick={() => setHomework(initialValues.homework ?? '')}>
                    {t('lessons.form.useLast')}
                  </button>
                )}
                <button type="button" className="p-1 rounded-lg hover:bg-teal-100/60 transition-colors" aria-label={t('lessons.form.voiceInput')}>
                  <Mic size={13} style={{ color: TEAL_400 }} />
                </button>
              </div>
            </div>
            <textarea
              className={inp}
              style={inpStyle}
              rows={4}
              placeholder={t('lessons.form.homeworkPlaceholder')}
              value={homework}
              onChange={e => setHomework(e.target.value)}
            />
          </div>
        </div>

        {/* Souvenir Image */}
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: MUTED }}>
            🎁 {t('lessons.form.souvenirImage')}
          </label>
          <div
            className="rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors hover:border-[#0d9488] group"
            style={{
              borderColor:  souvenirImage ? TEAL_600 : TEAL_100,
              background:   'rgba(255,255,255,0.7)',
            }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault()
              const file = e.dataTransfer.files[0]
              if (file && file.type.startsWith('image/')) setSouvenirImage(file)
            }}
          >
            {souvenirImage ? (
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: TEAL_50 }}>
                  <Upload size={18} style={{ color: TEAL_600 }} />
                </div>
                <p className="text-sm font-medium" style={{ color: NAVY }}>{souvenirImage.name}</p>
                <button
                  type="button"
                  className="text-xs underline"
                  style={{ color: MUTED }}
                  onClick={e => { e.stopPropagation(); setSouvenirImage(null) }}
                >
                  {t('lessons.form.remove')}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-colors group-hover:bg-teal-100" style={{ background: TEAL_50 }}>
                  <Upload size={18} style={{ color: TEAL_400 }} />
                </div>
                <p className="text-sm font-medium" style={{ color: NAVY }}>{t('lessons.form.uploadImage')}</p>
                <p className="text-xs" style={{ color: MUTED }}>{t('lessons.form.clickOrDrag')}</p>
                <p className="text-xs" style={{ color: MUTED }}>{t('lessons.form.uploadHint')}</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) setSouvenirImage(f)
            }}
          />
        </div>
      </SectionCard>

      {/* ── Actions ──────────────────────────────────────── */}
      <div className="flex gap-2 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl text-sm font-medium border hover:bg-black/5 transition-colors"
            style={{ borderColor: BORDER, color: NAVY }}
          >
            {t('common.cancel')}
          </button>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: TEAL_600 }}
        >
          {isPending ? t('common.saving') : isEdit ? t('lessons.form.updateLesson') : t('lessons.form.createLesson')}
        </button>
      </div>
    </form>
  )
}
