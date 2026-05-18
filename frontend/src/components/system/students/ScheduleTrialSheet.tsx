'use client'
import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { CalendarDays, ChevronDown, Search, X } from 'lucide-react'
import { useCreateSession } from '@/hooks/system/useSessions'
import { useTeachers } from '@/hooks/system/useTeachers'
import { ApiError } from '@/lib/system/api'
import type { StudentDetail } from '@/types/system/student'

interface Props {
  student: StudentDetail
  open: boolean
  onClose: () => void
}

const DURATIONS = [30, 45, 60]

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, '0')
  const m = i % 2 === 0 ? '00' : '30'
  return `${h}:${m}`
})

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
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] transition-shadow text-left"
        style={{ borderColor: 'rgb(var(--border-default,229 233 240))', background: '#fff' }}>
        <span className="flex-1 truncate" style={!selected ? { color: 'rgb(156 163 175)' } : { color: 'rgb(11 31 58)' }}>
          {selected ? selected.name : 'Select teacher…'}
        </span>
        <ChevronDown size={13} className="opacity-40 shrink-0" />
      </button>
      {open && (
        <div className="absolute z-[200] w-full mt-1 rounded-xl border shadow-xl overflow-hidden"
          style={{ background: '#fff', borderColor: 'rgb(var(--border-default,229 233 240))' }}>
          <div className="flex items-center gap-2 px-3 py-2 border-b"
            style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
            <Search size={13} className="opacity-40 shrink-0" />
            <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search…" className="flex-1 bg-transparent text-sm outline-none" />
          </div>
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 && <li className="px-3 py-2 text-sm opacity-40">No results</li>}
            {filtered.map(item => (
              <li key={item.id}
                onMouseDown={e => { e.preventDefault(); onChange(item.id); setOpen(false) }}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors"
                style={item.id === value ? { background: 'rgb(14 124 90 / 0.08)', color: 'rgb(14 124 90)', fontWeight: 500 } : { color: 'rgb(11 31 58)' }}>
                {item.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

const inp = 'w-full px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] transition-shadow'
const inpStyle = { borderColor: 'rgb(var(--border-default,229 233 240))', background: '#fff' }

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-medium mb-1.5 opacity-70">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

/* ─── Default datetime: today + nearest future half-hour ─ */
function defaultDatetime() {
  const now = new Date()
  now.setMinutes(now.getMinutes() >= 30 ? 60 : 30, 0, 0)
  return now.toISOString().slice(0, 16)
}

export function ScheduleTrialSheet({ student, open, onClose }: Props) {
  const { data: teachersData } = useTeachers()
  const teachers = (teachersData?.data ?? []).map(t => ({ id: t.id, name: t.name ?? `Teacher #${t.id}` }))

  const [teacherId,   setTeacherId]   = useState<number | undefined>(student.assigned_teacher?.id)
  const [date,        setDate]        = useState(() => new Date().toISOString().split('T')[0])
  const [time,        setTime]        = useState('18:00')
  const [duration,    setDuration]    = useState(student.session_duration_min ?? 60)

  const create = useCreateSession()

  useEffect(() => {
    if (open) {
      setTeacherId(student.assigned_teacher?.id)
      setDuration(student.session_duration_min ?? 60)
      const now = new Date()
      setDate(now.toISOString().split('T')[0])
      setTime(now.getMinutes() >= 30 ? `${String(now.getHours() + 1).padStart(2, '0')}:00` : `${String(now.getHours()).padStart(2, '0')}:30`)
    }
  }, [open, student.assigned_teacher?.id, student.session_duration_min])

  if (!open) return null

  async function handleSave() {
    if (!teacherId) { toast.error('Please select a teacher.'); return }

    const scheduledStart = new Date(`${date}T${time}:00`).toISOString()

    try {
      await create.mutateAsync({
        student_id:      student.id,
        teacher_id:      teacherId,
        scheduled_start: scheduledStart,
        duration_min:    duration,
      })
      toast.success('Trial class scheduled.')
      onClose()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to schedule session.')
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-[rgb(11,31,58)]/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm flex flex-col shadow-2xl"
        style={{ background: 'rgb(var(--surface-bg,244 246 250))', borderLeft: '1px solid rgb(var(--border-default,229 233 240))' }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b shrink-0"
          style={{ background: '#fff', borderColor: 'rgb(var(--border-default,229 233 240))' }}>
          <div className="flex items-center justify-center w-9 h-9 rounded-xl"
            style={{ background: 'rgb(14 124 90 / 0.1)' }}>
            <CalendarDays size={16} style={{ color: 'rgb(14 124 90)' }} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'rgb(11 31 58)' }}>Schedule Trial Class</p>
            <p className="text-xs" style={{ color: 'rgb(90 100 112)' }}>{student.name}</p>
          </div>
          <button onClick={onClose}
            className="ml-auto p-1.5 rounded-lg hover:bg-black/5 transition-colors opacity-50 hover:opacity-100">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="rounded-2xl p-4 space-y-4"
            style={{ background: '#fff', border: '1px solid rgb(var(--border-default,229 233 240))' }}>

            <div>
              <Label required>Teacher</Label>
              <TeacherCombobox items={teachers} value={teacherId} onChange={setTeacherId} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label required>Date</Label>
                <input type="date" className={inp} style={inpStyle}
                  value={date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <Label required>Time</Label>
                <select className={inp} style={inpStyle}
                  value={time} onChange={e => setTime(e.target.value)}>
                  {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <Label required>Duration</Label>
              <div className="flex gap-2">
                {DURATIONS.map(d => (
                  <button key={d} type="button" onClick={() => setDuration(d)}
                    className="flex-1 py-2 rounded-xl text-sm font-medium border transition-colors"
                    style={duration === d
                      ? { background: 'rgb(14 124 90)', color: '#fff', borderColor: 'rgb(14 124 90)' }
                      : { background: '#fff', borderColor: 'rgb(var(--border-default,229 233 240))', color: 'rgb(11 31 58)' }}>
                    {d}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          {teacherId && (
            <div className="rounded-xl px-4 py-3 text-sm"
              style={{ background: 'rgb(14 124 90 / 0.06)', border: '1px solid rgb(14 124 90 / 0.15)' }}>
              <p className="font-medium" style={{ color: 'rgb(14 124 90)' }}>Session summary</p>
              <p className="mt-1 opacity-80" style={{ color: 'rgb(11 31 58)' }}>
                {new Date(`${date}T${time}`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
                {' at '}{time} · {duration} min
              </p>
              <p className="opacity-60 text-xs mt-0.5" style={{ color: 'rgb(11 31 58)' }}>
                with {teachers.find(t => t.id === teacherId)?.name}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-end gap-3 px-5 py-4 border-t"
          style={{ background: '#fff', borderColor: 'rgb(var(--border-default,229 233 240))' }}>
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium border hover:bg-black/5 transition-colors"
            style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={create.isPending || !teacherId}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity hover:opacity-90"
            style={{ background: 'rgb(14 124 90)' }}>
            <CalendarDays size={14} />
            {create.isPending ? 'Scheduling…' : 'Schedule Trial'}
          </button>
        </div>
      </div>
    </>
  )
}
