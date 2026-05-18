'use client'
import { useState, useRef, useEffect } from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { useForm, Controller } from 'react-hook-form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { X, UserPlus, ChevronDown, Search } from 'lucide-react'
import { ParentGuardianFields } from './ParentGuardianFields'
import { useCreateStudent } from '@/hooks/system/useStudents'
import { ApiError } from '@/lib/system/api'

/* ─── Country → Timezone map ──────────────────────── */
const COUNTRIES = [
  { code: 'AE', name: 'United Arab Emirates', timezone: 'Asia/Dubai' },
  { code: 'AF', name: 'Afghanistan', timezone: 'Asia/Kabul' },
  { code: 'AL', name: 'Albania', timezone: 'Europe/Tirane' },
  { code: 'DZ', name: 'Algeria', timezone: 'Africa/Algiers' },
  { code: 'AO', name: 'Angola', timezone: 'Africa/Luanda' },
  { code: 'AR', name: 'Argentina', timezone: 'America/Argentina/Buenos_Aires' },
  { code: 'AU', name: 'Australia', timezone: 'Australia/Sydney' },
  { code: 'AT', name: 'Austria', timezone: 'Europe/Vienna' },
  { code: 'AZ', name: 'Azerbaijan', timezone: 'Asia/Baku' },
  { code: 'BH', name: 'Bahrain', timezone: 'Asia/Bahrain' },
  { code: 'BD', name: 'Bangladesh', timezone: 'Asia/Dhaka' },
  { code: 'BY', name: 'Belarus', timezone: 'Europe/Minsk' },
  { code: 'BE', name: 'Belgium', timezone: 'Europe/Brussels' },
  { code: 'BJ', name: 'Benin', timezone: 'Africa/Porto-Novo' },
  { code: 'BT', name: 'Bhutan', timezone: 'Asia/Thimphu' },
  { code: 'BO', name: 'Bolivia', timezone: 'America/La_Paz' },
  { code: 'BA', name: 'Bosnia and Herzegovina', timezone: 'Europe/Sarajevo' },
  { code: 'BW', name: 'Botswana', timezone: 'Africa/Gaborone' },
  { code: 'BR', name: 'Brazil', timezone: 'America/Sao_Paulo' },
  { code: 'BN', name: 'Brunei', timezone: 'Asia/Brunei' },
  { code: 'BG', name: 'Bulgaria', timezone: 'Europe/Sofia' },
  { code: 'BF', name: 'Burkina Faso', timezone: 'Africa/Ouagadougou' },
  { code: 'KH', name: 'Cambodia', timezone: 'Asia/Phnom_Penh' },
  { code: 'CM', name: 'Cameroon', timezone: 'Africa/Douala' },
  { code: 'CA', name: 'Canada', timezone: 'America/Toronto' },
  { code: 'CF', name: 'Central African Republic', timezone: 'Africa/Bangui' },
  { code: 'TD', name: 'Chad', timezone: 'Africa/Ndjamena' },
  { code: 'CL', name: 'Chile', timezone: 'America/Santiago' },
  { code: 'CN', name: 'China', timezone: 'Asia/Shanghai' },
  { code: 'CO', name: 'Colombia', timezone: 'America/Bogota' },
  { code: 'KM', name: 'Comoros', timezone: 'Indian/Comoro' },
  { code: 'CG', name: 'Congo', timezone: 'Africa/Brazzaville' },
  { code: 'CD', name: 'Congo (DRC)', timezone: 'Africa/Kinshasa' },
  { code: 'HR', name: 'Croatia', timezone: 'Europe/Zagreb' },
  { code: 'CY', name: 'Cyprus', timezone: 'Asia/Nicosia' },
  { code: 'CZ', name: 'Czech Republic', timezone: 'Europe/Prague' },
  { code: 'DK', name: 'Denmark', timezone: 'Europe/Copenhagen' },
  { code: 'DJ', name: 'Djibouti', timezone: 'Africa/Djibouti' },
  { code: 'EG', name: 'Egypt', timezone: 'Africa/Cairo' },
  { code: 'ET', name: 'Ethiopia', timezone: 'Africa/Addis_Ababa' },
  { code: 'FI', name: 'Finland', timezone: 'Europe/Helsinki' },
  { code: 'FR', name: 'France', timezone: 'Europe/Paris' },
  { code: 'GA', name: 'Gabon', timezone: 'Africa/Libreville' },
  { code: 'GM', name: 'Gambia', timezone: 'Africa/Banjul' },
  { code: 'GE', name: 'Georgia', timezone: 'Asia/Tbilisi' },
  { code: 'DE', name: 'Germany', timezone: 'Europe/Berlin' },
  { code: 'GH', name: 'Ghana', timezone: 'Africa/Accra' },
  { code: 'GR', name: 'Greece', timezone: 'Europe/Athens' },
  { code: 'GN', name: 'Guinea', timezone: 'Africa/Conakry' },
  { code: 'GW', name: 'Guinea-Bissau', timezone: 'Africa/Bissau' },
  { code: 'HN', name: 'Honduras', timezone: 'America/Tegucigalpa' },
  { code: 'HK', name: 'Hong Kong', timezone: 'Asia/Hong_Kong' },
  { code: 'HU', name: 'Hungary', timezone: 'Europe/Budapest' },
  { code: 'IN', name: 'India', timezone: 'Asia/Kolkata' },
  { code: 'ID', name: 'Indonesia', timezone: 'Asia/Jakarta' },
  { code: 'IR', name: 'Iran', timezone: 'Asia/Tehran' },
  { code: 'IQ', name: 'Iraq', timezone: 'Asia/Baghdad' },
  { code: 'IE', name: 'Ireland', timezone: 'Europe/Dublin' },
  { code: 'IL', name: 'Israel', timezone: 'Asia/Jerusalem' },
  { code: 'IT', name: 'Italy', timezone: 'Europe/Rome' },
  { code: 'CI', name: 'Ivory Coast', timezone: 'Africa/Abidjan' },
  { code: 'JM', name: 'Jamaica', timezone: 'America/Jamaica' },
  { code: 'JP', name: 'Japan', timezone: 'Asia/Tokyo' },
  { code: 'JO', name: 'Jordan', timezone: 'Asia/Amman' },
  { code: 'KZ', name: 'Kazakhstan', timezone: 'Asia/Almaty' },
  { code: 'KE', name: 'Kenya', timezone: 'Africa/Nairobi' },
  { code: 'KW', name: 'Kuwait', timezone: 'Asia/Kuwait' },
  { code: 'KG', name: 'Kyrgyzstan', timezone: 'Asia/Bishkek' },
  { code: 'LA', name: 'Laos', timezone: 'Asia/Vientiane' },
  { code: 'LB', name: 'Lebanon', timezone: 'Asia/Beirut' },
  { code: 'LY', name: 'Libya', timezone: 'Africa/Tripoli' },
  { code: 'MY', name: 'Malaysia', timezone: 'Asia/Kuala_Lumpur' },
  { code: 'MV', name: 'Maldives', timezone: 'Indian/Maldives' },
  { code: 'ML', name: 'Mali', timezone: 'Africa/Bamako' },
  { code: 'MR', name: 'Mauritania', timezone: 'Africa/Nouakchott' },
  { code: 'MX', name: 'Mexico', timezone: 'America/Mexico_City' },
  { code: 'MD', name: 'Moldova', timezone: 'Europe/Chisinau' },
  { code: 'MA', name: 'Morocco', timezone: 'Africa/Casablanca' },
  { code: 'MZ', name: 'Mozambique', timezone: 'Africa/Maputo' },
  { code: 'MM', name: 'Myanmar', timezone: 'Asia/Rangoon' },
  { code: 'NA', name: 'Namibia', timezone: 'Africa/Windhoek' },
  { code: 'NP', name: 'Nepal', timezone: 'Asia/Kathmandu' },
  { code: 'NL', name: 'Netherlands', timezone: 'Europe/Amsterdam' },
  { code: 'NZ', name: 'New Zealand', timezone: 'Pacific/Auckland' },
  { code: 'NE', name: 'Niger', timezone: 'Africa/Niamey' },
  { code: 'NG', name: 'Nigeria', timezone: 'Africa/Lagos' },
  { code: 'MK', name: 'North Macedonia', timezone: 'Europe/Skopje' },
  { code: 'NO', name: 'Norway', timezone: 'Europe/Oslo' },
  { code: 'OM', name: 'Oman', timezone: 'Asia/Muscat' },
  { code: 'PK', name: 'Pakistan', timezone: 'Asia/Karachi' },
  { code: 'PS', name: 'Palestine', timezone: 'Asia/Gaza' },
  { code: 'PA', name: 'Panama', timezone: 'America/Panama' },
  { code: 'PY', name: 'Paraguay', timezone: 'America/Asuncion' },
  { code: 'PE', name: 'Peru', timezone: 'America/Lima' },
  { code: 'PH', name: 'Philippines', timezone: 'Asia/Manila' },
  { code: 'PL', name: 'Poland', timezone: 'Europe/Warsaw' },
  { code: 'PT', name: 'Portugal', timezone: 'Europe/Lisbon' },
  { code: 'QA', name: 'Qatar', timezone: 'Asia/Qatar' },
  { code: 'RO', name: 'Romania', timezone: 'Europe/Bucharest' },
  { code: 'RU', name: 'Russia', timezone: 'Europe/Moscow' },
  { code: 'RW', name: 'Rwanda', timezone: 'Africa/Kigali' },
  { code: 'SA', name: 'Saudi Arabia', timezone: 'Asia/Riyadh' },
  { code: 'SN', name: 'Senegal', timezone: 'Africa/Dakar' },
  { code: 'RS', name: 'Serbia', timezone: 'Europe/Belgrade' },
  { code: 'SL', name: 'Sierra Leone', timezone: 'Africa/Freetown' },
  { code: 'SG', name: 'Singapore', timezone: 'Asia/Singapore' },
  { code: 'SK', name: 'Slovakia', timezone: 'Europe/Bratislava' },
  { code: 'SI', name: 'Slovenia', timezone: 'Europe/Ljubljana' },
  { code: 'SO', name: 'Somalia', timezone: 'Africa/Mogadishu' },
  { code: 'ZA', name: 'South Africa', timezone: 'Africa/Johannesburg' },
  { code: 'SS', name: 'South Sudan', timezone: 'Africa/Juba' },
  { code: 'ES', name: 'Spain', timezone: 'Europe/Madrid' },
  { code: 'LK', name: 'Sri Lanka', timezone: 'Asia/Colombo' },
  { code: 'SD', name: 'Sudan', timezone: 'Africa/Khartoum' },
  { code: 'SE', name: 'Sweden', timezone: 'Europe/Stockholm' },
  { code: 'CH', name: 'Switzerland', timezone: 'Europe/Zurich' },
  { code: 'SY', name: 'Syria', timezone: 'Asia/Damascus' },
  { code: 'TW', name: 'Taiwan', timezone: 'Asia/Taipei' },
  { code: 'TJ', name: 'Tajikistan', timezone: 'Asia/Dushanbe' },
  { code: 'TZ', name: 'Tanzania', timezone: 'Africa/Dar_es_Salaam' },
  { code: 'TH', name: 'Thailand', timezone: 'Asia/Bangkok' },
  { code: 'TG', name: 'Togo', timezone: 'Africa/Lome' },
  { code: 'TN', name: 'Tunisia', timezone: 'Africa/Tunis' },
  { code: 'TR', name: 'Turkey', timezone: 'Europe/Istanbul' },
  { code: 'TM', name: 'Turkmenistan', timezone: 'Asia/Ashgabat' },
  { code: 'UG', name: 'Uganda', timezone: 'Africa/Kampala' },
  { code: 'UA', name: 'Ukraine', timezone: 'Europe/Kyiv' },
  { code: 'GB', name: 'United Kingdom', timezone: 'Europe/London' },
  { code: 'US', name: 'United States', timezone: 'America/New_York' },
  { code: 'UY', name: 'Uruguay', timezone: 'America/Montevideo' },
  { code: 'UZ', name: 'Uzbekistan', timezone: 'Asia/Tashkent' },
  { code: 'VE', name: 'Venezuela', timezone: 'America/Caracas' },
  { code: 'VN', name: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh' },
  { code: 'YE', name: 'Yemen', timezone: 'Asia/Aden' },
  { code: 'ZM', name: 'Zambia', timezone: 'Africa/Lusaka' },
  { code: 'ZW', name: 'Zimbabwe', timezone: 'Africa/Harare' },
] as const

/* ─── Schema ───────────────────────────────────────── */
const schema = z.object({
  name:          z.string().min(1, 'Name is required'),
  email:         z.string().email().optional().or(z.literal('')),
  phone:         z.string().optional(),
  whatsapp:      z.string().optional(),
  country:       z.string().min(1, 'Country is required'),
  timezone:      z.string().min(1, 'Timezone is required'),
  age_category:  z.enum(['child', 'adult']),
  source:        z.enum(['lead', 'manual', 'referral', 'trial_booking']),
  internal_note: z.string().optional(),
  parent_name:   z.string().optional(),
  parent_phone:  z.string().optional(),
  parent_whatsapp: z.string().optional(),
  parent_email:  z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const SOURCE_OPTIONS = [
  { value: 'manual',        label: 'Manual entry' },
  { value: 'lead',          label: 'Lead' },
  { value: 'referral',      label: 'Referral' },
  { value: 'trial_booking', label: 'Trial booking' },
]

const inp = 'w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] transition-shadow'
const inpStyle = { borderColor: 'rgb(var(--border-default,229 233 240))', background: '#fff' }

interface AddStudentDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function AddStudentDialog({ open, onOpenChange }: AddStudentDialogProps) {
  const create = useCreateStudent()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, control, watch, reset, setValue, formState: { errors, isSubmitting } } = useForm<any>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      age_category: 'adult',
      source:       'manual',
    },
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const ageCategory = watch('age_category')

  async function onSubmit(values: FormValues) {
    try {
      await create.mutateAsync(values as Record<string, unknown>)
      toast.success('Student enrolled successfully.')
      reset()
      onOpenChange(false)
    } catch (e) {
      if (e instanceof ApiError && e.errors) {
        Object.values(e.errors).flat().forEach((m) => toast.error(String(m)))
      } else {
        toast.error(e instanceof ApiError ? e.message : 'Failed to create student.')
      }
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Backdrop */}
        <DialogPrimitive.Backdrop
          className="fixed inset-0 z-50 bg-[rgb(11,31,58)]/40 backdrop-blur-sm
            data-open:animate-in data-open:fade-in-0
            data-closed:animate-out data-closed:fade-out-0 duration-200"
        />

        {/* Panel */}
        <DialogPrimitive.Popup
          className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          style={{ outline: 'none' }}
        >
          <div
            className="relative pointer-events-auto w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden
              data-open:animate-in data-open:fade-in-0 data-open:zoom-in-[0.97]
              data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-[0.97] duration-200"
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
                style={{ background: 'rgb(14 124 90 / 0.1)' }}
              >
                <UserPlus size={16} style={{ color: 'rgb(14 124 90)' }} />
              </div>
              <div>
                <DialogPrimitive.Title className="font-semibold text-[rgb(11,31,58)] leading-none">
                  Enrol New Student
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-xs mt-0.5" style={{ color: 'rgb(90 100 112)' }}>
                  Add basic info to start the trial. Enrollment details are set on activation.
                </DialogPrimitive.Description>
              </div>
              <DialogPrimitive.Close
                className="ml-auto p-1.5 rounded-lg hover:bg-black/5 transition-colors opacity-50 hover:opacity-100"
                aria-label="Close"
              >
                <X size={16} />
              </DialogPrimitive.Close>
            </div>

            {/* Scrollable body */}
            <form
              id="add-student-form"
              onSubmit={handleSubmit(onSubmit)}
              className="flex-1 overflow-y-auto px-6 py-5 space-y-4"
            >
              {/* — Identity — */}
              <Section title="Identity">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Full name" required error={errors.name}>
                    <input className={inp} style={inpStyle} {...register('name')} />
                  </Field>
                  <Field label="Email">
                    <input type="email" className={inp} style={inpStyle} {...register('email')} />
                  </Field>
                  <Field label="Phone">
                    <input className={inp} style={inpStyle} {...register('phone')} />
                  </Field>
                  <Field label="WhatsApp">
                    <input className={inp} style={inpStyle} {...register('whatsapp')} />
                  </Field>

                  {/* Country — searchable dropdown */}
                  <Field label="Country" required error={errors.country}>
                    <Controller
                      name="country"
                      control={control}
                      render={({ field }) => (
                        <CountryCombobox
                          value={field.value ?? ''}
                          onChange={(code, timezone) => {
                            field.onChange(code)
                            setValue('timezone', timezone, { shouldValidate: true })
                          }}
                        />
                      )}
                    />
                  </Field>

                  {/* Timezone — auto-filled, still editable */}
                  <Field label="Timezone" required error={errors.timezone}>
                    <Controller
                      name="timezone"
                      control={control}
                      render={({ field }) => (
                        <input
                          className={inp}
                          style={inpStyle}
                          placeholder="e.g. Africa/Cairo"
                          {...field}
                          value={field.value ?? ''}
                        />
                      )}
                    />
                  </Field>

                  <Field label="Age category" required>
                    <div className="flex gap-4 pt-1">
                      {(['adult', 'child'] as const).map((v) => (
                        <label key={v} className="flex items-center gap-2 text-sm cursor-pointer capitalize">
                          <input type="radio" value={v} {...register('age_category')} className="accent-[rgb(14,124,90)]" />
                          {v}
                        </label>
                      ))}
                    </div>
                  </Field>
                </div>
              </Section>

              {/* — Parent / Guardian (children only) — */}
              {ageCategory === 'child' && (
                <Section title="Parent / Guardian">
                  <ParentGuardianFields control={control} />
                </Section>
              )}

              {/* — Source & Notes — */}
              <Section title="Source & Notes">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <Field label="Source">
                    <Controller name="source" control={control} render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SOURCE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )} />
                  </Field>
                </div>
                <Field label="Internal note">
                  <textarea rows={3} className={inp} style={inpStyle} placeholder="Visible only to staff…" {...register('internal_note')} />
                </Field>
              </Section>
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
                form="add-student-form"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60 transition-opacity hover:opacity-90"
                style={{ background: 'rgb(14 124 90)' }}
              >
                {isSubmitting ? 'Adding…' : 'Add Trial Student'}
              </button>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/* ─── CountryCombobox ──────────────────────────────── */

function flagEmoji(code: string) {
  return code
    .toUpperCase()
    .replace(/./g, (ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)))
}

function CountryCombobox({
  value,
  onChange,
}: {
  value: string
  onChange: (code: string, timezone: string) => void
}) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const containerRef        = useRef<HTMLDivElement>(null)
  const searchRef           = useRef<HTMLInputElement>(null)

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
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

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

      {open && (
        <div
          className="absolute z-[200] w-full mt-1 rounded-xl border shadow-xl overflow-hidden"
          style={{ background: '#fff', borderColor: 'rgb(var(--border-default,229 233 240))' }}
        >
          {/* Search bar */}
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

          {/* List */}
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm opacity-40">No results</li>
            )}
            {filtered.map((c) => (
              <li
                key={c.code}
                onMouseDown={(e) => {
                  e.preventDefault()
                  onChange(c.code, c.timezone)
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

/* ─── tiny helpers ─────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ background: '#fff', border: '1px solid rgb(var(--border-default,229 233 240))' }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-widest opacity-40">{title}</p>
      {children}
    </div>
  )
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: { message?: string }
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5 opacity-70">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error?.message && <p className="text-red-500 text-[11px] mt-1">{String(error.message)}</p>}
    </div>
  )
}
