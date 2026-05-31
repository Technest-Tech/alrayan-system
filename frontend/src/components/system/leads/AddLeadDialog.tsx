'use client'
import { useState, useRef, useEffect } from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { toast } from 'sonner'
import { X, Plus, Star, Search, ChevronDown, Check, Users, AlertTriangle, GraduationCap } from 'lucide-react'
import { useCreateLead, useUpdateLead, useConvertLead } from '@/hooks/system/useLeads'
import { useCourses } from '@/hooks/system/useCourses'
import { useTeachers } from '@/hooks/system/useTeachers'
import { ApiError } from '@/lib/system/api'
import type { Lead, LeadStatus, LeadPriority, LeadPlatform, LeadSource } from '@/types/system/lead'

/* ── Islamic star path ─────────────────────────── */
const STAR = 'M50,5 L57.65,31.52 L81.82,18.18 L68.48,42.35 L95,50 L68.48,57.65 L81.82,81.82 L57.65,68.48 L50,95 L42.35,68.48 L18.18,81.82 L31.52,57.65 L5,50 L31.52,42.35 L18.18,18.18 L42.35,31.52 Z'

/* ── Ornamental section divider ─────────────────── */
function SectionDivider({ title }: { title: string }) {
  const diamonds = [2, 10, 18, 26, 34, 42, 50, 58]
  return (
    <div className="flex items-center gap-2 my-5">
      <svg width="70" height="14" viewBox="0 0 70 14" aria-hidden className="shrink-0">
        <line x1="0" y1="7" x2="66" y2="7" stroke="#C9A24B" strokeWidth="0.6" opacity="0.4" />
        {diamonds.map(x => (
          <polygon key={x} points={`${x},3 ${x+3},7 ${x},11 ${x-3},7`} fill="#C9A24B" opacity="0.3" />
        ))}
      </svg>
      <svg width="11" height="11" viewBox="0 0 100 100" className="shrink-0" aria-hidden>
        <path d={STAR} fill="#C9A24B" opacity="0.65" />
      </svg>
      <span className="whitespace-nowrap text-[10px] font-semibold tracking-[0.13em] uppercase" style={{ color: 'rgb(90 100 112)' }}>
        {title}
      </span>
      <svg width="11" height="11" viewBox="0 0 100 100" className="shrink-0" aria-hidden>
        <path d={STAR} fill="#C9A24B" opacity="0.65" />
      </svg>
      <svg width="70" height="14" viewBox="0 0 70 14" style={{ transform: 'scaleX(-1)' }} aria-hidden className="shrink-0">
        <line x1="0" y1="7" x2="66" y2="7" stroke="#C9A24B" strokeWidth="0.6" opacity="0.4" />
        {diamonds.map(x => (
          <polygon key={x} points={`${x},3 ${x+3},7 ${x},11 ${x-3},7`} fill="#C9A24B" opacity="0.3" />
        ))}
      </svg>
    </div>
  )
}

/* ── Enrollment alert banner ────────────────────── */
function EnrollmentBanner() {
  return (
    <div
      className="flex items-start gap-3 rounded-xl p-3 mb-1"
      style={{ background: 'rgba(14,124,90,0.08)', border: '1px solid rgba(14,124,90,0.2)' }}
    >
      <GraduationCap size={16} className="shrink-0 mt-0.5" style={{ color: 'rgb(14 124 90)' }} />
      <div>
        <p className="text-xs font-semibold" style={{ color: 'rgb(14 124 90)' }}>Converting to Student</p>
        <p className="text-xs mt-0.5" style={{ color: 'rgb(90 100 112)' }}>
          Fill in the enrollment details below. A student account will be created when you save.
        </p>
      </div>
    </div>
  )
}

/* ── Options ────────────────────────────────────── */
const STATUS_OPTIONS_ADD: { value: LeadStatus; label: string }[] = [
  { value: 'new_lead',            label: 'New Lead' },
  { value: 'interested',          label: 'Interested' },
  { value: 'waiting_for_trial',   label: 'Waiting for Trial' },
  { value: 'waiting_for_payment', label: 'Waiting for Payment' },
  { value: 'not_interested',      label: 'Not Interested' },
  { value: 'lost',                label: 'Lost' },
]

const STATUS_OPTIONS_EDIT: { value: LeadStatus; label: string }[] = [
  ...STATUS_OPTIONS_ADD,
  { value: 'closed', label: 'Closed — Convert to Student' },
]

const PLATFORM_OPTIONS: { value: string; label: string }[] = [
  { value: 'website',   label: 'Website' },
  { value: 'facebook',  label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube',   label: 'YouTube' },
  { value: 'whatsapp',  label: 'WhatsApp' },
  { value: 'tiktok',    label: 'TikTok' },
  { value: 'other',     label: 'Other' },
]

const SOURCE_OPTIONS: { value: string; label: string }[] = [
  { value: 'google_ads',       label: 'Google Ads' },
  { value: 'facebook_ads',     label: 'Facebook Ads' },
  { value: 'instagram_ads',    label: 'Instagram' },
  { value: 'whatsapp_direct',  label: 'WhatsApp Direct' },
  { value: 'student_referral', label: 'Student Referral' },
  { value: 'website_form',     label: 'Website Form' },
  { value: 'manual_entry',     label: 'Manual Entry' },
]

const PRIORITY_OPTIONS: { value: string; label: string }[] = [
  { value: 'low',    label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high',   label: 'High' },
]

const GENDER_OPTIONS: { value: string; label: string }[] = [
  { value: 'male',   label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other',  label: 'Other' },
]

const CURRENCY_OPTIONS: { value: string; label: string }[] = [
  'EUR', 'USD', 'GBP', 'SAR', 'AED', 'MAD', 'OMR', 'QAR', 'KWD', 'BHD'
].map(c => ({ value: c, label: c }))

const PAYMENT_OPTIONS: { value: string; label: string }[] = [
  { value: 'none',          label: 'None' },
  { value: 'card',          label: 'Card' },
  { value: 'cash',          label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
]

const REJECTION_OPTIONS: { value: string; label: string }[] = [
  { value: 'price',          label: 'Price' },
  { value: 'schedule',       label: 'Schedule' },
  { value: 'not_interested', label: 'Not Interested' },
  { value: 'no_response',    label: 'No Response' },
  { value: 'other',          label: 'Other' },
]

const SESSION_DURATION_OPTIONS: { value: string; label: string }[] = [
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '60 minutes' },
]

const TIMEZONE_OPTIONS: { value: string; label: string }[] = [
  'Africa/Algiers', 'Africa/Cairo', 'Africa/Casablanca', 'Africa/Khartoum',
  'Africa/Lagos', 'Africa/Nairobi', 'Africa/Tripoli', 'Africa/Tunis',
  'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/New_York',
  'America/Sao_Paulo', 'America/Toronto', 'America/Vancouver',
  'Asia/Amman', 'Asia/Baghdad', 'Asia/Bahrain', 'Asia/Beirut',
  'Asia/Damascus', 'Asia/Dhaka', 'Asia/Dubai', 'Asia/Istanbul',
  'Asia/Jakarta', 'Asia/Jerusalem', 'Asia/Karachi', 'Asia/Kolkata',
  'Asia/Kuala_Lumpur', 'Asia/Kuwait', 'Asia/Muscat', 'Asia/Qatar',
  'Asia/Riyadh', 'Asia/Singapore',
  'Australia/Melbourne', 'Australia/Sydney',
  'Europe/Amsterdam', 'Europe/Berlin', 'Europe/London',
  'Europe/Madrid', 'Europe/Paris', 'Europe/Rome', 'Europe/Stockholm',
].map(tz => ({ value: tz, label: tz.replace('_', ' ') }))

const COUNTRIES = [
  { code: 'AE', name: 'UAE' }, { code: 'AF', name: 'Afghanistan' },
  { code: 'AL', name: 'Albania' }, { code: 'AU', name: 'Australia' },
  { code: 'AZ', name: 'Azerbaijan' }, { code: 'BD', name: 'Bangladesh' },
  { code: 'BE', name: 'Belgium' }, { code: 'BH', name: 'Bahrain' },
  { code: 'CA', name: 'Canada' }, { code: 'CH', name: 'Switzerland' },
  { code: 'DE', name: 'Germany' }, { code: 'DZ', name: 'Algeria' },
  { code: 'EG', name: 'Egypt' }, { code: 'ES', name: 'Spain' },
  { code: 'ET', name: 'Ethiopia' }, { code: 'FR', name: 'France' },
  { code: 'GB', name: 'United Kingdom' }, { code: 'GH', name: 'Ghana' },
  { code: 'ID', name: 'Indonesia' }, { code: 'IN', name: 'India' },
  { code: 'IQ', name: 'Iraq' }, { code: 'IT', name: 'Italy' },
  { code: 'JO', name: 'Jordan' }, { code: 'KE', name: 'Kenya' },
  { code: 'KW', name: 'Kuwait' }, { code: 'LB', name: 'Lebanon' },
  { code: 'LY', name: 'Libya' }, { code: 'MA', name: 'Morocco' },
  { code: 'ML', name: 'Mali' }, { code: 'MR', name: 'Mauritania' },
  { code: 'MY', name: 'Malaysia' }, { code: 'NE', name: 'Niger' },
  { code: 'NG', name: 'Nigeria' }, { code: 'NL', name: 'Netherlands' },
  { code: 'OM', name: 'Oman' }, { code: 'PK', name: 'Pakistan' },
  { code: 'PS', name: 'Palestine' }, { code: 'QA', name: 'Qatar' },
  { code: 'SA', name: 'Saudi Arabia' }, { code: 'SD', name: 'Sudan' },
  { code: 'SE', name: 'Sweden' }, { code: 'SG', name: 'Singapore' },
  { code: 'SN', name: 'Senegal' }, { code: 'SO', name: 'Somalia' },
  { code: 'SY', name: 'Syria' }, { code: 'TN', name: 'Tunisia' },
  { code: 'TR', name: 'Turkey' }, { code: 'TZ', name: 'Tanzania' },
  { code: 'UG', name: 'Uganda' }, { code: 'US', name: 'United States' },
  { code: 'YE', name: 'Yemen' }, { code: 'ZA', name: 'South Africa' },
].sort((a, b) => a.name.localeCompare(b.name))

function flag(code: string) {
  const off = 0x1f1e6 - 65
  return [...code.toUpperCase()].map(c => String.fromCodePoint(c.charCodeAt(0) + off)).join('')
}

/* ── Shared input styles ────────────────────────── */
const inp = 'w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all focus:ring-2 focus:ring-[#C9A24B33] focus:border-[#C9A24B66]'
const inpStyle = { borderColor: 'rgb(229 233 240)', background: '#fff' }

/* ── Field wrapper ──────────────────────────────── */
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgb(90 100 112)' }}>
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

/* ── Searchable Select ──────────────────────────── */
interface SelectOption { value: string; label: string }

function SearchSelect({
  value, onChange, options, placeholder = 'Select…', clearable = true,
}: {
  value: string
  onChange: (v: string) => void
  options: SelectOption[]
  placeholder?: string
  clearable?: boolean
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
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left focus:outline-none focus:ring-2 focus:ring-[#C9A24B33] focus:border-[#C9A24B66] transition-all"
        style={inpStyle}
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
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: '#C9A24B66', boxShadow: '0 0 0 2px rgba(201,162,75,0.1)', background: '#fff' }}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: 'rgb(229 233 240)' }}>
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
      <div className="max-h-44 overflow-y-auto">
        {clearable && value && (
          <button type="button" className="w-full flex items-center gap-2 px-3 py-1.5 text-xs border-b text-left hover:bg-red-50 transition-colors" style={{ borderColor: 'rgb(229 233 240)', color: 'rgb(90 100 112)' }}
            onClick={() => { onChange(''); setOpen(false) }}>
            <X size={10} /> Clear selection
          </button>
        )}
        {filtered.map(opt => (
          <button key={opt.value} type="button"
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-black/5 transition-colors"
            style={opt.value === value ? { background: 'rgba(201,162,75,0.07)' } : {}}
            onClick={() => { onChange(opt.value); setOpen(false); setSearch('') }}>
            <span className="flex-1">{opt.label}</span>
            {opt.value === value && <Check size={12} style={{ color: '#C9A24B' }} />}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="px-3 py-2.5 text-xs" style={{ color: 'rgb(90 100 112)' }}>No results for "{search}"</p>
        )}
      </div>
    </div>
  )
}

/* ── Country picker ─────────────────────────────── */
function CountryPicker({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const inputRef            = useRef<HTMLInputElement>(null)
  const containerRef        = useRef<HTMLDivElement>(null)
  const selected            = COUNTRIES.find(c => c.code === value)
  const filtered            = search
    ? COUNTRIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().startsWith(search.toLowerCase()))
    : COUNTRIES

  useEffect(() => { if (open) inputRef.current?.focus() }, [open])
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) { setOpen(false); setSearch('') }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  if (!open) return (
    <button type="button" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left focus:outline-none focus:ring-2 focus:ring-[#C9A24B33] focus:border-[#C9A24B66] transition-all" style={inpStyle} onClick={() => setOpen(true)}>
      {selected ? <><span>{flag(selected.code)}</span><span className="flex-1 truncate">{selected.name}</span></> : <span className="flex-1 opacity-40">e.g. Egypt</span>}
      <ChevronDown size={13} className="opacity-40 shrink-0" />
    </button>
  )

  return (
    <div ref={containerRef} className="rounded-lg border overflow-hidden" style={{ borderColor: '#C9A24B66', boxShadow: '0 0 0 2px rgba(201,162,75,0.1)', background: '#fff' }}>
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: 'rgb(229 233 240)' }}>
        <Search size={12} className="opacity-40 shrink-0" />
        <input ref={inputRef} placeholder="Search country…" className="flex-1 text-sm outline-none bg-transparent" value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => { if (e.key === 'Escape') { setOpen(false); setSearch('') } }} />
        <button type="button" className="opacity-40 hover:opacity-100" onClick={() => { setOpen(false); setSearch('') }}><X size={13} /></button>
      </div>
      <div className="max-h-44 overflow-y-auto">
        {value && <button type="button" className="w-full flex items-center gap-2 px-3 py-1.5 text-xs border-b text-left hover:bg-red-50 transition-colors" style={{ borderColor: 'rgb(229 233 240)', color: 'rgb(90 100 112)' }} onClick={() => { onChange(''); setOpen(false) }}><X size={10} />Clear</button>}
        {filtered.map(c => (
          <button key={c.code} type="button" className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-black/5 transition-colors" style={c.code === value ? { background: 'rgba(201,162,75,0.07)' } : {}} onClick={() => { onChange(c.code); setOpen(false); setSearch('') }}>
            <span>{flag(c.code)}</span><span className="flex-1">{c.name}</span>
            {c.code === value && <Check size={12} style={{ color: '#C9A24B' }} />}
          </button>
        ))}
        {filtered.length === 0 && <p className="px-3 py-2.5 text-xs" style={{ color: 'rgb(90 100 112)' }}>No results</p>}
      </div>
    </div>
  )
}

/* ── Multi-contact field ────────────────────────── */
interface ContactEntry { value: string; primary: boolean }

function MultiContactField({ label, entries, onChange, placeholder }: {
  label: string; entries: ContactEntry[]; onChange: (e: ContactEntry[]) => void; placeholder: string
}) {
  const addEntry    = () => onChange([...entries, { value: '', primary: entries.length === 0 }])
  const removeEntry = (i: number) => {
    const next = entries.filter((_, idx) => idx !== i)
    if (next.length && !next.some(e => e.primary)) next[0].primary = true
    onChange(next)
  }
  const setPrimary = (i: number) => onChange(entries.map((e, idx) => ({ ...e, primary: idx === i })))
  const updateVal  = (i: number, v: string) => onChange(entries.map((e, idx) => idx === i ? { ...e, value: v } : e))

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium" style={{ color: 'rgb(90 100 112)' }}>{label}</label>
        <button type="button" onClick={addEntry} className="inline-flex items-center gap-0.5 text-[11px] font-semibold hover:opacity-70 transition-opacity" style={{ color: 'rgb(14 124 90)' }}>
          <Plus size={11} />Add
        </button>
      </div>
      {entries.length === 0 ? (
        <button type="button" onClick={addEntry} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed text-sm text-left hover:bg-black/5 transition-colors" style={{ borderColor: 'rgb(229 233 240)', color: 'rgb(90 100 112)' }}>
          <Plus size={12} className="opacity-40" /><span className="opacity-40 text-xs">{placeholder}</span>
        </button>
      ) : (
        <div className="space-y-1.5">
          {entries.map((entry, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input className={`${inp} flex-1`} style={inpStyle} value={entry.value} onChange={e => updateVal(i, e.target.value)} placeholder={placeholder} />
              <button type="button" onClick={() => setPrimary(i)} className="p-1.5 rounded-lg transition-colors shrink-0" title="Set as primary"
                style={{ background: entry.primary ? 'rgba(201,162,75,0.15)' : 'transparent', color: entry.primary ? '#C9A24B' : 'rgb(203 211 222)' }}>
                <Star size={12} fill={entry.primary ? 'currentColor' : 'none'} />
              </button>
              <button type="button" onClick={() => removeEntry(i)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors shrink-0" style={{ color: 'rgb(203 211 222)' }}>
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Tag input ──────────────────────────────────── */
function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState('')
  const add    = () => { const t = input.trim(); if (t && !value.includes(t)) onChange([...value, t]); setInput('') }
  const remove = (tag: string) => onChange(value.filter(v => v !== tag))
  return (
    <div className="rounded-lg border px-2 py-1.5 flex flex-wrap gap-1 min-h-[38px] focus-within:ring-2 focus-within:ring-[#C9A24B33] focus-within:border-[#C9A24B66] transition-all" style={inpStyle}>
      {value.map(tag => (
        <span key={tag} className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md" style={{ background: 'rgba(14,124,90,0.1)', color: 'rgb(14 124 90)' }}>
          {tag}<button type="button" onClick={() => remove(tag)} className="hover:opacity-70"><X size={9} /></button>
        </span>
      ))}
      <input className="flex-1 min-w-16 text-sm outline-none bg-transparent" value={input} onChange={e => setInput(e.target.value)} placeholder={value.length === 0 ? placeholder : ''}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() }; if (e.key === 'Backspace' && !input && value.length) remove(value[value.length - 1]) }} onBlur={add} />
    </div>
  )
}

/* ── Form state ─────────────────────────────────── */
interface FormState {
  status: LeadStatus; name: string; gender: string; age: string
  country: string; city: string; course_interest_id: string
  sections: string[]; assigned_teacher_id: string
  platform: string; platform_url: string; source: string
  parent_mode: 'adult' | 'new_family' | 'existing'
  package_type: string; package_hours: string; subscription_price: string
  currency: string; payment_method: string
  next_followup: string; priority: LeadPriority; assigned_to: string
  notes: string; rejection_reason: string; is_family_lead: boolean
}

const EMPTY: FormState = {
  status: 'new_lead', name: '', gender: '', age: '', country: '', city: '',
  course_interest_id: '', sections: [], assigned_teacher_id: '',
  platform: '', platform_url: '', source: '', parent_mode: 'adult',
  package_type: '', package_hours: '', subscription_price: '',
  currency: 'EUR', payment_method: 'none',
  next_followup: '', priority: 'medium', assigned_to: '',
  notes: '', rejection_reason: '', is_family_lead: false,
}

/* ── Enrollment state (used when closing a lead) ── */
interface EnrollmentState {
  course_id: string; assigned_teacher_id: string; timezone: string
  student_type: 'adult' | 'child'; sessions_per_month: string
  session_duration_min: string; monthly_price: string; currency: string
  guardian_name: string; guardian_whatsapp: string
}

const EMPTY_ENROLLMENT: EnrollmentState = {
  course_id: '', assigned_teacher_id: '', timezone: 'Africa/Cairo',
  student_type: 'adult', sessions_per_month: '4', session_duration_min: '60',
  monthly_price: '', currency: 'EUR', guardian_name: '', guardian_whatsapp: '',
}

/* ── Dialog ─────────────────────────────────────── */
interface AddLeadDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  lead?: Lead
}

export function AddLeadDialog({ open, onOpenChange, lead }: AddLeadDialogProps) {
  const isEditMode = !!lead
  const isAlreadyClosed = lead?.status === 'closed'

  const create  = useCreateLead()
  const update  = useUpdateLead(lead?.id ?? 0)
  const convert = useConvertLead(lead?.id ?? 0)

  const { data: coursesData } = useCourses()
  const { data: teachersData } = useTeachers({ per_page: 200 } as Parameters<typeof useTeachers>[0])
  const courses  = coursesData ?? []
  const teachers = teachersData?.data ?? []

  const [form,       setForm]       = useState<FormState>(EMPTY)
  const [emails,     setEmails]     = useState<ContactEntry[]>([])
  const [phones,     setPhones]     = useState<ContactEntry[]>([])
  const [enrollment, setEnrollment] = useState<EnrollmentState>(EMPTY_ENROLLMENT)

  const isClosing = isEditMode && !isAlreadyClosed && form.status === 'closed'

  /* Pre-fill when lead changes / dialog opens */
  useEffect(() => {
    if (!open) return
    if (!lead) { setForm(EMPTY); setEmails([]); setPhones([]); setEnrollment(EMPTY_ENROLLMENT); return }

    const payload = lead.payload as Record<string, unknown> | null
    const payloadEmails = (payload?.emails as ContactEntry[] | undefined) ?? []
    const payloadPhones = (payload?.phones as ContactEntry[] | undefined) ?? []

    setForm({
      status:             lead.status,
      name:               lead.name,
      gender:             lead.gender ?? '',
      age:                lead.age ? String(lead.age) : '',
      country:            lead.country ?? '',
      city:               lead.city ?? '',
      course_interest_id: lead.course_interest?.id ? String(lead.course_interest.id) : '',
      sections:           (payload?.sections as string[] | undefined) ?? [],
      assigned_teacher_id: '',
      platform:           lead.platform ?? '',
      platform_url:       lead.platform_url ?? '',
      source:             lead.source ?? '',
      parent_mode:        (payload?.parent_mode as 'adult' | 'new_family' | 'existing' | undefined) ?? 'adult',
      package_type:       lead.package_type ? String(lead.package_type) : '',
      package_hours:      lead.package_hours ? String(lead.package_hours) : '',
      subscription_price: lead.subscription_price ? String(lead.subscription_price) : '',
      currency:           lead.currency ?? 'EUR',
      payment_method:     lead.payment_method ?? 'none',
      next_followup:      (payload?.next_followup as string | undefined) ?? '',
      priority:           lead.priority,
      assigned_to:        lead.assigned_supervisor_id ? String(lead.assigned_supervisor_id) : '',
      notes:              lead.notes ?? '',
      rejection_reason:   lead.rejection_reason ?? '',
      is_family_lead:     lead.is_family_lead,
    })

    setEmails(
      payloadEmails.length > 0 ? payloadEmails
        : lead.email ? [{ value: lead.email, primary: true }] : []
    )
    setPhones(
      payloadPhones.length > 0 ? payloadPhones
        : lead.phone ? [{ value: lead.phone, primary: true }] : []
    )

    setEnrollment({
      ...EMPTY_ENROLLMENT,
      course_id:          lead.course_interest?.id ? String(lead.course_interest.id) : '',
      currency:           lead.currency ?? 'EUR',
      monthly_price:      lead.subscription_price ? String(lead.subscription_price) : '',
    })
  }, [lead, open])

  function set<K extends keyof FormState>(k: K, v: FormState[K]) { setForm(p => ({ ...p, [k]: v })) }
  function setEnr<K extends keyof EnrollmentState>(k: K, v: EnrollmentState[K]) { setEnrollment(p => ({ ...p, [k]: v })) }
  function reset() { setForm(EMPTY); setEmails([]); setPhones([]); setEnrollment(EMPTY_ENROLLMENT) }

  const courseOptions: SelectOption[] = courses.map((c: { id: number; name: string }) => ({ value: String(c.id), label: c.name }))
  const teacherOptions: SelectOption[] = teachers.map((t: { id: number; name: string | null }) => ({ value: String(t.id), label: t.name ?? `Teacher #${t.id}` }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const primaryEmail = emails.find(e => e.primary)?.value || emails[0]?.value || ''
    const primaryPhone = phones.find(p => p.primary)?.value || phones[0]?.value || ''

    const basePayload: Record<string, unknown> = {
      name: form.name,
      email: primaryEmail || undefined, phone: primaryPhone || undefined,
      gender: form.gender || undefined, age: form.age ? Number(form.age) : undefined,
      country: form.country || undefined, city: form.city || undefined,
      course_interest_id: form.course_interest_id || undefined,
      platform: (form.platform as LeadPlatform) || undefined,
      platform_url: form.platform_url || undefined,
      source: (form.source as LeadSource) || undefined,
      package_type: form.package_type ? Number(form.package_type) : undefined,
      package_hours: form.package_hours ? Number(form.package_hours) : undefined,
      subscription_price: form.subscription_price ? Number(form.subscription_price) : undefined,
      currency: form.currency || undefined, payment_method: form.payment_method || undefined,
      priority: form.priority,
      notes: form.notes || undefined, rejection_reason: form.rejection_reason || undefined,
      is_family_lead: form.is_family_lead,
      assigned_supervisor_id: form.assigned_to ? Number(form.assigned_to) : undefined,
      payload: {
        emails: emails.filter(e => e.value),
        phones: phones.filter(p => p.value),
        sections: form.sections,
        parent_mode: form.parent_mode,
        next_followup: form.next_followup || undefined,
      },
    }

    try {
      if (isEditMode) {
        /* ── Edit: don't send status if going to closed (convert handles it) ── */
        const updatePayload = { ...basePayload }
        if (!isClosing) updatePayload.status = form.status
        await update.mutateAsync(updatePayload)

        if (isClosing) {
          await convert.mutateAsync({
            course_id:            Number(enrollment.course_id),
            assigned_teacher_id:  Number(enrollment.assigned_teacher_id),
            timezone:             enrollment.timezone,
            student_type:         enrollment.student_type,
            sessions_per_month:   Number(enrollment.sessions_per_month),
            session_duration_min: Number(enrollment.session_duration_min),
            monthly_price_minor:  Math.round(parseFloat(enrollment.monthly_price || '0') * 100),
            currency:             enrollment.currency,
            guardian_name:        enrollment.guardian_name || undefined,
            guardian_whatsapp:    enrollment.guardian_whatsapp || undefined,
          })
          toast.success('Lead converted to student successfully!')
        } else {
          toast.success('Lead updated.')
        }
      } else {
        /* ── Create ── */
        basePayload.status = form.status
        await create.mutateAsync(basePayload)
        toast.success('Lead created.')
      }
      reset(); onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : isEditMode ? 'Failed to update lead.' : 'Failed to create lead.')
    }
  }

  const isPending = create.isPending || update.isPending || convert.isPending
  const statusOptions = isEditMode ? STATUS_OPTIONS_EDIT : STATUS_OPTIONS_ADD

  return (
    <DialogPrimitive.Root open={open} onOpenChange={v => { if (!v) reset(); onOpenChange(v) }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-[#0B1F3A]/50 backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 duration-200" />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none" style={{ outline: 'none' }}>
          <div
            className="relative pointer-events-auto w-full max-w-2xl max-h-[94vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
            style={{ background: 'rgb(244 246 250)' }}
          >
            {/* ── Header ── */}
            <div
              className="shrink-0 overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #0d2548 0%, #0B1F3A 65%, #071528 100%)' }}
            >
              <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #C9A24B, transparent)' }} />
              <svg className="absolute right-0 top-0 pointer-events-none" width="200" height="80" aria-hidden>
                <g transform="translate(150, -15) scale(1.6)" opacity="0.05"><path d={STAR} fill="#C9A24B" /></g>
                <g transform="translate(80, 30) scale(0.9)" opacity="0.03"><path d={STAR} fill="#C9A24B" /></g>
              </svg>
              <svg className="absolute inset-0 w-full pointer-events-none" style={{ height: 72 }} aria-hidden>
                <pattern id="add-lead-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="0.7" fill="#C9A24B" opacity="0.07" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#add-lead-dots)" />
              </svg>
              <div className="relative flex items-center gap-3 px-6 py-4">
                <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(201,162,75,0.15)', border: '1px solid rgba(201,162,75,0.25)' }}>
                  <svg width="20" height="20" viewBox="0 0 100 100" aria-hidden><path d={STAR} fill="#C9A24B" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <DialogPrimitive.Title className="font-bold text-white leading-none" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.15rem' }}>
                    {isEditMode ? 'Edit Lead' : 'Add Lead'}
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description className="text-xs mt-0.5" style={{ color: 'rgba(201,162,75,0.7)' }}>
                    {isEditMode ? `Editing ${lead?.name}` : 'New entry for the CRM pipeline'}
                  </DialogPrimitive.Description>
                </div>
                <DialogPrimitive.Close className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white shrink-0">
                  <X size={16} />
                </DialogPrimitive.Close>
              </div>
              <div style={{ height: 1.5, background: 'linear-gradient(90deg, transparent, #C9A24B66, transparent)' }} />
            </div>

            {/* ── Body ── */}
            <form id="lead-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-2" style={{ scrollbarWidth: 'thin' }}>

              {/* Family Lead toggle */}
              <label className="flex items-center gap-2.5 mt-3 mb-1 cursor-pointer py-1">
                <input type="checkbox" checked={form.is_family_lead} onChange={e => set('is_family_lead', e.target.checked)} className="w-4 h-4 rounded accent-[rgb(14,124,90)]" />
                <div className="flex items-center gap-1.5">
                  <Users size={13} style={{ color: 'rgb(90 100 112)' }} />
                  <span className="text-sm" style={{ color: '#0B1F3A' }}>Family Lead (Parent + Children)</span>
                </div>
              </label>

              {/* ─── 1: Status & Personal Info ─── */}
              <SectionDivider title="Status & Personal Info" />
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Status">
                    {isAlreadyClosed ? (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm" style={{ ...inpStyle, background: 'rgba(14,124,90,0.07)', borderColor: 'rgba(14,124,90,0.3)' }}>
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'rgb(14 124 90)' }} />
                        <span style={{ color: 'rgb(14 124 90)', fontWeight: 600 }}>Closed</span>
                        <span className="ml-auto text-[10px]" style={{ color: 'rgb(90 100 112)' }}>Converted to student</span>
                      </div>
                    ) : (
                      <SearchSelect value={form.status} onChange={v => set('status', v as LeadStatus)} options={statusOptions} placeholder="Select status" clearable={false} />
                    )}
                  </Field>
                  <Field label="Priority">
                    <SearchSelect value={form.priority} onChange={v => set('priority', v as LeadPriority)} options={PRIORITY_OPTIONS} placeholder="Select priority" clearable={false} />
                  </Field>
                </div>
                <Field label="Full Name" required>
                  <input required className={inp} style={inpStyle} placeholder="Enter lead's full name" value={form.name} onChange={e => set('name', e.target.value)} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <MultiContactField label="Email Addresses" entries={emails} onChange={setEmails} placeholder="contact@example.com" />
                  <MultiContactField label="Phone Numbers"   entries={phones}  onChange={setPhones}  placeholder="+1 234 567 890" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Age">
                    <input type="number" min={1} max={120} className={inp} style={inpStyle} placeholder="e.g. 28" value={form.age} onChange={e => set('age', e.target.value)} />
                  </Field>
                  <Field label="Gender">
                    <SearchSelect value={form.gender} onChange={v => set('gender', v)} options={GENDER_OPTIONS} placeholder="Select gender" />
                  </Field>
                  <Field label="Country">
                    <CountryPicker value={form.country} onChange={v => set('country', v)} />
                  </Field>
                  <Field label="City">
                    <input className={inp} style={inpStyle} placeholder="City" value={form.city} onChange={e => set('city', e.target.value)} />
                  </Field>
                </div>
              </div>

              {/* ─── 2: Subjects ─── */}
              <SectionDivider title="Subjects" />
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Course Interest">
                    <SearchSelect value={form.course_interest_id} onChange={v => set('course_interest_id', v)} options={courseOptions} placeholder="Select course" />
                  </Field>
                  <Field label="Assigned Teacher">
                    <SearchSelect value={form.assigned_teacher_id} onChange={v => set('assigned_teacher_id', v)} options={teacherOptions} placeholder="Select teacher" />
                  </Field>
                </div>
                <Field label="Sections / Groups">
                  <TagInput value={form.sections} onChange={v => set('sections', v)} placeholder="Type section name and press Enter…" />
                </Field>
              </div>

              {/* ─── 3: Platform & Source ─── */}
              <SectionDivider title="Platform & Source" />
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Platform">
                    <SearchSelect value={form.platform} onChange={v => set('platform', v)} options={PLATFORM_OPTIONS} placeholder="Where they found us" />
                  </Field>
                  <Field label="Source">
                    <SearchSelect value={form.source} onChange={v => set('source', v)} options={SOURCE_OPTIONS} placeholder="How they came in" />
                  </Field>
                </div>
                <Field label="Platform URL">
                  <input className={inp} style={inpStyle} placeholder="https://…" value={form.platform_url} onChange={e => set('platform_url', e.target.value)} />
                </Field>
                <Field label="Parent / Family">
                  <div className="flex items-center gap-6 mt-0.5">
                    {([
                      { value: 'adult',      label: 'Adult Student' },
                      { value: 'new_family', label: 'New Family' },
                      { value: 'existing',   label: 'Existing Parent' },
                    ] as const).map(opt => (
                      <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="parent_mode" value={opt.value} checked={form.parent_mode === opt.value} onChange={() => set('parent_mode', opt.value)} className="accent-[rgb(14,124,90)]" />
                        <span className="text-sm" style={{ color: '#0B1F3A' }}>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </Field>
              </div>

              {/* ─── 4: Package & Price ─── */}
              <SectionDivider title="Package & Price" />
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-3">
                  <Field label="Package (sessions)">
                    <input type="number" min={1} className={inp} style={inpStyle} placeholder="8" value={form.package_type} onChange={e => set('package_type', e.target.value)} />
                  </Field>
                  <Field label="Hours">
                    <input type="number" min={1} className={inp} style={inpStyle} placeholder="4" value={form.package_hours} onChange={e => set('package_hours', e.target.value)} />
                  </Field>
                  <Field label="Price">
                    <input type="number" min={0} step="0.01" className={inp} style={inpStyle} placeholder="120" value={form.subscription_price} onChange={e => set('subscription_price', e.target.value)} />
                  </Field>
                  <Field label="Currency">
                    <SearchSelect value={form.currency} onChange={v => set('currency', v)} options={CURRENCY_OPTIONS} placeholder="EUR" clearable={false} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Payment Method">
                    <SearchSelect value={form.payment_method} onChange={v => set('payment_method', v)} options={PAYMENT_OPTIONS} placeholder="Select method" clearable={false} />
                  </Field>
                </div>
              </div>

              {/* ─── 5: Follow Up ─── */}
              <SectionDivider title="Follow Up" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Next Follow-up">
                  <input type="datetime-local" className={inp} style={inpStyle} value={form.next_followup} onChange={e => set('next_followup', e.target.value)} />
                </Field>
                <Field label="Assigned To">
                  <SearchSelect value={form.assigned_to} onChange={v => set('assigned_to', v)} options={teacherOptions} placeholder="Unassigned" />
                </Field>
              </div>

              {/* ─── 6: Notes & Rejection ─── */}
              <SectionDivider title="Notes & Rejection" />
              <div className="space-y-3">
                <Field label="Notes">
                  <textarea rows={3} className={inp} style={inpStyle} placeholder="Any notes about this lead…" value={form.notes} onChange={e => set('notes', e.target.value)} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Rejection Reason">
                    <SearchSelect value={form.rejection_reason} onChange={v => set('rejection_reason', v)} options={REJECTION_OPTIONS} placeholder="If applicable" />
                  </Field>
                </div>
              </div>

              {/* ─── 7: Student Enrollment (only when closing a non-closed lead) ─── */}
              {isClosing && (
                <>
                  <SectionDivider title="Student Enrollment Details" />
                  <div className="space-y-3 pb-3">
                    <EnrollmentBanner />

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Course" required>
                        <SearchSelect value={enrollment.course_id} onChange={v => setEnr('course_id', v)} options={courseOptions} placeholder="Select course" clearable={false} />
                      </Field>
                      <Field label="Assigned Teacher" required>
                        <SearchSelect value={enrollment.assigned_teacher_id} onChange={v => setEnr('assigned_teacher_id', v)} options={teacherOptions} placeholder="Select teacher" clearable={false} />
                      </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Timezone" required>
                        <SearchSelect value={enrollment.timezone} onChange={v => setEnr('timezone', v)} options={TIMEZONE_OPTIONS} placeholder="Select timezone" clearable={false} />
                      </Field>
                      <Field label="Student Type" required>
                        <div className="flex items-center gap-6 px-1 py-2">
                          {(['adult', 'child'] as const).map(t => (
                            <label key={t} className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="student_type" value={t} checked={enrollment.student_type === t} onChange={() => setEnr('student_type', t)} className="accent-[rgb(14,124,90)]" />
                              <span className="text-sm capitalize" style={{ color: '#0B1F3A' }}>{t}</span>
                            </label>
                          ))}
                        </div>
                      </Field>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      <Field label="Sessions / Month" required>
                        <input type="number" min={1} max={30} required={isClosing} className={inp} style={inpStyle} placeholder="4" value={enrollment.sessions_per_month} onChange={e => setEnr('sessions_per_month', e.target.value)} />
                      </Field>
                      <Field label="Duration" required>
                        <SearchSelect value={enrollment.session_duration_min} onChange={v => setEnr('session_duration_min', v)} options={SESSION_DURATION_OPTIONS} clearable={false} />
                      </Field>
                      <Field label="Monthly Price" required>
                        <input type="number" min={0} step="0.01" required={isClosing} className={inp} style={inpStyle} placeholder="120" value={enrollment.monthly_price} onChange={e => setEnr('monthly_price', e.target.value)} />
                      </Field>
                      <Field label="Currency" required>
                        <SearchSelect value={enrollment.currency} onChange={v => setEnr('currency', v)} options={CURRENCY_OPTIONS} clearable={false} />
                      </Field>
                    </div>

                    {enrollment.student_type === 'child' && (
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Guardian Name" required>
                          <input required={isClosing && enrollment.student_type === 'child'} className={inp} style={inpStyle} placeholder="Parent or guardian's name" value={enrollment.guardian_name} onChange={e => setEnr('guardian_name', e.target.value)} />
                        </Field>
                        <Field label="Guardian WhatsApp" required>
                          <input required={isClosing && enrollment.student_type === 'child'} className={inp} style={inpStyle} placeholder="+1 234 567 890" value={enrollment.guardian_whatsapp} onChange={e => setEnr('guardian_whatsapp', e.target.value)} />
                        </Field>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Already-closed info */}
              {isAlreadyClosed && (
                <div className="mb-4 flex items-center gap-2 text-xs px-3 py-2.5 rounded-lg" style={{ background: 'rgba(14,124,90,0.07)', color: 'rgb(14 124 90)', border: '1px solid rgba(14,124,90,0.2)' }}>
                  <GraduationCap size={13} className="shrink-0" />
                  This lead has already been converted to a student.
                </div>
              )}

              <div className="pb-2" />
            </form>

            {/* ── Footer ── */}
            <div className="relative shrink-0 flex items-center justify-between gap-3 px-6 py-4 border-t" style={{ background: '#fff', borderColor: 'rgb(229 233 240)' }}>
              <div className="absolute left-0 right-0 top-0" style={{ height: 1, background: 'linear-gradient(90deg, transparent, #C9A24B33, transparent)' }} />

              {/* Warning about closing */}
              {isClosing && (
                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgb(154 113 23)' }}>
                  <AlertTriangle size={12} />
                  <span>Will create a student account</span>
                </div>
              )}

              <div className="flex items-center gap-3 ml-auto">
                <DialogPrimitive.Close className="px-4 py-2 rounded-lg text-sm font-medium border hover:bg-black/5 transition-colors" style={{ borderColor: 'rgb(229 233 240)' }}>
                  Cancel
                </DialogPrimitive.Close>
                <button
                  type="submit" form="lead-form" disabled={isPending}
                  className="inline-flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60 hover:opacity-90 transition-opacity"
                  style={{ background: isClosing ? 'linear-gradient(135deg, #0d9488, rgb(14 124 90))' : 'linear-gradient(135deg, #0d9488, rgb(14 124 90))' }}
                >
                  {isPending ? (isClosing ? 'Converting…' : isEditMode ? 'Saving…' : 'Creating…') : (isClosing ? 'Convert to Student' : isEditMode ? 'Save Changes' : 'Create Lead')}
                </button>
              </div>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
