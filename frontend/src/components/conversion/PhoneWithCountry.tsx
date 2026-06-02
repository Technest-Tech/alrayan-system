'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { COUNTRIES, flagEmoji } from '@/lib/system/countries'

type CountryRow = (typeof COUNTRIES)[number]

interface PhoneWithCountryProps {
  id: string
  value: string
  onChange: (combined: string) => void
  defaultCountry?: string
  disabled?: boolean
  invalid?: boolean
  placeholder?: string
}

function findByDial(value: string): CountryRow | undefined {
  if (!value.startsWith('+')) return undefined
  // Longest dial-code match wins (e.g. +1, +1242, +1284)
  return [...COUNTRIES]
    .sort((a, b) => b.dialCode.length - a.dialCode.length)
    .find((c) => value.startsWith(c.dialCode))
}

export function PhoneWithCountry({
  id,
  value,
  onChange,
  defaultCountry = 'EG',
  disabled,
  invalid,
  placeholder = '12 345 6789',
}: PhoneWithCountryProps) {
  const initial = useMemo(
    () => findByDial(value) ?? COUNTRIES.find((c) => c.code === defaultCountry) ?? COUNTRIES[0],
    // intentionally only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  const [country, setCountry] = useState<CountryRow>(initial)
  const [local, setLocal] = useState<string>(() => {
    const matched = findByDial(value)
    return matched ? value.slice(matched.dialCode.length).replace(/^\s+/, '') : ''
  })
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => searchRef.current?.focus(), 30)
      return () => clearTimeout(t)
    }
    setSearch('')
  }, [open])

  useEffect(() => {
    if (!open) return
    function onOutside(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  const filtered = COUNTRIES.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.dialCode.includes(q)
    )
  })

  function emit(next: { country?: CountryRow; local?: string }) {
    const c = next.country ?? country
    const l = (next.local ?? local).replace(/[^\d]/g, '')
    onChange(l ? `${c.dialCode}${l}` : '')
  }

  function pickCountry(c: CountryRow) {
    setCountry(c)
    setOpen(false)
    emit({ country: c })
  }

  function onLocalChange(v: string) {
    const cleaned = v.replace(/[^\d\s]/g, '')
    setLocal(cleaned)
    emit({ local: cleaned })
  }

  return (
    <div ref={wrapRef} className="relative">
      <div
        className={`flex items-stretch rounded-lg border bg-transparent transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 ${
          invalid ? 'border-destructive ring-3 ring-destructive/20' : 'border-input'
        } ${disabled ? 'opacity-50' : ''}`}
      >
        <button
          type="button"
          onClick={() => !disabled && setOpen((v) => !v)}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Country code"
          className="flex items-center gap-1.5 px-3 border-r border-input bg-secondary/5 hover:bg-secondary/10 rounded-l-lg text-sm text-primary transition-colors disabled:cursor-not-allowed"
        >
          <span className="text-base leading-none">{flagEmoji(country.code)}</span>
          <span className="font-medium tabular-nums">{country.dialCode}</span>
          <ChevronDown className="size-3.5 opacity-60" aria-hidden="true" />
        </button>

        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={local}
          onChange={(e) => onLocalChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className="flex-1 h-10 bg-transparent px-3 text-sm text-primary outline-none disabled:cursor-not-allowed"
        />
      </div>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full sm:w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border-soft bg-white shadow-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border-soft">
            <Search size={14} className="opacity-40 shrink-0" aria-hidden="true" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country or code…"
              className="flex-1 bg-transparent text-sm text-primary outline-none"
            />
          </div>
          <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-muted-foreground">No results</li>
            )}
            {filtered.map((c) => {
              const active = c.code === country.code
              return (
                <li key={c.code} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      pickCountry(c)
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-secondary/5 transition-colors ${
                      active ? 'bg-secondary/10 text-secondary font-medium' : 'text-primary'
                    }`}
                  >
                    <span className="text-base leading-none w-5 shrink-0">{flagEmoji(c.code)}</span>
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="text-xs tabular-nums text-muted-foreground shrink-0">{c.dialCode}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
