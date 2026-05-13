'use client'
import { useState } from 'react'

interface MoneyInputProps {
  /** Amount in smallest currency unit (cents) */
  value: number
  onChange: (cents: number) => void
  currency?: string
  placeholder?: string
  disabled?: boolean
}

export function MoneyInput({ value, onChange, currency = 'USD', placeholder = '0.00', disabled }: MoneyInputProps) {
  const [display, setDisplay] = useState(() => (value / 100).toFixed(2))

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDisplay(e.target.value)
    const parsed = parseFloat(e.target.value)
    if (!isNaN(parsed)) onChange(Math.round(parsed * 100))
  }

  function handleBlur() {
    const parsed = parseFloat(display)
    if (!isNaN(parsed)) {
      setDisplay(parsed.toFixed(2))
      onChange(Math.round(parsed * 100))
    } else {
      setDisplay((value / 100).toFixed(2))
    }
  }

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm opacity-50">{currency}</span>
      <input
        type="number"
        step="0.01"
        value={display}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full pl-14 pr-3 py-2 rounded-lg border text-sm tabular outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] disabled:opacity-50"
        style={{ borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }}
      />
    </div>
  )
}
