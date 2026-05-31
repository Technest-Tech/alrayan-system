'use client'
import { useState, useRef, useEffect, CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Search } from 'lucide-react'
import { COUNTRIES, flagEmoji } from '@/lib/system/countries'

interface WhatsAppInputProps {
  value: string
  onChange: (fullNumber: string) => void
  /** When the parent country changes, pass the new dial code here to auto-sync. */
  syncDialCode?: string
  inputClassName?: string
  inputStyle?: React.CSSProperties
}

function parseNumber(value: string): { dialCode: string; local: string } {
  if (!value) return { dialCode: '', local: '' }
  const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length)
  for (const c of sorted) {
    if (value.startsWith(c.dialCode)) {
      return { dialCode: c.dialCode, local: value.slice(c.dialCode.length) }
    }
  }
  return { dialCode: '', local: value }
}

export function WhatsAppInput({
  value,
  onChange,
  syncDialCode,
  inputClassName,
  inputStyle,
}: WhatsAppInputProps) {
  const parsed = parseNumber(value)
  const initialDialCode = parsed.dialCode || syncDialCode || '+1'
  const [dialCode, setDialCode]       = useState(initialDialCode)
  const [pickedCode, setPickedCode]   = useState(() => COUNTRIES.find(c => c.dialCode === initialDialCode)?.code ?? '')
  const [local, setLocal]             = useState(parsed.local)
  const [open, setOpen]         = useState(false)
  const [search, setSearch]     = useState('')
  const [touched, setTouched]   = useState(false)
  const [dropPos, setDropPos]   = useState<{ top: number; left: number } | null>(null)
  const triggerRef              = useRef<HTMLButtonElement>(null)
  const dropdownRef             = useRef<HTMLDivElement>(null)
  const containerRef            = useRef<HTMLDivElement>(null)
  const searchRef               = useRef<HTMLInputElement>(null)

  // Sync dial code when parent country selection changes
  useEffect(() => {
    if (syncDialCode && syncDialCode !== dialCode) {
      setDialCode(syncDialCode)
      setPickedCode(COUNTRIES.find(c => c.dialCode === syncDialCode)?.code ?? '')
      setLocal('')
      onChange(syncDialCode)
      setTouched(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncDialCode])

  // Find country entry for the current picked code (falls back to first dial code match)
  const selectedCountry = COUNTRIES.find((c) => c.code === pickedCode) ?? COUNTRIES.find((c) => c.dialCode === dialCode)
  const digitRange      = selectedCountry?.digits as readonly [number, number] | undefined

  // Digit count (digits only, no spaces)
  const digitCount = local.replace(/\D/g, '').length

  const isValid   = !digitRange || local.length === 0 || (digitCount >= digitRange[0] && digitCount <= digitRange[1])
  const showError = touched && local.length > 0 && !isValid
  const errorMsg  = digitRange
    ? digitRange[0] === digitRange[1]
      ? `Expected ${digitRange[0]} digits for ${selectedCountry?.name}`
      : `Expected ${digitRange[0]}–${digitRange[1]} digits for ${selectedCountry?.name}`
    : ''

  const options = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.dialCode.includes(search),
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
      setDropPos({ top: r.bottom + 4, left: r.left })
    }
    setOpen((v) => !v)
  }

  function pickCountry(countryCode: string, dc: string) {
    setDialCode(dc)
    setPickedCode(countryCode)
    setLocal('')
    onChange(dc)
    setTouched(false)
    setOpen(false)
  }

  function handleLocalChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Digits only; cap at max if a range is known
    const raw    = e.target.value.replace(/\D/g, '')
    const capped = digitRange ? raw.slice(0, digitRange[1]) : raw
    setLocal(capped)
    onChange(dialCode + capped)
  }

  const hasError = showError
  const btnStyle: React.CSSProperties = {
    ...inputStyle,
    borderRadius: '0.5rem 0 0 0.5rem',
    borderRight: 'none',
    ...(hasError ? { borderColor: 'rgb(239 68 68)' } : {}),
  }
  const numStyle: React.CSSProperties = {
    ...inputStyle,
    borderRadius: '0 0.5rem 0.5rem 0',
    ...(hasError ? { borderColor: 'rgb(239 68 68)' } : {}),
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex">
        {/* ── Dial-code picker ── */}
        <button
          ref={triggerRef}
          type="button"
          onClick={handleOpen}
          className="flex items-center gap-1.5 px-3 py-2 border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] shrink-0 transition-shadow"
          style={btnStyle}
        >
          {selectedCountry ? (
            <>
              <span className="text-base leading-none">{flagEmoji(selectedCountry.code)}</span>
              <span className="text-xs font-medium opacity-70">{dialCode}</span>
            </>
          ) : (
            <span className="text-xs opacity-40">{dialCode || '+?'}</span>
          )}
          <ChevronDown size={12} className="opacity-40 ml-0.5" />
        </button>

        {/* ── Number input ── */}
        <input
          type="tel"
          inputMode="numeric"
          className={`flex-1 px-3 py-2 border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] transition-shadow ${inputClassName ?? ''}`}
          style={numStyle}
          placeholder={
            digitRange
              ? digitRange[0] === digitRange[1]
                ? `${digitRange[0]} digits`
                : `${digitRange[0]}–${digitRange[1]} digits`
              : 'Number'
          }
          value={local}
          onChange={handleLocalChange}
          onBlur={() => setTouched(true)}
        />
      </div>

      {/* ── Validation error ── */}
      {showError && (
        <p className="text-red-500 text-[11px] mt-1">{errorMsg}</p>
      )}

      {/* ── Dropdown ── */}
      {open && dropPos && (
        <div
          ref={dropdownRef}
          className="rounded-xl border shadow-xl overflow-hidden"
          style={{
            position: 'fixed',
            top: dropPos.top,
            left: dropPos.left,
            width: 256,
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
              placeholder="Search country or +code…"
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {options.length === 0 && (
              <li className="px-3 py-2 text-sm opacity-40">No results</li>
            )}
            {options.map((c) => (
              <li
                key={c.code}
                onMouseDown={(e) => {
                  e.preventDefault()
                  pickCountry(c.code, c.dialCode)
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors"
                style={
                  selectedCountry?.code === c.code
                    ? { background: 'rgb(14 124 90 / 0.08)', color: 'rgb(14 124 90)', fontWeight: 500 }
                    : undefined
                }
              >
                <span className="text-base leading-none w-5 shrink-0">{flagEmoji(c.code)}</span>
                <span className="flex-1 truncate">{c.name}</span>
                <span className="text-[11px] opacity-35 shrink-0">{c.code}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
