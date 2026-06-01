'use client'
import { use, useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  ChevronLeft, MessageCircle, PlayCircle, PauseCircle,
  XCircle, ChevronDown, Search, X, CalendarDays, Check, Trash2,
  Baby, UserRound, ExternalLink,
} from 'lucide-react'
import { useStudent, useUpdateStudent, useStudentTransition, useActivateStudent, useDeleteStudent } from '@/hooks/system/useStudents'
import { useStudentSessions } from '@/hooks/system/useSessions'
import { StudentStatusBadge } from '@/components/system/students/StudentStatusBadge'
import { StudentTimeline } from '@/components/system/students/StudentTimeline'
import { FamilyTabContent } from '@/components/system/students/FamilyTabContent'
import { AutoBillingTable } from '@/components/system/billing/AutoBillingTable'
import { ActivateStudentDialog } from '@/components/system/students/ActivateStudentDialog'
import { ScheduleTrialSheet } from '@/components/system/students/ScheduleTrialSheet'
import { StudentSessionsTab } from '@/components/system/students/StudentSessionsTab'
import { StudentWorkflowGuide } from '@/components/system/students/StudentWorkflowGuide'
import { SetScheduleSheet } from '@/components/system/students/SetScheduleSheet'
import { NotesList } from '@/components/system/notes/NotesList'
import { NoteComposer } from '@/components/system/notes/NoteComposer'
import { EmptyState } from '@/components/system/primitives/EmptyState'
import { ApiError } from '@/lib/system/api'
import { useCourses } from '@/hooks/system/useCourses'
import { useTeachers } from '@/hooks/system/useTeachers'
import type { StudentStatus } from '@/types/system/student'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

/* ─── Avatar ───────────────────────────────────────── */
const PALETTE = ['#0E7C5A', '#0B1F3A', '#1E5AAB', '#7C3AED', '#B45309', '#BE185D', '#C05621']
function initials(name: string) {
  return name.split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase() ?? '').join('')
}
function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (name.charCodeAt(i) + ((h << 5) - h)) | 0
  return PALETTE[Math.abs(h) % PALETTE.length]
}

/* ─── Country data ─────────────────────────────────── */
const COUNTRIES = [
  { code: 'AE', name: 'United Arab Emirates', timezone: 'Asia/Dubai' },
  { code: 'AF', name: 'Afghanistan', timezone: 'Asia/Kabul' },
  { code: 'AL', name: 'Albania', timezone: 'Europe/Tirane' },
  { code: 'DZ', name: 'Algeria', timezone: 'Africa/Algiers' },
  { code: 'AR', name: 'Argentina', timezone: 'America/Argentina/Buenos_Aires' },
  { code: 'AU', name: 'Australia', timezone: 'Australia/Sydney' },
  { code: 'AT', name: 'Austria', timezone: 'Europe/Vienna' },
  { code: 'AZ', name: 'Azerbaijan', timezone: 'Asia/Baku' },
  { code: 'BH', name: 'Bahrain', timezone: 'Asia/Bahrain' },
  { code: 'BD', name: 'Bangladesh', timezone: 'Asia/Dhaka' },
  { code: 'BE', name: 'Belgium', timezone: 'Europe/Brussels' },
  { code: 'BO', name: 'Bolivia', timezone: 'America/La_Paz' },
  { code: 'BA', name: 'Bosnia and Herzegovina', timezone: 'Europe/Sarajevo' },
  { code: 'BR', name: 'Brazil', timezone: 'America/Sao_Paulo' },
  { code: 'BN', name: 'Brunei', timezone: 'Asia/Brunei' },
  { code: 'BG', name: 'Bulgaria', timezone: 'Europe/Sofia' },
  { code: 'CA', name: 'Canada', timezone: 'America/Toronto' },
  { code: 'CL', name: 'Chile', timezone: 'America/Santiago' },
  { code: 'CN', name: 'China', timezone: 'Asia/Shanghai' },
  { code: 'CO', name: 'Colombia', timezone: 'America/Bogota' },
  { code: 'HR', name: 'Croatia', timezone: 'Europe/Zagreb' },
  { code: 'CY', name: 'Cyprus', timezone: 'Asia/Nicosia' },
  { code: 'CZ', name: 'Czech Republic', timezone: 'Europe/Prague' },
  { code: 'DK', name: 'Denmark', timezone: 'Europe/Copenhagen' },
  { code: 'DJ', name: 'Djibouti', timezone: 'Africa/Djibouti' },
  { code: 'EG', name: 'Egypt', timezone: 'Africa/Cairo' },
  { code: 'ET', name: 'Ethiopia', timezone: 'Africa/Addis_Ababa' },
  { code: 'FI', name: 'Finland', timezone: 'Europe/Helsinki' },
  { code: 'FR', name: 'France', timezone: 'Europe/Paris' },
  { code: 'GE', name: 'Georgia', timezone: 'Asia/Tbilisi' },
  { code: 'DE', name: 'Germany', timezone: 'Europe/Berlin' },
  { code: 'GH', name: 'Ghana', timezone: 'Africa/Accra' },
  { code: 'GR', name: 'Greece', timezone: 'Europe/Athens' },
  { code: 'HK', name: 'Hong Kong', timezone: 'Asia/Hong_Kong' },
  { code: 'HU', name: 'Hungary', timezone: 'Europe/Budapest' },
  { code: 'IN', name: 'India', timezone: 'Asia/Kolkata' },
  { code: 'ID', name: 'Indonesia', timezone: 'Asia/Jakarta' },
  { code: 'IR', name: 'Iran', timezone: 'Asia/Tehran' },
  { code: 'IQ', name: 'Iraq', timezone: 'Asia/Baghdad' },
  { code: 'IE', name: 'Ireland', timezone: 'Europe/Dublin' },
  { code: 'IL', name: 'Israel', timezone: 'Asia/Jerusalem' },
  { code: 'IT', name: 'Italy', timezone: 'Europe/Rome' },
  { code: 'JP', name: 'Japan', timezone: 'Asia/Tokyo' },
  { code: 'JO', name: 'Jordan', timezone: 'Asia/Amman' },
  { code: 'KZ', name: 'Kazakhstan', timezone: 'Asia/Almaty' },
  { code: 'KE', name: 'Kenya', timezone: 'Africa/Nairobi' },
  { code: 'KW', name: 'Kuwait', timezone: 'Asia/Kuwait' },
  { code: 'LB', name: 'Lebanon', timezone: 'Asia/Beirut' },
  { code: 'LY', name: 'Libya', timezone: 'Africa/Tripoli' },
  { code: 'MY', name: 'Malaysia', timezone: 'Asia/Kuala_Lumpur' },
  { code: 'MV', name: 'Maldives', timezone: 'Indian/Maldives' },
  { code: 'MA', name: 'Morocco', timezone: 'Africa/Casablanca' },
  { code: 'NP', name: 'Nepal', timezone: 'Asia/Kathmandu' },
  { code: 'NL', name: 'Netherlands', timezone: 'Europe/Amsterdam' },
  { code: 'NZ', name: 'New Zealand', timezone: 'Pacific/Auckland' },
  { code: 'NG', name: 'Nigeria', timezone: 'Africa/Lagos' },
  { code: 'NO', name: 'Norway', timezone: 'Europe/Oslo' },
  { code: 'OM', name: 'Oman', timezone: 'Asia/Muscat' },
  { code: 'PK', name: 'Pakistan', timezone: 'Asia/Karachi' },
  { code: 'PS', name: 'Palestine', timezone: 'Asia/Gaza' },
  { code: 'PE', name: 'Peru', timezone: 'America/Lima' },
  { code: 'PH', name: 'Philippines', timezone: 'Asia/Manila' },
  { code: 'PL', name: 'Poland', timezone: 'Europe/Warsaw' },
  { code: 'PT', name: 'Portugal', timezone: 'Europe/Lisbon' },
  { code: 'QA', name: 'Qatar', timezone: 'Asia/Qatar' },
  { code: 'RO', name: 'Romania', timezone: 'Europe/Bucharest' },
  { code: 'RU', name: 'Russia', timezone: 'Europe/Moscow' },
  { code: 'SA', name: 'Saudi Arabia', timezone: 'Asia/Riyadh' },
  { code: 'SN', name: 'Senegal', timezone: 'Africa/Dakar' },
  { code: 'RS', name: 'Serbia', timezone: 'Europe/Belgrade' },
  { code: 'SG', name: 'Singapore', timezone: 'Asia/Singapore' },
  { code: 'SO', name: 'Somalia', timezone: 'Africa/Mogadishu' },
  { code: 'ZA', name: 'South Africa', timezone: 'Africa/Johannesburg' },
  { code: 'ES', name: 'Spain', timezone: 'Europe/Madrid' },
  { code: 'LK', name: 'Sri Lanka', timezone: 'Asia/Colombo' },
  { code: 'SD', name: 'Sudan', timezone: 'Africa/Khartoum' },
  { code: 'SE', name: 'Sweden', timezone: 'Europe/Stockholm' },
  { code: 'CH', name: 'Switzerland', timezone: 'Europe/Zurich' },
  { code: 'SY', name: 'Syria', timezone: 'Asia/Damascus' },
  { code: 'TZ', name: 'Tanzania', timezone: 'Africa/Dar_es_Salaam' },
  { code: 'TH', name: 'Thailand', timezone: 'Asia/Bangkok' },
  { code: 'TN', name: 'Tunisia', timezone: 'Africa/Tunis' },
  { code: 'TR', name: 'Turkey', timezone: 'Europe/Istanbul' },
  { code: 'UG', name: 'Uganda', timezone: 'Africa/Kampala' },
  { code: 'UA', name: 'Ukraine', timezone: 'Europe/Kyiv' },
  { code: 'GB', name: 'United Kingdom', timezone: 'Europe/London' },
  { code: 'US', name: 'United States', timezone: 'America/New_York' },
  { code: 'UZ', name: 'Uzbekistan', timezone: 'Asia/Tashkent' },
  { code: 'VN', name: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh' },
  { code: 'YE', name: 'Yemen', timezone: 'Asia/Aden' },
] as const

function flagEmoji(code: string) {
  return code.toUpperCase().replace(/./g, (ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)))
}

/* ─── EntityCombobox ───────────────────────────────── */
function EntityCombobox({
  items, value, onChange, placeholder = 'Select…', noneLabel = 'None',
}: {
  items:       { id: number; name: string }[]
  value:       number | undefined
  onChange:    (id: number | undefined) => void
  placeholder?: string
  noneLabel?:  string
}) {
  const [open,   setOpen]   = useState(false)
  const [search, setSearch] = useState('')
  const containerRef        = useRef<HTMLDivElement>(null)
  const searchRef           = useRef<HTMLInputElement>(null)

  const selected = items.find((i) => i.id === value)
  const filtered = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))

  useEffect(() => {
    if (open) { const t = setTimeout(() => searchRef.current?.focus(), 40); return () => clearTimeout(t) }
    else setSearch('')
  }, [open])

  useEffect(() => {
    if (!open) return
    function onOut(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOut)
    return () => document.removeEventListener('mousedown', onOut)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] transition-shadow text-left"
        style={{ borderColor: 'rgb(var(--border-default,229 233 240))', background: '#fff' }}>
        <span className="flex-1 truncate"
          style={!selected ? { color: 'rgb(156 163 175)' } : { color: 'rgb(11 31 58)' }}>
          {selected ? selected.name : placeholder}
        </span>
        <ChevronDown size={13} className="opacity-40 shrink-0" />
      </button>
      {open && (
        <div className="absolute z-[200] w-full mt-1 rounded-xl border shadow-xl overflow-hidden"
          style={{ background: '#fff', borderColor: 'rgb(var(--border-default,229 233 240))' }}>
          <div className="flex items-center gap-2 px-3 py-2 border-b"
            style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
            <Search size={13} className="opacity-40 shrink-0" />
            <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…" className="flex-1 bg-transparent text-sm outline-none" />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            <li onMouseDown={(e) => { e.preventDefault(); onChange(undefined); setOpen(false) }}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors"
              style={!value ? { background: 'rgb(14 124 90 / 0.08)', color: 'rgb(14 124 90)', fontWeight: 500 } : { color: 'rgb(156 163 175)' }}>
              {noneLabel}
            </li>
            {filtered.length === 0 && items.length > 0 && (
              <li className="px-3 py-2 text-sm opacity-40">No results</li>
            )}
            {filtered.map((item) => (
              <li key={item.id}
                onMouseDown={(e) => { e.preventDefault(); onChange(item.id); setOpen(false) }}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors"
                style={item.id === value
                  ? { background: 'rgb(14 124 90 / 0.08)', color: 'rgb(14 124 90)', fontWeight: 500 }
                  : { color: 'rgb(11 31 58)' }}>
                {item.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* ─── CountryCombobox ──────────────────────────────── */
function CountryCombobox({
  value, onChange,
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
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()),
  )

  useEffect(() => {
    if (open) { const t = setTimeout(() => searchRef.current?.focus(), 40); return () => clearTimeout(t) }
    else setSearch('')
  }, [open])

  useEffect(() => {
    if (!open) return
    function onOut(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOut)
    return () => document.removeEventListener('mousedown', onOut)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] transition-shadow text-left"
        style={{ borderColor: 'rgb(var(--border-default,229 233 240))', background: '#fff' }}
      >
        {selected ? (
          <><span className="text-base leading-none">{flagEmoji(selected.code)}</span>
          <span className="flex-1 truncate">{selected.name}</span>
          <span className="text-[11px] opacity-40 shrink-0">{selected.code}</span></>
        ) : <span className="flex-1 opacity-40">Select country…</span>}
        <ChevronDown size={13} className="opacity-40 shrink-0 ml-1" />
      </button>
      {open && (
        <div className="absolute z-[200] w-full mt-1 rounded-xl border shadow-xl overflow-hidden"
          style={{ background: '#fff', borderColor: 'rgb(var(--border-default,229 233 240))' }}>
          <div className="flex items-center gap-2 px-3 py-2 border-b"
            style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
            <Search size={13} className="opacity-40 shrink-0" />
            <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country…" className="flex-1 bg-transparent text-sm outline-none" />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 && <li className="px-3 py-2 text-sm opacity-40">No results</li>}
            {filtered.map((c) => (
              <li key={c.code}
                onMouseDown={(e) => { e.preventDefault(); onChange(c.code, c.timezone); setOpen(false) }}
                className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors"
                style={c.code === value ? { background: 'rgb(14 124 90 / 0.08)', color: 'rgb(14 124 90)', fontWeight: 500 } : undefined}
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

/* ─── Schema & constants ───────────────────────────── */
const profileSchema = z.object({
  name:                 z.string().min(1),
  email:                z.string().email().optional().or(z.literal('')),
  whatsapp:             z.string().optional(),
  country:              z.string().min(1),
  timezone:             z.string().min(1),
  course_id:            z.coerce.number().optional(),
  assigned_teacher_id:  z.coerce.number().optional(),
  sessions_per_month:   z.coerce.number().min(1),
  session_duration_min: z.coerce.number().min(1),
  currency:             z.string().min(1),
  monthly_price_minor:  z.coerce.number().min(0),
  custom_discount_pct:  z.coerce.number().min(0).max(100),
})
type ProfileValues = z.infer<typeof profileSchema>

const DURATIONS  = [30, 45, 60]
const CURRENCIES = ['USD', 'EGP', 'GBP', 'EUR', 'SAR', 'AED']
const TABS = ['Profile', 'Sessions', 'Reports', 'Invoices', 'Wallet', 'Family', 'Timeline', 'Notes'] as const
type Tab = typeof TABS[number]

const CANCELLATION_REASONS = [
  'No longer interested', 'Price too high', 'Schedule conflict',
  'Completed course', 'Moved to another provider', 'Other',
]

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Manual', lead: 'From Lead', referral: 'Referral', trial_booking: 'Trial Booking',
}

const TRANSITIONS: Record<StudentStatus, StudentStatus[]> = {
  trial:     ['active', 'cancelled'],
  active:    ['paused', 'suspended', 'cancelled'],
  paused:    ['active', 'cancelled'],
  suspended: ['active', 'cancelled'],
  cancelled: [],
}

const inp = 'w-full px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] transition-shadow'
const inpStyle = { borderColor: 'rgb(var(--border-default,229 233 240))', background: '#fff' }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/* ─── Delete modal ─────────────────────────────────── */
function DeleteStudentModal({ studentName, onConfirm, onClose, isLoading }: {
  studentName: string
  onConfirm: () => void
  onClose: () => void
  isLoading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[rgb(11,31,58)]/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-4 bg-white">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-black/5 opacity-40 hover:opacity-70">
          <X size={16} />
        </button>
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl mx-auto"
          style={{ background: 'rgb(220 38 38 / 0.08)' }}>
          <Trash2 size={20} style={{ color: 'rgb(220 38 38)' }} />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-[rgb(11,31,58)]">Delete {studentName}?</h3>
          <p className="text-xs mt-1.5" style={{ color: 'rgb(90 100 112)' }}>
            This will permanently remove the student and all their data — sessions, notes, invoices, and timeline. This cannot be undone.
          </p>
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-xl text-sm font-medium border hover:bg-black/5 transition-colors"
            style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors">
            {isLoading ? 'Deleting…' : 'Delete student'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Cancel modal ─────────────────────────────────── */
function CancelModal({ onConfirm, onClose, isLoading }: {
  onConfirm: (reason: string, notes: string) => void
  onClose: () => void
  isLoading: boolean
}) {
  const [reason, setReason] = useState('')
  const [notes,  setNotes]  = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[rgb(11,31,58)]/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 bg-white">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-black/5 opacity-40 hover:opacity-70">
          <X size={16} />
        </button>
        <div>
          <h3 className="font-semibold text-[rgb(11,31,58)]">Cancel enrolment</h3>
          <p className="text-xs mt-0.5" style={{ color: 'rgb(90 100 112)' }}>This action will be logged in the student timeline.</p>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5 opacity-70">Reason</label>
          <select value={reason} onChange={(e) => setReason(e.target.value)} className={inp} style={inpStyle}>
            <option value="">Select a reason…</option>
            {CANCELLATION_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5 opacity-70">Internal notes (optional)</label>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={inp} style={inpStyle} />
        </div>
        <div className="flex justify-end gap-3 pt-1">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium border hover:bg-black/5 transition-colors"
            style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>Back</button>
          <button onClick={() => onConfirm(reason, notes)} disabled={!reason || isLoading}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors">
            {isLoading ? 'Cancelling…' : 'Confirm cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Stat chip ────────────────────────────────────── */
function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider mb-0.5" style={{ color: 'rgb(90 100 112)' }}>{label}</p>
      <p className="text-sm font-semibold truncate" style={{ color: 'rgb(11 31 58)' }}>{value}</p>
    </div>
  )
}

/* ─── Section card ─────────────────────────────────── */
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5 space-y-4 bg-white"
      style={{ border: '1px solid rgb(var(--border-default,229 233 240))' }}>
      <p className="text-[11px] font-semibold uppercase tracking-widest opacity-40">{title}</p>
      {children}
    </div>
  )
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-medium mb-1.5 opacity-70">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

/* ═══ Page ═════════════════════════════════════════════ */
export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('Profile')
  const [showCancel,      setShowCancel]      = useState(false)
  const [showActivate,    setShowActivate]    = useState(false)
  const [showTrialSheet,  setShowTrialSheet]  = useState(false)
  const [showSetSchedule, setShowSetSchedule] = useState(false)
  const [showDelete,      setShowDelete]      = useState(false)

  const { data: student, isLoading } = useStudent(id)
  const update     = useUpdateStudent(id)
  const transition = useStudentTransition(id)
  const activate   = useActivateStudent(id)  // eslint-disable-line @typescript-eslint/no-unused-vars
  const deleteStudent = useDeleteStudent()
  const { data: sessionsData } = useStudentSessions(student?.id)
  const { data: courses = [] } = useCourses()
  const { data: teachersData } = useTeachers()
  const teachers = teachersData?.data ?? []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, control, setValue, formState: { isSubmitting } } = useForm<any>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(profileSchema) as any,
    values: student ? {
      name:                 student.name ?? '',
      email:                student.email ?? '',
      whatsapp:             student.whatsapp ?? '',
      country:              student.country ?? '',
      timezone:             student.timezone ?? '',
      course_id:            student.course?.id,
      assigned_teacher_id:  student.assigned_teacher?.id,
      sessions_per_month:   student.sessions_per_month,
      session_duration_min: student.session_duration_min,
      currency:             student.currency,
      monthly_price_minor:  student.monthly_price_minor,
      custom_discount_pct:  student.custom_discount_pct,
    } : undefined,
  })

  async function onProfileSave(values: ProfileValues) {
    try {
      await update.mutateAsync(values as Record<string, unknown>)
      toast.success('Profile saved.')
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to save.')
    }
  }

  async function doTransition(to: StudentStatus) {
    if (to === 'cancelled') { setShowCancel(true); return }
    if (to === 'active' && student?.status === 'trial') { setShowActivate(true); return }
    try {
      await transition.mutateAsync({ to })
      toast.success(`Student moved to ${to}.`)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Action failed.')
    }
  }

  async function handleCancel(reason: string, notes: string) {
    try {
      await transition.mutateAsync({ to: 'cancelled', reason, notes })
      toast.success('Enrolment cancelled.')
      setShowCancel(false)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Cancellation failed.')
    }
  }

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-5 w-40 rounded-lg bg-gray-100" />
        <div className="h-48 rounded-2xl bg-gray-100" />
        <div className="h-10 rounded-xl bg-gray-100" />
      </div>
    )
  }

  if (!student) {
    return (
      <EmptyState icon="AlertCircle" title="Student not found"
        action={<Link href="/students" className="text-sm underline">Back to students</Link>} />
    )
  }

  const allowed   = TRANSITIONS[student.status] ?? []
  const sessionsList      = (sessionsData as { data?: { status: string }[] } | undefined)?.data ?? []
  const hasScheduledTrial = sessionsList.some(s => s.status === 'scheduled')
  const hasAnySession     = sessionsList.length > 0
  const price   = `${student.currency} ${(student.monthly_price_minor / 100).toFixed(0)}/mo`
  const sessions = student.sessions_per_month
    ? `${student.sessions_per_month} × ${student.session_duration_min}m`
    : '—'

  return (
    <div className="space-y-0">

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 mb-5 text-sm" style={{ color: 'rgb(90 100 112)' }}>
        <Link href="/students" className="flex items-center gap-1 hover:text-[rgb(14,124,90)] transition-colors">
          <ChevronLeft size={14} />
          Students
        </Link>
        <span className="opacity-30">/</span>
        <span style={{ color: 'rgb(11 31 58)' }}>{student.name}</span>
      </div>

      {/* ── Hero header card ── */}
      <div className="rounded-2xl overflow-hidden mb-6 bg-white"
        style={{ border: '1px solid rgb(var(--border-default,229 233 240))', boxShadow: '0 1px 8px rgb(11 31 58 / 0.06)' }}>

        {/* Top accent strip */}
        <div className="h-1" style={{ background: 'linear-gradient(90deg, rgb(14 124 90), rgb(30 90 171))' }} />

        <div className="px-6 pt-5 pb-0">
          <div className="flex items-start gap-4">

            {/* Avatar */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white shrink-0 select-none"
              style={{ background: avatarColor(student.name) }}
            >
              {initials(student.name)}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2.5 flex-wrap mb-1">
                <h1 className="text-xl font-bold" style={{ color: 'rgb(11 31 58)' }}>{student.name}</h1>
                {student.student_type === 'child' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgb(14 124 90 / 0.1)', color: 'rgb(14 124 90)' }}>
                    <Baby size={10} />
                    Child
                  </span>
                )}
                <StudentStatusBadge status={student.status} />
                {student.source && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                    style={{ background: 'rgb(244 246 250)', color: 'rgb(90 100 112)' }}>
                    {SOURCE_LABELS[student.source] ?? student.source}
                  </span>
                )}
              </div>
              <p className="text-sm" style={{ color: 'rgb(90 100 112)' }}>
                {student.student_type === 'child' && student.guardian
                  ? <>via <span className="font-medium" style={{ color: 'rgb(11 31 58)' }}>{student.guardian.name}</span> · </>
                  : null}
                {student.country}
                {student.timezone ? <> · <span className="opacity-70">{student.timezone}</span></> : null}
                {student.enrolled_at ? <> · Enrolled {formatDate(student.enrolled_at)}</> : null}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0 pt-0.5 flex-wrap justify-end">
              <button
                onClick={() => setShowDelete(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                style={{ borderColor: 'rgb(var(--border-default,229 233 240))', color: 'rgb(90 100 112)' }}
              >
                <Trash2 size={13} />
                Delete
              </button>
              {student.whatsapp && (
                <a
                  href={`https://wa.me/${student.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:bg-black/5"
                  style={{ borderColor: 'rgb(var(--border-default,229 233 240))', color: 'rgb(11 31 58)' }}
                >
                  <MessageCircle size={13} />
                  WhatsApp
                </a>
              )}
              {student.status === 'trial' && !hasAnySession && (
                <button onClick={() => setShowTrialSheet(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  style={{ background: 'rgb(14 124 90 / 0.1)', color: 'rgb(14 124 90)', border: '1px solid rgb(14 124 90 / 0.25)' }}>
                  <CalendarDays size={13} />
                  Schedule Trial Class
                </button>
              )}
              {student.status === 'trial' && hasScheduledTrial && (
                <button onClick={() => setTab('Sessions')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  style={{ background: 'rgb(14 124 90 / 0.06)', color: 'rgb(14 124 90)', border: '1px solid rgb(14 124 90 / 0.2)', cursor: 'default' }}
                  title="Trial class already scheduled — view in Sessions tab">
                  <Check size={13} />
                  Trial Scheduled
                </button>
              )}
              {student.status === 'trial' && hasAnySession && !hasScheduledTrial && (
                <button onClick={() => setShowTrialSheet(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  style={{ background: 'rgb(107 114 128 / 0.08)', color: 'rgb(107 114 128)', border: '1px solid rgb(107 114 128 / 0.2)' }}>
                  <CalendarDays size={13} />
                  Schedule Another Trial
                </button>
              )}
              {allowed.map((to) => {
                if (to === 'active')    return (
                  <button key={to} onClick={() => doTransition(to)} disabled={transition.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: 'rgb(14 124 90)' }}>
                    <PlayCircle size={13} /> Activate
                  </button>
                )
                if (to === 'paused')   return (
                  <button key={to} onClick={() => doTransition(to)} disabled={transition.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 transition-colors">
                    <PauseCircle size={13} /> Pause
                  </button>
                )
                if (to === 'suspended') return (
                  <button key={to} onClick={() => doTransition(to)} disabled={transition.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition-colors">
                    <PauseCircle size={13} /> Suspend
                  </button>
                )
                if (to === 'cancelled') return (
                  <button key={to} onClick={() => doTransition(to)} disabled={transition.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors">
                    <XCircle size={13} /> Cancel
                  </button>
                )
                return null
              })}
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-5 pt-4 pb-5 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 border-t"
            style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
            <StatChip label="Course"   value={student.course?.name ?? '—'} />
            <StatChip label="Teacher"  value={student.assigned_teacher?.name ?? 'Unassigned'} />
            <StatChip label="Sessions" value={sessions} />
            {student.student_type === 'child'
              ? <StatChip label="Parent" value={student.guardian?.name ?? '—'} />
              : <StatChip label="Price"  value={student.monthly_price_minor ? price : '—'} />
            }
          </div>
        </div>
      </div>

      {/* ── Workflow guide ── */}
      <StudentWorkflowGuide
        student={student}
        onScheduleTrial={() => setShowTrialSheet(true)}
        onGoToSessions={() => setTab('Sessions')}
        onActivate={() => setShowActivate(true)}
        onSetSchedule={() => setShowSetSchedule(true)}
      />

      {/* ── Tab bar ── */}
      <div className="sticky top-0 z-10 -mx-1 px-1 bg-[rgb(var(--surface-bg,244_246_250))] pb-0">
        <div className="flex gap-0 border-b overflow-x-auto"
          style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors"
              style={{
                borderBottomColor: tab === t ? 'rgb(14 124 90)' : 'transparent',
                color: tab === t ? 'rgb(14 124 90)' : 'rgb(90 100 112)',
              }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="pt-6">

        {tab === 'Profile' && (
          <form onSubmit={handleSubmit(onProfileSave)} className="space-y-4 max-w-3xl">

            <Card title="Identity">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label required>Name</Label><input className={inp} style={inpStyle} {...register('name')} /></div>
                <div><Label>Email</Label><input type="email" className={inp} style={inpStyle} {...register('email')} /></div>
                <div><Label>WhatsApp</Label><input className={inp} style={inpStyle} {...register('whatsapp')} /></div>
                {/* Country + Timezone: adults only — children's location belongs with the parent */}
                {student.student_type === 'adult' && (<>
                  <div>
                    <Label required>Country</Label>
                    <Controller name="country" control={control} render={({ field }) => (
                      <CountryCombobox value={field.value ?? ''} onChange={(code, tz) => {
                        field.onChange(code)
                        setValue('timezone', tz, { shouldValidate: true })
                      }} />
                    )} />
                  </div>
                  <div>
                    <Label required>Timezone</Label>
                    <Controller name="timezone" control={control} render={({ field }) => (
                      <input className={inp} style={inpStyle} placeholder="e.g. Africa/Cairo" {...field} value={field.value ?? ''} />
                    )} />
                  </div>
                </>)}
              </div>
            </Card>

            {student.student_type === 'child' && (
              <Card title="Parent / Guardian">
                {student.guardian ? (
                  <div className="space-y-4">
                    {/* Parent identity row */}
                    <div className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: 'rgb(14 124 90 / 0.04)', border: '1px solid rgb(14 124 90 / 0.15)' }}>
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                        style={{ background: 'rgb(14 124 90 / 0.1)' }}>
                        <UserRound size={18} style={{ color: 'rgb(14 124 90)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: 'rgb(11 31 58)' }}>{student.guardian.name}</p>
                        <p className="text-xs opacity-60">{student.guardian.whatsapp}</p>
                      </div>
                      {student.guardian.whatsapp && (
                        <a
                          href={`https://wa.me/${student.guardian.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:bg-black/5 shrink-0"
                          style={{ borderColor: 'rgb(var(--border-default,229 233 240))', color: 'rgb(11 31 58)' }}
                        >
                          <MessageCircle size={12} />
                          WhatsApp
                        </a>
                      )}
                    </div>

                    {/* Country / Timezone — editable, moved here for children */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t"
                      style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
                      <div>
                        <Label required>Country</Label>
                        <Controller name="country" control={control} render={({ field }) => (
                          <CountryCombobox value={field.value ?? ''} onChange={(code, tz) => {
                            field.onChange(code)
                            setValue('timezone', tz, { shouldValidate: true })
                          }} />
                        )} />
                      </div>
                      <div>
                        <Label required>Timezone</Label>
                        <Controller name="timezone" control={control} render={({ field }) => (
                          <input className={inp} style={inpStyle} placeholder="e.g. Africa/Cairo" {...field} value={field.value ?? ''} />
                        )} />
                      </div>
                    </div>

                    {/* Siblings under same parent — clickable link pills */}
                    {student.guardian.students.filter(s => s.id !== student.id).length > 0 && (
                      <div className="pt-1 border-t" style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
                        <p className="text-[11px] font-semibold uppercase tracking-widest opacity-40 mb-2">
                          Other children ({student.guardian.students.filter(s => s.id !== student.id).length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {student.guardian.students
                            .filter(s => s.id !== student.id)
                            .map(s => (
                              <Link
                                key={s.id}
                                href={`/students/${s.id}`}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors hover:bg-black/5"
                                style={{ borderColor: 'rgb(var(--border-default,229 233 240))', color: 'rgb(11 31 58)' }}
                              >
                                {s.name}
                                <ExternalLink size={10} className="opacity-40" />
                              </Link>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm opacity-40">No guardian linked.</p>
                )}
              </Card>
            )}

            <Card title="Enrollment">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Course</Label>
                  <Controller name="course_id" control={control} render={({ field }) => (
                    <EntityCombobox
                      items={courses.map((c) => ({ id: c.id, name: c.name }))}
                      value={field.value as number | undefined}
                      onChange={field.onChange}
                      placeholder="Select course…"
                      noneLabel="No course"
                    />
                  )} />
                </div>
                <div>
                  <Label>Teacher</Label>
                  <Controller name="assigned_teacher_id" control={control} render={({ field }) => (
                    <EntityCombobox
                      items={teachers.map((t) => ({ id: t.id, name: t.name ?? `Teacher #${t.id}` }))}
                      value={field.value as number | undefined}
                      onChange={field.onChange}
                      placeholder="Assign teacher…"
                      noneLabel="Unassigned"
                    />
                  )} />
                </div>
                <div>
                  <Label>Sessions / month</Label>
                  <input type="number" min="1" className={inp} style={inpStyle} {...register('sessions_per_month')} />
                </div>
                <div>
                  <Label>Session duration</Label>
                  <Controller name="session_duration_min" control={control} render={({ field }) => (
                    <Select value={String(field.value)} onValueChange={v => field.onChange(Number(v))}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DURATIONS.map((d) => <SelectItem key={d} value={String(d)}>{d} minutes</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )} />
                </div>
              </div>
            </Card>

            <Card title="Pricing">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Currency</Label>
                  <Controller name="currency" control={control} render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )} />
                </div>
                <div>
                  <Label>Monthly price</Label>
                  <input type="number" min="0" className={inp} style={inpStyle} {...register('monthly_price_minor')} />
                </div>
                <div>
                  <Label>Discount (%)</Label>
                  <input type="number" min="0" max="100" className={inp} style={inpStyle} {...register('custom_discount_pct')} />
                </div>
              </div>
            </Card>

            <div className="flex justify-end">
              <button type="submit" disabled={isSubmitting}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 hover:opacity-90 transition-opacity"
                style={{ background: 'rgb(14 124 90)' }}>
                {isSubmitting ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        )}

        {tab === 'Sessions' && (
          <StudentSessionsTab
            studentId={student.id}
            studentName={student.name}
            studentStatus={student.status}
          />
        )}
        {tab === 'Reports'  && <EmptyState icon="BarChart2" title="Reports"  description="Coming soon." />}
        {tab === 'Invoices' && <AutoBillingTable studentIdFilter={student.id} />}
        {tab === 'Wallet'   && <EmptyState icon="Wallet"    title="Wallet"   description="Coming soon." />}
        {tab === 'Family'   && <FamilyTabContent student={student} />}
        {tab === 'Timeline' && <StudentTimeline entries={student.timeline} isLoading={false} />}
        {tab === 'Notes'    && (
          <div className="space-y-4 max-w-2xl">
            <NoteComposer context="students" entityId={student.id} />
            <NotesList    context="students" entityId={student.id} />
          </div>
        )}
      </div>

      {/* Modals */}
      {showCancel && (
        <CancelModal
          onConfirm={handleCancel}
          onClose={() => setShowCancel(false)}
          isLoading={transition.isPending}
        />
      )}
      <ActivateStudentDialog
        student={student}
        open={showActivate}
        onOpenChange={setShowActivate}
      />
      <ScheduleTrialSheet
        student={student}
        open={showTrialSheet}
        onClose={() => setShowTrialSheet(false)}
      />
      <SetScheduleSheet
        student={student}
        open={showSetSchedule}
        onClose={() => setShowSetSchedule(false)}
      />
      {showDelete && (
        <DeleteStudentModal
          studentName={student.name}
          isLoading={deleteStudent.isPending}
          onConfirm={async () => {
            try {
              await deleteStudent.mutateAsync(student.id)
              toast.success(`${student.name} deleted.`)
              router.push('/students')
            } catch (e) {
              toast.error(e instanceof ApiError ? e.message : 'Failed to delete student.')
            }
          }}
          onClose={() => setShowDelete(false)}
        />
      )}
    </div>
  )
}
