'use client'
import { useState } from 'react'
import { DayPicker, type DateRange } from 'react-day-picker'
import { CalendarDays } from 'lucide-react'
import 'react-day-picker/style.css'

export type { DateRange }

interface DateRangePickerProps {
  value?: DateRange
  onChange: (range: DateRange | undefined) => void
  disabled?: boolean
  placeholder?: string
}

function formatRange(range?: DateRange): string {
  if (!range?.from) return ''
  const from = range.from.toLocaleDateString()
  if (!range.to) return from
  return `${from} – ${range.to.toLocaleDateString()}`
}

export function DateRangePicker({ value, onChange, disabled, placeholder = 'Select date range' }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm disabled:opacity-50"
        style={{ borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }}
      >
        <CalendarDays size={14} className="opacity-50" />
        <span className={value?.from ? '' : 'opacity-40'}>
          {formatRange(value) || placeholder}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute top-full left-0 mt-1 z-20 rounded-xl border shadow-lg p-3"
            style={{ background: 'rgb(var(--surface-card, 255 255 255))', borderColor: 'rgb(var(--border-default, 229 233 240))' }}
          >
            <DayPicker
              mode="range"
              selected={value}
              onSelect={range => {
                onChange(range)
                if (range?.from && range?.to) setOpen(false)
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}
