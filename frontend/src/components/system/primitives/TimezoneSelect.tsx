'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useI18n } from '@/lib/system/i18n'

const TIMEZONES = [
  'Africa/Cairo',
  'Africa/Riyadh',
  'Asia/Dubai',
  'Asia/Kuwait',
  'Asia/Qatar',
  'Asia/Amman',
  'Asia/Beirut',
  'Asia/Istanbul',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'Australia/Sydney',
  'UTC',
]

interface TimezoneSelectProps {
  value: string
  onChange: (tz: string) => void
  disabled?: boolean
}

export function TimezoneSelect({ value, onChange, disabled }: TimezoneSelectProps) {
  const { t } = useI18n()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const filtered = TIMEZONES.filter(tz => tz.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm outline-none disabled:opacity-50"
        style={{ borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }}
      >
        <span>{value || t('pickers.selectTimezone')}</span>
        <ChevronDown size={14} className="opacity-50" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => { setOpen(false); setQ('') }} />
          <div
            className="absolute top-full left-0 right-0 mt-1 z-20 rounded-xl border shadow-lg overflow-hidden"
            style={{ background: 'rgb(var(--surface-card, 255 255 255))', borderColor: 'rgb(var(--border-default, 229 233 240))' }}
          >
            <div className="p-2 border-b" style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}>
              <input
                autoFocus
                type="text"
                placeholder={t('pickers.searchPlaceholder')}
                value={q}
                onChange={e => setQ(e.target.value)}
                className="w-full px-2 py-1 text-sm bg-transparent outline-none"
              />
            </div>
            <ul className="max-h-48 overflow-y-auto py-1">
              {filtered.map(tz => (
                <li key={tz}>
                  <button
                    type="button"
                    onClick={() => { onChange(tz); setOpen(false); setQ('') }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-black/5 transition-colors font-mono"
                  >
                    {tz}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
