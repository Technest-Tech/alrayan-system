'use client'
import { useRef, useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { useI18n } from '@/lib/system/i18n'

export interface SelectOption {
  value: string
  label: string
}

interface Props {
  options:      SelectOption[]
  value:        string
  onChange:     (v: string) => void
  placeholder?: string
  clearable?:   boolean
  className?:   string
  style?:       React.CSSProperties
}

const BORDER   = 'rgb(var(--border-default,229 233 240))'
const NAVY     = 'rgb(11 31 58)'
const MUTED    = 'rgb(90 100 112)'
const TEAL_50  = '#F0FDFA'
const TEAL_100 = '#CCFBF1'
const TEAL_600 = '#0d9488'

export function SearchableSelect({ options, value, onChange, placeholder, clearable, className, style }: Props) {
  const { t } = useI18n()
  placeholder = placeholder ?? t('lessons.selectPlaceholder')
  const [open,  setOpen]  = useState(false)
  const [query, setQuery] = useState('')
  const [pos,   setPos]   = useState<{ top?: number; bottom?: number; left: number; width: number } | null>(null)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const searchRef  = useRef<HTMLInputElement>(null)
  const dropRef    = useRef<HTMLDivElement>(null)

  const selected = options.find(o => o.value === value)
  const filtered = query.trim()
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  const calcPos = useCallback(() => {
    if (!triggerRef.current) return null
    const r = triggerRef.current.getBoundingClientRect()
    const DROPDOWN_H = 260
    const spaceBelow = window.innerHeight - r.bottom
    const openUp = spaceBelow < DROPDOWN_H && r.top > spaceBelow
    return openUp
      ? { bottom: window.innerHeight - r.top + 4, left: r.left, width: r.width }
      : { top: r.bottom + 4,                       left: r.left, width: r.width }
  }, [])

  const openDropdown = useCallback(() => {
    setPos(calcPos())
    setOpen(true)
    setQuery('')
  }, [calcPos])

  const close = useCallback(() => { setOpen(false); setQuery('') }, [])

  const select = useCallback((v: string) => { onChange(v); close() }, [onChange, close])

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 10)
  }, [open])

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      const t = e.target as Node
      if (!triggerRef.current?.contains(t) && !dropRef.current?.contains(t)) close()
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [open, close])

  useEffect(() => {
    if (!open) return
    function update() { setPos(calcPos()) }
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open, calcPos])

  useEffect(() => {
    if (!open) return
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, close])

  return (
    <div className={className} style={style}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={open ? close : openDropdown}
        className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#0d9488] transition-shadow bg-white flex items-center justify-between gap-2 text-left"
        style={{ borderColor: open ? TEAL_600 : BORDER }}
      >
        <span className="truncate flex-1 min-w-0" style={{ color: selected ? NAVY : MUTED }}>
          {selected ? selected.label : placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {clearable && value && (
            <span
              role="button"
              onClick={e => { e.stopPropagation(); onChange('') }}
              className="p-0.5 rounded hover:bg-black/10 cursor-pointer"
            >
              <X size={11} style={{ color: MUTED }} />
            </span>
          )}
          <ChevronDown
            size={14}
            style={{
              color:     MUTED,
              transform: open ? 'rotate(180deg)' : undefined,
              transition: 'transform 0.15s',
            }}
          />
        </div>
      </button>

      {/* Floating dropdown — portaled to <body> so an ancestor's CSS transform
          (e.g. the slide-in drawer) can't become its containing block and shove
          the fixed-positioned menu off-screen. */}
      {open && pos && typeof document !== 'undefined' && createPortal(
        <div ref={dropRef} className="fixed z-[9999]" style={pos}>
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: '#fff', border: `1px solid ${TEAL_100}`, boxShadow: '0 8px 28px rgb(0 0 0 / 0.14)' }}
          >
            {/* Search bar */}
            <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: `1px solid ${TEAL_100}` }}>
              <Search size={13} style={{ color: MUTED, flexShrink: 0 }} />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('common.search')}
                className="flex-1 text-sm outline-none bg-transparent min-w-0"
                style={{ color: NAVY }}
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} className="shrink-0 p-0.5">
                  <X size={11} style={{ color: MUTED }} />
                </button>
              )}
            </div>

            {/* Option list */}
            <div className="overflow-y-auto" style={{ maxHeight: 200 }}>
              {filtered.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: MUTED }}>{t('common.noResults')}</p>
              ) : filtered.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => select(o.value)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-[#F0FDFA]"
                  style={{ color: NAVY, background: o.value === value ? TEAL_50 : undefined }}
                >
                  <span className="truncate">{o.label}</span>
                  {o.value === value && <Check size={13} style={{ color: TEAL_600, flexShrink: 0 }} />}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
