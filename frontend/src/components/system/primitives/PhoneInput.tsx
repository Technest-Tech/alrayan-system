'use client'

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  defaultCountry?: string
  disabled?: boolean
  placeholder?: string
}

export function PhoneInput({ value, onChange, placeholder = '+1 555 000 0000', disabled }: PhoneInputProps) {
  return (
    <input
      type="tel"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] disabled:opacity-50"
      style={{ borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }}
    />
  )
}
