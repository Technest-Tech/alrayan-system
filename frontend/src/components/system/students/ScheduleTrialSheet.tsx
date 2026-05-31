'use client'
import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { CalendarDays, ChevronDown, Search, X, Clock, User, Users, CheckCircle2, AlertTriangle, Loader2, AlertCircle } from 'lucide-react'
import { useCreateSession, useCheckTeacherAvailability } from '@/hooks/system/useSessions'
import { useTeachers } from '@/hooks/system/useTeachers'
import { ApiError } from '@/lib/system/api'
import type { StudentDetail } from '@/types/system/student'

interface Props {
  student: StudentDetail
  open: boolean
  onClose: () => void
}

const DURATIONS = [30, 45, 60]
const HOURS_12  = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
const MINUTES   = [0, 30]

function to24(h12: number, min: number, period: 'AM' | 'PM') {
  let h = h12
  if (period === 'AM' && h === 12) h = 0
  if (period === 'PM' && h !== 12) h += 12
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

function from24(time24: string): { h12: number; min: number; period: 'AM' | 'PM' } {
  const [hStr, mStr] = time24.split(':')
  const h24 = parseInt(hStr, 10)
  const min = parseInt(mStr, 10)
  const period: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM'
  let h12 = h24 % 12
  if (h12 === 0) h12 = 12
  return { h12, min, period }
}

function formatDisplay(h12: number, min: number, period: 'AM' | 'PM') {
  return `${h12}:${String(min).padStart(2, '0')} ${period}`
}

/* ─── Teacher combobox ────────────────────────────── */
function TeacherCombobox({ items, value, onChange }: {
  items:    { id: number; name: string }[]
  value:    number | undefined
  onChange: (id: number | undefined) => void
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
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] transition-shadow text-left"
        style={{ borderColor: value ? 'rgb(14 124 90 / 0.4)' : 'rgb(var(--border-default,229 233 240))', background: '#fff' }}>
        <User size={14} className="shrink-0" style={{ color: value ? 'rgb(14 124 90)' : 'rgb(156 163 175)' }} />
        <span className="flex-1 truncate" style={!selected ? { color: 'rgb(156 163 175)' } : { color: 'rgb(11 31 58)', fontWeight: 500 }}>
          {selected ? selected.name : 'Select teacher…'}
        </span>
        <ChevronDown size={13} className="opacity-40 shrink-0" />
      </button>
      {open && (
        <div className="absolute z-[300] w-full mt-1.5 rounded-xl border shadow-2xl overflow-hidden"
          style={{ background: '#fff', borderColor: 'rgb(var(--border-default,229 233 240))' }}>
          <div className="flex items-center gap-2 px-3 py-2.5 border-b"
            style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
            <Search size={13} className="opacity-40 shrink-0" />
            <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search teacher…" className="flex-1 bg-transparent text-sm outline-none" />
          </div>
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 && <li className="px-3 py-2 text-sm opacity-40">No results</li>}
            {filtered.map(item => (
              <li key={item.id}
                onMouseDown={e => { e.preventDefault(); onChange(item.id); setOpen(false) }}
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm cursor-pointer hover:bg-gray-50 transition-colors"
                style={item.id === value ? { background: 'rgb(14 124 90 / 0.08)', color: 'rgb(14 124 90)', fontWeight: 500 } : { color: 'rgb(11 31 58)' }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                  style={{ background: 'rgb(14 124 90 / 0.1)', color: 'rgb(14 124 90)' }}>
                  {item.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                {item.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* ─── Time picker ─────────────────────────────────── */
function TimePicker({ hour, minute, period, onHourChange, onMinuteChange, onPeriodChange }: {
  hour:           number
  minute:         number
  period:         'AM' | 'PM'
  onHourChange:   (h: number) => void
  onMinuteChange: (m: number) => void
  onPeriodChange: (p: 'AM' | 'PM') => void
}) {
  return (
    <div className="flex items-center gap-1.5 p-1 rounded-xl border"
      style={{ borderColor: 'rgb(var(--border-default,229 233 240))', background: '#fff' }}>
      {/* Hours */}
      <select
        value={hour}
        onChange={e => onHourChange(Number(e.target.value))}
        className="flex-1 py-1.5 text-center text-sm font-medium bg-transparent outline-none cursor-pointer rounded-lg hover:bg-gray-50 transition-colors"
        style={{ color: 'rgb(11 31 58)' }}>
        {HOURS_12.map(h => (
          <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
        ))}
      </select>
      <span className="text-lg font-bold opacity-30 select-none">:</span>
      {/* Minutes */}
      <select
        value={minute}
        onChange={e => onMinuteChange(Number(e.target.value))}
        className="flex-1 py-1.5 text-center text-sm font-medium bg-transparent outline-none cursor-pointer rounded-lg hover:bg-gray-50 transition-colors"
        style={{ color: 'rgb(11 31 58)' }}>
        {MINUTES.map(m => (
          <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
        ))}
      </select>
      {/* AM/PM toggle */}
      <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
        {(['AM', 'PM'] as const).map(p => (
          <button key={p} type="button" onClick={() => onPeriodChange(p)}
            className="px-2.5 py-1.5 text-xs font-semibold transition-all"
            style={period === p
              ? { background: 'rgb(14 124 90)', color: '#fff' }
              : { background: '#fff', color: 'rgb(90 100 112)' }}>
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'rgb(90 100 112)' }}>
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

export function ScheduleTrialSheet({ student, open, onClose }: Props) {
  const { data: teachersData } = useTeachers()
  const teachers = (teachersData?.data ?? []).map(t => ({ id: t.id, name: t.name ?? `Teacher #${t.id}` }))

  const [teacherId,        setTeacherId]        = useState<number | undefined>(student.assigned_teacher?.id)
  const [date,             setDate]             = useState(() => new Date().toISOString().split('T')[0])
  const [hour,             setHour]             = useState(6)
  const [minute,           setMinute]           = useState(0)
  const [period,           setPeriod]           = useState<'AM' | 'PM'>('PM')
  const [duration,         setDuration]         = useState(student.session_duration_min ?? 60)
  const [includedSiblings, setIncludedSiblings] = useState<Set<number>>(new Set())

  const create = useCreateSession()

  function toggleSibling(id: number) {
    setIncludedSiblings(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  useEffect(() => {
    if (open) {
      setTeacherId(student.assigned_teacher?.id)
      setDuration(student.session_duration_min ?? 60)
      setIncludedSiblings(new Set())
      const now = new Date()
      setDate(now.toISOString().split('T')[0])
      const nearestHalf = now.getMinutes() < 30 ? 30 : 0
      const nextHour    = now.getMinutes() < 30 ? now.getHours() : now.getHours() + 1
      const clamped     = nextHour % 24
      const { h12, min, period: p } = from24(`${String(clamped).padStart(2,'0')}:${String(nearestHalf).padStart(2,'0')}`)
      setHour(h12); setMinute(min); setPeriod(p)
    }
  }, [open, student.assigned_teacher?.id, student.session_duration_min])

  // Debounced availability check params — update 700ms after user stops changing inputs
  const [availParams, setAvailParams] = useState<{
    teacher_id: number; scheduled_start: string; duration_min: number
  } | null>(null)

  const time24 = to24(hour, minute, period)
  const selectedTeacher = teachers.find(t => t.id === teacherId)

  useEffect(() => {
    if (!teacherId || !date) { setAvailParams(null); return }
    const t = setTimeout(() => {
      const iso = new Date(`${date}T${time24}:00`).toISOString()
      if (isNaN(new Date(iso).getTime())) { setAvailParams(null); return }
      setAvailParams({ teacher_id: teacherId, scheduled_start: iso, duration_min: duration })
    }, 700)
    return () => clearTimeout(t)
  }, [teacherId, date, time24, duration])

  const availability = useCheckTeacherAvailability(availParams)
  const isChecking   = availability.isFetching
  const hasConflicts = availability.data && !availability.data.available
  const isAvailable  = availability.data?.available === true && !isChecking

  if (!open) return null

  async function handleSave() {
    if (!teacherId) { toast.error('Please select a teacher.'); return }

    const scheduledStart = new Date(`${date}T${time24}:00`).toISOString()

    try {
      await create.mutateAsync({
        student_id:      student.id,
        teacher_id:      teacherId,
        scheduled_start: scheduledStart,
        duration_min:    duration,
      })
      for (const sibId of includedSiblings) {
        await create.mutateAsync({
          student_id:      sibId,
          teacher_id:      teacherId,
          scheduled_start: scheduledStart,
          duration_min:    duration,
        })
      }
      const total = 1 + includedSiblings.size
      toast.success(total > 1 ? `${total} trial classes scheduled.` : 'Trial class scheduled.')
      onClose()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to schedule session.')
    }
  }

  const summaryDate = new Date(`${date}T${time24}`)
  const isValidDate = !isNaN(summaryDate.getTime())

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[rgb(11,31,58)]/50 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ background: 'rgb(244 246 250)', border: '1px solid rgb(var(--border-default,229 233 240))' }}>

        {/* Accent strip */}
        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, rgb(14 124 90), rgb(30 90 171))' }} />

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 shrink-0"
          style={{ background: '#fff', borderBottom: '1px solid rgb(var(--border-default,229 233 240))' }}>
          <div className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
            style={{ background: 'rgb(14 124 90 / 0.1)' }}>
            <CalendarDays size={16} style={{ color: 'rgb(14 124 90)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight" style={{ color: 'rgb(11 31 58)' }}>Schedule Trial Class</p>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'rgb(90 100 112)' }}>{student.name}</p>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/5 transition-colors opacity-40 hover:opacity-70 shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">

          {/* Teacher */}
          <div className="rounded-2xl p-4 space-y-4"
            style={{ background: '#fff', border: '1px solid rgb(var(--border-default,229 233 240))' }}>
            <div>
              <Label required>Teacher</Label>
              <TeacherCombobox items={teachers} value={teacherId} onChange={setTeacherId} />
            </div>
          </div>

          {/* Date & Time */}
          <div className="rounded-2xl p-4 space-y-4"
            style={{ background: '#fff', border: '1px solid rgb(var(--border-default,229 233 240))' }}>
            <div>
              <Label required>Date</Label>
              <div className="relative">
                <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" />
                <input
                  type="date"
                  value={date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setDate(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] transition-shadow"
                  style={{ borderColor: 'rgb(var(--border-default,229 233 240))', background: '#fff', color: 'rgb(11 31 58)' }}
                />
              </div>
            </div>

            <div>
              <Label required>Time</Label>
              <div className="relative">
                <TimePicker
                  hour={hour} minute={minute} period={period}
                  onHourChange={setHour}
                  onMinuteChange={setMinute}
                  onPeriodChange={setPeriod}
                />
              </div>
            </div>
          </div>

          {/* Duration */}
          <div className="rounded-2xl p-4 space-y-3"
            style={{ background: '#fff', border: '1px solid rgb(var(--border-default,229 233 240))' }}>
            <Label required>Duration</Label>
            <div className="flex gap-2">
              {DURATIONS.map(d => (
                <button key={d} type="button" onClick={() => setDuration(d)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all"
                  style={duration === d
                    ? { background: 'rgb(14 124 90)', color: '#fff', borderColor: 'rgb(14 124 90)', boxShadow: '0 2px 8px rgb(14 124 90 / 0.25)' }
                    : { background: '#fff', borderColor: 'rgb(var(--border-default,229 233 240))', color: 'rgb(90 100 112)' }}>
                  {d} min
                </button>
              ))}
            </div>
          </div>

          {/* Availability status */}
          {teacherId && isValidDate && (
            <div className="rounded-xl px-4 py-3 space-y-2 transition-all"
              style={
                isChecking   ? { background: 'rgb(244 246 250)',        border: '1px solid rgb(var(--border-default,229 233 240))' }
              : hasConflicts ? { background: 'rgb(254 243 199)',        border: '1px solid rgb(251 191 36 / 0.5)' }
              : isAvailable  ? { background: 'rgb(14 124 90 / 0.06)',   border: '1px solid rgb(14 124 90 / 0.2)' }
              :                { background: 'rgb(244 246 250)',        border: '1px solid rgb(var(--border-default,229 233 240))' }
              }>

              {/* Status row */}
              <div className="flex items-center gap-2">
                {isChecking ? (
                  <><Loader2 size={14} className="animate-spin opacity-50 shrink-0" />
                  <span className="text-xs font-medium opacity-60">Checking availability…</span></>
                ) : isAvailable ? (
                  <><CheckCircle2 size={14} className="shrink-0" style={{ color: 'rgb(14 124 90)' }} />
                  <span className="text-xs font-semibold" style={{ color: 'rgb(14 124 90)' }}>Teacher is available</span></>
                ) : hasConflicts ? (
                  <><AlertTriangle size={14} className="shrink-0 text-amber-600" />
                  <span className="text-xs font-semibold text-amber-700">Scheduling conflict detected</span></>
                ) : (
                  <><Clock size={14} className="opacity-30 shrink-0" />
                  <span className="text-xs opacity-40">Availability will be checked…</span></>
                )}
              </div>

              {/* Conflict details */}
              {hasConflicts && availability.data && (
                <ul className="space-y-1.5 pt-0.5">
                  {availability.data.conflicts.map((c, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertCircle size={12} className="shrink-0 mt-0.5 text-amber-600" />
                      <span className="text-xs text-amber-800">
                        {c.type === 'teacher_double_booking' && (
                          c.related?.student
                            ? <>Already booked with <strong>{c.related.student.name}</strong>{c.related.scheduled_start ? ` at ${new Date(c.related.scheduled_start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}` : ''}</>
                            : 'Already has a session at this time'
                        )}
                        {c.type === 'teacher_on_leave' && (
                          c.related?.start_date
                            ? <>On approved leave ({c.related.start_date} – {c.related.end_date})</>
                            : 'Teacher is on approved leave'
                        )}
                        {c.type === 'teacher_unavailable' && 'Outside teacher\'s available hours'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Session summary line */}
              {(isAvailable || hasConflicts) && (
                <div className="flex items-center gap-1.5 pt-0.5 border-t" style={{ borderColor: isAvailable ? 'rgb(14 124 90 / 0.12)' : 'rgb(251 191 36 / 0.3)' }}>
                  <Clock size={11} className={isAvailable ? 'opacity-50' : 'text-amber-600 opacity-70'} />
                  <p className="text-xs" style={{ color: isAvailable ? 'rgb(90 100 112)' : 'rgb(146 64 14)' }}>
                    {new Date(`${date}T${time24}`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {' · '}{formatDisplay(hour, minute, period)} · {duration} min · with {selectedTeacher?.name}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Siblings */}
          {student.student_type === 'child' && student.siblings.length > 0 && (
            <div className="rounded-2xl p-4 space-y-3"
              style={{ background: '#fff', border: '1px solid rgb(var(--border-default,229 233 240))' }}>
              <div className="flex items-center gap-2">
                <Users size={13} className="opacity-40" />
                <p className="text-[11px] font-semibold uppercase tracking-wide opacity-40">Also schedule for siblings?</p>
              </div>
              {student.siblings.map(sib => (
                <label key={sib.id} className="flex items-center gap-3 cursor-pointer group rounded-xl p-2.5 transition-colors hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={includedSiblings.has(sib.id)}
                    onChange={() => toggleSibling(sib.id)}
                    className="w-4 h-4 rounded accent-[rgb(14,124,90)] cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium transition-colors" style={{ color: includedSiblings.has(sib.id) ? 'rgb(14 124 90)' : 'rgb(11 31 58)' }}>
                      {sib.name}
                    </p>
                    {sib.teacher_name && <p className="text-xs opacity-50">{sib.teacher_name}</p>}
                  </div>
                  {includedSiblings.has(sib.id) && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: 'rgb(14 124 90 / 0.1)', color: 'rgb(14 124 90)' }}>
                      Same slot
                    </span>
                  )}
                </label>
              ))}
              {includedSiblings.size > 0 && (
                <p className="text-[11px] opacity-40 px-1">Same teacher, date &amp; time used for all selected siblings.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-4" style={{ background: '#fff', borderTop: '1px solid rgb(var(--border-default,229 233 240))' }}>
          {hasConflicts && (
            <p className="text-[11px] text-amber-700 mb-3 flex items-center gap-1.5">
              <AlertTriangle size={11} className="shrink-0" />
              Conflict found — you can still schedule, but consider picking another time.
            </p>
          )}
          <div className="flex items-center justify-end gap-3">
            <button onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium border hover:bg-black/5 transition-colors"
              style={{ borderColor: 'rgb(var(--border-default,229 233 240))', color: 'rgb(90 100 112)' }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={create.isPending || !teacherId}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-all hover:opacity-90 hover:shadow-lg"
              style={hasConflicts
                ? { background: 'rgb(180 83 9)', boxShadow: '0 2px 8px rgb(180 83 9 / 0.3)' }
                : { background: 'rgb(14 124 90)', boxShadow: '0 2px 8px rgb(14 124 90 / 0.3)' }}>
              <CalendarDays size={14} />
              {create.isPending
                ? 'Scheduling…'
                : hasConflicts
                  ? `Schedule Anyway`
                  : includedSiblings.size > 0
                    ? `Schedule ${1 + includedSiblings.size} Trials`
                    : 'Schedule Trial'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
