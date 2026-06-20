'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus, X, Search, FileText, CheckCircle2,
  AlertTriangle, Receipt, Loader2,
  Mail, Phone, Clock, BookOpen, User, Send, Bell, BellRing,
  CreditCard, Eye, MoreHorizontal, Calendar, RefreshCw, Zap, PenLine,
} from 'lucide-react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useInvoices, type InvoiceFilters } from '@/hooks/system/useInvoices'
import { useCreateInvoice } from '@/hooks/system/useCreateInvoice'
import { useSendInvoice } from '@/hooks/system/useInvoice'
import { useStudents } from '@/hooks/system/useStudents'
import { useStudentBillingState } from '@/hooks/system/useStudentBillingState'
import { formatMinor } from '@/lib/money'
import type { Invoice, InvoiceStatus, InvoiceType } from '@/types/system/invoice'
import type { Student } from '@/types/system/student'

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; classes: string; dot: string }> = {
  draft:   { label: 'Draft',   classes: 'bg-gray-100 text-gray-600',     dot: 'bg-gray-400' },
  sent:    { label: 'Sent',    classes: 'bg-blue-50 text-blue-700',       dot: 'bg-blue-500' },
  paid:    { label: 'Paid',    classes: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  overdue: { label: 'Overdue', classes: 'bg-red-50 text-red-700',         dot: 'bg-red-500' },
  void:    { label: 'Void',    classes: 'bg-gray-100 text-gray-400',      dot: 'bg-gray-300' },
}

const ALL_STATUSES: InvoiceStatus[] = ['draft', 'sent', 'paid', 'overdue', 'void']

type CreateInvoiceType = 'advance' | 'reactivation' | 'manual'

const TYPE_CONFIG: { value: CreateInvoiceType; label: string; desc: string }[] = [
  { value: 'advance',      label: 'Advance',      desc: 'Pro-rata for remaining days this month' },
  { value: 'reactivation', label: 'Reactivation', desc: 'Outstanding balance + pro-rata' },
  { value: 'manual',       label: 'Custom',       desc: 'Write a message & amount for this student' },
]

function toMinor(str: string): number {
  const n = parseFloat(str.replace(/,/g, ''))
  return isNaN(n) ? 0 : Math.round(n * 100)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function totalHoursFromInvoice(inv: Invoice): { hours: number; sessions: number } | null {
  const snap = inv.snapshot
  if (snap?.sessions_per_month && snap?.session_duration_min) {
    const sessions = Number(snap.sessions_per_month)
    const duration = Number(snap.session_duration_min)
    return { sessions, hours: (sessions * duration) / 60 }
  }
  if (inv.lines && inv.lines.length > 0) {
    const monthly = inv.lines.find(l => l.kind === 'monthly')
    if (monthly?.session_duration_min) {
      return { sessions: monthly.quantity, hours: (monthly.quantity * monthly.session_duration_min) / 60 }
    }
  }
  return null
}

function fmtHours(h: number): string {
  return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`
}

function daysUntil(iso: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const due   = new Date(iso); due.setHours(0, 0, 0, 0)
  return Math.round((due.getTime() - today.getTime()) / 86400000)
}

function normalisePhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  const digits = raw.replace(/[^\d]/g, '')
  return digits.length >= 7 ? digits : null
}

function buildAutoFooter(inv: Invoice): string {
  const studentName = inv.student?.name ?? inv.snapshot?.student_name ?? '—'
  const amount  = formatMinor(inv.total_minor, inv.currency)
  const due     = new Date(inv.due_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const issued  = inv.issued_at
    ? new Date(inv.issued_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const course  = inv.snapshot?.course_name ? `\nCourse: ${inv.snapshot.course_name}` : ''
  return [``, `──────────────────`, `Student: ${studentName}`, `Date: ${issued}${course}`, `Amount: ${amount}`, `Due: ${due}`, ``, `— Azhary`].join('\n')
}

function buildWhatsAppMessage(inv: Invoice, kind: 'invoice' | 'reminder'): string {
  const studentName = inv.student?.name ?? inv.snapshot?.student_name ?? 'there'
  const description = inv.description ?? inv.snapshot?.description
  if (kind === 'reminder') {
    const amount = formatMinor(inv.total_minor, inv.currency)
    const due    = new Date(inv.due_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const course = inv.snapshot?.course_name ? ` for ${inv.snapshot.course_name}` : ''
    return [`Hi ${studentName},`, ``, `This is a friendly reminder about your payment${course}.`, `Amount due: ${amount}`, `Due date: ${due}`, ``, `Please let us know once the payment has been made. Jazak Allahu khairan.`, ``, `— Azhary`].join('\n')
  }
  if (description) return `As-salamu alaikum ${studentName},\n\n${description}${buildAutoFooter(inv)}`
  const course = inv.snapshot?.course_name ? ` for ${inv.snapshot.course_name}` : ''
  return [`As-salamu alaikum ${studentName},`, ``, `Your invoice${course} is ready.`].join('\n') + buildAutoFooter(inv)
}

// ─── New invoice modal ────────────────────────────────────────────────────────

function NewInvoiceModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: number) => void }) {
  const { mutateAsync, isPending } = useCreateInvoice()
  const [query, setQuery]                 = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [dropdownOpen, setDropdownOpen]   = useState(false)
  const [type, setType]                   = useState<CreateInvoiceType>('advance')
  const [effectiveFrom, setEffectiveFrom] = useState('')
  const [dueAt, setDueAt]                 = useState('')
  const [manualDescription, setManualDescription] = useState('')
  const [manualAmountStr, setManualAmountStr]       = useState('')
  const [formError, setFormError]         = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => { const t = setTimeout(() => setDebouncedQuery(query), 320); return () => clearTimeout(t) }, [query])
  useEffect(() => {
    const h = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h)
  }, [onClose])

  const { data: studentsData, isLoading: searchLoading } = useStudents(debouncedQuery ? { q: debouncedQuery, per_page: 8 } : { per_page: 1 })
  const { data: billingPreview } = useStudentBillingState((selectedStudent?.id && type !== 'manual') ? selectedStudent.id : '')
  const students = debouncedQuery ? (studentsData?.data ?? []) : []
  const currency = selectedStudent?.currency ?? 'USD'
  const manualAmountMinor = toMinor(manualAmountStr)

  const selectStudent = (s: Student) => { setSelectedStudent(s); setQuery(s.name); setDropdownOpen(false) }

  const submit = async () => {
    if (!selectedStudent) return setFormError('Please select a student.')
    if (type === 'manual') {
      if (!dueAt) return setFormError('Due date is required.')
      if (!manualDescription.trim()) return setFormError('Description is required.')
      if (!manualAmountStr || manualAmountMinor === 0) return setFormError('Amount is required.')
    }
    setFormError(null)
    try {
      const invoice = await mutateAsync({
        student_id: selectedStudent.id, type,
        effective_from: type === 'advance' && effectiveFrom ? effectiveFrom : undefined,
        due_at: type === 'manual' ? dueAt : undefined,
        lines: type === 'manual' ? [{ description: manualDescription.trim(), kind: 'adjustment' as const, quantity: 1, unit_price_minor: manualAmountMinor, line_total_minor: manualAmountMinor }] : undefined,
      })
      onCreated(invoice.id)
    } catch (e: unknown) { setFormError(e instanceof Error ? e.message : 'Failed to create invoice.') }
  }

  const previewFooter = type === 'manual' && manualDescription.trim() ? (() => {
    const name   = selectedStudent?.name ?? 'Student Name'
    const amount = manualAmountMinor > 0 ? formatMinor(manualAmountMinor, currency) : `${currency} 0.00`
    const due    = dueAt ? new Date(dueAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Due date'
    const today  = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return `As-salamu alaikum ${name},\n\n${manualDescription.trim()}\n\n──────────────────\nStudent: ${name}\nDate: ${today}\nAmount: ${amount}\nDue: ${due}\n\n— Azhary`
  })() : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col">
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div><h2 className="text-lg font-semibold text-gray-900">New Invoice</h2><p className="text-sm text-gray-400 mt-0.5">Create a billing invoice for a student</p></div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors mt-0.5"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
          {formError && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{formError}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Student</label>
            <div ref={dropdownRef} className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input value={query} onChange={e => { setQuery(e.target.value); setSelectedStudent(null); setDropdownOpen(true) }} onFocus={() => debouncedQuery && setDropdownOpen(true)}
                className="w-full rounded-xl border border-gray-200 pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-gray-400" placeholder="Search by name or email…" />
              {searchLoading && debouncedQuery && <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />}
              {selectedStudent && !searchLoading && <CheckCircle2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />}
              {dropdownOpen && students.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-20">
                  {students.map(s => (
                    <button key={s.id} onClick={() => selectStudent(s)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">{s.name.charAt(0).toUpperCase()}</div>
                      <div className="min-w-0"><p className="text-sm font-medium text-gray-800 truncate">{s.name}</p><p className="text-xs text-gray-400 truncate">{s.email ?? s.course?.name ?? s.currency}</p></div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Invoice type</label>
            <div className="grid grid-cols-3 gap-2">
              {TYPE_CONFIG.map(t => (
                <button key={t.value} onClick={() => setType(t.value)} className={`rounded-xl border-2 p-3 text-left transition-all ${type === t.value ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                  <p className={`text-sm font-semibold ${type === t.value ? 'text-emerald-700' : 'text-gray-700'}`}>{t.label}</p>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
          {type !== 'manual' && selectedStudent && billingPreview && (
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-2.5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Billing Preview</p>
              {billingPreview.outstanding.map(o => (
                <div key={o.number} className="flex justify-between text-sm"><span className="text-gray-500">Outstanding #{o.number}</span><span className="font-semibold text-red-600">{formatMinor(o.amount_minor, billingPreview.currency)}</span></div>
              ))}
              {billingPreview.pro_rata && (
                <div className="flex justify-between text-sm"><span className="text-gray-500">Pro-rata ({billingPreview.pro_rata.remaining_days}/{billingPreview.pro_rata.days_in_month} days)</span><span className="font-medium text-gray-800">{formatMinor(billingPreview.pro_rata.amount_minor, billingPreview.currency)}</span></div>
              )}
              <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2.5"><span className="text-gray-700">Estimated total</span><span className="text-gray-900">{formatMinor(billingPreview.total_minor, billingPreview.currency)}</span></div>
            </div>
          )}
          {type === 'advance' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Effective from<span className="ml-1.5 text-xs font-normal text-gray-400">optional — defaults to today</span></label>
              <input type="date" value={effectiveFrom} onChange={e => setEffectiveFrom(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
            </div>
          )}
          {type === 'manual' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Due date</label>
                <input type="date" value={dueAt} onChange={e => setDueAt(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-700">Amount</label>
                  {selectedStudent?.currency ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">{selectedStudent.currency}</span> : <span className="text-[11px] text-gray-400">select a student first</span>}
                </div>
                <div className="flex items-center rounded-xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent">
                  <span className="px-3 py-2.5 text-sm font-semibold text-gray-500 bg-gray-50 border-r border-gray-200 shrink-0">{selectedStudent?.currency ?? '—'}</span>
                  <input type="number" step="0.01" min="0" value={manualAmountStr} onChange={e => setManualAmountStr(e.target.value)} disabled={!selectedStudent} className="flex-1 px-3 py-2.5 text-sm text-right focus:outline-none bg-white placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-400" placeholder="0.00" />
                </div>
                {manualAmountMinor > 0 && <p className="text-xs text-emerald-700 font-semibold mt-1 text-right tabular-nums">{formatMinor(manualAmountMinor, currency)}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Message / Description<span className="ml-1.5 text-xs font-normal text-gray-400">sent to the student via WhatsApp</span></label>
                <textarea value={manualDescription} onChange={e => setManualDescription(e.target.value)} rows={4} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none placeholder:text-gray-400" placeholder="e.g. Monthly tuition for May 2026, includes 8 sessions…" />
              </div>
              {previewFooter && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">WhatsApp preview — auto-appended details</p>
                  <pre className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[11px] leading-relaxed text-gray-600 whitespace-pre-wrap font-sans overflow-x-auto">{previewFooter}</pre>
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
          <button onClick={submit} disabled={isPending || !selectedStudent} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-opacity hover:opacity-90" style={{ background: 'rgb(14 124 90)' }}>
            {isPending ? <><Loader2 size={14} className="animate-spin" />Creating…</> : <>Create invoice</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── WhatsApp preview modal ───────────────────────────────────────────────────

function WhatsAppPreviewModal({ invoice, kind, onClose }: { invoice: Invoice; kind: 'invoice' | 'reminder'; onClose: () => void }) {
  const phone = normalisePhone(invoice.student?.whatsapp ?? invoice.student?.phone)
  const [message, setMessage] = useState(() => buildWhatsAppMessage(invoice, kind))
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h)
  }, [onClose])
  const open = () => {
    if (!phone) return
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
    onClose()
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div><h3 className="text-base font-semibold text-gray-900">{kind === 'reminder' ? 'Send WhatsApp Reminder' : 'Send Invoice via WhatsApp'}</h3><p className="text-sm text-gray-400 mt-0.5">{invoice.invoice_number} · {invoice.student?.name ?? '—'}</p></div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X size={17} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {!phone && <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">This student has no WhatsApp or phone number on file.</div>}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">To</p>
            <div className="flex items-center gap-2 text-sm text-gray-800"><Phone size={13} className="text-emerald-600" /><span className="font-mono">{phone ? `+${phone}` : '—'}</span><span className="text-gray-400">·</span><span>{invoice.student?.name ?? '—'}</span></div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Message</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={9} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-y" />
            <p className="text-[11px] text-gray-400 mt-1.5">Opens WhatsApp Web/app with the message pre-filled. You confirm and tap send there.</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
          <button onClick={open} disabled={!phone} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity" style={{ background: kind === 'reminder' ? 'rgb(180 83 9)' : 'rgb(22 163 74)' }}>
            <WhatsAppIcon size={14} />Open in WhatsApp
          </button>
        </div>
      </div>
    </div>
  )
}

function WhatsAppIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.81 11.81 0 018.413 3.488 11.81 11.81 0 013.48 8.414c-.003 6.554-5.338 11.89-11.893 11.89-1.99 0-3.95-.5-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l.36.572-1.003 3.668 3.622-.999zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.296-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.521.074-.792.372s-1.04 1.016-1.04 2.479c0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
    </svg>
  )
}

// ─── Invoice row ──────────────────────────────────────────────────────────────

function InvoiceRow({ inv, onWhatsApp }: { inv: Invoice; onWhatsApp: (inv: Invoice, kind: 'invoice' | 'reminder') => void }) {
  const cfg         = STATUS_CONFIG[inv.status]
  const hours       = totalHoursFromInvoice(inv)
  const studentName = inv.student?.name ?? inv.snapshot?.student_name ?? '—'
  const courseName  = inv.snapshot?.course_name as string | null | undefined
  const teacherName = inv.snapshot?.teacher_name as string | null | undefined
  const due         = new Date(inv.due_at)
  const dueDays     = daysUntil(inv.due_at)
  const phone       = inv.student?.whatsapp ?? inv.student?.phone
  const hasContact  = !!normalisePhone(phone)

  const { mutateAsync: resend, isPending: resending } = useSendInvoice(inv.id)
  const [resendDone, setResendDone] = useState(false)

  let dispatch: { label: string; cls: string; icon: React.ReactNode }
  if      (inv.status === 'paid')    dispatch = { label: 'Paid',            cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 size={11} /> }
  else if (inv.status === 'void')    dispatch = { label: 'Cancelled',       cls: 'bg-gray-50 text-gray-500 border-gray-200',          icon: <X size={11} /> }
  else if (inv.status === 'overdue') dispatch = { label: 'Reminder needed', cls: 'bg-red-50 text-red-700 border-red-200',             icon: <BellRing size={11} /> }
  else if (inv.issued_at)            dispatch = { label: 'Sent',            cls: 'bg-blue-50 text-blue-700 border-blue-200',          icon: <Send size={11} /> }
  else                               dispatch = { label: 'Not sent',        cls: 'bg-amber-50 text-amber-700 border-amber-200',       icon: <Bell size={11} /> }

  const handleResend = async () => {
    try { await resend(); setResendDone(true); setTimeout(() => setResendDone(false), 2000) } catch { /* surfaced by hook */ }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all overflow-hidden">
      <div className="px-5 py-4 flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700 flex items-center justify-center text-sm font-bold shrink-0">{studentName.charAt(0).toUpperCase()}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">{inv.type}</span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${cfg.classes}`}><span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}</span>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${dispatch.cls}`}>{dispatch.icon}{dispatch.label}</span>
            </div>
            <p className="text-sm font-semibold text-gray-900 mt-1 truncate">{studentName}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap text-[11px] text-gray-500">
              {courseName  && <span className="inline-flex items-center gap-1"><BookOpen size={11} /> {courseName}</span>}
              {teacherName && <span className="inline-flex items-center gap-1"><User size={11} /> {teacherName}</span>}
              {phone       && <span className="inline-flex items-center gap-1"><Phone size={11} /> {phone}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-5 lg:gap-7 shrink-0 pl-13 lg:pl-0">
          {hours && (
            <div className="text-right">
              <div className="inline-flex items-center gap-1 text-sm font-semibold text-gray-800 tabular-nums"><Clock size={13} className="text-gray-400" />{fmtHours(hours.hours)}</div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">{hours.sessions} sessions</p>
            </div>
          )}
          <div className="text-right">
            <p className="text-base font-bold text-gray-900 tabular-nums">{formatMinor(inv.total_minor, inv.currency)}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">{inv.currency} · total</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-700 inline-flex items-center gap-1"><Calendar size={11} className="text-gray-400" />{due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
            <p className={`text-[10px] uppercase tracking-wider ${inv.status === 'paid' || inv.status === 'void' ? 'text-gray-400' : dueDays < 0 ? 'text-red-500 font-semibold' : dueDays <= 3 ? 'text-amber-600 font-semibold' : 'text-gray-400'}`}>
              {inv.status === 'paid' || inv.status === 'void' ? 'due date' : dueDays < 0 ? `${Math.abs(dueDays)}d overdue` : dueDays === 0 ? 'due today' : `in ${dueDays}d`}
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-2.5 flex items-center gap-1.5 flex-wrap">
        <Link href={`/billing/invoices/${inv.id}`} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all"><Eye size={12} />View</Link>
        {inv.status !== 'void' && inv.status !== 'paid' && (
          <button onClick={() => onWhatsApp(inv, 'invoice')} disabled={!hasContact} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            <WhatsAppIcon size={12} />WhatsApp
          </button>
        )}
        {(inv.status === 'draft' || inv.status === 'sent') && (
          <button onClick={handleResend} disabled={resending} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all disabled:opacity-50">
            {resending ? <Loader2 size={12} className="animate-spin" /> : resendDone ? <CheckCircle2 size={12} /> : <Mail size={12} />}
            {resendDone ? 'Sent' : inv.status === 'sent' ? 'Resend email' : 'Send email'}
          </button>
        )}
        {(inv.status === 'sent' || inv.status === 'overdue') && (
          <button onClick={() => onWhatsApp(inv, 'reminder')} disabled={!hasContact} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-700 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            <BellRing size={12} />Send reminder
          </button>
        )}
        {(inv.status === 'sent' || inv.status === 'overdue') && (
          <Link href={`/billing/invoices/${inv.id}`} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all">
            <CreditCard size={12} />Record payment
          </Link>
        )}
        <div className="flex-1" />
        <Link href={`/billing/invoices/${inv.id}`} className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-700 hover:bg-white transition-colors"><MoreHorizontal size={13} /></Link>
      </div>
    </div>
  )
}

// ─── Tab + section config ─────────────────────────────────────────────────────

type TabKey = 'automatic' | 'pro' | 'manual'

const TABS: {
  key: TabKey
  label: string
  types: InvoiceType[]
  Icon: React.ComponentType<{ size?: number; className?: string }>
  color: { tab: string; activeTab: string; indicator: string; iconBg: string; activeAll: string }
}[] = [
  {
    key: 'automatic', label: 'Automatic', types: ['monthly'],
    Icon: RefreshCw,
    color: { tab: 'text-gray-500 hover:text-blue-600 hover:bg-blue-50', activeTab: 'text-blue-700', indicator: 'bg-blue-600', iconBg: 'text-blue-600', activeAll: 'bg-blue-700 text-white' },
  },
  {
    key: 'pro', label: 'Pro', types: ['advance', 'reactivation'],
    Icon: Zap,
    color: { tab: 'text-gray-500 hover:text-purple-600 hover:bg-purple-50', activeTab: 'text-purple-700', indicator: 'bg-purple-600', iconBg: 'text-purple-600', activeAll: 'bg-purple-700 text-white' },
  },
  {
    key: 'manual', label: 'Manual', types: ['manual'],
    Icon: PenLine,
    color: { tab: 'text-gray-500 hover:text-amber-600 hover:bg-amber-50', activeTab: 'text-amber-700', indicator: 'bg-amber-500', iconBg: 'text-amber-600', activeAll: 'bg-amber-600 text-white' },
  },
]

// ─── Section content ──────────────────────────────────────────────────────────

function SectionContent({
  tab,
  onWhatsApp,
}: {
  tab: typeof TABS[number]
  onWhatsApp: (inv: Invoice, kind: 'invoice' | 'reminder') => void
}) {
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | undefined>()
  const [searchTerm, setSearchTerm]     = useState('')

  const typeParam = tab.types.length === 1 ? tab.types[0] : tab.types.slice() as string[]

  const { data: allData }     = useInvoices({ 'filter[type]': typeParam })
  const { data: paidData }    = useInvoices({ 'filter[type]': typeParam, 'filter[status]': 'paid' })
  const { data: sentData }    = useInvoices({ 'filter[type]': typeParam, 'filter[status]': 'sent' })
  const { data: overdueData } = useInvoices({ 'filter[type]': typeParam, 'filter[status]': 'overdue' })

  const listFilters: InvoiceFilters = { 'filter[type]': typeParam }
  if (statusFilter) listFilters['filter[status]'] = statusFilter
  const { data, isLoading, error } = useInvoices(listFilters)

  const rawInvoices = data?.data ?? []
  const invoices = useMemo(() => {
    if (!searchTerm.trim()) return rawInvoices
    const q = searchTerm.toLowerCase()
    return rawInvoices.filter(inv =>
      inv.invoice_number.toLowerCase().includes(q) ||
      inv.student?.name?.toLowerCase().includes(q) ||
      inv.student?.email?.toLowerCase().includes(q) ||
      (inv.snapshot?.course_name as string | undefined)?.toLowerCase().includes(q)
    )
  }, [rawInvoices, searchTerm])

  const meta = data?.meta ?? null
  const { color } = tab

  const statCards = [
    { label: 'Total',   value: allData?.meta?.total,     icon: <FileText size={15} className="text-gray-400" /> },
    { label: 'Paid',    value: paidData?.meta?.total,    icon: <CheckCircle2 size={15} className="text-emerald-500" />, status: 'paid'    as InvoiceStatus },
    { label: 'Pending', value: sentData?.meta?.total,    icon: <Receipt size={15} className="text-blue-500" />,         status: 'sent'    as InvoiceStatus },
    { label: 'Overdue', value: overdueData?.meta?.total, icon: <AlertTriangle size={15} className="text-red-500" />,    status: 'overdue' as InvoiceStatus },
  ]

  return (
    <div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {statCards.map(card => {
          const active = card.status && statusFilter === card.status
          return (
            <button
              key={card.label}
              onClick={() => card.status && setStatusFilter(f => f === card.status ? undefined : card.status)}
              className={`rounded-xl border p-4 text-left transition-all hover:shadow-sm ${active ? 'border-emerald-300 bg-emerald-50 ring-1 ring-emerald-300' : 'border-gray-200 bg-white hover:border-gray-300'}`}
            >
              <div className="flex items-center justify-between mb-3">
                {card.icon}
                {active && <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">Active</span>}
              </div>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{card.value ?? '—'}</p>
              <p className="text-xs text-gray-400 mt-0.5">{card.label}</p>
            </button>
          )
        })}
      </div>

      {/* Search + status filters */}
      <div className="mb-5 flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search invoice #, student, course…"
            className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-gray-400"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={13} /></button>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={() => setStatusFilter(undefined)} className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${!statusFilter ? color.activeAll : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}>All</button>
          {ALL_STATUSES.map(s => {
            const cfg    = STATUS_CONFIG[s]
            const active = statusFilter === s
            return (
              <button key={s} onClick={() => setStatusFilter(f => f === s ? undefined : s)} className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${active ? cfg.classes : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}>{cfg.label}</button>
            )
          })}
        </div>
      </div>

      {/* Invoice list */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400"><Loader2 size={22} className="animate-spin" /><p className="text-sm">Loading invoices…</p></div>
      ) : error ? (
        <div className="py-10 text-center text-sm text-red-500">{(error as Error).message}</div>
      ) : invoices.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center"><FileText size={22} className="text-gray-300" /></div>
          <p className="text-sm text-gray-400 font-medium">{searchTerm ? 'No invoices match your search' : 'No invoices found'}</p>
          {(statusFilter || searchTerm) && <button onClick={() => { setStatusFilter(undefined); setSearchTerm('') }} className="text-sm text-emerald-600 hover:underline">Clear filters</button>}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {invoices.map(inv => <InvoiceRow key={inv.id} inv={inv} onWhatsApp={onWhatsApp} />)}
          </div>
          {meta && (
            <div className="mt-5 px-1 flex items-center justify-between">
              <span className="text-xs text-gray-400">Showing {invoices.length}{searchTerm ? ' filtered' : ''} of {meta.total} invoices</span>
              <span className="text-xs text-gray-400">Page {meta.current_page} of {meta.last_page}</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InvoicesPage() {
  const router = useRouter()
  const [activeTab, setActiveTab]   = useState<TabKey>('automatic')
  const [showNewModal, setShowNewModal] = useState(false)
  const [whatsApp, setWhatsApp]     = useState<{ invoice: Invoice; kind: 'invoice' | 'reminder' } | null>(null)

  // Lightweight count queries to populate tab badges before switching
  const { data: autoCount }   = useInvoices({ 'filter[type]': 'monthly' })
  const { data: proCount }    = useInvoices({ 'filter[type]': ['advance', 'reactivation'] })
  const { data: manualCount } = useInvoices({ 'filter[type]': 'manual' })

  const tabCounts: Record<TabKey, number | undefined> = {
    automatic: autoCount?.meta?.total,
    pro:       proCount?.meta?.total,
    manual:    manualCount?.meta?.total,
  }

  const currentTab = TABS.find(t => t.key === activeTab)!

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Manage automatic monthly bills, pro-rata advance invoices, and custom manual charges."
        actions={
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
            style={{ background: 'rgb(14 124 90)' }}
          >
            <Plus size={16} />
            New invoice
          </button>
        }
      />

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-gray-200 mb-6 -mt-2">
        {TABS.map(tab => {
          const active = activeTab === tab.key
          const count  = tabCounts[tab.key]
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${active ? tab.color.activeTab + ' bg-white' : tab.color.tab}`}
            >
              <tab.Icon size={15} className={active ? tab.color.iconBg : ''} />
              {tab.label}
              {count !== undefined && (
                <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full tabular-nums ${active ? 'bg-gray-100 text-gray-600' : 'bg-gray-100 text-gray-500'}`}>
                  {count}
                </span>
              )}
              {active && (
                <span className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full ${tab.color.indicator}`} />
              )}
            </button>
          )
        })}
      </div>

      {/* Active section */}
      <SectionContent
        key={activeTab}
        tab={currentTab}
        onWhatsApp={(invoice, kind) => setWhatsApp({ invoice, kind })}
      />

      {showNewModal && (
        <NewInvoiceModal
          onClose={() => setShowNewModal(false)}
          onCreated={id => { setShowNewModal(false); router.push(`/billing/invoices/${id}`) }}
        />
      )}

      {whatsApp && (
        <WhatsAppPreviewModal
          invoice={whatsApp.invoice}
          kind={whatsApp.kind}
          onClose={() => setWhatsApp(null)}
        />
      )}
    </>
  )
}
