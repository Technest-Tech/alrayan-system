'use client'
import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Clock, LayoutGrid } from 'lucide-react'
import { useSessions } from '@/hooks/system/useSessions'
import type { TeacherAvailabilitySlot } from '@/types/system/teacher'
import type { Session, SessionStatus } from '@/types/system/session'

// ── Grid config ───────────────────────────────────────────────
const GRID_START = 7   // 7 AM
const GRID_END   = 23  // 11 PM
const HOUR_H     = 64  // px per hour
const DAYS       = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

// ── Helpers ───────────────────────────────────────────────────

function weekSunday(d: Date): Date {
  const s = new Date(d)
  s.setDate(s.getDate() - s.getDay())
  s.setHours(0, 0, 0, 0)
  return s
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function minToY(totalMin: number): number {
  return ((totalMin - GRID_START * 60) / 60) * HOUR_H
}

function parseTimeMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function fmtDuration(min: number): string {
  if (min === 0) return '0m'
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

type SessionKind = 'trial' | 'regular' | 'makeup'

const KIND_CFG: Record<SessionKind, { label: string; bg: string; color: string }> = {
  trial:   { label: 'Trial',   bg: 'rgb(99 102 241 / 0.15)',  color: 'rgb(67 56 202)'  },
  regular: { label: 'Regular', bg: 'rgb(14 124 90 / 0.15)',   color: 'rgb(14 124 90)'  },
  makeup:  { label: 'Makeup',  bg: 'rgb(245 158 11 / 0.15)',  color: 'rgb(180 83 9)'   },
}

function sessionKind(s: Session): SessionKind {
  if (s.original_session_id !== null) return 'makeup'
  if (s.schedule_pattern_id !== null) return 'regular'
  return 'trial'
}

// ── Status styles ─────────────────────────────────────────────

const STATUS_CFG: Record<string, { bg: string; border: string; text: string; accent: string; label: string }> = {
  scheduled: {
    bg:     'rgb(14 124 90 / 0.09)',
    border: 'rgb(14 124 90 / 0.55)',
    text:   'rgb(6 54 39)',
    accent: 'rgb(14 124 90)',
    label:  'Confirmed',
  },
  attended: {
    bg:     'rgb(34 197 94 / 0.10)',
    border: 'rgb(22 163 74 / 0.50)',
    text:   'rgb(15 118 54)',
    accent: 'rgb(22 163 74)',
    label:  'Attended',
  },
  absent: {
    bg:     'rgb(245 158 11 / 0.10)',
    border: 'rgb(245 158 11 / 0.55)',
    text:   'rgb(120 53 15)',
    accent: 'rgb(245 158 11)',
    label:  'Absent',
  },
  cancelled: {
    bg:     'rgb(148 163 184 / 0.10)',
    border: 'rgb(148 163 184 / 0.45)',
    text:   'rgb(71 85 105)',
    accent: 'rgb(148 163 184)',
    label:  'Cancelled',
  },
  rescheduled: {
    bg:     'rgb(148 163 184 / 0.10)',
    border: 'rgb(148 163 184 / 0.45)',
    text:   'rgb(71 85 105)',
    accent: 'rgb(148 163 184)',
    label:  'Rescheduled',
  },
  pending_substitute: {
    bg:     'rgb(239 68 68 / 0.09)',
    border: 'rgb(239 68 68 / 0.55)',
    text:   'rgb(153 27 27)',
    accent: 'rgb(239 68 68)',
    label:  'Needs Sub',
  },
}

// ── Component ─────────────────────────────────────────────────

interface Props {
  teacherId:    number | string
  availability: TeacherAvailabilitySlot[]
}

export function TeacherScheduleView({ teacherId, availability }: Props) {
  const [weekStart, setWeekStart] = useState(() => weekSunday(new Date()))
  const scrollRef = useRef<HTMLDivElement>(null)

  const weekEnd = addDays(weekStart, 6)

  // Scroll to 8 AM on first render
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = (8 - GRID_START) * HOUR_H - 4
    }
  }, [])

  const { data, isLoading } = useSessions({
    teacher_id: teacherId,
    from:       isoDate(weekStart),
    to:         isoDate(weekEnd),
    per_page:   200,
  })
  const sessions: Session[] = data?.data ?? []

  // Current-time state
  const now      = new Date()
  const isCurr   = now >= weekStart && now < addDays(weekEnd, 1)
  const todayDow = now.getDay()
  const nowMin   = now.getHours() * 60 + now.getMinutes()
  const nowY     = minToY(nowMin)
  const nowOk    = nowMin >= GRID_START * 60 && nowMin < GRID_END * 60

  // Index sessions & availability by day-of-week
  const sessByDay = sessions.reduce<Record<number, Session[]>>((acc, s) => {
    const dow = new Date(s.scheduled_start).getDay()
    ;(acc[dow] ??= []).push(s)
    return acc
  }, {})

  const availByDay = availability.reduce<Record<number, TeacherAvailabilitySlot[]>>((acc, sl) => {
    ;(acc[sl.day_of_week] ??= []).push(sl)
    return acc
  }, {})

  // Weekly stats
  const totalAvailMin = availability.reduce(
    (sum, sl) => sum + (parseTimeMin(sl.end_time) - parseTimeMin(sl.start_time)),
    0,
  )
  const activeStatuses: SessionStatus[] = ['scheduled', 'attended']
  const bookedMin = sessions
    .filter(s => activeStatuses.includes(s.status))
    .reduce((sum, s) => sum + s.duration_min, 0)
  const freeMin = Math.max(totalAvailMin - bookedMin, 0)

  const hours = Array.from({ length: GRID_END - GRID_START }, (_, i) => GRID_START + i)

  const weekLabel = `${weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${weekEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`

  const border = 'rgb(var(--border-default, 229 233 240))'
  const surface = 'rgb(var(--surface-card, 255 255 255))'

  return (
    <div className="rounded-2xl overflow-hidden border" style={{ background: surface, borderColor: border }}>

      {/* ── Navigation + legend ──────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 border-b" style={{ borderColor: border }}>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setWeekStart(w => addDays(w, -7))}
              className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setWeekStart(weekSunday(new Date()))}
              className="px-3 py-1 text-xs font-semibold rounded-lg border hover:bg-black/5 transition-colors"
              style={{ borderColor: border }}
            >
              This week
            </button>
            <button
              onClick={() => setWeekStart(w => addDays(w, 7))}
              className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <span className="text-sm font-semibold">{weekLabel}</span>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium" style={{ opacity: 0.6 }}>
          <LegendChip shape="rect" color="rgb(14 124 90 / 0.2)" border="rgb(14 124 90 / 0.3)" label="Available" />
          <LegendChip color="rgb(14 124 90)"  label="Confirmed" />
          <LegendChip color="rgb(22 163 74)"  label="Attended" />
          <LegendChip color="rgb(245 158 11)" label="Absent" />
          <LegendChip color="rgb(239 68 68)"  label="Needs Sub" />
          <LegendChip color="rgb(148 163 184)" label="Cancelled" />
        </div>
      </div>

      {/* ── Stats row ─────────────────────────────────────── */}
      <div className="grid grid-cols-3 border-b" style={{ borderColor: border }}>
        <StatCell
          icon={<LayoutGrid size={13} />}
          label="Weekly available"
          value={fmtDuration(totalAvailMin)}
          color="rgb(14 124 90)"
          border={border}
          rightBorder
        />
        <StatCell
          icon={<Clock size={13} />}
          label="Booked this week"
          value={fmtDuration(bookedMin)}
          color="rgb(99 102 241)"
          border={border}
          rightBorder
        />
        <StatCell
          icon={<Clock size={13} />}
          label="Free slots"
          value={fmtDuration(freeMin)}
          color={freeMin === 0 ? 'rgb(239 68 68)' : 'rgb(14 124 90)'}
          border={border}
        />
      </div>

      {/* ── Calendar ──────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: 700 }}>

          {/* Day headers */}
          <div className="flex sticky top-0 z-20 border-b" style={{ background: surface, borderColor: border }}>
            <div className="w-14 shrink-0" />
            {DAYS.map((label, dow) => {
              const date    = addDays(weekStart, dow)
              const isToday = isCurr && dow === todayDow
              return (
                <div
                  key={dow}
                  className="flex-1 flex flex-col items-center py-3 select-none"
                  style={{ borderLeft: `1px solid ${border}` }}
                >
                  <span
                    className="text-[10px] uppercase tracking-widest font-semibold"
                    style={{ color: isToday ? 'rgb(14 124 90)' : undefined, opacity: isToday ? 1 : 0.4 }}
                  >
                    {label}
                  </span>
                  <span
                    className="mt-1 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors"
                    style={isToday ? { background: 'rgb(14 124 90)', color: '#fff' } : { opacity: 0.75 }}
                  >
                    {date.getDate()}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Scrollable body — paddingTop gives room so the 7 AM label isn't clipped */}
          <div ref={scrollRef} className="overflow-y-auto relative" style={{ maxHeight: 560, paddingTop: 14 }}>
            {isLoading && (
              <div
                className="absolute inset-0 z-30 flex items-center justify-center"
                style={{ background: 'rgb(255 255 255 / 0.8)' }}
              >
                <span className="text-sm opacity-40 animate-pulse">Loading sessions…</span>
              </div>
            )}

            <div className="flex relative" style={{ height: (GRID_END - GRID_START) * HOUR_H }}>

              {/* Time gutter */}
              <div className="w-14 shrink-0 relative select-none">
                {hours.map(h => (
                  <div
                    key={h}
                    className="absolute right-2 flex items-baseline gap-0.5 tabular-nums"
                    style={{ top: (h - GRID_START) * HOUR_H - 7 }}
                  >
                    <span className="text-[11px] font-medium" style={{ opacity: 0.35 }}>
                      {h === 12 ? '12' : h > 12 ? h - 12 : h}
                    </span>
                    <span className="text-[8px] font-medium" style={{ opacity: 0.25 }}>
                      {h < 12 ? 'am' : 'pm'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {DAYS.map((_, dow) => {
                const isToday     = isCurr && dow === todayDow
                const daySlots    = availByDay[dow] ?? []
                const daySessions = sessByDay[dow] ?? []

                return (
                  <div
                    key={dow}
                    className="flex-1 relative"
                    style={{ borderLeft: `1px solid ${border}` }}
                  >
                    {/* Hour grid lines */}
                    {hours.map(h => (
                      <div
                        key={h}
                        className="absolute left-0 right-0 pointer-events-none"
                        style={{ top: (h - GRID_START) * HOUR_H, height: 1, background: border, opacity: 0.7 }}
                      />
                    ))}

                    {/* Half-hour lines */}
                    {hours.map(h => (
                      <div
                        key={`${h}h`}
                        className="absolute left-0 right-0 pointer-events-none"
                        style={{ top: (h - GRID_START) * HOUR_H + HOUR_H / 2, height: 1, background: border, opacity: 0.3 }}
                      />
                    ))}

                    {/* Today tint */}
                    {isToday && (
                      <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgb(14 124 90 / 0.025)' }} />
                    )}

                    {/* Availability bands */}
                    {daySlots.map((slot, i) => {
                      const startMin = parseTimeMin(slot.start_time)
                      const endMin   = parseTimeMin(slot.end_time)
                      const top      = minToY(Math.max(startMin, GRID_START * 60))
                      const height   = ((Math.min(endMin, GRID_END * 60) - Math.max(startMin, GRID_START * 60)) / 60) * HOUR_H
                      if (height <= 0) return null
                      return (
                        <div
                          key={i}
                          className="absolute left-0 right-0 pointer-events-none"
                          style={{
                            top,
                            height,
                            background: 'rgb(14 124 90 / 0.07)',
                            borderLeft: '2px solid rgb(14 124 90 / 0.20)',
                          }}
                        />
                      )
                    })}

                    {/* Current time indicator */}
                    {isToday && nowOk && (
                      <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: nowY }}>
                        <div className="relative flex items-center">
                          <div
                            className="absolute rounded-full"
                            style={{ width: 9, height: 9, background: 'rgb(14 124 90)', left: -4, top: -4 }}
                          />
                          <div className="w-full" style={{ height: 1.5, background: 'rgb(14 124 90)', opacity: 0.85 }} />
                        </div>
                      </div>
                    )}

                    {/* Session cards */}
                    {daySessions.map(session => {
                      const start    = new Date(session.scheduled_start)
                      const end      = new Date(session.scheduled_end)
                      const startMin = start.getHours() * 60 + start.getMinutes()
                      const endMin   = end.getHours() * 60 + end.getMinutes()
                      const top      = minToY(startMin)
                      const height   = Math.max(((endMin - startMin) / 60) * HOUR_H, 22)
                      const cfg      = STATUS_CFG[session.status] ?? STATUS_CFG.scheduled
                      const kind     = sessionKind(session)
                      const kindCfg  = KIND_CFG[kind]
                      const compact  = height < 42
                      const spacious = height >= 58

                      return (
                        <div
                          key={session.id}
                          title={`${kindCfg.label} · ${session.student?.name ?? 'Session'} · ${fmtTime(start)} – ${fmtTime(end)} · ${session.duration_min}min · ${cfg.label}`}
                          className="absolute left-1 right-1 rounded-lg overflow-hidden z-10 transition-shadow hover:shadow-lg hover:z-30"
                          style={{
                            top:        top + 1,
                            height:     height - 2,
                            background: cfg.bg,
                            border:     `1.5px solid ${cfg.border}`,
                          }}
                        >
                          {/* left accent bar */}
                          <div
                            className="absolute left-0 top-0 bottom-0"
                            style={{ width: 3, background: cfg.accent, borderRadius: '6px 0 0 6px' }}
                          />

                          <div className="pl-3 pr-2 py-1 h-full flex flex-col justify-center gap-0.5">
                            {compact ? (
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span
                                  className="shrink-0 px-1 py-px rounded text-[8px] font-bold uppercase tracking-wide leading-none"
                                  style={{ background: kindCfg.bg, color: kindCfg.color }}
                                >
                                  {kindCfg.label}
                                </span>
                                <p className="text-[10px] font-bold truncate leading-tight" style={{ color: cfg.text }}>
                                  {session.student?.name ?? '—'} · {fmtTime(start)}
                                </p>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span
                                    className="shrink-0 px-1.5 py-px rounded text-[8px] font-bold uppercase tracking-wide leading-none"
                                    style={{ background: kindCfg.bg, color: kindCfg.color }}
                                  >
                                    {kindCfg.label}
                                  </span>
                                  <p className="text-[11px] font-bold leading-snug truncate" style={{ color: cfg.text }}>
                                    {session.student?.name ?? 'Unknown student'}
                                  </p>
                                </div>
                                <p className="text-[10px] leading-snug truncate" style={{ color: cfg.text, opacity: 0.7 }}>
                                  {fmtTime(start)} – {fmtTime(end)}
                                </p>
                                {spacious && (
                                  <span
                                    className="self-start px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide"
                                    style={{ background: cfg.accent + '20', color: cfg.accent }}
                                  >
                                    {cfg.label} · {session.duration_min}min
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function LegendChip({
  color,
  label,
  shape = 'circle',
  border,
}: {
  color: string
  label: string
  shape?: 'circle' | 'rect'
  border?: string
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={shape === 'rect' ? 'w-3 h-3 rounded-sm' : 'w-2.5 h-2.5 rounded-full'}
        style={{ display: 'inline-block', background: color, ...(border ? { border: `1.5px solid ${border}` } : {}) }}
      />
      {label}
    </span>
  )
}

function StatCell({
  icon,
  label,
  value,
  color,
  border,
  rightBorder,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
  border: string
  rightBorder?: boolean
}) {
  return (
    <div
      className="py-3.5 px-4 flex flex-col items-center gap-0.5"
      style={rightBorder ? { borderRight: `1px solid ${border}` } : {}}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-medium" style={{ opacity: 0.45 }}>
        <span style={{ color }}>{icon}</span>
        {label}
      </div>
      <div className="text-lg font-bold leading-tight" style={{ color }}>{value}</div>
    </div>
  )
}
