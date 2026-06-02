'use client'
import { useState, useRef, useEffect, CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Search, Clock } from 'lucide-react'
import { getTimezonesForCountry, tzLabel, tzOffset } from '@/lib/system/timezones'

interface TimezoneComboboxProps {
  value: string
  onChange: (tz: string) => void
  countryCode: string
}

const DROPDOWN_MAX_H = 220

export function TimezoneCombobox({ value, onChange, countryCode }: TimezoneComboboxProps) {
  const [open, setOpen]           = useState(false)
  const [search, setSearch]       = useState('')
  const [dropStyle, setDropStyle] = useState<CSSProperties>({})
  const containerRef              = useRef<HTMLDivElement>(null)
  const dropdownRef               = useRef<HTMLDivElement>(null)
  const searchRef                 = useRef<HTMLInputElement>(null)

  const zones    = getTimezonesForCountry(countryCode)
  const filtered = zones.filter((tz) =>
    tz.toLowerCase().includes(search.toLowerCase()) ||
    tzLabel(tz).toLowerCase().includes(search.toLowerCase()),
  )

  // Auto-select when the country produces exactly one timezone
  useEffect(() => {
    if (zones.length === 1 && zones[0] !== value) {
      onChange(zones[0])
    }
    // Clear value if it doesn't belong to the new country's zones
    if (zones.length > 1 && value && !zones.includes(value)) {
      onChange('')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCode])

  function calcPosition() {
    if (!containerRef.current) return
    const rect       = containerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const openUpward = spaceBelow < DROPDOWN_MAX_H + 60 && rect.top > spaceBelow
    setDropStyle(
      openUpward
        ? { position: 'fixed', bottom: window.innerHeight - rect.top + 4, left: rect.left, width: rect.width, zIndex: 9999 }
        : { position: 'fixed', top: rect.bottom + 4,                      left: rect.left, width: rect.width, zIndex: 9999 },
    )
  }

  useEffect(() => {
    if (open) {
      calcPosition()
      const t = setTimeout(() => searchRef.current?.focus(), 40)
      return () => clearTimeout(t)
    } else {
      setSearch('')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return
    function onOutside(e: MouseEvent) {
      const t = e.target as Node
      if (!containerRef.current?.contains(t) && !dropdownRef.current?.contains(t)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  useEffect(() => {
    if (!open) return
    function onScroll(e: Event) {
      if (dropdownRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    window.addEventListener('scroll', onScroll, true)
    return () => window.removeEventListener('scroll', onScroll, true)
  }, [open])

  // If no country selected yet, render a disabled placeholder
  if (!countryCode) {
    return (
      <div
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm opacity-40 cursor-not-allowed"
        style={{ borderColor: 'rgb(var(--border-default,229 233 240))', background: '#fff' }}
      >
        <Clock size={13} />
        <span>Select a country first</span>
      </div>
    )
  }

  // Single timezone: show as static read-only chip
  if (zones.length === 1) {
    return (
      <div
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm"
        style={{ borderColor: 'rgb(var(--border-default,229 233 240))', background: '#f9fafb' }}
      >
        <Clock size={13} className="opacity-40 shrink-0" />
        <span className="flex-1 truncate">{tzLabel(zones[0])}</span>
        <span className="text-[11px] opacity-40 shrink-0">{tzOffset(zones[0])}</span>
      </div>
    )
  }

  const dropdown = (
    <div
      ref={dropdownRef}
      className="rounded-xl border shadow-xl overflow-hidden"
      style={{ ...dropStyle, background: '#fff', borderColor: 'rgb(var(--border-default,229 233 240))' }}
    >
      <div
        className="flex items-center gap-2 px-3 py-2 border-b"
        style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}
      >
        <Search size={13} className="opacity-40 shrink-0" />
        <input
          ref={searchRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search timezone…"
          className="flex-1 bg-transparent text-sm outline-none"
        />
      </div>
      <ul className="max-h-52 overflow-y-auto py-1">
        {filtered.length === 0 && (
          <li className="px-3 py-2 text-sm opacity-40">No results</li>
        )}
        {filtered.map((tz) => (
          <li
            key={tz}
            onMouseDown={(e) => {
              e.preventDefault()
              onChange(tz)
              setOpen(false)
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors"
            style={
              tz === value
                ? { background: 'rgb(14 124 90 / 0.08)', color: 'rgb(14 124 90)', fontWeight: 500 }
                : undefined
            }
          >
            <span className="flex-1">{tzLabel(tz)}</span>
            <span className="text-[11px] opacity-35 shrink-0 tabular-nums">{tzOffset(tz)}</span>
          </li>
        ))}
      </ul>
    </div>
  )

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] transition-shadow text-left"
        style={{ borderColor: 'rgb(var(--border-default,229 233 240))', background: '#fff' }}
      >
        <Clock size={13} className="opacity-40 shrink-0" />
        {value ? (
          <>
            <span className="flex-1 truncate">{tzLabel(value)}</span>
            <span className="text-[11px] opacity-40 shrink-0">{tzOffset(value)}</span>
          </>
        ) : (
          <span className="flex-1 opacity-40">Select timezone…</span>
        )}
        <ChevronDown size={13} className="opacity-40 shrink-0 ml-1" />
      </button>

      {open && typeof document !== 'undefined' && createPortal(dropdown, document.body)}
    </div>
  )
}
