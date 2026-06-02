'use client'
import { useState, useRef, useEffect } from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { useForm, Controller } from 'react-hook-form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { X, PlayCircle, ChevronDown, Search, ChevronRight, CalendarDays, SkipForward } from 'lucide-react'
import { useActivateStudent } from '@/hooks/system/useStudents'
import { useReplaceSchedulePatterns } from '@/hooks/system/useSchedulePatterns'
import { useCourses } from '@/hooks/system/useCourses'
import { useTeachers } from '@/hooks/system/useTeachers'
import { ApiError } from '@/lib/system/api'
import type { Student } from '@/types/system/student'

/* ─── EntityCombobox ───────────────────────────────── */
function EntityCombobox({
  items, value, onChange, placeholder = 'Select…', noneLabel = 'None',
}: {
  items:       { id: number; name: string }[]
  value:       number | undefined
  onChange:    (id: number | undefined) => void
  placeholder?: string
  noneLabel?:  string
}) {
  const [open,   setOpen]   = useState(false)
  const [search, setSearch] = useState('')
  const containerRef        = useRef<HTMLDivElement>(null)
  const searchRef           = useRef<HTMLInputElement>(null)

  const selected = items.find((i) => i.id === value)
  const filtered = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))

  useEffect(() => {
    if (open) { const t = setTimeout(() => searchRef.current?.focus(), 40); return () => clearTimeout(t) }
    else setSearch('')
  }, [open])

  useEffect(() => {
    if (!open) return
    function onOut(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOut)
    return () => document.removeEventListener('mousedown', onOut)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] transition-shadow text-left"
        style={{ borderColor: 'rgb(var(--border-default,229 233 240))', background: '#fff' }}>
        <span className="flex-1 truncate" style={!selected ? { color: 'rgb(156 163 175)' } : { color: 'rgb(11 31 58)' }}>
          {selected ? selected.name : placeholder}
        </span>
        <ChevronDown size={13} className="opacity-40 shrink-0" />
      </button>
      {open && (
        <div className="absolute z-[200] w-full mt-1 rounded-xl border shadow-xl overflow-hidden"
          style={{ background: '#fff', borderColor: 'rgb(var(--border-default,229 233 240))' }}>
          <div className="flex items-center gap-2 px-3 py-2 border-b"
            style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
            <Search size={13} className="opacity-40 shrink-0" />
            <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…" className="flex-1 bg-transparent text-sm outline-none" />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            <li onMouseDown={(e) => { e.preventDefault(); onChange(undefined); setOpen(false) }}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors"
              style={!value ? { background: 'rgb(14 124 90 / 0.08)', color: 'rgb(14 124 90)', fontWeight: 500 } : { color: 'rgb(156 163 175)' }}>
              {noneLabel}
            </li>
            {filtered.length === 0 && items.length > 0 && (
              <li className="px-3 py-2 text-sm opacity-40">No results</li>
            )}
            {filtered.map((item) => (
              <li key={item.id}
                onMouseDown={(e) => { e.preventDefault(); onChange(item.id); setOpen(false) }}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors"
                style={item.id === value
                  ? { background: 'rgb(14 124 90 / 0.08)', color: 'rgb(14 124 90)', fontWeight: 500 }
                  : { color: 'rgb(11 31 58)' }}>
                {item.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* ─── Schema ───────────────────────────────────────── */
const enrollmentSchema = z.object({
  course_id:            z.number().optional(),
  assigned_teacher_id:  z.number().optional(),
  sessions_per_month:   z.coerce.number().min(1, 'Required'),
  session_duration_min: z.coerce.number().min(1, 'Required'),
  currency:             z.string().min(1, 'Required'),
  monthly_price_minor:  z.coerce.number().min(0),
  note:                 z.string().optional(),
})

type EnrollmentValues = z.infer<typeof enrollmentSchema>

const CURRENCIES = ['USD', 'EGP', 'GBP', 'EUR', 'SAR', 'AED']
const DURATIONS  = [30, 45, 60]
const DAY_NAMES  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, '0')
  const m = i % 2 === 0 ? '00' : '30'
  return `${h}:${m}`
})

const inp = 'w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] transition-shadow'
const inpStyle = { borderColor: 'rgb(var(--border-default,229 233 240))', background: '#fff' }

interface PatternEntry { day_of_week: number; start_time: string; duration_min: number }

/* ─── Step indicator ────────────────────────────────── */
function StepDots({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2].map(n => (
        <div key={n} className="flex items-center gap-1">
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors"
            style={step >= n
              ? { background: 'rgb(14 124 90)', color: '#fff' }
              : { background: 'rgb(229 233 240)', color: 'rgb(90 100 112)' }}>
            {n}
          </div>
          {n < 2 && <div className="w-8 h-px" style={{ background: step > 1 ? 'rgb(14 124 90)' : 'rgb(229 233 240)' }} />}
        </div>
      ))}
    </div>
  )
}

/* ─── Timetable step ────────────────────────────────── */
function TimetableStep({
  sessionsPerMonth,
  sessionDurationMin,
  patterns,
  effectiveDate,
  onPatternsChange,
  onEffectiveDateChange,
}: {
  sessionsPerMonth: number
  sessionDurationMin: number
  patterns: PatternEntry[]
  effectiveDate: string
  onPatternsChange: (p: PatternEntry[]) => void
  onEffectiveDateChange: (d: string) => void
}) {
  const targetPerWeek = Math.round(sessionsPerMonth / 4)
  const countOk = patterns.length === targetPerWeek

  function toggleDay(day: number) {
    if (patterns.find(p => p.day_of_week === day)) {
      onPatternsChange(patterns.filter(p => p.day_of_week !== day))
    } else {
      onPatternsChange(
        [...patterns, { day_of_week: day, start_time: '18:00', duration_min: sessionDurationMin }]
          .sort((a, b) => a.day_of_week - b.day_of_week)
      )
    }
  }

  function updateTime(day: number, time: string) {
    onPatternsChange(patterns.map(p => p.day_of_week === day ? { ...p, start_time: time } : p))
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4 space-y-4"
        style={{ background: '#fff', border: '1px solid rgb(var(--border-default,229 233 240))' }}>
        <p className="text-[11px] font-semibold uppercase tracking-widest opacity-40">Weekly schedule</p>

        {/* Effective from */}
        <div>
          <label className="block text-xs font-medium mb-1.5 opacity-70">Start from</label>
          <input type="date" className={inp} style={inpStyle}
            value={effectiveDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => onEffectiveDateChange(e.target.value)} />
        </div>

        {/* Day chips */}
        <div>
          <label className="block text-xs font-medium mb-2 opacity-70">Days of the week</label>
          <div className="flex gap-1.5 flex-wrap">
            {DAY_NAMES.map((name, i) => {
              const active = patterns.some(p => p.day_of_week === i)
              return (
                <button key={i} type="button" onClick={() => toggleDay(i)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
                  style={active
                    ? { background: 'rgb(14 124 90)', color: '#fff', borderColor: 'rgb(14 124 90)' }
                    : { background: '#fff', borderColor: 'rgb(var(--border-default,229 233 240))', color: 'rgb(90 100 112)' }}>
                  {name}
                </button>
              )
            })}
          </div>
        </div>

        {/* Pattern rows */}
        {patterns.length > 0 && (
          <div className="space-y-2">
            {patterns.map(p => (
              <div key={p.day_of_week}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg border"
                style={{ borderColor: 'rgb(var(--border-default,229 233 240))', background: 'rgb(244 246 250)' }}>
                <span className="text-xs font-semibold w-8 shrink-0" style={{ color: 'rgb(14 124 90)' }}>
                  {DAY_NAMES[p.day_of_week]}
                </span>
                <select className="text-sm px-2 py-1 rounded-lg border bg-white flex-1"
                  style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}
                  value={p.start_time} onChange={e => updateTime(p.day_of_week, e.target.value)}>
                  {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <span className="text-xs opacity-50 shrink-0">{p.duration_min}m</span>
                <button type="button" onClick={() => onPatternsChange(patterns.filter(x => x.day_of_week !== p.day_of_week))}
                  className="ml-auto opacity-40 hover:opacity-80 transition-opacity text-sm leading-none">
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {patterns.length === 0 && (
          <p className="text-xs text-center py-2 opacity-40">Select days above to set class times</p>
        )}
      </div>

      {/* Count hint */}
      <div className="text-xs px-1" style={{ color: countOk ? 'rgb(14 124 90)' : 'rgb(180 83 9)' }}>
        {patterns.length} day{patterns.length !== 1 ? 's' : ''}/week × 4 = {patterns.length * 4} sessions/month
        {countOk ? ' ✓' : ` (target: ~${sessionsPerMonth})`}
      </div>
    </div>
  )
}

/* ─── Dialog ───────────────────────────────────────── */
interface ActivateStudentDialogProps {
  student:      Student
  open:         boolean
  onOpenChange: (v: boolean) => void
}

export function ActivateStudentDialog({ student, open, onOpenChange }: ActivateStudentDialogProps) {
  const activate  = useActivateStudent(student.id)
  const replace   = useReplaceSchedulePatterns()
  const { data: courses  = [] } = useCourses()
  const { data: teachersData }  = useTeachers()
  const teachers = teachersData?.data ?? []

  const [step, setStep] = useState<1 | 2>(1)
  const [step1Values, setStep1Values] = useState<EnrollmentValues | null>(null)
  const [patterns, setPatterns]       = useState<PatternEntry[]>([])
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().split('T')[0])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<any>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(enrollmentSchema) as any,
    defaultValues: {
      course_id:            undefined,
      assigned_teacher_id:  undefined,
      sessions_per_month:   4,
      session_duration_min: 60,
      currency:             'USD',
      monthly_price_minor:  0,
    },
  })

  function handleClose(v: boolean) {
    if (!v) { setStep(1); setStep1Values(null); setPatterns([]); reset() }
    onOpenChange(v)
  }

  function onStep1Next(values: EnrollmentValues) {
    setStep1Values(values)
    setStep(2)
  }

  async function activateAndClose(skipSchedule = false) {
    if (!step1Values) return
    try {
      // User enters monthly price in dollars; DB stores minor units (cents).
      const payload = {
        ...step1Values,
        monthly_price_minor: Math.round(Number(step1Values.monthly_price_minor || 0) * 100),
      }
      await activate.mutateAsync(payload as Record<string, unknown>)

      if (!skipSchedule && patterns.length > 0) {
        await replace.mutateAsync({
          studentId:    student.id as number,
          effectiveDate,
          patterns,
          forceConflicts: false,
        })
      }

      toast.success(`${student.name} is now active.${!skipSchedule && patterns.length > 0 ? ' Schedule saved.' : ''}`)
      handleClose(false)
    } catch (e) {
      if (e instanceof ApiError && e.errors) {
        Object.values(e.errors).flat().forEach((m) => toast.error(String(m)))
      } else {
        toast.error(e instanceof ApiError ? e.message : 'Failed to activate student.')
      }
    }
  }

  const isBusy = activate.isPending || replace.isPending || isSubmitting

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleClose}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className="fixed inset-0 z-50 bg-[rgb(11,31,58)]/40 backdrop-blur-sm
            data-open:animate-in data-open:fade-in-0
            data-closed:animate-out data-closed:fade-out-0 duration-200"
        />
        <DialogPrimitive.Popup
          className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          style={{ outline: 'none' }}
        >
          <div
            className="relative pointer-events-auto w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden
              data-open:animate-in data-open:fade-in-0 data-open:zoom-in-[0.97]
              data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-[0.97] duration-200"
            style={{ background: 'rgb(var(--surface-bg,244 246 250))' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b shrink-0"
              style={{ background: '#fff', borderColor: 'rgb(var(--border-default,229 233 240))' }}>
              <div className="flex items-center justify-center w-9 h-9 rounded-xl"
                style={{ background: 'rgb(14 124 90 / 0.1)' }}>
                {step === 1
                  ? <PlayCircle size={16} style={{ color: 'rgb(14 124 90)' }} />
                  : <CalendarDays size={16} style={{ color: 'rgb(14 124 90)' }} />}
              </div>
              <div className="flex-1">
                <DialogPrimitive.Title className="font-semibold text-[rgb(11,31,58)] leading-none">
                  {step === 1 ? `Activate ${student.name}` : 'Set Weekly Timetable'}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-xs mt-0.5" style={{ color: 'rgb(90 100 112)' }}>
                  {step === 1
                    ? 'Step 1 of 2 — enrollment & pricing'
                    : 'Step 2 of 2 — recurring class schedule'}
                </DialogPrimitive.Description>
              </div>
              <StepDots step={step} />
              <DialogPrimitive.Close
                className="ml-2 p-1.5 rounded-lg hover:bg-black/5 transition-colors opacity-50 hover:opacity-100"
                aria-label="Close">
                <X size={16} />
              </DialogPrimitive.Close>
            </div>

            {/* ── Step 1: Enrollment form ── */}
            {step === 1 && (
              <>
                <form id="activate-step1" onSubmit={handleSubmit(onStep1Next)}
                  className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

                  <Section title="Enrollment">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Course">
                        <Controller name="course_id" control={control} render={({ field }) => (
                          <EntityCombobox
                            items={courses.map((c) => ({ id: c.id, name: c.name }))}
                            value={field.value as number | undefined}
                            onChange={field.onChange}
                            placeholder="Select course…"
                            noneLabel="No course"
                          />
                        )} />
                      </Field>

                      <Field label="Teacher">
                        <Controller name="assigned_teacher_id" control={control} render={({ field }) => (
                          <EntityCombobox
                            items={teachers.map((t) => ({ id: t.id, name: t.name ?? `Teacher #${t.id}` }))}
                            value={field.value as number | undefined}
                            onChange={field.onChange}
                            placeholder="Assign teacher…"
                            noneLabel="Assign later"
                          />
                        )} />
                      </Field>

                      <Field label="Sessions / month" required error={errors.sessions_per_month}>
                        <input type="number" min="1" className={inp} style={inpStyle} {...register('sessions_per_month')} />
                      </Field>

                      <Field label="Session duration" required error={errors.session_duration_min}>
                        <Controller name="session_duration_min" control={control} render={({ field }) => (
                          <Select value={String(field.value ?? 60)} onValueChange={(v) => field.onChange(Number(v))}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {DURATIONS.map((d) => <SelectItem key={d} value={String(d)}>{d} minutes</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )} />
                      </Field>
                    </div>
                  </Section>

                  <Section title="Pricing">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Currency" required error={errors.currency}>
                        <Controller name="currency" control={control} render={({ field }) => (
                          <Select value={field.value ?? 'USD'} onValueChange={field.onChange}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )} />
                      </Field>
                      <Field label="Monthly price" error={errors.monthly_price_minor}>
                        <input type="number" min="0" className={inp} style={inpStyle} {...register('monthly_price_minor')} />
                      </Field>
                    </div>
                  </Section>

                  <Section title="Note">
                    <Field label="Activation note">
                      <textarea rows={2} className={inp} style={inpStyle} placeholder="Optional…" {...register('note')} />
                    </Field>
                  </Section>
                </form>

                <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t"
                  style={{ background: '#fff', borderColor: 'rgb(var(--border-default,229 233 240))' }}>
                  <DialogPrimitive.Close
                    className="px-4 py-2 rounded-lg text-sm font-medium border hover:bg-black/5 transition-colors"
                    style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
                    Cancel
                  </DialogPrimitive.Close>
                  <button type="submit" form="activate-step1"
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: 'rgb(14 124 90)' }}>
                    Next
                    <ChevronRight size={14} />
                  </button>
                </div>
              </>
            )}

            {/* ── Step 2: Timetable ── */}
            {step === 2 && step1Values && (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  <TimetableStep
                    sessionsPerMonth={step1Values.sessions_per_month}
                    sessionDurationMin={step1Values.session_duration_min}
                    patterns={patterns}
                    effectiveDate={effectiveDate}
                    onPatternsChange={setPatterns}
                    onEffectiveDateChange={setEffectiveDate}
                  />
                </div>

                <div className="shrink-0 flex items-center gap-3 px-6 py-4 border-t"
                  style={{ background: '#fff', borderColor: 'rgb(var(--border-default,229 233 240))' }}>
                  <button onClick={() => setStep(1)} disabled={isBusy}
                    className="px-4 py-2 rounded-lg text-sm font-medium border hover:bg-black/5 transition-colors disabled:opacity-50"
                    style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
                    ← Back
                  </button>
                  <div className="flex-1" />
                  <button onClick={() => activateAndClose(true)} disabled={isBusy}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border hover:bg-black/5 transition-colors disabled:opacity-50"
                    style={{ borderColor: 'rgb(var(--border-default,229 233 240))', color: 'rgb(90 100 112)' }}>
                    <SkipForward size={13} />
                    Set later
                  </button>
                  <button onClick={() => activateAndClose(false)} disabled={isBusy || patterns.length === 0}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60 transition-opacity hover:opacity-90"
                    style={{ background: 'rgb(14 124 90)' }}>
                    <PlayCircle size={14} />
                    {isBusy ? 'Activating…' : 'Activate & Set Schedule'}
                  </button>
                </div>
              </>
            )}
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/* ─── Helpers ──────────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4 space-y-3"
      style={{ background: '#fff', border: '1px solid rgb(var(--border-default,229 233 240))' }}>
      <p className="text-[11px] font-semibold uppercase tracking-widest opacity-40">{title}</p>
      {children}
    </div>
  )
}

function Field({ label, required, error, children }: {
  label: string
  required?: boolean
  error?: { message?: string }
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5 opacity-70">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error?.message && <p className="text-red-500 text-[11px] mt-1">{String(error.message)}</p>}
    </div>
  )
}
