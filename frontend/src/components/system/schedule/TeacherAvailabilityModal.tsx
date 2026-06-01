'use client'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, Search, Clock, CheckCircle2, XCircle, Sparkles, GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '@/lib/system/api'

type Slot = { day_of_week: number; start_time: string; end_time: string; timezone: string }
type OverviewSession = {
  id: number
  scheduled_start: string
  scheduled_end: string
  status: string
  is_trial: boolean
  student: { id: number; name: string; status: string } | null
}
type OverviewTeacher = {
  id: number
  name: string | null
  email: string | null
  availability: Slot[]
  sessions: OverviewSession[]
}
type OverviewResponse = {
  data: OverviewTeacher[]
  range: { from: string; to: string }
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function toYmd(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function startOfWeek(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  x.setDate(x.getDate() - x.getDay()) // Sunday
  return x
}

function addDays(d: Date, n: number) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function timeToMinutes(t: string): number {
  // accepts "HH:mm" or "HH:mm:ss"
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function isSlotCoveringTime(slot: Slot, day: number, minute: number): boolean {
  if (slot.day_of_week !== day) return false
  return timeToMinutes(slot.start_time) <= minute && timeToMinutes(slot.end_time) > minute
}

function sessionsOnDay(sessions: OverviewSession[], dayStart: Date): OverviewSession[] {
  const dayEnd = addDays(dayStart, 1)
  return sessions
    .filter(s => {
      const t = new Date(s.scheduled_start)
      return t >= dayStart && t < dayEnd
    })
    .sort((a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime())
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function fmtClock(t: string) {
  // "HH:mm:ss" -> "h:mm AM/PM"
  const [hh, mm] = t.split(':').map(Number)
  const period = hh >= 12 ? 'PM' : 'AM'
  const h = hh % 12 || 12
  return `${h}:${String(mm).padStart(2, '0')} ${period}`
}

export function TeacherAvailabilityModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()))
  const [search, setSearch] = useState('')
  const [filterDate, setFilterDate] = useState<string>('') // YYYY-MM-DD
  const [filterTime, setFilterTime] = useState<string>('') // HH:mm

  const from = toYmd(weekStart)
  const to = toYmd(addDays(weekStart, 6))

  const { data, isLoading } = useQuery({
    queryKey: ['system', 'teachers', 'availability-overview', from, to],
    queryFn: () => api<OverviewResponse>(`/teachers/availability-overview?from=${from}&to=${to}`),
    enabled: open,
  })

  const teachers = data?.data ?? []

  // Filter: search + (date+time availability filter)
  const filtered = useMemo(() => {
    let list = teachers
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t => (t.name ?? '').toLowerCase().includes(q) || (t.email ?? '').toLowerCase().includes(q))
    }
    if (filterDate && filterTime) {
      const day = new Date(filterDate + 'T00:00:00').getDay()
      const minute = timeToMinutes(filterTime)
      const checkStart = new Date(`${filterDate}T${filterTime}:00`)
      list = list.filter(t => {
        const covers = t.availability.some(s => isSlotCoveringTime(s, day, minute))
        if (!covers) return false
        const conflict = t.sessions.some(s => {
          const ss = new Date(s.scheduled_start)
          const se = new Date(s.scheduled_end)
          return ss <= checkStart && se > checkStart
        })
        return !conflict
      })
    }
    return list
  }, [teachers, search, filterDate, filterTime])

  if (!open) return null

  const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${addDays(weekStart, 6).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="ml-auto h-full w-full max-w-5xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between shrink-0"
          style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'rgb(11 31 58)' }}>
              <Sparkles size={18} style={{ color: 'rgb(30 90 171)' }} />
              Teacher Availabilities
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgb(90 100 112)' }}>
              See who's free this week — perfect for placing trial sessions.
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        {/* Controls */}
        <div className="px-5 py-3 border-b shrink-0 space-y-2" style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setWeekStart(addDays(weekStart, -7))}
              className="p-1.5 rounded-lg border hover:bg-gray-50"
              style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}
              title="Previous week"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-sm font-semibold" style={{ color: 'rgb(11 31 58)' }}>{weekLabel}</span>
            <button
              onClick={() => setWeekStart(addDays(weekStart, 7))}
              className="p-1.5 rounded-lg border hover:bg-gray-50"
              style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}
              title="Next week"
            >
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => setWeekStart(startOfWeek(new Date()))}
              className="px-2.5 py-1 rounded-lg border text-xs hover:bg-gray-50"
              style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}
            >
              This week
            </button>

            <div className="relative ml-auto min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search teacher…"
                className="w-full rounded-lg border bg-white pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}
              />
            </div>
          </div>

          {/* Availability filter */}
          <div className="flex items-center gap-2 flex-wrap p-2 rounded-lg" style={{ background: 'rgb(248 250 252)' }}>
            <Clock size={14} style={{ color: 'rgb(30 90 171)' }} />
            <span className="text-xs font-semibold" style={{ color: 'rgb(11 31 58)' }}>Who's free at:</span>
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="px-2 py-1 rounded-md border text-xs bg-white"
              style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}
            />
            <input
              type="time"
              value={filterTime}
              onChange={e => setFilterTime(e.target.value)}
              className="px-2 py-1 rounded-md border text-xs bg-white"
              style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}
            />
            {(filterDate || filterTime) && (
              <button
                onClick={() => { setFilterDate(''); setFilterTime('') }}
                className="text-xs text-emerald-600 hover:underline"
              >
                Clear
              </button>
            )}
            {filterDate && filterTime && (
              <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgb(220 252 231)', color: 'rgb(21 128 61)' }}>
                {filtered.length} teacher{filtered.length === 1 ? '' : 's'} available
              </span>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 flex-wrap text-[11px]" style={{ color: 'rgb(90 100 112)' }}>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ background: 'rgb(220 252 231)', border: '1px solid rgb(187 247 208)' }} />
              Available
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ background: 'rgb(254 243 199)', border: '1px solid rgb(252 211 77)' }} />
              Trial session
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ background: 'rgb(219 234 254)', border: '1px solid rgb(147 197 253)' }} />
              Actual session
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-5">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-gray-400">
              <Clock size={20} className="animate-pulse" />
              <p className="text-sm">Loading availability…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-2 text-gray-400">
              <XCircle size={22} />
              <p className="text-sm font-medium">No teachers match these filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(t => (
                <TeacherRow key={t.id} teacher={t} weekStart={weekStart} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TeacherRow({ teacher, weekStart }: { teacher: OverviewTeacher; weekStart: Date }) {
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  )

  // Group availability by day
  const availByDay = useMemo(() => {
    const map = new Map<number, Slot[]>()
    for (const s of teacher.availability) {
      const arr = map.get(s.day_of_week) ?? []
      arr.push(s)
      map.set(s.day_of_week, arr)
    }
    return map
  }, [teacher.availability])

  const totalSessions = teacher.sessions.length
  const trialCount = teacher.sessions.filter(s => s.is_trial).length

  return (
    <div className="rounded-xl border bg-white overflow-hidden"
      style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
      {/* Teacher header */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-2 border-b"
        style={{ borderColor: 'rgb(var(--border-default,229 233 240))', background: 'rgb(248 250 252)' }}>
        <div className="flex items-center gap-2 min-w-0">
          <GraduationCap size={14} style={{ color: 'rgb(30 90 171)' }} />
          <p className="text-sm font-semibold truncate" style={{ color: 'rgb(11 31 58)' }}>
            {teacher.name ?? 'Unnamed teacher'}
          </p>
          {teacher.availability.length === 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
              style={{ background: 'rgb(254 226 226)', color: 'rgb(153 27 27)' }}>
              No availability set
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px]" style={{ color: 'rgb(90 100 112)' }}>
          <span>{totalSessions} session{totalSessions === 1 ? '' : 's'}</span>
          {trialCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full font-semibold"
              style={{ background: 'rgb(254 243 199)', color: 'rgb(146 64 14)' }}>
              {trialCount} trial
            </span>
          )}
        </div>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7 divide-x" style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
        {days.map((d, i) => {
          const slots = availByDay.get(i) ?? []
          const sess = sessionsOnDay(teacher.sessions, d)
          const isToday = toYmd(d) === toYmd(new Date())
          return (
            <div key={i} className="p-2 min-h-[120px]"
              style={{ background: isToday ? 'rgb(240 249 255)' : '#fff' }}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'rgb(90 100 112)' }}>
                  {DAYS[i]}
                </p>
                <p className="text-[10px]" style={{ color: 'rgb(120 130 140)' }}>
                  {d.getDate()}
                </p>
              </div>

              {/* Availability slots */}
              <div className="space-y-1 mb-1.5">
                {slots.length === 0 ? (
                  <div className="text-[10px] italic" style={{ color: 'rgb(160 170 180)' }}>—</div>
                ) : (
                  slots.map((s, idx) => (
                    <div key={idx}
                      className="text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center gap-1"
                      style={{ background: 'rgb(220 252 231)', color: 'rgb(21 128 61)', border: '1px solid rgb(187 247 208)' }}
                      title={`Available ${fmtClock(s.start_time)} – ${fmtClock(s.end_time)} (${s.timezone})`}>
                      <CheckCircle2 size={9} />
                      {fmtClock(s.start_time)}–{fmtClock(s.end_time)}
                    </div>
                  ))
                )}
              </div>

              {/* Sessions overlay */}
              {sess.length > 0 && (
                <div className="space-y-1 pt-1.5 border-t"
                  style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
                  {sess.map(s => (
                    <div key={s.id}
                      className="text-[10px] px-1.5 py-0.5 rounded font-medium truncate"
                      title={`${s.is_trial ? 'Trial' : 'Session'} · ${s.student?.name ?? ''} · ${fmtTime(s.scheduled_start)}–${fmtTime(s.scheduled_end)} (${s.status})`}
                      style={
                        s.is_trial
                          ? { background: 'rgb(254 243 199)', color: 'rgb(146 64 14)', border: '1px solid rgb(252 211 77)' }
                          : { background: 'rgb(219 234 254)', color: 'rgb(30 64 175)', border: '1px solid rgb(147 197 253)' }
                      }>
                      {s.is_trial ? '★ ' : ''}{fmtTime(s.scheduled_start)} {s.student?.name ?? ''}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
