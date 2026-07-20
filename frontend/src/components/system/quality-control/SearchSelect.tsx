'use client'
import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, Check, X } from 'lucide-react'

const BORDER   = 'rgb(var(--border-default,229 233 240))'
const MUTED    = 'rgb(90 100 112)'
const TEAL_600 = '#0d9488'

export interface SelectOption { value: string; label: string }

/** Compact searchable combobox (client-side filtered) used across the QC modals. */
export function SearchSelect({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  clearable = false,
  disabled = false,
}: {
  value: string
  onChange: (v: string) => void
  options: SelectOption[]
  placeholder?: string
  clearable?: boolean
  disabled?: boolean
}) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const containerRef        = useRef<HTMLDivElement>(null)
  const inputRef            = useRef<HTMLInputElement>(null)

  const selected = options.find(o => o.value === value)
  const filtered = search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false); setSearch('')
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  useEffect(() => { if (open) inputRef.current?.focus() }, [open])

  if (!open) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm text-left bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9488] transition-shadow disabled:opacity-50"
        style={{ borderColor: BORDER }}
      >
        <span className={`flex-1 truncate ${!selected ? 'opacity-40' : ''}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={13} className="opacity-40 shrink-0" />
      </button>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative rounded-xl border"
      style={{ borderColor: TEAL_600, boxShadow: '0 0 0 2px rgba(13,148,136,0.12)', background: '#fff' }}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: BORDER }}>
        <Search size={12} className="opacity-40 shrink-0" />
        <input
          ref={inputRef}
          placeholder="Search…"
          className="flex-1 text-sm outline-none bg-transparent"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Escape') { setOpen(false); setSearch('') }
            if (e.key === 'Enter' && filtered.length === 1) { onChange(filtered[0].value); setOpen(false); setSearch('') }
          }}
        />
        <button type="button" className="opacity-40 hover:opacity-100 transition-opacity" onClick={() => { setOpen(false); setSearch('') }}>
          <X size={13} />
        </button>
      </div>
      <div className="absolute z-20 left-0 right-0 top-full mt-1 rounded-xl border bg-white max-h-52 overflow-y-auto shadow-lg" style={{ borderColor: BORDER }}>
        {clearable && value && (
          <button type="button" className="w-full flex items-center gap-2 px-3 py-1.5 text-xs border-b text-left hover:bg-red-50 transition-colors" style={{ borderColor: BORDER, color: MUTED }}
            onClick={() => { onChange(''); setOpen(false) }}>
            <X size={10} /> Clear
          </button>
        )}
        {filtered.map(opt => (
          <button key={opt.value} type="button"
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-black/5 transition-colors"
            style={opt.value === value ? { background: 'rgba(13,148,136,0.07)' } : {}}
            onClick={() => { onChange(opt.value); setOpen(false); setSearch('') }}>
            <span className="flex-1">{opt.label}</span>
            {opt.value === value && <Check size={12} style={{ color: TEAL_600 }} />}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="px-3 py-2.5 text-xs" style={{ color: MUTED }}>No results</p>
        )}
      </div>
    </div>
  )
}
