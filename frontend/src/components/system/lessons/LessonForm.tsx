'use client'
import { useRef, useState } from 'react'
import { Mic, Upload } from 'lucide-react'
import { SearchableSelect } from './SearchableSelect'
import { toast } from 'sonner'
import { useLessonSubjects, useLessonEvaluations, useCreateLesson, useUpdateLesson } from '@/hooks/system/useLessons'
import { useTeachers } from '@/hooks/system/useTeachers'
import { useStudents } from '@/hooks/system/useStudents'
import type { Lesson, LessonStatus, StoreLessonPayload } from '@/types/system/lesson'

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
const STATUSES: { value: LessonStatus; label: string }[] = [
  { value: 'scheduled',    label: 'Scheduled'    },
  { value: 'attended',     label: 'Attended'     },
  { value: 'paid_absence', label: 'Paid Absence' },
  { value: 'absent',       label: 'Absent'       },
  { value: 'cancelled',    label: 'Cancelled'    },
]

const HOUR_OPTIONS   = [0, 1, 2, 3]
const MINUTE_OPTIONS = [0, 30]

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
  const isEdit = !!initialValues

  const { data: subjects    = [] } = useLessonSubjects()
  const { data: evaluations = [] } = useLessonEvaluations()
  const { data: teachersData }     = useTeachers()
  const { data: studentsData }     = useStudents({ per_page: 500 })
  const teachers = teachersData?.data ?? []
  const students = studentsData?.data ?? []

  const createLesson = useCreateLesson()
  const updateLesson = useUpdateLesson()
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* ── Form state ─────────────────────────────────────────── */
  const [teacherId,    setTeacherId]    = useState(initialValues ? String(initialValues.teacher_id) : prefill?.teacherId ? String(prefill.teacherId) : '')
  const [studentId,    setStudentId]    = useState(initialValues ? String(initialValues.student_id) : prefill?.studentId ? String(prefill.studentId) : '')
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

  const selectedSubject = subjects.find(s => String(s.id) === subjectId)

  /* ── Submit ─────────────────────────────────────────────── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!teacherId || !studentId || !scheduledAt) {
      toast.error('Please fill in required fields.')
      return
    }
    const durationMinutes = durationH * 60 + durationM
    if (durationMinutes === 0) { toast.error('Duration must be greater than 0.'); return }

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
    }

    try {
      if (isEdit) {
        await updateLesson.mutateAsync({ id: initialValues.id, ...payload })
        toast.success('Lesson updated.')
      } else {
        await createLesson.mutateAsync(payload)
        toast.success('Lesson created.')
      }
      onSuccess?.()
    } catch {
      toast.error('Something went wrong. Please try again.')
    }
  }

  const isPending = createLesson.isPending || updateLesson.isPending

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* ── Participants ─────────────────────────────────── */}
      <SectionCard title="Participants">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Status">
            <SearchableSelect
              options={STATUSES.map(s => ({ value: s.value, label: s.label }))}
              value={status}
              onChange={v => setStatus(v as LessonStatus)}
            />
          </Field>
          <Field label="Evaluation">
            <SearchableSelect
              options={evaluations.map(ev => ({ value: String(ev.id), label: ev.label }))}
              value={evaluationId}
              onChange={setEvaluationId}
              placeholder="— None —"
              clearable
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Teacher" required>
            <SearchableSelect
              options={teachers.map(t => ({ value: String(t.id), label: (t as any).name ?? `Teacher #${t.id}` }))}
              value={teacherId}
              onChange={setTeacherId}
              placeholder="Select teacher…"
            />
          </Field>
          <Field label="Student" required>
            <SearchableSelect
              options={students.map(s => ({ value: String(s.id), label: s.name }))}
              value={studentId}
              onChange={setStudentId}
              placeholder="Select student…"
            />
          </Field>
        </div>
      </SectionCard>

      {/* ── Schedule ─────────────────────────────────────── */}
      <SectionCard title="Schedule">
        <div className="grid grid-cols-[1fr_auto] gap-3 items-end mb-3">
          <Field label="Subject">
            <SearchableSelect
              options={subjects.map(s => ({ value: String(s.id), label: s.name }))}
              value={subjectId}
              onChange={v => { setSubjectId(v); setSubjectDetails({}) }}
              placeholder="Subject"
              clearable
            />
          </Field>
          {/* Duration */}
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: MUTED }}>Duration</label>
            <div className="flex items-center gap-1.5">
              <select
                className="px-2.5 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#0d9488] bg-white"
                style={{ borderColor: BORDER }}
                value={durationH}
                onChange={e => setDurationH(Number(e.target.value))}
              >
                {HOUR_OPTIONS.map(h => <option key={h} value={h}>{h}h</option>)}
              </select>
              <span style={{ color: MUTED }}>:</span>
              <select
                className="px-2.5 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#0d9488] bg-white"
                style={{ borderColor: BORDER }}
                value={durationM}
                onChange={e => setDurationM(Number(e.target.value))}
              >
                {MINUTE_OPTIONS.map(m => <option key={m} value={m}>{String(m).padStart(2,'0')}min</option>)}
              </select>
            </div>
          </div>
        </div>
        <Field label="Date" required>
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
        <SectionCard title={`${selectedSubject.name} Details`}>
          <div className="space-y-3">
            {selectedSubject.fields.map(f => (
              <Field key={f.key} label={f.label}>
                {f.type === 'select' && f.options ? (
                  <SearchableSelect
                    options={f.options.map(o => ({ value: o, label: o }))}
                    value={subjectDetails[f.key] ?? ''}
                    onChange={v => setSubjectDetails(p => ({ ...p, [f.key]: v }))}
                    placeholder="— Select —"
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

      {/* ── Lesson Report ─────────────────────────────────── */}
      <SectionCard title="Lesson Report">
        {/* Content */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium" style={{ color: MUTED }}>Content</label>
            <button type="button" className="p-1 rounded-lg hover:bg-teal-100/60 transition-colors" aria-label="Voice input">
              <Mic size={13} style={{ color: TEAL_400 }} />
            </button>
          </div>
          <textarea
            className={inp}
            style={inpStyle}
            rows={3}
            placeholder="What was covered in this lesson…"
            value={content}
            onChange={e => setContent(e.target.value)}
          />
        </div>

        {/* Notes + Homework side by side */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium" style={{ color: MUTED }}>Notes</label>
              <div className="flex items-center gap-1">
                {initialValues?.notes && (
                  <button type="button" className="text-xs font-medium underline" style={{ color: TEAL_600 }} onClick={() => setNotes(initialValues.notes ?? '')}>
                    Use last
                  </button>
                )}
                <button type="button" className="p-1 rounded-lg hover:bg-teal-100/60 transition-colors" aria-label="Voice input">
                  <Mic size={13} style={{ color: TEAL_400 }} />
                </button>
              </div>
            </div>
            <textarea
              className={inp}
              style={inpStyle}
              rows={4}
              placeholder="Notes for the teacher or student…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium" style={{ color: MUTED }}>Homework</label>
              <div className="flex items-center gap-1">
                {initialValues?.homework && (
                  <button type="button" className="text-xs font-medium underline" style={{ color: TEAL_600 }} onClick={() => setHomework(initialValues.homework ?? '')}>
                    Use last
                  </button>
                )}
                <button type="button" className="p-1 rounded-lg hover:bg-teal-100/60 transition-colors" aria-label="Voice input">
                  <Mic size={13} style={{ color: TEAL_400 }} />
                </button>
              </div>
            </div>
            <textarea
              className={inp}
              style={inpStyle}
              rows={4}
              placeholder="Assigned homework…"
              value={homework}
              onChange={e => setHomework(e.target.value)}
            />
          </div>
        </div>

        {/* Souvenir Image */}
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: MUTED }}>
            🎁 Souvenir Image
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
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-colors group-hover:bg-teal-100" style={{ background: TEAL_50 }}>
                  <Upload size={18} style={{ color: TEAL_400 }} />
                </div>
                <p className="text-sm font-medium" style={{ color: NAVY }}>Upload Image</p>
                <p className="text-xs" style={{ color: MUTED }}>Click or drag and drop</p>
                <p className="text-xs" style={{ color: MUTED }}>PNG, JPG, GIF up to 3MB</p>
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
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: TEAL_600 }}
        >
          {isPending ? 'Saving…' : isEdit ? 'Update Lesson' : 'Create Lesson'}
        </button>
      </div>
    </form>
  )
}
