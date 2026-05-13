'use client'
import { useEffect, useRef, useState } from 'react'
import type { Session } from '@/types/system/session'

interface CalendarViewProps {
  sessions: Session[]
  loading?: boolean
  onEventClick?: (session: Session) => void
  onEventDrop?: (session: Session, newStart: Date) => void
  editable?: boolean
  initialView?: 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth'
}

const STATUS_COLORS: Record<string, string> = {
  scheduled:         '#16a34a',
  attended:          '#15803d',
  absent:            '#dc2626',
  cancelled:         '#9ca3af',
  rescheduled:       '#9ca3af',
  pending_substitute:'#f97316',
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

type View = 'day' | 'week' | 'month'

export function CalendarView({
  sessions,
  loading = false,
  onEventClick,
  onEventDrop,
  editable = false,
  initialView = 'timeGridWeek',
}: CalendarViewProps) {
  const [view, setView] = useState<View>(
    initialView === 'timeGridDay' ? 'day' : initialView === 'dayGridMonth' ? 'month' : 'week'
  )
  const [currentDate, setCurrentDate] = useState(new Date())

  const startOfWeek = (d: Date) => {
    const date = new Date(d)
    const day  = date.getDay()
    date.setDate(date.getDate() - day)
    date.setHours(0, 0, 0, 0)
    return date
  }

  const daysInView = () => {
    if (view === 'day') return [new Date(currentDate)]
    if (view === 'week') {
      const start = startOfWeek(currentDate)
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start)
        d.setDate(d.getDate() + i)
        return d
      })
    }
    return []
  }

  const days = daysInView()

  const sessionsForDay = (day: Date) =>
    sessions.filter(s => {
      const sd = new Date(s.scheduled_start)
      return (
        sd.getFullYear() === day.getFullYear() &&
        sd.getMonth() === day.getMonth() &&
        sd.getDate() === day.getDate()
      )
    })

  const navigate = (dir: number) => {
    const d = new Date(currentDate)
    if (view === 'day') d.setDate(d.getDate() + dir)
    else if (view === 'week') d.setDate(d.getDate() + dir * 7)
    else d.setMonth(d.getMonth() + dir)
    setCurrentDate(d)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
        Loading calendar…
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(-1)}
            className="px-2 py-1 text-sm rounded hover:bg-muted"
          >
            ‹
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 text-sm rounded hover:bg-muted"
          >
            Today
          </button>
          <button
            onClick={() => navigate(1)}
            className="px-2 py-1 text-sm rounded hover:bg-muted"
          >
            ›
          </button>
        </div>
        <div className="flex rounded-md border overflow-hidden text-sm">
          {(['day', 'week', 'month'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 capitalize ${view === v ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      {view === 'month' ? (
        <MonthView
          sessions={sessions}
          currentDate={currentDate}
          onEventClick={onEventClick}
        />
      ) : (
        <WeekDayView
          days={days}
          sessionsForDay={sessionsForDay}
          onEventClick={onEventClick}
          editable={editable}
          onEventDrop={onEventDrop}
        />
      )}
    </div>
  )
}

function WeekDayView({
  days,
  sessionsForDay,
  onEventClick,
  editable,
  onEventDrop,
}: {
  days: Date[]
  sessionsForDay: (d: Date) => Session[]
  onEventClick?: (s: Session) => void
  editable?: boolean
  onEventDrop?: (s: Session, newStart: Date) => void
}) {
  return (
    <div className={`grid gap-1 border rounded-lg overflow-hidden`}
      style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}
    >
      {days.map(day => {
        const daySessions = sessionsForDay(day)
        const isToday = new Date().toDateString() === day.toDateString()
        return (
          <div key={day.toISOString()} className="min-h-[200px]">
            <div className={`px-2 py-1 text-xs font-medium border-b ${isToday ? 'bg-primary text-primary-foreground' : 'bg-muted/50'}`}>
              {day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <div className="p-1 space-y-1">
              {daySessions.length === 0 ? (
                <div className="text-xs text-muted-foreground py-2 text-center">—</div>
              ) : (
                daySessions.map(s => (
                  <SessionChip key={s.id} session={s} onClick={() => onEventClick?.(s)} />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MonthView({
  sessions,
  currentDate,
  onEventClick,
}: {
  sessions: Session[]
  currentDate: Date
  onEventClick?: (s: Session) => void
}) {
  const year  = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) => i < firstDay ? null : i - firstDay + 1)

  const sessionsOnDay = (d: number) =>
    sessions.filter(s => {
      const sd = new Date(s.scheduled_start)
      return sd.getFullYear() === year && sd.getMonth() === month && sd.getDate() === d
    })

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="grid grid-cols-7">
        {DAYS.map(d => (
          <div key={d} className="py-1 text-center text-xs font-medium bg-muted/50 border-b">{d}</div>
        ))}
        {cells.map((d, i) => {
          const ds = d ? sessionsOnDay(d) : []
          const isToday = d && new Date().getDate() === d && new Date().getMonth() === month && new Date().getFullYear() === year
          return (
            <div key={i} className={`min-h-[80px] border-b border-r p-1 ${!d ? 'bg-muted/20' : ''}`}>
              {d && (
                <>
                  <div className={`text-xs mb-1 w-5 h-5 flex items-center justify-center rounded-full font-medium ${isToday ? 'bg-primary text-primary-foreground' : ''}`}>
                    {d}
                  </div>
                  <div className="space-y-0.5">
                    {ds.slice(0, 2).map(s => (
                      <SessionChip key={s.id} session={s} compact onClick={() => onEventClick?.(s)} />
                    ))}
                    {ds.length > 2 && (
                      <div className="text-xs text-muted-foreground">+{ds.length - 2} more</div>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SessionChip({ session, onClick, compact = false }: { session: Session; onClick?: () => void; compact?: boolean }) {
  const color = STATUS_COLORS[session.status] ?? '#9ca3af'
  if (compact) {
    return (
      <button
        onClick={onClick}
        className="w-full text-left text-[10px] px-1 py-0.5 rounded truncate"
        style={{ backgroundColor: color + '22', borderLeft: `3px solid ${color}` }}
      >
        {formatTime(session.scheduled_start)} {session.student?.name}
      </button>
    )
  }
  return (
    <button
      onClick={onClick}
      className="w-full text-left text-xs px-2 py-1.5 rounded-md border"
      style={{ backgroundColor: color + '15', borderLeftColor: color, borderLeftWidth: 3 }}
    >
      <div className="font-medium truncate">{session.student?.name}</div>
      <div className="text-muted-foreground">
        {formatTime(session.scheduled_start)} – {formatTime(session.scheduled_end)}
      </div>
      <div className="text-[10px] text-muted-foreground capitalize">{session.status.replace('_', ' ')}</div>
    </button>
  )
}
