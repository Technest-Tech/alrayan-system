'use client'
import { useState } from 'react'
import { Plus, Trash2, Clock } from 'lucide-react'
import { toast } from 'sonner'
import type { TeacherAvailabilitySlot } from '@/types/system/teacher'
import { useUpdateAvailability } from '@/hooks/system/useTeacherAvailability'
import { ApiError } from '@/lib/system/api'

/* ─── Types ──────────────────────────────────────────── */
type TimeSlot  = { start: string; end: string }
type DayState  = { enabled: boolean; slots: TimeSlot[] }
type WeekState = DayState[]

/* ─── Constants ──────────────────────────────────────── */
const DAYS = [
  { short: 'Sun', label: 'Sunday' },
  { short: 'Mon', label: 'Monday' },
  { short: 'Tue', label: 'Tuesday' },
  { short: 'Wed', label: 'Wednesday' },
  { short: 'Thu', label: 'Thursday' },
  { short: 'Fri', label: 'Friday' },
  { short: 'Sat', label: 'Saturday' },
]

const TIME_OPTIONS: string[] = []
for (let h = 0; h < 24; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`)
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`)
}
TIME_OPTIONS.push('24:00')

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  if (h === 24) return '12:00 AM (midnight)'
  const ampm = h < 12 ? 'AM' : 'PM'
  const hh   = h % 12 === 0 ? 12 : h % 12
  return `${hh}:${String(m).padStart(2, '0')} ${ampm}`
}

/* ─── Converters ─────────────────────────────────────── */
function slotsToWeek(slots: TeacherAvailabilitySlot[]): WeekState {
  const week: WeekState = DAYS.map(() => ({
    enabled: false,
    slots: [{ start: '09:00', end: '17:00' }],
  }))
  for (const slot of slots) {
    const d = slot.day_of_week
    if (!week[d].enabled) {
      week[d] = { enabled: true, slots: [] }
    }
    week[d].slots.push({ start: slot.start_time, end: slot.end_time })
  }
  return week
}

function weekToSlots(week: WeekState) {
  const result: { day_of_week: number; start_time: string; end_time: string }[] = []
  for (let d = 0; d < 7; d++) {
    if (week[d].enabled) {
      for (const s of week[d].slots) {
        result.push({ day_of_week: d, start_time: s.start, end_time: s.end })
      }
    }
  }
  return result
}

/* ─── Sub-components ─────────────────────────────────── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200"
      style={{ background: checked ? 'rgb(14 124 90)' : 'rgb(203 213 225)' }}
    >
      <span
        className="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{ transform: checked ? 'translateX(16px)' : 'translateX(0)' }}
      />
    </button>
  )
}

function TimeSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-2.5 py-1.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] transition-shadow cursor-pointer"
      style={{
        borderColor: 'rgb(var(--border-default, 229 233 240))',
        background: 'rgb(var(--surface-card, 255 255 255))',
        minWidth: '120px',
      }}
    >
      {options.map(t => (
        <option key={t} value={t}>{formatTime(t)}</option>
      ))}
    </select>
  )
}

/* ─── Main component ─────────────────────────────────── */
interface AvailabilityPickerProps {
  teacherId: number | string
  initialSlots: TeacherAvailabilitySlot[]
  timezone: string
}

export function AvailabilityPicker({ teacherId, initialSlots, timezone }: AvailabilityPickerProps) {
  const [week, setWeek] = useState<WeekState>(() => slotsToWeek(initialSlots))
  const update = useUpdateAvailability(teacherId)

  /* Day toggle */
  function toggleDay(d: number) {
    setWeek(prev => {
      const next = [...prev]
      next[d] = { ...next[d], enabled: !next[d].enabled }
      return next
    })
  }

  /* Update a single slot field */
  function updateSlot(d: number, idx: number, field: 'start' | 'end', value: string) {
    setWeek(prev => {
      const next = prev.map(day => ({ ...day, slots: [...day.slots] }))
      next[d].slots[idx] = { ...next[d].slots[idx], [field]: value }
      return next
    })
  }

  /* Add a new slot to a day */
  function addSlot(d: number) {
    setWeek(prev => {
      const next = prev.map(day => ({ ...day, slots: [...day.slots] }))
      const lastEnd = next[d].slots.at(-1)?.end ?? '17:00'
      next[d].slots.push({ start: lastEnd, end: '18:00' })
      return next
    })
  }

  /* Remove a slot from a day */
  function removeSlot(d: number, idx: number) {
    setWeek(prev => {
      const next = prev.map(day => ({ ...day, slots: [...day.slots] }))
      next[d].slots.splice(idx, 1)
      if (next[d].slots.length === 0) next[d].slots = [{ start: '09:00', end: '17:00' }]
      return next
    })
  }

  async function handleSave() {
    const slots = weekToSlots(week)
    try {
      await update.mutateAsync({ availability: slots, timezone })
      toast.success('Availability saved.')
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to save availability.')
    }
  }

  const activeDayCount = week.filter(d => d.enabled).length

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={15} style={{ color: 'rgb(14 124 90)' }} />
          <span className="text-xs opacity-50">
            {activeDayCount === 0 ? 'No days selected' : `${activeDayCount} day${activeDayCount > 1 ? 's' : ''} active`}
            {' · '}{timezone}
          </span>
        </div>
        <button
          onClick={handleSave}
          disabled={update.isPending}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
          style={{ background: 'rgb(14 124 90)' }}
        >
          {update.isPending ? 'Saving…' : 'Save availability'}
        </button>
      </div>

      {/* Day cards */}
      <div className="space-y-2">
        {DAYS.map(({ short, label }, d) => {
          const day = week[d]
          return (
            <div
              key={d}
              className="rounded-xl border transition-colors"
              style={{
                borderColor: day.enabled ? 'rgb(14 124 90 / 0.3)' : 'rgb(var(--border-default, 229 233 240))',
                background: day.enabled ? 'rgb(14 124 90 / 0.03)' : 'rgb(var(--surface-card, 255 255 255))',
              }}
            >
              {/* Day header row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <Toggle checked={day.enabled} onChange={() => toggleDay(d)} />

                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span
                    className="text-sm font-semibold w-8"
                    style={{ color: day.enabled ? 'rgb(14 124 90)' : 'rgb(var(--text-secondary, 100 116 139))' }}
                  >
                    {short}
                  </span>
                  <span className="text-sm hidden sm:inline opacity-50">{label}</span>
                </div>

                {!day.enabled && (
                  <span className="text-xs opacity-35 italic">Unavailable</span>
                )}
              </div>

              {/* Slots */}
              {day.enabled && (
                <div className="px-4 pb-3 space-y-2 border-t" style={{ borderColor: 'rgb(14 124 90 / 0.15)' }}>
                  {day.slots.map((slot, idx) => (
                    <div key={idx} className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs opacity-40 w-8 text-right shrink-0">
                        {idx === 0 ? 'From' : 'Also'}
                      </span>

                      <TimeSelect
                        value={slot.start}
                        onChange={v => updateSlot(d, idx, 'start', v)}
                        options={TIME_OPTIONS.slice(0, -1)}
                      />

                      <span className="text-xs opacity-40">to</span>

                      <TimeSelect
                        value={slot.end}
                        onChange={v => updateSlot(d, idx, 'end', v)}
                        options={TIME_OPTIONS.filter(t => t > slot.start)}
                      />

                      {day.slots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSlot(d, idx)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors opacity-40 hover:opacity-100"
                          aria-label="Remove slot"
                        >
                          <Trash2 size={13} className="text-red-500" />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addSlot(d)}
                    className="flex items-center gap-1.5 text-xs mt-2 ml-10 transition-opacity opacity-50 hover:opacity-100"
                    style={{ color: 'rgb(14 124 90)' }}
                  >
                    <Plus size={12} />
                    Add another time range
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
