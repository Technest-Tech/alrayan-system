'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

// Common countries — extend as needed
const COUNTRIES = [
  { code: 'EG', label: 'Egypt' },
  { code: 'SA', label: 'Saudi Arabia' },
  { code: 'AE', label: 'UAE' },
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' },
  { code: 'CA', label: 'Canada' },
  { code: 'AU', label: 'Australia' },
  { code: 'KW', label: 'Kuwait' },
  { code: 'QA', label: 'Qatar' },
  { code: 'JO', label: 'Jordan' },
  { code: 'LB', label: 'Lebanon' },
  { code: 'TR', label: 'Turkey' },
]

interface CountrySelectProps {
  value: string
  onChange: (code: string) => void
  disabled?: boolean
}

export function CountrySelect({ value, onChange, disabled }: CountrySelectProps) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const selected = COUNTRIES.find(c => c.code === value)
  const filtered = COUNTRIES.filter(c => c.label.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm outline-none disabled:opacity-50"
        style={{ borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }}
      >
        <span>{selected?.label ?? 'Select country'}</span>
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
                placeholder="Search…"
                value={q}
                onChange={e => setQ(e.target.value)}
                className="w-full px-2 py-1 text-sm bg-transparent outline-none"
              />
            </div>
            <ul className="max-h-48 overflow-y-auto py-1">
              {filtered.map(c => (
                <li key={c.code}>
                  <button
                    type="button"
                    onClick={() => { onChange(c.code); setOpen(false); setQ('') }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-black/5 transition-colors"
                  >
                    {c.label}
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
