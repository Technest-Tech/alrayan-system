'use client'
import { useState, useRef, useEffect } from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { toast } from 'sonner'
import { X, UserPlus2, Search, ChevronDown, Check } from 'lucide-react'
import { useCreateLead } from '@/hooks/system/useLeads'
import { ApiError } from '@/lib/system/api'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const SOURCE_OPTIONS = [
  { value: 'google_ads',       label: 'Google Ads' },
  { value: 'facebook_ads',     label: 'Facebook Ads' },
  { value: 'instagram_ads',    label: 'Instagram Ads' },
  { value: 'whatsapp_direct',  label: 'WhatsApp Direct' },
  { value: 'student_referral', label: 'Student Referral' },
  { value: 'website_form',     label: 'Website Form' },
  { value: 'manual_entry',     label: 'Manual Entry' },
]

const COUNTRIES = [
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'AF', name: 'Afghanistan' },
  { code: 'AL', name: 'Albania' },
  { code: 'AU', name: 'Australia' },
  { code: 'AZ', name: 'Azerbaijan' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'BN', name: 'Brunei' },
  { code: 'CA', name: 'Canada' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'DE', name: 'Germany' },
  { code: 'DJ', name: 'Djibouti' },
  { code: 'DK', name: 'Denmark' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'EG', name: 'Egypt' },
  { code: 'ER', name: 'Eritrea' },
  { code: 'ES', name: 'Spain' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'GH', name: 'Ghana' },
  { code: 'GM', name: 'Gambia' },
  { code: 'GN', name: 'Guinea' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'IN', name: 'India' },
  { code: 'IQ', name: 'Iraq' },
  { code: 'IR', name: 'Iran' },
  { code: 'IT', name: 'Italy' },
  { code: 'JO', name: 'Jordan' },
  { code: 'JP', name: 'Japan' },
  { code: 'KE', name: 'Kenya' },
  { code: 'KM', name: 'Comoros' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'KZ', name: 'Kazakhstan' },
  { code: 'LB', name: 'Lebanon' },
  { code: 'LY', name: 'Libya' },
  { code: 'MA', name: 'Morocco' },
  { code: 'ML', name: 'Mali' },
  { code: 'MR', name: 'Mauritania' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'NE', name: 'Niger' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NO', name: 'Norway' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'OM', name: 'Oman' },
  { code: 'PH', name: 'Philippines' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'PS', name: 'Palestine' },
  { code: 'QA', name: 'Qatar' },
  { code: 'RU', name: 'Russia' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'SD', name: 'Sudan' },
  { code: 'SE', name: 'Sweden' },
  { code: 'SG', name: 'Singapore' },
  { code: 'SN', name: 'Senegal' },
  { code: 'SO', name: 'Somalia' },
  { code: 'SS', name: 'South Sudan' },
  { code: 'SY', name: 'Syria' },
  { code: 'TD', name: 'Chad' },
  { code: 'TJ', name: 'Tajikistan' },
  { code: 'TN', name: 'Tunisia' },
  { code: 'TR', name: 'Turkey' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'UG', name: 'Uganda' },
  { code: 'US', name: 'United States' },
  { code: 'UZ', name: 'Uzbekistan' },
  { code: 'YE', name: 'Yemen' },
  { code: 'ZA', name: 'South Africa' },
].sort((a, b) => a.name.localeCompare(b.name))

function countryFlag(code: string): string {
  const offset = 0x1f1e6 - 65
  return [...code.toUpperCase()].map(c => String.fromCodePoint(c.charCodeAt(0) + offset)).join('')
}

const inp = 'w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] transition-shadow'
const inpStyle = { borderColor: 'rgb(var(--border-default,229 233 240))', background: '#fff' }

const EMPTY = { name: '', email: '', phone: '', whatsapp: '', country: '', source: 'manual_entry' }

interface AddLeadDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function AddLeadDialog({ open, onOpenChange }: AddLeadDialogProps) {
  const create = useCreateLead()
  const [form, setForm] = useState(EMPTY)

  function set(k: keyof typeof EMPTY, v: string) {
    setForm(p => ({ ...p, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await create.mutateAsync(form as Record<string, unknown>)
      toast.success('Lead created.')
      setForm(EMPTY)
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create lead.')
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className="fixed inset-0 z-50 bg-[rgb(11,31,58)]/40 backdrop-blur-sm
            data-open:animate-in data-open:fade-in-0
            data-closed:animate-out data-closed:fade-out-0 duration-200"
        />
        <DialogPrimitive.Popup
          className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          style={{ outline: 'none' }}
        >
          <div
            className="relative pointer-events-auto w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: 'rgb(var(--surface-bg,244 246 250))' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-6 py-4 border-b shrink-0"
              style={{ background: '#fff', borderColor: 'rgb(var(--border-default,229 233 240))' }}
            >
              <div
                className="flex items-center justify-center w-9 h-9 rounded-xl"
                style={{ background: 'rgb(30 90 171 / 0.1)' }}
              >
                <UserPlus2 size={16} style={{ color: 'rgb(30 90 171)' }} />
              </div>
              <div>
                <DialogPrimitive.Title className="font-semibold text-[rgb(11,31,58)] leading-none">
                  New Lead
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-xs mt-0.5" style={{ color: 'rgb(90 100 112)' }}>
                  Manually capture an inbound enquiry or referral.
                </DialogPrimitive.Description>
              </div>
              <DialogPrimitive.Close
                className="ml-auto p-1.5 rounded-lg hover:bg-black/5 transition-colors opacity-50 hover:opacity-100"
                aria-label="Close"
              >
                <X size={16} />
              </DialogPrimitive.Close>
            </div>

            {/* Body */}
            <form
              id="add-lead-form"
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto px-6 py-5 space-y-3"
            >
              <Field label="Full name" required>
                <input
                  required
                  className={inp}
                  style={inpStyle}
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Email">
                  <input
                    type="email"
                    className={inp}
                    style={inpStyle}
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                  />
                </Field>
                <Field label="Phone">
                  <input
                    className={inp}
                    style={inpStyle}
                    placeholder="+1 555 000 0000"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                  />
                </Field>
                <Field label="WhatsApp">
                  <input
                    className={inp}
                    style={inpStyle}
                    placeholder="+1 555 000 0000"
                    value={form.whatsapp}
                    onChange={e => set('whatsapp', e.target.value)}
                  />
                </Field>
                <Field label="Source" required>
                  <Select value={form.source} onValueChange={v => set('source', v)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SOURCE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field label="Country">
                <CountryPicker value={form.country} onChange={v => set('country', v)} />
              </Field>
            </form>

            {/* Footer */}
            <div
              className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t"
              style={{ background: '#fff', borderColor: 'rgb(var(--border-default,229 233 240))' }}
            >
              <DialogPrimitive.Close
                className="px-4 py-2 rounded-lg text-sm font-medium border hover:bg-black/5 transition-colors"
                style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}
              >
                Cancel
              </DialogPrimitive.Close>
              <button
                type="submit"
                form="add-lead-form"
                disabled={create.isPending}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60 transition-opacity hover:opacity-90"
                style={{ background: 'rgb(30 90 171)' }}
              >
                {create.isPending ? 'Creating…' : 'Create Lead'}
              </button>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function CountryPicker({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const selected = COUNTRIES.find(c => c.code === value)

  const filtered = search
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().startsWith(search.toLowerCase()),
      )
    : COUNTRIES

  useEffect(() => {
    if (open) searchRef.current?.focus()
  }, [open])

  function select(code: string) {
    onChange(code)
    setOpen(false)
    setSearch('')
  }

  if (!open) {
    return (
      <button
        type="button"
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-shadow hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(14,124,90)]"
        style={inpStyle}
        onClick={() => setOpen(true)}
      >
        {selected ? (
          <>
            <span className="text-base leading-none">{countryFlag(selected.code)}</span>
            <span className="flex-1 truncate">{selected.name}</span>
          </>
        ) : (
          <span className="flex-1 opacity-40">Select country…</span>
        )}
        <ChevronDown size={14} className="opacity-40 shrink-0" />
      </button>
    )
  }

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: 'rgb(14 124 90)', boxShadow: '0 0 0 2px rgb(14 124 90 / 0.15)' }}
    >
      {/* Search row */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b"
        style={{ borderColor: 'rgb(var(--border-default,229 233 240))', background: '#fff' }}
      >
        <Search size={13} className="opacity-40 shrink-0" />
        <input
          ref={searchRef}
          placeholder="Search country…"
          className="flex-1 text-sm outline-none bg-transparent"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button
          type="button"
          className="opacity-40 hover:opacity-100 transition-opacity"
          onClick={() => { setOpen(false); setSearch('') }}
        >
          <X size={14} />
        </button>
      </div>

      {/* List */}
      <div className="max-h-44 overflow-y-auto" style={{ background: '#fff' }}>
        {value && (
          <button
            type="button"
            className="w-full flex items-center gap-2 px-3 py-2 text-xs border-b text-left hover:bg-black/5 transition-colors"
            style={{ borderColor: 'rgb(var(--border-default,229 233 240))', color: 'rgb(90 100 112)' }}
            onClick={() => { onChange(''); setOpen(false); setSearch('') }}
          >
            <X size={11} /> Clear selection
          </button>
        )}
        {filtered.length === 0 && (
          <p className="px-3 py-3 text-xs opacity-40">No countries match.</p>
        )}
        {filtered.map(c => (
          <button
            key={c.code}
            type="button"
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-black/5 transition-colors"
            style={c.code === value ? { background: 'rgb(14 124 90 / 0.07)' } : {}}
            onClick={() => select(c.code)}
          >
            <span className="text-base leading-none">{countryFlag(c.code)}</span>
            <span className="flex-1">{c.name}</span>
            <span className="text-[10px] tabular-nums opacity-30">{c.code}</span>
            {c.code === value && <Check size={13} style={{ color: 'rgb(14 124 90)' }} />}
          </button>
        ))}
      </div>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5 opacity-70">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
