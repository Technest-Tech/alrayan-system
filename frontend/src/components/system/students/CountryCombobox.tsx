'use client'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { COUNTRIES, flagEmoji } from '@/lib/system/countries'
import { useI18n } from '@/lib/system/i18n'

interface CountryComboboxProps {
  value: string
  onChange: (code: string, timezone: string, dialCode: string) => void
}

export function CountryCombobox({ value, onChange }: CountryComboboxProps) {
  const { t } = useI18n()
  const [open, setOpen]       = useState(false)
  const [search, setSearch]   = useState('')
  const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const triggerRef            = useRef<HTMLButtonElement>(null)
  const dropdownRef           = useRef<HTMLDivElement>(null)
  const searchRef             = useRef<HTMLInputElement>(null)

  const selected = COUNTRIES.find((c) => c.code === value)
  const filtered = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()),
  )

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => searchRef.current?.focus(), 40)
      return () => clearTimeout(t)
    } else {
      setSearch('')
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onOutside(e: MouseEvent) {
      const inTrigger  = triggerRef.current?.contains(e.target as Node)
      const inDropdown = dropdownRef.current?.contains(e.target as Node)
      if (!inTrigger && !inDropdown) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  function handleOpen() {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      setDropPos({ top: r.bottom + 4, left: r.left, width: r.width })
    }
    setOpen((v) => !v)
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
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
          <span className="flex-1 opacity-40">{t('students.selectCountry')}</span>
        )}
        <ChevronDown size={13} className="opacity-40 shrink-0 ml-1" />
      </button>

      {open && dropPos && (
        <div
          ref={dropdownRef}
          className="rounded-xl border shadow-xl overflow-hidden"
          style={{
            position: 'fixed',
            top: dropPos.top,
            left: dropPos.left,
            width: dropPos.width,
            zIndex: 9999,
            background: '#fff',
            borderColor: 'rgb(var(--border-default,229 233 240))',
          }}
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
              placeholder={t('students.searchCountry')}
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>

          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm opacity-40">{t('common.noResults')}</li>
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
      )}
    </div>
  )
}
