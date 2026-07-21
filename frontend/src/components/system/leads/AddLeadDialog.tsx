'use client'
import { useState, useRef, useEffect } from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { toast } from 'sonner'
import { X, Plus, Star, Search, ChevronDown, Check, Users, AlertTriangle, GraduationCap, UserPlus } from 'lucide-react'
import { useCreateLead, useUpdateLead, useConvertLead } from '@/hooks/system/useLeads'
import { useCourses } from '@/hooks/system/useCourses'
import { useTeachers } from '@/hooks/system/useTeachers'
import { useSections } from '@/hooks/system/useSections'
import { useUsers } from '@/hooks/system/useUsers'
import { ApiError } from '@/lib/system/api'
import { useI18n } from '@/lib/system/i18n'
import type { Lead, LeadStatus, LeadPriority, LeadPlatform, LeadSource } from '@/types/system/lead'

/* ── Design tokens (create-lesson form style) ───── */
const BORDER   = 'rgb(var(--border-default,229 233 240))'
const NAVY     = 'rgb(11 31 58)'
const MUTED    = 'rgb(90 100 112)'
const TEAL_50  = '#F0FDFA'
const TEAL_100 = '#CCFBF1'
const TEAL_400 = '#2DD4BF'
const TEAL_600 = '#0d9488'

/* ── Decorative section card ────────────────────── */
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="relative rounded-2xl p-5" style={{ background: TEAL_50, border: `1px solid ${TEAL_100}` }}>
      {/* Corner diamonds */}
      {(['top-2.5 left-3', 'top-2.5 right-3', 'bottom-2.5 left-3', 'bottom-2.5 right-3'] as const).map(pos => (
        <span key={pos} className={`absolute ${pos} select-none pointer-events-none leading-none`} style={{ color: TEAL_400, fontSize: 13 }}>◇</span>
      ))}
      {/* Decorated title */}
      <div className="flex items-center gap-2 mb-5">
        <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${TEAL_100})` }} />
        <div className="flex items-center gap-2 shrink-0">
          <span style={{ color: TEAL_400, fontSize: 11, lineHeight: 1 }}>✦</span>
          <span className="text-sm font-semibold tracking-wide" style={{ color: NAVY }}>{title}</span>
          <span style={{ color: TEAL_400, fontSize: 11, lineHeight: 1 }}>✦</span>
        </div>
        <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${TEAL_100})` }} />
      </div>
      {children}
    </div>
  )
}

/* ── Enrollment alert banner ────────────────────── */
function EnrollmentBanner() {
  const { t } = useI18n()
  return (
    <div
      className="flex items-start gap-3 rounded-xl p-3 mb-1"
      style={{ background: 'rgba(13,148,136,0.08)', border: `1px solid ${TEAL_100}` }}
    >
      <GraduationCap size={16} className="shrink-0 mt-0.5" style={{ color: TEAL_600 }} />
      <div>
        <p className="text-xs font-semibold" style={{ color: TEAL_600 }}>{t('leads.convertingToStudent')}</p>
        <p className="text-xs mt-0.5" style={{ color: MUTED }}>
          {t('leads.enrollmentBannerHint')}
        </p>
      </div>
    </div>
  )
}

/* ── Options ────────────────────────────────────── */
const STATUS_OPTIONS_ADD: { value: LeadStatus; key: string }[] = [
  { value: 'new_lead',            key: 'leads.statusNewLead' },
  { value: 'interested',          key: 'leads.statusInterested' },
  { value: 'waiting_for_trial',   key: 'leads.statusWaitingForTrial' },
  { value: 'waiting_for_payment', key: 'leads.statusWaitingForPayment' },
  { value: 'not_interested',      key: 'leads.statusNotInterested' },
  { value: 'lost',                key: 'leads.statusLost' },
  // Closed converts to a student. In the Add dialog it's a walk-in: create the lead then enrol.
  { value: 'closed',              key: 'leads.statusClosedConvert' },
]

const STATUS_OPTIONS_EDIT = STATUS_OPTIONS_ADD

const PLATFORM_OPTIONS: { value: string; key: string }[] = [
  { value: 'website',   key: 'leads.platformWebsite' },
  { value: 'facebook',  key: 'leads.platformFacebook' },
  { value: 'instagram', key: 'leads.platformInstagram' },
  { value: 'youtube',   key: 'leads.platformYoutube' },
  { value: 'whatsapp',  key: 'leads.platformWhatsapp' },
  { value: 'tiktok',    key: 'leads.platformTiktok' },
  { value: 'other',     key: 'leads.platformOther' },
]

const SOURCE_OPTIONS: { value: string; key: string }[] = [
  { value: 'google_ads',       key: 'leads.sourceGoogleAds' },
  { value: 'facebook_ads',     key: 'leads.sourceFacebookAds' },
  { value: 'instagram_ads',    key: 'leads.sourceInstagramShort' },
  { value: 'whatsapp_direct',  key: 'leads.sourceWhatsappDirect' },
  { value: 'student_referral', key: 'leads.sourceStudentReferral' },
  { value: 'website_form',     key: 'leads.sourceWebsiteForm' },
  { value: 'manual_entry',     key: 'leads.sourceManualEntry' },
]

const PRIORITY_OPTIONS: { value: string; key: string }[] = [
  { value: 'low',    key: 'leads.priorityLow' },
  { value: 'medium', key: 'leads.priorityMedium' },
  { value: 'high',   key: 'leads.priorityHigh' },
]

const GENDER_OPTIONS: { value: string; key: string }[] = [
  { value: 'male',   key: 'leads.genderMale' },
  { value: 'female', key: 'leads.genderFemale' },
  { value: 'other',  key: 'leads.genderOther' },
]

const CURRENCY_OPTIONS: { value: string; label: string }[] = [
  'EUR', 'USD', 'GBP', 'SAR', 'AED', 'MAD', 'OMR', 'QAR', 'KWD', 'BHD'
].map(c => ({ value: c, label: c }))

const PAYMENT_OPTIONS: { value: string; key: string }[] = [
  { value: 'none',          key: 'leads.paymentNone' },
  { value: 'card',          key: 'leads.paymentCard' },
  { value: 'cash',          key: 'leads.paymentCash' },
  { value: 'bank_transfer', key: 'leads.paymentBankTransfer' },
]

const REJECTION_OPTIONS: { value: string; key: string }[] = [
  { value: 'price',          key: 'leads.lostReasonPrice' },
  { value: 'schedule',       key: 'leads.lostReasonSchedule' },
  { value: 'not_interested', key: 'leads.statusNotInterested' },
  { value: 'no_response',    key: 'leads.lostReasonNoResponse' },
  { value: 'other',          key: 'leads.lostReasonOther' },
]

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
const inp = 'w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#0d9488] transition-shadow bg-white'
const inpStyle = { borderColor: BORDER }

/* ── Field wrapper ──────────────────────────────── */
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: MUTED }}>
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

/* ── Searchable Select ──────────────────────────── */
interface SelectOption { value: string; label: string }

function SearchSelect({
  value, onChange, options, placeholder, clearable = true,
}: {
  value: string
  onChange: (v: string) => void
  options: SelectOption[]
  placeholder?: string
  clearable?: boolean
}) {
  const { t } = useI18n()
  placeholder = placeholder ?? t('leads.selectPlaceholder')
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
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm text-left bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9488] transition-shadow"
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
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: TEAL_600, boxShadow: '0 0 0 2px rgba(13,148,136,0.12)', background: '#fff' }}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: BORDER }}>
        <Search size={12} className="opacity-40 shrink-0" />
        <input
          ref={inputRef}
          placeholder={t('leads.searchEllipsis')}
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
          <button type="button" className="w-full flex items-center gap-2 px-3 py-1.5 text-xs border-b text-left hover:bg-red-50 transition-colors" style={{ borderColor: BORDER, color: MUTED }}
            onClick={() => { onChange(''); setOpen(false) }}>
            <X size={10} /> {t('leads.clearSelection')}
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
          <p className="px-3 py-2.5 text-xs" style={{ color: MUTED }}>{t('leads.noResultsFor', { query: search })}</p>
        )}
      </div>
    </div>
  )
}

/* ── Multi-select (chips + searchable dropdown) ──── */
function MultiSelect({
  value, onChange, options, placeholder,
}: {
  value: string[]
  onChange: (v: string[]) => void
  options: SelectOption[]
  placeholder?: string
}) {
  const { t } = useI18n()
  placeholder = placeholder ?? t('leads.selectPlaceholder')
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
        style={inpStyle}
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
        <input ref={inputRef} placeholder={t('leads.searchEllipsis')} className="flex-1 text-sm outline-none bg-transparent" value={search} onChange={e => setSearch(e.target.value)}
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
          <p className="px-3 py-2.5 text-xs" style={{ color: MUTED }}>{t('leads.noResultsFor', { query: search })}</p>
        )}
      </div>
    </div>
  )
}

/* ── Country picker ─────────────────────────────── */
function CountryPicker({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const { t } = useI18n()
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
    <button type="button" className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm text-left bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9488] transition-shadow" style={inpStyle} onClick={() => setOpen(true)}>
      {selected ? <><span>{flag(selected.code)}</span><span className="flex-1 truncate">{selected.name}</span></> : <span className="flex-1 opacity-40">{t('leads.countryPlaceholder')}</span>}
      <ChevronDown size={13} className="opacity-40 shrink-0" />
    </button>
  )

  return (
    <div ref={containerRef} className="rounded-xl border overflow-hidden" style={{ borderColor: TEAL_600, boxShadow: '0 0 0 2px rgba(13,148,136,0.12)', background: '#fff' }}>
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: BORDER }}>
        <Search size={12} className="opacity-40 shrink-0" />
        <input ref={inputRef} placeholder={t('leads.searchCountry')} className="flex-1 text-sm outline-none bg-transparent" value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => { if (e.key === 'Escape') { setOpen(false); setSearch('') } }} />
        <button type="button" className="opacity-40 hover:opacity-100" onClick={() => { setOpen(false); setSearch('') }}><X size={13} /></button>
      </div>
      <div className="max-h-44 overflow-y-auto">
        {value && <button type="button" className="w-full flex items-center gap-2 px-3 py-1.5 text-xs border-b text-left hover:bg-red-50 transition-colors" style={{ borderColor: BORDER, color: MUTED }} onClick={() => { onChange(''); setOpen(false) }}><X size={10} />{t('leads.clear')}</button>}
        {filtered.map(c => (
          <button key={c.code} type="button" className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-black/5 transition-colors" style={c.code === value ? { background: 'rgba(13,148,136,0.07)' } : {}} onClick={() => { onChange(c.code); setOpen(false); setSearch('') }}>
            <span>{flag(c.code)}</span><span className="flex-1">{c.name}</span>
            {c.code === value && <Check size={12} style={{ color: TEAL_600 }} />}
          </button>
        ))}
        {filtered.length === 0 && <p className="px-3 py-2.5 text-xs" style={{ color: MUTED }}>{t('common.noResults')}</p>}
      </div>
    </div>
  )
}

/* ── Multi-contact field ────────────────────────── */
interface ContactEntry { value: string; primary: boolean }

function MultiContactField({ label, entries, onChange, placeholder }: {
  label: string; entries: ContactEntry[]; onChange: (e: ContactEntry[]) => void; placeholder: string
}) {
  const { t } = useI18n()
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
        <label className="text-xs font-medium" style={{ color: MUTED }}>{label}</label>
        <button type="button" onClick={addEntry} className="inline-flex items-center gap-0.5 text-[11px] font-semibold hover:opacity-70 transition-opacity" style={{ color: TEAL_600 }}>
          <Plus size={11} />{t('common.add')}
        </button>
      </div>
      {entries.length === 0 ? (
        <button type="button" onClick={addEntry} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed text-sm text-left bg-white hover:bg-black/5 transition-colors" style={{ borderColor: BORDER, color: MUTED }}>
          <Plus size={12} className="opacity-40" /><span className="opacity-40 text-xs">{placeholder}</span>
        </button>
      ) : (
        <div className="space-y-1.5">
          {entries.map((entry, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input className={`${inp} flex-1`} style={inpStyle} value={entry.value} onChange={e => updateVal(i, e.target.value)} placeholder={placeholder} />
              <button type="button" onClick={() => setPrimary(i)} className="p-1.5 rounded-lg transition-colors shrink-0" title={t('leads.setAsPrimary')}
                style={{ background: entry.primary ? 'rgba(13,148,136,0.15)' : 'transparent', color: entry.primary ? TEAL_600 : 'rgb(203 211 222)' }}>
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

/* ── Form state ─────────────────────────────────── */
interface FormState {
  status: LeadStatus; name: string; gender: string; age: string
  country: string; city: string; course_interest_id: string
  sections: string[]; assigned_teacher_id: string
  platform: string; platform_url: string; source: string
  parent_mode: 'adult' | 'new_family' | 'existing'
  package_hours: string; subscription_price: string
  currency: string; payment_method: string
  next_followup: string; priority: LeadPriority; assigned_to: string
  notes: string; rejection_reason: string; is_family_lead: boolean
}

const EMPTY: FormState = {
  status: 'new_lead', name: '', gender: '', age: '', country: '', city: '',
  course_interest_id: '', sections: [], assigned_teacher_id: '',
  platform: '', platform_url: '', source: '', parent_mode: 'adult',
  package_hours: '', subscription_price: '',
  currency: 'EUR', payment_method: 'none',
  next_followup: '', priority: 'medium', assigned_to: '',
  notes: '', rejection_reason: '', is_family_lead: false,
}

/* ── Enrollment state (used when closing a lead) ── */
interface EnrollmentState {
  course_id: string; assigned_teacher_id: string; timezone: string
  student_type: 'adult' | 'child'; package_hours: string
  session_duration_min: string; package_price: string; currency: string
  guardian_name: string; guardian_whatsapp: string
}

const EMPTY_ENROLLMENT: EnrollmentState = {
  course_id: '', assigned_teacher_id: '', timezone: 'Africa/Cairo',
  student_type: 'adult', package_hours: '8', session_duration_min: '60',
  package_price: '', currency: 'EUR', guardian_name: '', guardian_whatsapp: '',
}

/* ── Dialog ─────────────────────────────────────── */
interface AddLeadDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  lead?: Lead
  /** When opening in edit mode, override the initial status (e.g. 'closed' to start the close/convert flow). */
  initialStatus?: LeadStatus
}

export function AddLeadDialog({ open, onOpenChange, lead, initialStatus }: AddLeadDialogProps) {
  const { t } = useI18n()
  const isEditMode = !!lead
  const isAlreadyClosed = lead?.status === 'closed'

  const create  = useCreateLead()
  const update  = useUpdateLead(lead?.id ?? 0)
  const convert = useConvertLead()

  const { data: coursesData } = useCourses()
  const { data: teachersData } = useTeachers({ per_page: 200 } as Parameters<typeof useTeachers>[0])
  const { data: sectionsData } = useSections()
  const { data: usersData } = useUsers()
  const courses  = coursesData ?? []
  const teachers = teachersData?.data ?? []
  // Follow-up owners are supervisors/admins (assigned_supervisor_id), not teachers.
  const supervisors = (usersData?.data ?? []).filter(u => u.role === 'admin' || u.role === 'supervisor')
  const sectionOptions: SelectOption[] = (sectionsData ?? []).map(s => ({ value: s.id, label: s.name }))

  const [form,       setForm]       = useState<FormState>(EMPTY)
  const [emails,     setEmails]     = useState<ContactEntry[]>([])
  const [phones,     setPhones]     = useState<ContactEntry[]>([])
  const [enrollment, setEnrollment] = useState<EnrollmentState>(EMPTY_ENROLLMENT)

  // "Closed" enrols a student — in edit it converts the lead, in add it's a walk-in (create + convert).
  const isClosing = !isAlreadyClosed && form.status === 'closed'

  /* Pre-fill when lead changes / dialog opens */
  useEffect(() => {
    if (!open) return
    if (!lead) { setForm(EMPTY); setEmails([]); setPhones([]); setEnrollment(EMPTY_ENROLLMENT); return }

    const payload = lead.payload as Record<string, unknown> | null
    const payloadEmails = (payload?.emails as ContactEntry[] | undefined) ?? []
    const payloadPhones = (payload?.phones as ContactEntry[] | undefined) ?? []

    setForm({
      status:             initialStatus && lead.status !== 'closed' ? initialStatus : lead.status,
      name:               lead.name,
      gender:             lead.gender ?? '',
      age:                lead.age ? String(lead.age) : '',
      country:            lead.country ?? '',
      city:               lead.city ?? '',
      course_interest_id: lead.course_interest?.id ? String(lead.course_interest.id) : '',
      sections:           (payload?.sections as string[] | undefined) ?? [],
      assigned_teacher_id: lead.assigned_teacher_id ? String(lead.assigned_teacher_id) : '',
      platform:           lead.platform ?? '',
      platform_url:       lead.platform_url ?? '',
      source:             lead.source ?? '',
      parent_mode:        (payload?.parent_mode as 'adult' | 'new_family' | 'existing' | undefined) ?? 'adult',
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
      assigned_teacher_id: lead.assigned_teacher_id ? String(lead.assigned_teacher_id) : '',
      currency:           lead.currency ?? 'EUR',
      package_hours:      lead.package_hours ? String(lead.package_hours) : '8',
      package_price:      lead.subscription_price ? String(lead.subscription_price) : '',
    })
  }, [lead, open, initialStatus])

  function set<K extends keyof FormState>(k: K, v: FormState[K]) { setForm(p => ({ ...p, [k]: v })) }
  function setEnr<K extends keyof EnrollmentState>(k: K, v: EnrollmentState[K]) { setEnrollment(p => ({ ...p, [k]: v })) }
  function reset() { setForm(EMPTY); setEmails([]); setPhones([]); setEnrollment(EMPTY_ENROLLMENT) }

  const courseOptions: SelectOption[] = courses.map((c: { id: number; name: string }) => ({ value: String(c.id), label: c.name }))
  const teacherOptions: SelectOption[] = teachers.map((tc: { id: number; name: string | null }) => ({ value: String(tc.id), label: tc.name ?? t('leads.teacherFallback', { id: String(tc.id) }) }))
  const supervisorOptions: SelectOption[] = supervisors.map(u => ({ value: String(u.id), label: u.name }))

  const loc = (opts: { value: string; key: string }[]): SelectOption[] => opts.map(o => ({ value: o.value, label: t(o.key) }))
  const statusOptionsAdd  = loc(STATUS_OPTIONS_ADD)
  const statusOptionsEdit = loc(STATUS_OPTIONS_EDIT)
  const platformOptions   = loc(PLATFORM_OPTIONS)
  const sourceOptions     = loc(SOURCE_OPTIONS)
  const priorityOptions   = loc(PRIORITY_OPTIONS)
  const genderOptions     = loc(GENDER_OPTIONS)
  const paymentOptions    = loc(PAYMENT_OPTIONS)
  const rejectionOptions  = loc(REJECTION_OPTIONS)

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
      package_hours: form.package_hours ? Number(form.package_hours) : undefined,
      subscription_price: form.subscription_price ? Number(form.subscription_price) : undefined,
      currency: form.currency || undefined, payment_method: form.payment_method || undefined,
      priority: form.priority,
      notes: form.notes || undefined, rejection_reason: form.rejection_reason || undefined,
      is_family_lead: form.is_family_lead,
      assigned_supervisor_id: form.assigned_to ? Number(form.assigned_to) : undefined,
      // Assigning a teacher flows onto the provisioned student so the calendar's
      // create-lesson form can filter students by teacher.
      assigned_teacher_id: form.assigned_teacher_id ? Number(form.assigned_teacher_id) : undefined,
      payload: {
        emails: emails.filter(e => e.value),
        phones: phones.filter(p => p.value),
        sections: form.sections,
        parent_mode: form.parent_mode,
        next_followup: form.next_followup || undefined,
      },
    }

    // Quick close: only hours + price are collected. Course/currency ride along from the form/lead
    // when known; teacher, timezone, student type and duration are kept from the student the lead
    // already provisioned (the converter leaves omitted keys untouched).
    const courseId = enrollment.course_id || form.course_interest_id
    const convertData = {
      package_hours:       Number(enrollment.package_hours),
      package_price_minor: Math.round(parseFloat(enrollment.package_price || '0') * 100),
      course_id:           courseId ? Number(courseId) : undefined,
      currency:            enrollment.currency || undefined,
    }

    try {
      if (isEditMode) {
        /* ── Edit: don't send status if going to closed (convert handles it) ── */
        const updatePayload = { ...basePayload }
        if (!isClosing) updatePayload.status = form.status
        await update.mutateAsync(updatePayload)

        if (isClosing) {
          await convert.mutateAsync({ id: lead?.id ?? 0, ...convertData })
          toast.success(t('leads.toastConverted'))
        } else {
          toast.success(t('leads.toastUpdated'))
        }
      } else if (isClosing) {
        /* ── Walk-in: create the lead (provisions a student) then convert it in one step. The
              lead can't be created as 'closed' (convert would reject it), so it lands ready-to-pay. ── */
        basePayload.status = 'waiting_for_payment'
        const createdLead = await create.mutateAsync(basePayload)
        await convert.mutateAsync({ id: createdLead.id, ...convertData })
        toast.success(t('leads.toastConverted'))
      } else {
        /* ── Create ── */
        basePayload.status = form.status
        await create.mutateAsync(basePayload)
        toast.success(t('leads.toastCreated'))
      }
      reset(); onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : isEditMode ? t('leads.toastUpdateFailed') : t('leads.toastCreateFailed'))
    }
  }

  const isPending = create.isPending || update.isPending || convert.isPending
  const statusOptions = isEditMode ? statusOptionsEdit : statusOptionsAdd

  return (
    <DialogPrimitive.Root open={open} onOpenChange={v => { if (!v) reset(); onOpenChange(v) }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 duration-200" />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none" style={{ outline: 'none' }}>
          <div
            className="relative pointer-events-auto w-full max-w-2xl max-h-[94vh] flex flex-col rounded-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', boxShadow: '0 20px 60px rgb(0 0 0 / 0.18)' }}
          >
            {/* ── Header ── */}
            <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b bg-white" style={{ borderColor: BORDER }}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: TEAL_50 }}>
                  <UserPlus size={14} style={{ color: TEAL_600 }} />
                </div>
                <div className="min-w-0">
                  <DialogPrimitive.Title className="text-base font-semibold leading-tight" style={{ color: NAVY }}>
                    {isEditMode ? t('leads.editLeadTitle') : t('leads.addLead')}
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description className="text-xs mt-0.5 truncate" style={{ color: MUTED }}>
                    {isEditMode ? t('leads.editingName', { name: lead?.name ?? '' }) : t('leads.addLeadSubtitle')}
                  </DialogPrimitive.Description>
                </div>
              </div>
              <DialogPrimitive.Close className="p-1.5 rounded-lg hover:bg-black/5 transition-colors shrink-0" aria-label={t('common.dismiss')}>
                <X size={18} />
              </DialogPrimitive.Close>
            </div>

            {/* ── Body ── */}
            <form id="lead-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4" style={{ scrollbarWidth: 'thin' }}>

              {/* Family Lead toggle */}
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.is_family_lead} onChange={e => set('is_family_lead', e.target.checked)} className="w-4 h-4 rounded accent-[#0d9488]" />
                <Users size={14} style={{ color: MUTED }} />
                <span className="text-sm" style={{ color: NAVY }}>{t('leads.familyLeadToggle')}</span>
              </label>

              {/* ─── 1: Status & Personal Info ─── */}
              <SectionCard title={t('leads.sectionStatusPersonal')}>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={t('common.status')}>
                      {isAlreadyClosed ? (
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm bg-white" style={{ borderColor: TEAL_100, background: TEAL_50 }}>
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: TEAL_600 }} />
                          <span style={{ color: TEAL_600, fontWeight: 600 }}>{t('leads.statusClosed')}</span>
                          <span className="ml-auto text-[10px]" style={{ color: MUTED }}>{t('leads.convertedToStudent')}</span>
                        </div>
                      ) : (
                        <SearchSelect value={form.status} onChange={v => set('status', v as LeadStatus)} options={statusOptions} placeholder={t('leads.selectStatus')} clearable={false} />
                      )}
                    </Field>
                    <Field label={t('leads.fieldPriority')}>
                      <SearchSelect value={form.priority} onChange={v => set('priority', v as LeadPriority)} options={priorityOptions} placeholder={t('leads.selectPriority')} clearable={false} />
                    </Field>
                  </div>
                  <Field label={t('leads.fieldFullName')} required>
                    <input required className={inp} style={inpStyle} placeholder={t('leads.fullNamePlaceholder')} value={form.name} onChange={e => set('name', e.target.value)} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <MultiContactField label={t('leads.fieldEmailAddresses')} entries={emails} onChange={setEmails} placeholder="contact@example.com" />
                    <MultiContactField label={t('leads.fieldPhoneNumbers')}   entries={phones}  onChange={setPhones}  placeholder="+1 234 567 890" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={t('leads.fieldAge')}>
                      <input type="number" min={1} max={120} className={inp} style={inpStyle} placeholder={t('leads.agePlaceholder')} value={form.age} onChange={e => set('age', e.target.value)} />
                    </Field>
                    <Field label={t('leads.fieldGender')}>
                      <SearchSelect value={form.gender} onChange={v => set('gender', v)} options={genderOptions} placeholder={t('leads.selectGender')} />
                    </Field>
                    <Field label={t('common.country')}>
                      <CountryPicker value={form.country} onChange={v => set('country', v)} />
                    </Field>
                    <Field label={t('leads.fieldCity')}>
                      <input className={inp} style={inpStyle} placeholder={t('leads.fieldCity')} value={form.city} onChange={e => set('city', e.target.value)} />
                    </Field>
                  </div>
                </div>
              </SectionCard>

              {/* ─── 2: Subjects ─── */}
              <SectionCard title={t('leads.sectionSubjects')}>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={t('leads.fieldCourseInterest')}>
                      <SearchSelect value={form.course_interest_id} onChange={v => set('course_interest_id', v)} options={courseOptions} placeholder={t('leads.selectCourse')} />
                    </Field>
                    <Field label={t('leads.fieldAssignedTeacher')}>
                      <SearchSelect value={form.assigned_teacher_id} onChange={v => set('assigned_teacher_id', v)} options={teacherOptions} placeholder={t('leads.selectTeacher')} />
                    </Field>
                  </div>
                  <Field label={t('leads.fieldSections')}>
                    <MultiSelect value={form.sections} onChange={v => set('sections', v)} options={sectionOptions} placeholder={t('leads.sectionsPlaceholder')} />
                  </Field>
                </div>
              </SectionCard>

              {/* ─── 3: Platform & Source ─── */}
              <SectionCard title={t('leads.sectionPlatformSource')}>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={t('leads.fieldPlatform')}>
                      <SearchSelect value={form.platform} onChange={v => set('platform', v)} options={platformOptions} placeholder={t('leads.platformPlaceholder')} />
                    </Field>
                    <Field label={t('leads.fieldSource')}>
                      <SearchSelect value={form.source} onChange={v => set('source', v)} options={sourceOptions} placeholder={t('leads.sourcePlaceholder')} />
                    </Field>
                  </div>
                  <Field label={t('leads.fieldPlatformUrl')}>
                    <input className={inp} style={inpStyle} placeholder="https://…" value={form.platform_url} onChange={e => set('platform_url', e.target.value)} />
                  </Field>
                  <Field label={t('leads.fieldParentFamily')}>
                    <div className="flex items-center gap-6 mt-0.5">
                      {([
                        { value: 'adult',      key: 'leads.parentModeAdult' },
                        { value: 'new_family', key: 'leads.parentModeNewFamily' },
                        { value: 'existing',   key: 'leads.parentModeExisting' },
                      ] as const).map(opt => (
                        <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="parent_mode" value={opt.value} checked={form.parent_mode === opt.value} onChange={() => set('parent_mode', opt.value)} className="accent-[#0d9488]" />
                          <span className="text-sm" style={{ color: NAVY }}>{t(opt.key)}</span>
                        </label>
                      ))}
                    </div>
                  </Field>
                </div>
              </SectionCard>

              {/* ─── 4: Package & Price ─── */}
              <SectionCard title={t('leads.sectionPackagePrice')}>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <Field label={t('leads.fieldPackageHours')}>
                      <input type="number" min={1} className={inp} style={inpStyle} placeholder="8" value={form.package_hours} onChange={e => set('package_hours', e.target.value)} />
                    </Field>
                    <Field label={t('leads.fieldPackagePrice')}>
                      <input type="number" min={0} step="0.01" className={inp} style={inpStyle} placeholder="120" value={form.subscription_price} onChange={e => set('subscription_price', e.target.value)} />
                    </Field>
                    <Field label={t('common.currency')}>
                      <SearchSelect value={form.currency} onChange={v => set('currency', v)} options={CURRENCY_OPTIONS} placeholder="EUR" clearable={false} />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={t('leads.fieldPaymentMethod')}>
                      <SearchSelect value={form.payment_method} onChange={v => set('payment_method', v)} options={paymentOptions} placeholder={t('leads.selectMethod')} clearable={false} />
                    </Field>
                  </div>
                </div>
              </SectionCard>

              {/* ─── 5: Follow Up ─── */}
              <SectionCard title={t('leads.sectionFollowUp')}>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t('leads.fieldNextFollowUp')}>
                    <input type="datetime-local" className={inp} style={inpStyle} value={form.next_followup} onChange={e => set('next_followup', e.target.value)} />
                  </Field>
                  <Field label={t('leads.fieldAssignedTo')}>
                    <SearchSelect value={form.assigned_to} onChange={v => set('assigned_to', v)} options={supervisorOptions} placeholder={t('status.unassigned')} />
                  </Field>
                </div>
              </SectionCard>

              {/* ─── 6: Notes & Rejection ─── */}
              <SectionCard title={t('leads.sectionNotesRejection')}>
                <div className="space-y-3">
                  <Field label={t('common.notes')}>
                    <textarea rows={3} className={inp} style={inpStyle} placeholder={t('leads.notesPlaceholder')} value={form.notes} onChange={e => set('notes', e.target.value)} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={t('leads.fieldRejectionReason')}>
                      <SearchSelect value={form.rejection_reason} onChange={v => set('rejection_reason', v)} options={rejectionOptions} placeholder={t('leads.ifApplicable')} />
                    </Field>
                  </div>
                </div>
              </SectionCard>

              {/* ─── 7: Quick close → convert (only Package Hours + Price; the rest is derived
                     from the student the lead already provisioned) ─── */}
              {isClosing && (
                <SectionCard title={t('leads.sectionEnrollmentDetails')}>
                  <div className="space-y-3">
                    <EnrollmentBanner />

                    <div className="grid grid-cols-3 gap-3">
                      <Field label={t('leads.fieldPackageHours')} required>
                        <input type="number" min={1} required={isClosing} className={inp} style={inpStyle} placeholder="8" value={enrollment.package_hours} onChange={e => setEnr('package_hours', e.target.value)} />
                      </Field>
                      <Field label={t('leads.fieldPackagePrice')} required>
                        <input type="number" min={0} step="0.01" required={isClosing} className={inp} style={inpStyle} placeholder="120" value={enrollment.package_price} onChange={e => setEnr('package_price', e.target.value)} />
                      </Field>
                      <Field label={t('common.currency')} required>
                        <SearchSelect value={enrollment.currency} onChange={v => setEnr('currency', v)} options={CURRENCY_OPTIONS} clearable={false} />
                      </Field>
                    </div>
                  </div>
                </SectionCard>
              )}

              {/* Already-closed info */}
              {isAlreadyClosed && (
                <div className="flex items-center gap-2 text-xs px-3 py-2.5 rounded-xl" style={{ background: TEAL_50, color: TEAL_600, border: `1px solid ${TEAL_100}` }}>
                  <GraduationCap size={13} className="shrink-0" />
                  {t('leads.alreadyConvertedNote')}
                </div>
              )}
            </form>

            {/* ── Footer ── */}
            <div className="shrink-0 flex items-center justify-between gap-3 px-6 py-4 border-t bg-white" style={{ borderColor: BORDER }}>
              {/* Warning about closing */}
              {isClosing && (
                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgb(154 113 23)' }}>
                  <AlertTriangle size={12} />
                  <span>{t('leads.willCreateStudent')}</span>
                </div>
              )}

              <div className="flex items-center gap-3 ml-auto">
                <DialogPrimitive.Close className="px-5 py-2.5 rounded-xl text-sm font-medium border hover:bg-black/5 transition-colors" style={{ borderColor: BORDER, color: NAVY }}>
                  {t('common.cancel')}
                </DialogPrimitive.Close>
                <button
                  type="submit" form="lead-form" disabled={isPending}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
                  style={{ background: TEAL_600 }}
                >
                  {isPending ? (isClosing ? t('leads.converting') : isEditMode ? t('common.saving') : t('common.creating')) : (isClosing ? t('leads.convertToStudent') : isEditMode ? t('common.save') : t('leads.createLeadButton'))}
                </button>
              </div>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
