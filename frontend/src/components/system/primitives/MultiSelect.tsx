'use client'
import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { useI18n } from '@/lib/system/i18n'

export interface MultiSelectOption {
  value: string
  label: string
}

const BORDER    = 'rgb(var(--border-default,229 233 240))'
const MUTED     = 'rgb(90 100 112)'
const TEAL_100  = '#CCFBF1'
const TEAL_600  = '#0d9488'

/**
 * Chips + searchable checkbox dropdown. Collapsed it reads as a normal input showing
 * the picked values as removable chips; open it becomes a filterable list.
 */
export function MultiSelect({
  value, onChange, options, placeholder,
}: {
  value: string[]
  onChange: (v: string[]) => void
  options: MultiSelectOption[]
  placeholder?: string
}) {
  const { t } = useI18n()
  placeholder = placeholder ?? t('common.selectPlaceholder')
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const containerRef        = useRef<HTMLDivElement>(null)
  const inputRef            = useRef<HTMLInputElement>(null)

  const filtered = search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) { setOpen(false); setSearch('') }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  useEffect(() => { if (open) inputRef.current?.focus() }, [open])

  const toggle = (v: string) => onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v])
  const labelFor = (v: string) => options.find(o => o.value === v)?.label ?? v

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-left bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9488] transition-shadow min-h-[42px]"
        style={{ borderColor: BORDER }}
      >
        <span className="flex-1 flex flex-wrap gap-1">
          {value.length === 0
            ? <span className="opacity-40">{placeholder}</span>
            : value.map(v => (
                <span key={v} className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md" style={{ background: TEAL_100, color: TEAL_600 }}>
                  {labelFor(v)}
                  <span role="button" tabIndex={0} className="hover:opacity-70" onClick={e => { e.stopPropagation(); toggle(v) }}><X size={9} /></span>
                </span>
              ))}
        </span>
        <ChevronDown size={13} className="opacity-40 shrink-0" />
      </button>
    )
  }

  return (
    <div ref={containerRef} className="rounded-xl border overflow-hidden" style={{ borderColor: TEAL_600, boxShadow: '0 0 0 2px rgba(13,148,136,0.12)', background: '#fff' }}>
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: BORDER }}>
        <Search size={12} className="opacity-40 shrink-0" />
        <input ref={inputRef} placeholder={t('common.searchEllipsis')} className="flex-1 text-sm outline-none bg-transparent" value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => { if (e.key === 'Escape') { setOpen(false); setSearch('') } }} />
        <button type="button" className="opacity-40 hover:opacity-100 transition-opacity" onClick={() => { setOpen(false); setSearch('') }}><X size={13} /></button>
      </div>
      <div className="max-h-44 overflow-y-auto">
        {filtered.map(opt => {
          const checked = value.includes(opt.value)
          return (
            <button key={opt.value} type="button"
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-black/5 transition-colors"
              style={checked ? { background: 'rgba(13,148,136,0.07)' } : {}}
              onClick={() => toggle(opt.value)}>
              <span className="flex-1">{opt.label}</span>
              {checked && <Check size={12} style={{ color: TEAL_600 }} />}
            </button>
          )
        })}
        {filtered.length === 0 && (
          <p className="px-3 py-2.5 text-xs" style={{ color: MUTED }}>{t('common.noResultsFor', { query: search })}</p>
        )}
      </div>
    </div>
  )
}
