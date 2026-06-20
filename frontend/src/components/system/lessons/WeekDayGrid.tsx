'use client'
import { useState, useRef, useEffect, useMemo } from 'react'
import type { Lesson } from '@/types/system/lesson'
import { lessonBlockStyle, displaySessionHours } from '@/lib/system/lessonStatus'

/* ── Layout constants ─────────────────────────────────── */
const SLOT_H  = 32   // px per 30-min slot
const TIME_W  = 56   // px width of time sidebar

/* ── Helpers ─────────────────────────────────────────── */
const BORDER = 'rgb(var(--border-default,229 233 240))'
const NAVY   = 'rgb(11 31 58)'
const MUTED  = 'rgb(90 100 112)'

function slotToTime(slot: number, gridStart: number): string {
  const totalMins = gridStart * 60 + slot * 30
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function lessonPos(lesson: Lesson, gridStart: number) {
  const d        = new Date(lesson.scheduled_at)
  const startMin = d.getHours() * 60 + d.getMinutes()
  const topSlot  = (startMin - gridStart * 60) / 30
  const hSlots   = lesson.duration_minutes / 30
  return {
    top:    topSlot * SLOT_H,
    height: Math.max(SLOT_H * 0.9, hSlots * SLOT_H - 2),
    hidden: topSlot < 0,
  }
}

/* ── Props ─────────────────────────────────────────────── */
interface Props {
  days:           Date[]
  lessons:        Lesson[]
  showFullDay?:   boolean
  onLessonClick:  (lesson: Lesson) => void
  onCellSelect:   (p: { date: string; startTime: string; durationMinutes: number }) => void
}

interface DragState {
  active:    boolean
  dayKey:    string
  startSlot: number
  endSlot:   number
}

interface Selection {
  dayKey: string
  start:  number
  end:    number
}

export function WeekDayGrid({ days, lessons, showFullDay = false, onLessonClick, onCellSelect }: Props) {
  const gridStart  = showFullDay ? 0  : 6
  const gridEnd    = showFullDay ? 24 : 23
  const totalSlots = (gridEnd - gridStart) * 2
  const totalH     = totalSlots * SLOT_H

  /* Group lessons by date */
  const byDate = useMemo(() => {
    const m: Record<string, Lesson[]> = {}
    lessons.forEach(l => {
      const k = l.scheduled_at.slice(0, 10)
      if (!m[k]) m[k] = []
      m[k].push(l)
    })
    return m
  }, [lessons])

  /* Today + current time indicator */
  const todayKey = fmtDate(new Date())
  const nowTop   = useMemo(() => {
    const now = new Date()
    if (now.getHours() < gridStart || now.getHours() >= gridEnd) return -1
    return ((now.getHours() * 60 + now.getMinutes()) - gridStart * 60) / 30 * SLOT_H
  }, [gridStart, gridEnd])

  /* Drag selection */
  const drag = useRef<DragState>({ active: false, dayKey: '', startSlot: 0, endSlot: 0 })
  const [sel, setSel] = useState<Selection | null>(null)

  useEffect(() => {
    function onUp() {
      if (!drag.current.active) return
      drag.current.active = false
      const { dayKey, startSlot, endSlot } = drag.current
      const s = Math.min(startSlot, endSlot)
      const e = Math.max(startSlot, endSlot)
      setSel(null)
      onCellSelect({
        date:            dayKey,
        startTime:       slotToTime(s, gridStart),
        durationMinutes: (e - s + 1) * 30,
      })
    }
    window.addEventListener('pointerup', onUp)
    return () => window.removeEventListener('pointerup', onUp)
  }, [gridStart, onCellSelect])

  function startDrag(dayKey: string, slot: number) {
    drag.current = { active: true, dayKey, startSlot: slot, endSlot: slot }
    setSel({ dayKey, start: slot, end: slot })
  }

  function extendDrag(dayKey: string, slot: number) {
    if (!drag.current.active || drag.current.dayKey !== dayKey) return
    drag.current.endSlot = slot
    setSel({ dayKey, start: drag.current.startSlot, end: slot })
  }

  /* Hour labels */
  const hourLabels = useMemo(() =>
    Array.from({ length: gridEnd - gridStart }, (_, i) => ({
      slot:  i * 2,
      label: `${String(gridStart + i).padStart(2, '0')}:00`,
    }))
  , [gridStart, gridEnd])

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: BORDER, background: '#fff' }}>

      {/* ── Sticky day-header row ─────────────────────────── */}
      <div className="flex border-b sticky top-0 z-20 bg-white" style={{ borderColor: BORDER }}>
        <div style={{ width: TIME_W, minWidth: TIME_W, flexShrink: 0, borderRight: `1px solid ${BORDER}` }} />
        {days.map((day, i) => {
          const isToday = fmtDate(day) === todayKey
          return (
            <div
              key={i}
              className="flex-1 py-2.5 text-center text-xs font-semibold"
              style={{
                borderRight: i < days.length - 1 ? `1px solid ${BORDER}` : undefined,
                color:       isToday ? '#0d9488' : NAVY,
                background:  isToday ? '#F0FDFA' : undefined,
              }}
            >
              {day.toLocaleDateString('en-US', { weekday: 'short' })}{' '}
              <span style={{ fontWeight: isToday ? 700 : 500 }}>
                {day.getMonth() + 1}/{day.getDate()}
              </span>
            </div>
          )
        })}
      </div>

      {/* ── Scrollable grid ──────────────────────────────── */}
      <div className="overflow-y-auto" style={{ maxHeight: 580 }}>
        <div className="flex" style={{ height: totalH, position: 'relative' }}>

          {/* Time sidebar */}
          <div
            className="relative shrink-0"
            style={{ width: TIME_W, minWidth: TIME_W, borderRight: `1px solid ${BORDER}` }}
          >
            {hourLabels.map(({ slot, label }) => (
              <div
                key={label}
                className="absolute right-2 pointer-events-none select-none"
                style={{ top: slot * SLOT_H - 8, fontSize: 10, color: MUTED, lineHeight: '16px' }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day, di) => {
            const dayKey     = fmtDate(day)
            const isToday    = dayKey === todayKey
            const dayLessons = byDate[dayKey] ?? []
            const selStart   = sel?.dayKey === dayKey ? Math.min(sel.start, sel.end) : -1
            const selEnd     = sel?.dayKey === dayKey ? Math.max(sel.start, sel.end) : -1

            return (
              <div
                key={di}
                className="flex-1 relative"
                style={{
                  borderRight: di < days.length - 1 ? `1px solid ${BORDER}` : undefined,
                  background:  isToday ? '#FDFFFE' : '#fff',
                }}
              >
                {/* Slot cells ─ click + drag surface */}
                {Array.from({ length: totalSlots }, (_, slot) => {
                  const isHour     = slot % 2 === 0
                  const isSelected = slot >= selStart && slot <= selEnd

                  return (
                    <div
                      key={slot}
                      onPointerDown={() => startDrag(dayKey, slot)}
                      onPointerEnter={() => extendDrag(dayKey, slot)}
                      className="absolute left-0 right-0"
                      style={{
                        top:        slot * SLOT_H,
                        height:     SLOT_H,
                        borderTop:  isHour
                          ? `1px solid ${BORDER}`
                          : `1px dashed rgba(229,233,240,0.7)`,
                        background: isSelected ? 'rgba(13,148,136,0.1)' : undefined,
                        cursor:     'cell',
                        userSelect: 'none',
                        zIndex:     1,
                      }}
                    />
                  )
                })}

                {/* Current time indicator */}
                {isToday && nowTop >= 0 && (
                  <div
                    className="absolute left-0 right-0 pointer-events-none"
                    style={{ top: nowTop, zIndex: 15 }}
                  >
                    <div style={{ height: 2, background: '#EF4444', position: 'relative' }}>
                      <div style={{
                        position: 'absolute', left: -4, top: -3,
                        width: 8, height: 8, borderRadius: '50%',
                        background: '#EF4444',
                      }} />
                    </div>
                  </div>
                )}

                {/* Lesson blocks */}
                {dayLessons.map(lesson => {
                  const pos  = lessonPos(lesson, gridStart)
                  if (pos.hidden || pos.top >= totalH) return null
                  const bs   = lessonBlockStyle(lesson)
                  const num  = displaySessionHours(lesson)

                  return (
                    <div
                      key={lesson.id}
                      onClick={e => { e.stopPropagation(); onLessonClick(lesson) }}
                      className="absolute rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
                      style={{
                        top:        pos.top + 1,
                        height:     pos.height,
                        left:       4,
                        right:      4,
                        background: bs.bg,
                        color:      bs.color,
                        border:     bs.border,
                        padding:    '3px 6px',
                        cursor:     'pointer',
                        zIndex:     10,
                      }}
                    >
                      <div className="text-xs font-semibold truncate leading-tight">
                        {num} · {lesson.student.name.split(' ')[0]}
                      </div>
                      {pos.height >= SLOT_H * 1.5 && (
                        <div className="text-xs opacity-60 truncate leading-tight">
                          {lesson.duration_minutes}min
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
