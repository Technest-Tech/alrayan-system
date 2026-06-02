'use client'
import { useState, useRef, useEffect, CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Search } from 'lucide-react'
import { COUNTRIES, flagEmoji } from '@/lib/system/countries'

interface CountryComboboxProps {
  value: string
  onChange: (code: string, timezone: string, dialCode: string) => void
}

const DROPDOWN_MAX_H = 220 // px, matches max-h-52

export function CountryCombobox({ value, onChange }: CountryComboboxProps) {
  const [open, setOpen]               = useState(false)
  const [search, setSearch]           = useState('')
  const [dropStyle, setDropStyle]     = useState<CSSProperties>({})
  const containerRef                  = useRef<HTMLDivElement>(null)
  const dropdownRef                   = useRef<HTMLDivElement>(null)
  const searchRef                     = useRef<HTMLInputElement>(null)

  const selected = COUNTRIES.find((c) => c.code === value)
  const filtered = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()),
  )

  function calcPosition() {
    if (!containerRef.current) return
    const rect        = containerRef.current.getBoundingClientRect()
    const spaceBelow  = window.innerHeight - rect.bottom
    const openUpward  = spaceBelow < DROPDOWN_MAX_H + 60 && rect.top > spaceBelow

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

  // Close on outside click (portal-aware: check both refs)
  useEffect(() => {
    if (!open) return
    function onOutside(e: MouseEvent) {
      const t = e.target as Node
      if (!containerRef.current?.contains(t) && !dropdownRef.current?.contains(t)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  // Close when an ancestor scrolls, but not when the dropdown list itself scrolls
  useEffect(() => {
    if (!open) return
    function onScroll(e: Event) {
      if (dropdownRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    window.addEventListener('scroll', onScroll, true)
    return () => window.removeEventListener('scroll', onScroll, true)
  }, [open])

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
          placeholder="Search country…"
          className="flex-1 bg-transparent text-sm outline-none"
        />
      </div>

      <ul className="max-h-52 overflow-y-auto py-1">
        {filtered.length === 0 && (
          <li className="px-3 py-2 text-sm opacity-40">No results</li>
        )}
        {filtered.map((c) => (
          <li
            key={c.code}
            onMouseDown={(e) => {
              e.preventDefault()
              onChange(c.code, c.timezone, c.dialCode)
              setOpen(false)
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors"
            style={
              c.code === value
                ? { background: 'rgb(14 124 90 / 0.08)', color: 'rgb(14 124 90)', fontWeight: 500 }
                : undefined
            }
          >
            <span className="text-base leading-none w-5 shrink-0">{flagEmoji(c.code)}</span>
            <span className="flex-1">{c.name}</span>
            <span className="text-[11px] opacity-35 shrink-0">{c.code}</span>
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
        {selected ? (
          <>
            <span className="text-base leading-none">{flagEmoji(selected.code)}</span>
            <span className="flex-1 truncate">{selected.name}</span>
            <span className="text-[11px] opacity-40 shrink-0">{selected.code}</span>
          </>
        ) : (
          <span className="flex-1 opacity-40">Select country…</span>
        )}
        <ChevronDown size={13} className="opacity-40 shrink-0 ml-1" />
      </button>

      {open && typeof document !== 'undefined' && createPortal(dropdown, document.body)}
    </div>
  )
}
