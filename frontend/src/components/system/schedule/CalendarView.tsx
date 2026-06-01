'use client'
import { useRef, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Session } from '@/types/system/session'

const HOUR_HEIGHT = 72            // px per hour — taller for better readability in single-day view
const START_HOUR  = 6             // 6 AM
const END_HOUR    = 22            // 10 PM
const TOTAL_HOURS = END_HOUR - START_HOUR

const LINE  = 'rgb(11 31 58 / 0.07)'   // hour grid lines
const LINE2 = 'rgb(11 31 58 / 0.04)'   // half-hour dashes
const GAP   = 3                         // px gap between sibling chips in same time slot

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  scheduled:          { bg: 'rgb(14 124 90 / 0.1)',    border: 'rgb(14 124 90)',   text: 'rgb(14 124 90)'   },
  attended:           { bg: 'rgb(30 90 171 / 0.1)',    border: 'rgb(30 90 171)',   text: 'rgb(30 90 171)'   },
  absent:             { bg: 'rgb(220 38 38 / 0.1)',    border: 'rgb(220 38 38)',   text: 'rgb(220 38 38)'   },
  cancelled:          { bg: 'rgb(156 163 175 / 0.15)', border: 'rgb(156 163 175)', text: 'rgb(107 114 128)' },
  rescheduled:        { bg: 'rgb(180 83 9 / 0.1)',     border: 'rgb(180 83 9)',    text: 'rgb(180 83 9)'    },
  pending_substitute: { bg: 'rgb(234 88 12 / 0.1)',    border: 'rgb(234 88 12)',   text: 'rgb(194 65 12)'   },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth()         === b.getMonth()    &&
    a.getDate()          === b.getDate()
}

function eventTop(iso: string): number {
  const d = new Date(iso)
  return Math.max(0, (d.getHours() + d.getMinutes() / 60 - START_HOUR) * HOUR_HEIGHT)
}

function eventHeight(min: number): number {
  return Math.max((min / 60) * HOUR_HEIGHT, 30)
}

function fmtHour(h: number): string {
  if (h === 12) return '12 PM'
  if (h === 0 || h === 24) return '12 AM'
  return h < 12 ? `${h} AM` : `${h - 12} PM`
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function fmtHHMM(iso: string): string {
  const d = new Date(iso)
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

// ── Overlap layout ────────────────────────────────────────────────────────────
// Groups concurrent events and assigns each a (col, colCount) so they render
// side-by-side without covering each other.

type WithLayout = Session & { col: number; colCount: number }

function layoutDayEvents(events: Session[]): WithLayout[] {
  if (events.length === 0) return []

  const sorted = [...events].sort((a, b) =>
    new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime()
  )

  const groups: WithLayout[][] = []

  for (const event of sorted) {
    const eStart = new Date(event.scheduled_start).getTime()

    // Find the first group whose max end time still overlaps this event's start
    let target: WithLayout[] | null = null
    for (const g of groups) {
      const gEnd = Math.max(...g.map(e =>
        new Date(e.scheduled_start).getTime() + e.duration_min * 60_000
      ))
      if (eStart < gEnd) { target = g; break }
    }
    if (!target) { target = []; groups.push(target) }

    // Find the first column not occupied by any event still active at eStart
    const activeCols = new Set(
      target
        .filter(e => new Date(e.scheduled_start).getTime() + e.duration_min * 60_000 > eStart)
        .map(e => e.col)
    )
    let col = 0
    while (activeCols.has(col)) col++

    target.push({ ...event, col, colCount: 0 })
  }

  // Finalise colCount = max col index + 1 per group
  const result: WithLayout[] = []
  for (const g of groups) {
    const colCount = Math.max(...g.map(e => e.col)) + 1
    for (const e of g) result.push({ ...e, colCount })
  }
  return result
}

// ── Public component ──────────────────────────────────────────────────────────

type View = 'day' | 'month'

interface CalendarViewProps {
  sessions:      Session[]
  loading?:      boolean
  onEventClick?: (session: Session) => void
  onEventDrop?:  (session: Session, newStart: Date) => void
  editable?:     boolean
  initialView?:  'timeGridDay' | 'timeGridWeek' | 'dayGridMonth'
  /** Controlled date (optional) — when provided, CalendarView reflects this date instead of its own. */
  date?:         Date
  onDateChange?: (d: Date) => void
}

export function CalendarView({
  sessions,
  loading = false,
  onEventClick,
  initialView = 'timeGridDay',
  date,
  onDateChange,
}: CalendarViewProps) {
  const [view, setView]                       = useState<View>(initialView === 'dayGridMonth' ? 'month' : 'day')
  const [internalDate, setInternalDate]       = useState(new Date())
  const currentDate                           = date ?? internalDate
  const setCurrentDate = (d: Date) => { if (onDateChange) onDateChange(d); else setInternalDate(d) }
  const scrollRef = useRef<HTMLDivElement>(null)
  const now       = new Date()

  const navigate = (dir: number) => {
    const d = new Date(currentDate)
    if (view === 'day') d.setDate(d.getDate() + dir)
    else                d.setMonth(d.getMonth() + dir)
    setCurrentDate(d)
  }

  const rangeLabel = (): string =>
    view === 'month'
      ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  useEffect(() => {
    if (scrollRef.current && view === 'day') {
      const h = new Date().getHours()
      scrollRef.current.scrollTop = Math.max(0, (h - START_HOUR - 1) * HOUR_HEIGHT)
    }
  }, [view])

  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-72 rounded-xl"
        style={{ border: '1px solid #E8E2D5', background: '#fff' }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-7 h-7 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgb(14 124 90 / 0.2)', borderTopColor: 'rgb(14 124 90)' }}
          />
          <p className="text-sm" style={{ color: 'rgb(90 100 112)' }}>Loading schedule…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E8E2D5', background: '#fff' }}>
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #E8E2D5' }}>
        <div className="flex items-center gap-1">
          <NavBtn onClick={() => navigate(-1)}><ChevronLeft size={15} /></NavBtn>
          <NavBtn onClick={() => setCurrentDate(new Date())} label>Today</NavBtn>
          <NavBtn onClick={() => navigate(1)}><ChevronRight size={15} /></NavBtn>
          <span className="ml-2 text-sm font-semibold" style={{ color: 'rgb(11 31 58)' }}>
            {rangeLabel()}
          </span>
        </div>

        {/* Day / Month switcher */}
        <div
          className="flex items-center p-0.5 rounded-lg gap-0.5"
          style={{ border: '1px solid #E8E2D5', background: '#F8F4ED' }}
        >
          {(['day', 'month'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-3 py-1 text-xs font-medium capitalize rounded-md transition-all"
              style={view === v
                ? { background: '#fff', color: 'rgb(11 31 58)', boxShadow: '0 1px 3px rgb(11 31 58 / 0.08)' }
                : { color: 'rgb(90 100 112)' }
              }
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === 'month'
        ? <MonthView sessions={sessions} currentDate={currentDate} onEventClick={onEventClick} />
        : <DayGrid   date={currentDate}  sessions={sessions}       onEventClick={onEventClick} scrollRef={scrollRef} now={now} />
      }
    </div>
  )
}

// ── Small nav button ──────────────────────────────────────────────────────────

function NavBtn({
  onClick, children, label = false,
}: {
  onClick: () => void
  children: React.ReactNode
  label?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`${label ? 'px-3 py-1 text-xs font-semibold rounded-lg' : 'p-1.5 rounded-lg'} transition-colors`}
      style={{ color: 'rgb(11 31 58)', border: label ? '1px solid #E8E2D5' : undefined }}
      onMouseOver={e => (e.currentTarget.style.background = '#F8F4ED')}
      onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </button>
  )
}

// ── Day grid ──────────────────────────────────────────────────────────────────

function DayGrid({
  date, sessions, onEventClick, scrollRef, now,
}: {
  date:          Date
  sessions:      Session[]
  onEventClick?: (s: Session) => void
  scrollRef:     React.RefObject<HTMLDivElement | null>
  now:           Date
}) {
  const hours       = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i)
  const nowTop      = (now.getHours() + now.getMinutes() / 60 - START_HOUR) * HOUR_HEIGHT
  const showNow     = isSameDay(date, now) && nowTop >= 0 && nowTop <= TOTAL_HOURS * HOUR_HEIGHT
  const totalHeight = TOTAL_HOURS * HOUR_HEIGHT

  // Filter to this day then compute overlap layout
  const dayEvts = sessions.filter(s => isSameDay(new Date(s.scheduled_start), date))
  const laid    = layoutDayEvents(dayEvts)

  return (
    <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: 640 }}>
      <div className="relative" style={{ height: totalHeight }}>

        {/* Time labels */}
        {hours.map((h, i) => (
          <div
            key={h}
            className="absolute pointer-events-none select-none"
            style={{ top: i * HOUR_HEIGHT + 3, width: 56, textAlign: 'right', paddingRight: 8 }}
          >
            <span style={{ fontSize: 10, color: 'rgb(90 100 112)', lineHeight: 1 }}>
              {fmtHour(h)}
            </span>
          </div>
        ))}

        {/* Hour lines */}
        {hours.map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{ top: i * HOUR_HEIGHT, left: 56, right: 0, borderTop: `1px solid ${LINE}` }}
          />
        ))}

        {/* Half-hour dashes */}
        {hours.map((_, i) => (
          <div
            key={`h${i}`}
            className="absolute"
            style={{ top: i * HOUR_HEIGHT + HOUR_HEIGHT / 2, left: 56, right: 0, borderTop: `1px dashed ${LINE2}` }}
          />
        ))}

        {/* Current time indicator */}
        {showNow && (
          <div
            className="absolute flex items-center pointer-events-none"
            style={{ top: nowTop, left: 56, right: 0, zIndex: 20 }}
          >
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: '#ef4444', marginLeft: -5, boxShadow: '0 0 0 2px rgb(239 68 68 / 0.2)' }}
            />
            <div className="flex-1" style={{ height: 1.5, background: '#ef4444' }} />
          </div>
        )}

        {/* Events — absolutely positioned, split into sub-columns when overlapping */}
        <div className="absolute top-0 bottom-0" style={{ left: 56, right: 0 }}>
          {laid.map(({ col, colCount, ...s }) => (
            <EventChip
              key={s.id}
              session={s}
              top={eventTop(s.scheduled_start)}
              height={eventHeight(s.duration_min)}
              col={col}
              colCount={colCount}
              colors={STATUS_COLORS[s.status] ?? STATUS_COLORS.cancelled}
              onClick={() => onEventClick?.(s)}
            />
          ))}
        </div>

      </div>
    </div>
  )
}

// ── Event chip ────────────────────────────────────────────────────────────────
// Single flex-row: name shrinks + truncates; time stays rigid on the right.
// col / colCount split the day column into side-by-side lanes for concurrent events.

function EventChip({
  session: s, top, height, col, colCount, colors: c, onClick,
}: {
  session:  Session
  top:      number
  height:   number
  col:      number
  colCount: number
  colors:   { bg: string; border: string; text: string }
  onClick:  () => void
}) {
  const pct   = 100 / colCount
  const left  = `calc(${col * pct}% + ${GAP}px)`
  const width = `calc(${pct}% - ${GAP * 2}px)`

  return (
    <button
      onClick={onClick}
      className="absolute overflow-hidden"
      style={{
        top, height, left, width,
        borderRadius: 5,
        background:   c.bg,
        borderLeft:   `3px solid ${c.border}`,
        zIndex:       10,
        cursor:       'pointer',
        display:      'flex',
        alignItems:   'center',
        paddingLeft:  7,
        paddingRight: 5,
        gap:          5,
      }}
      onMouseOver={e => (e.currentTarget.style.opacity = '0.78')}
      onMouseOut={e => (e.currentTarget.style.opacity = '1')}
    >
      {/* Name — takes all remaining space, truncates */}
      <span style={{
        flex: '1 1 0', minWidth: 0,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        fontSize: 12, fontWeight: 600, color: c.text, lineHeight: 1,
      }}>
        {s.student?.name ?? 'Student'}
      </span>

      {/* Time — never shrinks or wraps */}
      <span style={{
        flexShrink: 0, whiteSpace: 'nowrap',
        fontSize: 10, color: c.text, opacity: 0.55, lineHeight: 1,
      }}>
        {fmtHHMM(s.scheduled_start)}
      </span>
    </button>
  )
}

// ── Month view ────────────────────────────────────────────────────────────────

function MonthView({
  sessions, currentDate, onEventClick,
}: {
  sessions:      Session[]
  currentDate:   Date
  onEventClick?: (s: Session) => void
}) {
  const now      = new Date()
  const y        = currentDate.getFullYear()
  const m        = currentDate.getMonth()
  const firstDay = new Date(y, m, 1).getDay()
  const lastDay  = new Date(y, m + 1, 0).getDate()
  const cells    = Array.from(
    { length: Math.ceil((firstDay + lastDay) / 7) * 7 },
    (_, i) => { const d = i - firstDay + 1; return d >= 1 && d <= lastDay ? d : null }
  )

  const dayEvents = (d: number) =>
    sessions.filter(s => {
      const sd = new Date(s.scheduled_start)
      return sd.getFullYear() === y && sd.getMonth() === m && sd.getDate() === d
    })

  return (
    <div>
      {/* Day name header */}
      <div className="grid grid-cols-7" style={{ borderBottom: '1px solid #E8E2D5', background: '#FAFAFA' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
          <div
            key={d}
            className="py-2 text-center text-[10px] font-bold uppercase tracking-wider"
            style={{ color: 'rgb(90 100 112)', borderRight: i < 6 ? '1px solid #E8E2D5' : undefined }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          const evts    = d !== null ? dayEvents(d) : []
          const isToday = d !== null && now.getDate() === d && now.getMonth() === m && now.getFullYear() === y
          const col     = i % 7
          return (
            <div
              key={i}
              className="min-h-[100px] p-1.5"
              style={{
                background:  d === null ? 'rgb(248 244 237 / 0.4)' : '#fff',
                borderTop:   '1px solid #E8E2D5',
                borderRight: col < 6 ? '1px solid #E8E2D5' : undefined,
              }}
            >
              {d !== null && (
                <>
                  <div
                    className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold mb-1"
                    style={isToday
                      ? { background: 'rgb(14 124 90)', color: '#fff' }
                      : { color: 'rgb(90 100 112)' }
                    }
                  >
                    {d}
                  </div>
                  <div className="space-y-0.5">
                    {evts.slice(0, 3).map(s => {
                      const c = STATUS_COLORS[s.status] ?? STATUS_COLORS.cancelled
                      return (
                        <button
                          key={s.id}
                          onClick={() => onEventClick?.(s)}
                          className="w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate transition-opacity hover:opacity-75"
                          style={{ background: c.bg, color: c.text, borderLeft: `2px solid ${c.border}` }}
                        >
                          {fmtTime(s.scheduled_start)} {s.student?.name}
                        </button>
                      )
                    })}
                    {evts.length > 3 && (
                      <p className="text-[10px] px-1 font-medium" style={{ color: 'rgb(90 100 112)' }}>
                        +{evts.length - 3} more
                      </p>
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
