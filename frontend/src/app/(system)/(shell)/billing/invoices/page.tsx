'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus, X, Search, FileText, CheckCircle2,
  AlertTriangle, Receipt, Loader2, ChevronRight, Trash2,
} from 'lucide-react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useInvoices, type InvoiceFilters } from '@/hooks/system/useInvoices'
import { useCreateInvoice } from '@/hooks/system/useCreateInvoice'
import { useStudents } from '@/hooks/system/useStudents'
import { useStudentBillingState } from '@/hooks/system/useStudentBillingState'
import { formatMinor } from '@/lib/money'
import type { InvoiceStatus } from '@/types/system/invoice'
import type { Student } from '@/types/system/student'

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; classes: string; dot: string }> = {
  draft:   { label: 'Draft',   classes: 'bg-gray-100 text-gray-600',       dot: 'bg-gray-400' },
  sent:    { label: 'Sent',    classes: 'bg-blue-50 text-blue-700',         dot: 'bg-blue-500' },
  paid:    { label: 'Paid',    classes: 'bg-emerald-50 text-emerald-700',   dot: 'bg-emerald-500' },
  overdue: { label: 'Overdue', classes: 'bg-red-50 text-red-700',           dot: 'bg-red-500' },
  void:    { label: 'Void',    classes: 'bg-gray-100 text-gray-400',        dot: 'bg-gray-300' },
}

const ALL_STATUSES: InvoiceStatus[] = ['draft', 'sent', 'paid', 'overdue', 'void']

type InvoiceType = 'advance' | 'reactivation' | 'manual'

interface LineItem {
  id: number
  description: string
  kind: 'monthly' | 'pro_rata' | 'outstanding' | 'adjustment' | 'discount'
  quantity: number
  unitPriceStr: string
}

const LINE_KINDS: { value: LineItem['kind']; label: string }[] = [
  { value: 'adjustment',  label: 'Adjustment / Fee' },
  { value: 'discount',    label: 'Discount' },
  { value: 'monthly',     label: 'Monthly Tuition' },
  { value: 'pro_rata',    label: 'Pro-rata' },
  { value: 'outstanding', label: 'Outstanding Balance' },
]

const TYPE_CONFIG: { value: InvoiceType; label: string; desc: string }[] = [
  { value: 'advance',      label: 'Advance',      desc: 'Pro-rata for remaining days this month' },
  { value: 'reactivation', label: 'Reactivation', desc: 'Outstanding balance + pro-rata' },
  { value: 'manual',       label: 'Custom',       desc: 'Gift, fee, adjustment — define your own lines' },
]

let lineIdSeq = 0
function newLine(): LineItem {
  return { id: ++lineIdSeq, description: '', kind: 'adjustment', quantity: 1, unitPriceStr: '' }
}

function toMinor(str: string): number {
  const n = parseFloat(str.replace(/,/g, ''))
  return isNaN(n) ? 0 : Math.round(n * 100)
}

function NewInvoiceModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (id: number) => void
}) {
  const { mutateAsync, isPending } = useCreateInvoice()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [type, setType] = useState<InvoiceType>('advance')
  const [effectiveFrom, setEffectiveFrom] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [lines, setLines] = useState<LineItem[]>([newLine()])
  const [formError, setFormError] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 320)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const { data: studentsData, isLoading: searchLoading } = useStudents(
    debouncedQuery ? { q: debouncedQuery, per_page: 8 } : { per_page: 1 }
  )
  const { data: billingPreview } = useStudentBillingState(
    (selectedStudent?.id && type !== 'manual') ? selectedStudent.id : ''
  )

  const students = debouncedQuery ? (studentsData?.data ?? []) : []

  const selectStudent = (s: Student) => {
    setSelectedStudent(s)
    setQuery(s.name)
    setDropdownOpen(false)
  }

  const updateLine = (id: number, patch: Partial<LineItem>) => {
    setLines(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l))
  }

  const removeLine = (id: number) => {
    setLines(prev => prev.length > 1 ? prev.filter(l => l.id !== id) : prev)
  }

  const manualTotal = lines.reduce((sum, l) => sum + toMinor(l.unitPriceStr) * l.quantity, 0)
  const currency = selectedStudent?.currency ?? 'USD'

  const submit = async () => {
    if (!selectedStudent) return setFormError('Please select a student.')

    if (type === 'manual') {
      if (!dueAt) return setFormError('Due date is required for custom invoices.')
      if (lines.some(l => !l.description.trim())) return setFormError('Each line item needs a description.')
      if (lines.some(l => l.unitPriceStr === '')) return setFormError('Each line item needs an amount.')
    }

    setFormError(null)
    try {
      const invoice = await mutateAsync({
        student_id: selectedStudent.id,
        type,
        effective_from: type === 'advance' && effectiveFrom ? effectiveFrom : undefined,
        due_at: type === 'manual' ? dueAt : undefined,
        lines: type === 'manual'
          ? lines.map(l => ({
              description:      l.description,
              kind:             l.kind,
              quantity:         l.quantity,
              unit_price_minor: toMinor(l.unitPriceStr),
              line_total_minor: toMinor(l.unitPriceStr) * l.quantity,
            }))
          : undefined,
      })
      onCreated(invoice.id)
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Failed to create invoice.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">New Invoice</h2>
            <p className="text-sm text-gray-400 mt-0.5">Create a billing invoice for a student</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors mt-0.5"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
          {formError && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          {/* Student search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Student</label>
            <div ref={dropdownRef} className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                value={query}
                onChange={e => { setQuery(e.target.value); setSelectedStudent(null); setDropdownOpen(true) }}
                onFocus={() => debouncedQuery && setDropdownOpen(true)}
                className="w-full rounded-xl border border-gray-200 pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-gray-400"
                placeholder="Search by name or email…"
              />
              {searchLoading && debouncedQuery && (
                <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
              )}
              {selectedStudent && !searchLoading && (
                <CheckCircle2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />
              )}
              {dropdownOpen && students.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-20">
                  {students.map(s => (
                    <button
                      key={s.id}
                      onClick={() => selectStudent(s)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{s.name}</p>
                        <p className="text-xs text-gray-400 truncate">{s.email ?? s.course?.name ?? s.currency}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Invoice type cards */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Invoice type</label>
            <div className="grid grid-cols-3 gap-2">
              {TYPE_CONFIG.map(t => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`rounded-xl border-2 p-3 text-left transition-all ${
                    type === t.value
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <p className={`text-sm font-semibold ${type === t.value ? 'text-emerald-700' : 'text-gray-700'}`}>
                    {t.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Billing preview (advance / reactivation) */}
          {type !== 'manual' && selectedStudent && billingPreview && (
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-2.5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Billing Preview</p>
              {billingPreview.outstanding.map(o => (
                <div key={o.number} className="flex justify-between text-sm">
                  <span className="text-gray-500">Outstanding #{o.number}</span>
                  <span className="font-semibold text-red-600">{formatMinor(o.amount_minor, billingPreview.currency)}</span>
                </div>
              ))}
              {billingPreview.pro_rata && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Pro-rata ({billingPreview.pro_rata.remaining_days}/{billingPreview.pro_rata.days_in_month} days)
                  </span>
                  <span className="font-medium text-gray-800">
                    {formatMinor(billingPreview.pro_rata.amount_minor, billingPreview.currency)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2.5">
                <span className="text-gray-700">Estimated total</span>
                <span className="text-gray-900">{formatMinor(billingPreview.total_minor, billingPreview.currency)}</span>
              </div>
            </div>
          )}

          {/* Advance: effective from */}
          {type === 'advance' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Effective from
                <span className="ml-1.5 text-xs font-normal text-gray-400">optional — defaults to today</span>
              </label>
              <input
                type="date"
                value={effectiveFrom}
                onChange={e => setEffectiveFrom(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Manual / custom: due date + line items */}
          {type === 'manual' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Due date</label>
                <input
                  type="date"
                  value={dueAt}
                  onChange={e => setDueAt(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Line items</label>
                  <button
                    onClick={() => setLines(prev => [...prev, newLine()])}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    <Plus size={13} />
                    Add line
                  </button>
                </div>

                <div className="space-y-2">
                  {lines.map(line => {
                    const lineTotal = toMinor(line.unitPriceStr) * line.quantity
                    return (
                      <div key={line.id} className="rounded-xl border border-gray-200 p-3 space-y-2.5 bg-gray-50/50">
                        {/* Description */}
                        <input
                          value={line.description}
                          onChange={e => updateLine(line.id, { description: e.target.value })}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-gray-400"
                          placeholder="Description (e.g. Gift card reimbursement, Late fee…)"
                        />

                        {/* Kind + qty + price row */}
                        <div className="flex gap-2 items-center">
                          <select
                            value={line.kind}
                            onChange={e => updateLine(line.id, { kind: e.target.value as LineItem['kind'] })}
                            className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 flex-1 min-w-0"
                          >
                            {LINE_KINDS.map(k => (
                              <option key={k.value} value={k.value}>{k.label}</option>
                            ))}
                          </select>

                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-xs text-gray-400">Qty</span>
                            <input
                              type="number"
                              min={1}
                              value={line.quantity}
                              onChange={e => updateLine(line.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                              className="w-14 rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-xs text-gray-400 shrink-0">{currency}</span>
                            <input
                              type="number"
                              step="0.01"
                              value={line.unitPriceStr}
                              onChange={e => updateLine(line.id, { unitPriceStr: e.target.value })}
                              className="w-24 rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs text-right focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-400"
                              placeholder="0.00"
                            />
                          </div>

                          <span className="text-xs font-semibold text-gray-700 w-20 text-right shrink-0 tabular-nums">
                            {lineTotal !== 0 ? formatMinor(lineTotal, currency) : '—'}
                          </span>

                          <button
                            onClick={() => removeLine(line.id)}
                            disabled={lines.length === 1}
                            className="text-gray-300 hover:text-red-400 transition-colors disabled:opacity-20 shrink-0"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Total */}
                <div className="mt-3 flex justify-between items-center px-1">
                  <span className="text-xs text-gray-500">Total</span>
                  <span className={`text-sm font-bold tabular-nums ${manualTotal < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatMinor(manualTotal, currency)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={isPending || !selectedStudent}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-opacity hover:opacity-90"
            style={{ background: 'rgb(14 124 90)' }}
          >
            {isPending ? (
              <><Loader2 size={14} className="animate-spin" />Creating…</>
            ) : (
              <>Create invoice<ChevronRight size={14} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function InvoicesPage() {
  const router = useRouter()
  const [filters, setFilters] = useState<InvoiceFilters>({})
  const [showNewModal, setShowNewModal] = useState(false)

  const { data, isLoading, error } = useInvoices(filters)
  const { data: allData } = useInvoices({})
  const { data: paidData } = useInvoices({ 'filter[status]': 'paid' })
  const { data: overdueData } = useInvoices({ 'filter[status]': 'overdue' })
  const { data: sentData } = useInvoices({ 'filter[status]': 'sent' })

  const invoices = data?.data ?? []
  const meta = data?.meta ?? null

  const activeStatus = filters['filter[status]'] as InvoiceStatus | undefined

  const toggleStatus = (s: InvoiceStatus) => {
    setFilters(f => ({ ...f, 'filter[status]': f['filter[status]'] === s ? undefined : s }))
  }

  const statCards = [
    {
      label: 'Total',
      value: allData?.meta?.total ?? '—',
      icon: <FileText size={17} className="text-gray-400" />,
      ring: false,
    },
    {
      label: 'Paid',
      value: paidData?.meta?.total ?? '—',
      icon: <CheckCircle2 size={17} className="text-emerald-500" />,
      status: 'paid' as InvoiceStatus,
    },
    {
      label: 'Pending',
      value: sentData?.meta?.total ?? '—',
      icon: <Receipt size={17} className="text-blue-500" />,
      status: 'sent' as InvoiceStatus,
    },
    {
      label: 'Overdue',
      value: overdueData?.meta?.total ?? '—',
      icon: <AlertTriangle size={17} className="text-red-500" />,
      status: 'overdue' as InvoiceStatus,
    },
  ]

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Manage student billing and invoices."
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

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {statCards.map(card => {
          const active = card.status && activeStatus === card.status
          return (
            <button
              key={card.label}
              onClick={() => card.status && toggleStatus(card.status)}
              className={`rounded-xl border p-4 text-left transition-all hover:shadow-sm ${
                active
                  ? 'border-emerald-300 bg-emerald-50 ring-1 ring-emerald-300'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                {card.icon}
                {active && (
                  <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">Active</span>
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{card.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{card.label}</p>
            </button>
          )
        })}
      </div>

      {/* Filter tabs */}
      <div className="mb-5 flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => setFilters({})}
          className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
            !activeStatus
              ? 'bg-gray-900 text-white'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          All
        </button>
        {ALL_STATUSES.map(s => {
          const cfg = STATUS_CONFIG[s]
          const active = activeStatus === s
          return (
            <button
              key={s}
              onClick={() => toggleStatus(s)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                active ? cfg.classes : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {cfg.label}
            </button>
          )
        })}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
          <Loader2 size={22} className="animate-spin" />
          <p className="text-sm">Loading invoices…</p>
        </div>
      ) : error ? (
        <div className="py-10 text-center text-sm text-red-500">{(error as Error).message}</div>
      ) : invoices.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <FileText size={22} className="text-gray-300" />
          </div>
          <p className="text-sm text-gray-400 font-medium">No invoices found</p>
          {activeStatus && (
            <button onClick={() => setFilters({})} className="text-sm text-emerald-600 hover:underline">
              Clear filter
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50/80">
                {['Invoice', 'Student', 'Period', 'Due date', 'Amount', 'Status', ''].map((h, i) => (
                  <th
                    key={i}
                    className={`px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider ${
                      h === 'Amount' ? 'text-right' : 'text-left'
                    } ${h === '' ? 'w-8' : ''}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {invoices.map(inv => {
                const cfg = STATUS_CONFIG[inv.status]
                const initials = (inv.student?.name ?? '?').charAt(0).toUpperCase()
                return (
                  <tr key={inv.id} className="hover:bg-gray-50/60 transition-colors group">
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/billing/invoices/${inv.id}`}
                        className="text-sm font-mono font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                      >
                        {inv.invoice_number}
                      </Link>
                      <p className="text-[11px] text-gray-400 capitalize mt-0.5">{inv.type}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                          {initials}
                        </div>
                        <span className="text-sm text-gray-800 font-medium truncate max-w-[140px]">
                          {inv.student?.name ?? '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-500">
                      {inv.period_year && inv.period_month
                        ? new Date(inv.period_year, inv.period_month - 1).toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-500">
                      {new Date(inv.due_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-right font-bold text-gray-900 tabular-nums">
                      {formatMinor(inv.total_minor, inv.currency)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.classes}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/billing/invoices/${inv.id}`}
                        className="text-gray-200 group-hover:text-gray-400 transition-colors"
                      >
                        <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {meta && (
            <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between bg-gray-50/60">
              <span className="text-xs text-gray-400">
                Showing {invoices.length} of {meta.total} invoices
              </span>
              <span className="text-xs text-gray-400">
                Page {meta.current_page} of {meta.last_page}
              </span>
            </div>
          )}
        </div>
      )}

      {showNewModal && (
        <NewInvoiceModal
          onClose={() => setShowNewModal(false)}
          onCreated={id => {
            setShowNewModal(false)
            router.push(`/billing/invoices/${id}`)
          }}
        />
      )}
    </>
  )
}
