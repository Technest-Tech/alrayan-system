'use client'
import { useState } from 'react'
import { X, Plus, Trash2, RotateCw } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateLessonSchedule, useLessonSubjects } from '@/hooks/system/useLessons'
import { useTeachers } from '@/hooks/system/useTeachers'
import { useStudents } from '@/hooks/system/useStudents'
import type { LessonSchedule, ScheduleSlot } from '@/types/system/lesson'
import { SearchableSelect } from './SearchableSelect'

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
      {(['top-2.5 left-3', 'top-2.5 right-3', 'bottom-2.5 left-3', 'bottom-2.5 right-3'] as const).map(pos => (
        <span key={pos} className={`absolute ${pos} select-none pointer-events-none leading-none`} style={{ color: TEAL_400, fontSize: 13 }}>◇</span>
      ))}
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

/* ── Constants ───────────────────────────────────────────── */
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0')
  const m = i % 2 === 0 ? '00' : '30'
  return `${h}:${m}`
})

const DURATION_OPTIONS = [30, 45, 60, 75, 90, 120]

const RECURRENCE_OPTIONS: { value: LessonSchedule['recurrence']; label: string }[] = [
  { value: 'none',          label: 'Does not repeat'  },
  { value: 'weekly',        label: 'Every week'        },
  { value: 'biweekly',      label: 'Every 2 weeks'     },
  { value: 'every_4_weeks', label: 'Every 4 weeks'     },
  { value: 'custom',        label: 'Custom'            },
]

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess?: () => void
}

function newSlot(): Omit<ScheduleSlot, 'id'> {
  return { day_of_week: 1, start_time: '18:00', duration_minutes: 60 }
}

export function CreateScheduleDialog({ open, onOpenChange, onSuccess }: Props) {
  const { data: subjects = [] } = useLessonSubjects()
  const { data: teachersData }  = useTeachers()
  const { data: studentsData }  = useStudents({ per_page: 500 })
  const teachers = teachersData?.data ?? []
  const students = studentsData?.data ?? []

  const createSchedule = useCreateLessonSchedule()

  const [teacherId,  setTeacherId]  = useState('')
  const [studentId,  setStudentId]  = useState('')
  const [subjectId,  setSubjectId]  = useState('')
  const [recurrence, setRecurrence] = useState<LessonSchedule['recurrence']>('weekly')
  const [startDate,  setStartDate]  = useState(() => new Date().toISOString().split('T')[0])
  const [slots,      setSlots]      = useState<Omit<ScheduleSlot, 'id'>[]>([newSlot()])

  function addSlot()        { setSlots(p => [...p, newSlot()]) }
  function removeSlot(i: number) { setSlots(p => p.filter((_, j) => j !== i)) }
  function updateSlot(i: number, field: keyof Omit<ScheduleSlot, 'id'>, value: string | number) {
    setSlots(p => p.map((s, j) => j === i
      ? { ...s, [field]: field === 'day_of_week' || field === 'duration_minutes' ? Number(value) : value }
      : s
    ))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!teacherId || !studentId || !startDate || !slots.length) {
      toast.error('Please fill in all required fields.')
      return
    }
    try {
      await createSchedule.mutateAsync({
        teacher_id: Number(teacherId),
        student_id: Number(studentId),
        subject_id: subjectId ? Number(subjectId) : null,
        recurrence,
        start_date: startDate,
        slots,
      })
      toast.success('Schedule created.')
      onSuccess?.()
      onOpenChange(false)
    } catch {
      toast.error('Something went wrong. Please try again.')
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div aria-hidden="true" className="fixed inset-0 bg-black/40 z-50" onClick={() => onOpenChange(false)} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl"
          style={{ background: '#fff', boxShadow: '0 24px 64px rgb(0 0 0 / 0.2)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10"
            style={{ borderColor: BORDER }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: TEAL_50 }}>
                <RotateCw size={14} style={{ color: TEAL_600 }} />
              </div>
              <h2 className="text-base font-semibold" style={{ color: NAVY }}>Create Schedule</h2>
            </div>
            <button onClick={() => onOpenChange(false)} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors" aria-label="Close">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

            {/* ── Participants ─────────────────────────────── */}
            <SectionCard title="Participants">
              <div className="grid grid-cols-3 gap-3">
                <Field label="Teacher" required>
                  <SearchableSelect
                    options={teachers.map(t => ({ value: String(t.id), label: (t as any).name ?? `Teacher #${t.id}` }))}
                    value={teacherId}
                    onChange={setTeacherId}
                    placeholder="Select…"
                  />
                </Field>
                <Field label="Student" required>
                  <SearchableSelect
                    options={students.map(s => ({ value: String(s.id), label: s.name }))}
                    value={studentId}
                    onChange={setStudentId}
                    placeholder="Select…"
                  />
                </Field>
                <Field label="Subject">
                  <SearchableSelect
                    options={subjects.map(s => ({ value: String(s.id), label: s.name }))}
                    value={subjectId}
                    onChange={setSubjectId}
                    placeholder="Subject"
                    clearable
                  />
                </Field>
              </div>
            </SectionCard>

            {/* ── Schedule (time slots) ────────────────────── */}
            <SectionCard title="Schedule">
              <div className="space-y-2.5">
                {slots.map((slot, i) => (
                  <div
                    key={i}
                    className="rounded-xl border p-3"
                    style={{ borderColor: TEAL_100, background: '#fff' }}
                  >
                    {/* Row labels */}
                    <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 mb-1.5">
                      <p className="text-xs font-medium" style={{ color: MUTED }}>Day of Week</p>
                      <p className="text-xs font-medium" style={{ color: MUTED }}>Start Time</p>
                      <p className="text-xs font-medium" style={{ color: MUTED }}>Duration</p>
                      <div />
                    </div>
                    {/* Row inputs */}
                    <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                      <SearchableSelect
                        options={DAY_NAMES.map((d, idx) => ({ value: String(idx), label: d }))}
                        value={String(slot.day_of_week)}
                        onChange={v => updateSlot(i, 'day_of_week', v)}
                      />

                      <SearchableSelect
                        options={TIME_OPTIONS.map(t => ({ value: t, label: t }))}
                        value={slot.start_time}
                        onChange={v => updateSlot(i, 'start_time', v)}
                      />

                      <select
                        className="px-2.5 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#0d9488] bg-white"
                        style={{ borderColor: BORDER }}
                        value={slot.duration_minutes}
                        onChange={e => updateSlot(i, 'duration_minutes', e.target.value)}
                      >
                        {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d}min</option>)}
                      </select>

                      {slots.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeSlot(i)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                          aria-label="Remove slot"
                        >
                          <Trash2 size={14} />
                        </button>
                      ) : (
                        <div className="w-7" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addSlot}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-75"
                style={{ color: TEAL_600 }}
              >
                <Plus size={14} />
                Add another time slot
              </button>
            </SectionCard>

            {/* ── Recurrence ───────────────────────────────── */}
            <SectionCard title="Recurrence">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Field label="Start Date" required>
                  <input
                    type="date"
                    className={inp}
                    style={inpStyle}
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
                </Field>
                <Field label="Recurring">
                  <select
                    className={inp}
                    style={inpStyle}
                    value={recurrence}
                    onChange={e => setRecurrence(e.target.value as LessonSchedule['recurrence'])}
                  >
                    {RECURRENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
              </div>

              {/* Recurrence visual hint */}
              <div
                className="rounded-xl px-4 py-3 flex items-center gap-2.5"
                style={{ background: '#fff', border: `1px solid ${TEAL_100}` }}
              >
                <RotateCw size={14} style={{ color: TEAL_400, flexShrink: 0 }} />
                <p className="text-xs" style={{ color: MUTED }}>
                  {recurrence === 'none'
                    ? 'Lessons will be created only for the first occurrence of each time slot.'
                    : recurrence === 'weekly'
                    ? 'A lesson will be generated every week for each time slot, 90 days ahead.'
                    : recurrence === 'biweekly'
                    ? 'A lesson will be generated every 2 weeks for each time slot, 90 days ahead.'
                    : recurrence === 'every_4_weeks'
                    ? 'A lesson will be generated every 4 weeks for each time slot, 90 days ahead.'
                    : 'Custom recurrence — define the pattern after creating.'}
                </p>
              </div>
            </SectionCard>

            {/* ── Actions ──────────────────────────────────── */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium border hover:bg-black/5 transition-colors"
                style={{ borderColor: BORDER, color: NAVY }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createSchedule.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: TEAL_600 }}
              >
                {createSchedule.isPending ? 'Saving…' : 'Create Schedule'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
