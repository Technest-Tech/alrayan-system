'use client'
import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { TeacherAvailabilitySlot } from '@/types/system/teacher'
import { useUpdateAvailability } from '@/hooks/system/useTeacherAvailability'
import { ApiError } from '@/lib/system/api'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function padTime(h: number) {
  return `${String(h).padStart(2, '0')}:00`
}

function slotsToGrid(slots: TeacherAvailabilitySlot[]): boolean[][] {
  const grid: boolean[][] = Array.from({ length: 7 }, () => Array(24).fill(false))
  for (const slot of slots) {
    const startH = parseInt(slot.start_time.split(':')[0], 10)
    const endH   = parseInt(slot.end_time.split(':')[0], 10)
    for (let h = startH; h < endH; h++) {
      if (h >= 0 && h < 24) grid[slot.day_of_week][h] = true
    }
  }
  return grid
}

function gridToSlots(grid: boolean[][]): { day_of_week: number; start_time: string; end_time: string }[] {
  const result = []
  for (let day = 0; day < 7; day++) {
    let start: number | null = null
    for (let h = 0; h <= 24; h++) {
      const on = h < 24 && grid[day][h]
      if (on && start === null) {
        start = h
      } else if (!on && start !== null) {
        result.push({ day_of_week: day, start_time: padTime(start), end_time: padTime(h) })
        start = null
      }
    }
  }
  return result
}

interface AvailabilityPickerProps {
  teacherId: number | string
  initialSlots: TeacherAvailabilitySlot[]
  timezone: string
}

export function AvailabilityPicker({ teacherId, initialSlots, timezone }: AvailabilityPickerProps) {
  const [grid, setGrid] = useState<boolean[][]>(() => slotsToGrid(initialSlots))
  const [isDragging, setIsDragging] = useState(false)
  const [dragValue, setDragValue] = useState(false)
  const update = useUpdateAvailability(teacherId)

  const toggleCell = useCallback((day: number, hour: number, value: boolean) => {
    setGrid((prev) => {
      const next = prev.map((row) => [...row])
      next[day][hour] = value
      return next
    })
  }, [])

  async function handleSave() {
    const slots = gridToSlots(grid)
    try {
      await update.mutateAsync({ availability: slots, timezone })
      toast.success('Availability saved.')
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to save availability.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs opacity-50">Timezone: {timezone}. Click/drag cells to toggle hours.</p>
        <button
          onClick={handleSave}
          disabled={update.isPending}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: 'rgb(14 124 90)' }}
        >
          {update.isPending ? 'Saving…' : 'Save availability'}
        </button>
      </div>

      <div
        className="rounded-xl border overflow-auto"
        style={{ borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }}
        onMouseLeave={() => setIsDragging(false)}
      >
        <table className="w-full" style={{ minWidth: '700px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgb(var(--border-default, 229 233 240))' }}>
              <th className="w-12 text-xs font-semibold opacity-40 px-2 py-2 text-center" />
              {HOURS.map((h) => (
                <th key={h} className="text-xs font-normal opacity-40 py-2 text-center" style={{ minWidth: '32px' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAY_NAMES.map((day, dayIdx) => (
              <tr
                key={day}
                style={{ borderBottom: dayIdx < 6 ? '1px solid rgb(var(--border-default, 229 233 240))' : undefined }}
              >
                <td className="text-xs font-semibold opacity-50 px-2 py-1.5 text-center shrink-0">{day}</td>
                {HOURS.map((hour) => {
                  const active = grid[dayIdx][hour]
                  return (
                    <td key={hour} className="p-0.5">
                      <div
                        role="checkbox"
                        aria-checked={active}
                        aria-label={`${day} ${padTime(hour)}`}
                        className="w-full h-7 rounded cursor-pointer select-none transition-colors"
                        style={{
                          background: active
                            ? 'rgb(var(--status-success, 14 124 90) / 0.75)'
                            : 'rgb(var(--surface-card-2, 248 250 252))',
                        }}
                        onMouseDown={() => {
                          setIsDragging(true)
                          setDragValue(!active)
                          toggleCell(dayIdx, hour, !active)
                        }}
                        onMouseEnter={() => {
                          if (isDragging) toggleCell(dayIdx, hour, dragValue)
                        }}
                        onMouseUp={() => setIsDragging(false)}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
