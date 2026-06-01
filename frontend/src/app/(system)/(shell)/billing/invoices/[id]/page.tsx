'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, X, Send, Ban, CreditCard,
  Copy, Check, Loader2, ExternalLink, Clock,
  CheckCircle2, AlertTriangle, FileText, Download, CalendarDays,
  XCircle, GraduationCap,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useInvoice, useVoidInvoice, useSendInvoice, useInvoiceSessions } from '@/hooks/system/useInvoice'
import { useRecordPayment } from '@/hooks/system/useRecordPayment'
import { getToken } from '@/lib/system/api'
import { formatMinor } from '@/lib/money'
import type { Invoice, PaymentMethod } from '@/types/system/invoice'

const STATUS_CONFIG: Record<string, { label: string; classes: string; dot: string; icon: React.ReactNode }> = {
  draft:   { label: 'Draft',   classes: 'bg-gray-100 text-gray-600',       dot: 'bg-gray-400',    icon: <FileText size={13} /> },
  sent:    { label: 'Sent',    classes: 'bg-blue-50 text-blue-700',         dot: 'bg-blue-500',    icon: <Clock size={13} /> },
  paid:    { label: 'Paid',    classes: 'bg-emerald-50 text-emerald-700',   dot: 'bg-emerald-500', icon: <CheckCircle2 size={13} /> },
  overdue: { label: 'Overdue', classes: 'bg-red-50 text-red-700',           dot: 'bg-red-500',     icon: <AlertTriangle size={13} /> },
  void:    { label: 'Void',    classes: 'bg-gray-100 text-gray-400',        dot: 'bg-gray-300',    icon: <Ban size={13} /> },
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'paymob',        label: 'Paymob' },
  { value: 'paypal',        label: 'PayPal' },
  { value: 'vodafone_cash', label: 'Vodafone Cash' },
  { value: 'instapay',      label: 'InstaPay' },
  { value: 'wallet',        label: 'Wallet' },
  { value: 'other',         label: 'Other' },
]

function BlurModal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={17} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function RecordPaymentModal({
  invoice,
  onSuccess,
  onClose,
}: {
  invoice: Invoice
  onSuccess: () => void
  onClose: () => void
}) {
  const { mutateAsync, isPending, error } = useRecordPayment(invoice.id)
  const [method, setMethod] = useState<PaymentMethod>('bank_transfer')
  const [reference, setReference] = useState('')

  const submit = async () => {
    try {
      await mutateAsync({
        amount_minor: invoice.total_minor,
        currency: invoice.currency,
        method,
        reference: reference || undefined,
      })
      onSuccess()
    } catch {
      // error displayed from hook
    }
  }

  return (
    <BlurModal title="Record Payment" subtitle={`Full amount: ${formatMinor(invoice.total_minor, invoice.currency)}`} onClose={onClose}>
      <div className="px-6 py-5 space-y-4">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {(error as Error).message}
          </div>
        )}

        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
          <p className="text-xs text-emerald-600 font-medium">Amount to record</p>
          <p className="text-xl font-bold text-emerald-800 mt-0.5">
            {formatMinor(invoice.total_minor, invoice.currency)}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment method</label>
          <select
            value={method}
            onChange={e => setMethod(e.target.value as PaymentMethod)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            {PAYMENT_METHODS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Reference
            <span className="ml-1.5 text-xs font-normal text-gray-400">optional</span>
          </label>
          <input
            value={reference}
            onChange={e => setReference(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-gray-400"
            placeholder="Bank ref, transaction ID…"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
        <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
          style={{ background: 'rgb(14 124 90)' }}
        >
          {isPending ? <><Loader2 size={14} className="animate-spin" /> Recording…</> : <><CreditCard size={14} /> Record payment</>}
        </button>
      </div>
    </BlurModal>
  )
}

function VoidModal({
  invoiceId,
  onSuccess,
  onClose,
}: {
  invoiceId: number | string
  onSuccess: () => void
  onClose: () => void
}) {
  const { mutateAsync, isPending, error } = useVoidInvoice(invoiceId)
  const [reason, setReason] = useState('')

  const submit = async () => {
    if (!reason.trim()) return
    try {
      await mutateAsync(reason)
      onSuccess()
    } catch {
      // error from hook
    }
  }

  return (
    <BlurModal title="Void Invoice" subtitle="This action cannot be undone." onClose={onClose}>
      <div className="px-6 py-5 space-y-4">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {(error as Error).message}
          </div>
        )}
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          Voiding an invoice marks it as cancelled and removes it from the student&apos;s outstanding balance.
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason for voiding</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none placeholder:text-gray-400"
            placeholder="e.g. Student cancelled, duplicate invoice…"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
        <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={isPending || !reason.trim()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold disabled:opacity-50 hover:bg-red-700 transition-colors"
        >
          {isPending ? <><Loader2 size={14} className="animate-spin" /> Voiding…</> : <><Ban size={14} /> Void invoice</>}
        </button>
      </div>
    </BlurModal>
  )
}

function SendModal({
  invoiceId,
  studentName,
  onSuccess,
  onClose,
}: {
  invoiceId: number | string
  studentName: string
  onSuccess: () => void
  onClose: () => void
}) {
  const { mutateAsync, isPending, error } = useSendInvoice(invoiceId)

  const submit = async () => {
    try {
      await mutateAsync()
      onSuccess()
    } catch {
      // error from hook
    }
  }

  return (
    <BlurModal title="Send Invoice" subtitle={`Send to ${studentName}`} onClose={onClose}>
      <div className="px-6 py-5 space-y-4">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {(error as Error).message}
          </div>
        )}
        <p className="text-sm text-gray-600">
          This will send the invoice by email to <span className="font-medium text-gray-800">{studentName}</span> and mark it as <span className="font-medium">Sent</span>.
        </p>
      </div>
      <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
        <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
          style={{ background: 'rgb(14 124 90)' }}
        >
          {isPending ? <><Loader2 size={14} className="animate-spin" /> Sending…</> : <><Send size={14} /> Send invoice</>}
        </button>
      </div>
    </BlurModal>
  )
}

/* Single session row inside the "Sessions in this period" panel */
type SessRow = ReturnType<typeof useInvoiceSessions>['data'] extends { data: infer R } | undefined
  ? R extends Array<infer X> ? X : never
  : never

const SESSION_STATUS_CFG: Record<string, { label: string; bg: string; fg: string; Icon: React.ElementType }> = {
  scheduled:          { label: 'Scheduled', bg: 'rgb(219 234 254)', fg: 'rgb(30 64 175)',  Icon: Clock },
  attended:           { label: 'Attended',  bg: 'rgb(220 252 231)', fg: 'rgb(21 128 61)',  Icon: CheckCircle2 },
  absent:             { label: 'Absent',    bg: 'rgb(254 226 226)', fg: 'rgb(153 27 27)',  Icon: XCircle },
  cancelled:          { label: 'Cancelled', bg: 'rgb(243 244 246)', fg: 'rgb(75 85 99)',   Icon: Ban },
  rescheduled:        { label: 'Reschd',    bg: 'rgb(254 243 199)', fg: 'rgb(146 64 14)',  Icon: Clock },
  pending_substitute: { label: 'Sub',       bg: 'rgb(255 237 213)', fg: 'rgb(154 52 18)',  Icon: AlertTriangle },
}

const QUOTA_CFG: Record<string, { label: string; bg: string; fg: string }> = {
  counted:         { label: 'Counted',        bg: 'rgb(220 252 231)', fg: 'rgb(21 128 61)' },
  counted_no_show: { label: 'No-show',        bg: 'rgb(254 226 226)', fg: 'rgb(153 27 27)' },
  free_teacher:    { label: 'Free (teacher)', bg: 'rgb(254 243 199)', fg: 'rgb(146 64 14)' },
  free_excused:    { label: 'Free (excused)', bg: 'rgb(219 234 254)', fg: 'rgb(30 64 175)' },
  free:            { label: 'Free',           bg: 'rgb(243 244 246)', fg: 'rgb(75 85 99)'  },
}

function SessionRow({ s, currency }: { s: SessRow; currency: string }) {
  const st = SESSION_STATUS_CFG[s.status] ?? SESSION_STATUS_CFG.cancelled
  const q  = QUOTA_CFG[s.quota_impact] ?? QUOTA_CFG.free
  const dt = s.scheduled_start ? new Date(s.scheduled_start) : null
  return (
    <tr>
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <CalendarDays size={12} className="text-gray-400 shrink-0" />
          <div>
            <p className="font-semibold" style={{ color: 'rgb(11 31 58)' }}>
              {dt?.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) ?? '—'}
            </p>
            <p className="text-[11px]" style={{ color: 'rgb(120 130 140)' }}>
              {dt?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) ?? '—'}
              <span className="mx-1.5">·</span>{s.duration_min}m
              {s.has_report && <> <span className="ml-1.5 text-blue-600">· Report ✓</span></>}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm hidden sm:table-cell">
        <span className="inline-flex items-center gap-1 text-xs text-gray-600">
          <GraduationCap size={11} className="text-gray-400" />
          {s.teacher_name ?? '—'}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
          style={{ background: st.bg, color: st.fg }}>
          <st.Icon size={10} />{st.label}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
          style={{ background: q.bg, color: q.fg }}>
          {q.label}
        </span>
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-sm font-semibold"
          style={{ color: s.counts_against_quota ? 'rgb(11 31 58)' : 'rgb(156 163 175)' }}>
        {s.counts_against_quota ? formatMinor(s.cost_minor, currency) : '—'}
      </td>
    </tr>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-800 transition-colors shrink-0">
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: invoice, isLoading, error, refetch } = useInvoice(id)
  const { data: sessionsRes } = useInvoiceSessions(id ?? null)
  const [modal, setModal] = useState<'payment' | 'void' | 'send' | null>(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  async function handleDownloadPdf() {
    if (!invoice) return
    setDownloadingPdf(true)
    try {
      // The shared api() helper forces JSON parsing, so fetch the PDF directly.
      const base   = process.env.NEXT_PUBLIC_API_URL ?? ''
      const prefix = process.env.NEXT_PUBLIC_SYSTEM_API_PREFIX ?? '/api/system'
      const token  = getToken()
      const res = await fetch(`${base}${prefix}/invoices/${invoice.id}/pdf`, {
        headers: {
          Accept: 'application/pdf',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      if (!res.ok) throw new Error(`PDF download failed (${res.status})`)
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url
      a.download = `${invoice.invoice_number}.pdf`
      document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
      toast.success('PDF downloaded.')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to download PDF.')
    } finally {
      setDownloadingPdf(false)
    }
  }

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center gap-3 text-gray-400">
        <Loader2 size={24} className="animate-spin" />
        <p className="text-sm">Loading invoice…</p>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-red-500">{(error as Error)?.message ?? 'Invoice not found'}</p>
        <Link href="/billing/invoices" className="mt-3 inline-block text-sm text-gray-500 hover:underline">
          ← Back to invoices
        </Link>
      </div>
    )
  }

  const cfg = STATUS_CONFIG[invoice.status] ?? STATUS_CONFIG.draft
  const canRecordPayment = ['sent', 'overdue'].includes(invoice.status)
  const canSend = ['draft', 'sent'].includes(invoice.status)
  const canVoid = !['void', 'paid'].includes(invoice.status)

  const closeModal = () => {
    setModal(null)
    refetch()
  }

  return (
    <>
      <PageHeader
        title={invoice.invoice_number}
        description={[invoice.student?.name, invoice.snapshot?.course_name as string | undefined]
          .filter(Boolean)
          .join(' · ')}
        actions={
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${cfg.classes}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {downloadingPdf
                ? <><Loader2 size={13} className="animate-spin" />Preparing…</>
                : <><Download size={13} />Download PDF</>}
            </button>
            {canSend && (
              <button
                onClick={() => setModal('send')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Send size={13} />
                Send
              </button>
            )}
            {canRecordPayment && (
              <button
                onClick={() => setModal('payment')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-white hover:opacity-90 transition-opacity"
                style={{ background: 'rgb(14 124 90)' }}
              >
                <CreditCard size={13} />
                Record payment
              </button>
            )}
            {canVoid && (
              <button
                onClick={() => setModal('void')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
              >
                <Ban size={13} />
                Void
              </button>
            )}
          </div>
        }
      />

      {/* Meta strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Issued', value: invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—' },
          { label: 'Due date', value: new Date(invoice.due_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
          { label: 'Period', value: invoice.period_year && invoice.period_month ? new Date(invoice.period_year, invoice.period_month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—' },
          { label: 'Currency', value: invoice.currency.toUpperCase() },
        ].map(item => (
          <div key={item.label} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
            <p className="text-xs text-gray-400 font-medium">{item.label}</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Line items */}
      <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm mb-5">
        <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Line Items</p>
        </div>
        <table className="min-w-full divide-y divide-gray-50">
          <thead>
            <tr className="bg-white">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400">Description</th>
              <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-400">Qty</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-400">Unit price</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-400">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
            {(invoice.lines ?? []).map(line => (
              <tr key={line.id}>
                <td className="px-4 py-3 text-sm text-gray-800">{line.description}</td>
                <td className="px-4 py-3 text-sm text-center text-gray-600">{line.quantity}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">
                  {formatMinor(line.unit_price_minor, invoice.currency)}
                </td>
                <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                  {formatMinor(line.line_total_minor, invoice.currency)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50/60 divide-y divide-gray-100">
            {invoice.discount_minor > 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-2.5 text-sm text-right text-gray-500">Discount</td>
                <td className="px-4 py-2.5 text-sm text-right font-medium text-red-600">
                  −{formatMinor(invoice.discount_minor, invoice.currency)}
                </td>
              </tr>
            )}
            {invoice.wallet_credit_minor > 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-2.5 text-sm text-right text-gray-500">Wallet credit</td>
                <td className="px-4 py-2.5 text-sm text-right font-medium text-emerald-600">
                  −{formatMinor(invoice.wallet_credit_minor, invoice.currency)}
                </td>
              </tr>
            )}
            <tr>
              <td colSpan={3} className="px-4 py-3.5 text-sm font-bold text-right text-gray-700">Total due</td>
              <td className="px-4 py-3.5 text-base font-bold text-right text-gray-900">
                {formatMinor(invoice.total_minor, invoice.currency)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── Sessions in this period ── */}
      {sessionsRes && sessionsRes.data.length > 0 && (
        <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm mb-5">
          <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CalendarDays size={13} className="text-gray-400" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Sessions in this period
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-gray-500">
              <span><strong className="text-emerald-700">{sessionsRes.meta.counted}</strong> counted</span>
              <span><strong className="text-amber-700">{sessionsRes.meta.free}</strong> free</span>
              <span>·</span>
              <span>Total: <strong className="text-gray-900">{formatMinor(sessionsRes.meta.total_cost_minor, sessionsRes.meta.currency)}</strong></span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-50">
              <thead>
                <tr className="bg-white">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400">Date · Time</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 hidden sm:table-cell">Teacher</th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-400">Status</th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-400">Quota</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-400">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {sessionsRes.data.map(s => (
                  <SessionRow key={s.id} s={s} currency={sessionsRes.meta.currency} />
                ))}
              </tbody>
              <tfoot className="bg-gray-50/60">
                <tr>
                  <td colSpan={4} className="px-4 py-2.5 text-sm text-right text-gray-500">
                    Per session: {formatMinor(sessionsRes.meta.per_session_price_minor, sessionsRes.meta.currency)}
                    {' · '}{sessionsRes.meta.counted} counted
                  </td>
                  <td className="px-4 py-2.5 text-sm text-right font-bold text-gray-900">
                    {formatMinor(sessionsRes.meta.total_cost_minor, sessionsRes.meta.currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Paymob link */}
      {invoice.paymob_link && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment Link (Paymob)</p>
            {invoice.paymob_link.is_active && (
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <code className="text-xs text-gray-600 truncate flex-1 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
              {invoice.paymob_link.url}
            </code>
            <CopyButton text={invoice.paymob_link.url} />
            <a
              href={invoice.paymob_link.url}
              target="_blank"
              rel="noreferrer"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ExternalLink size={14} />
            </a>
          </div>
          {invoice.paymob_link.expires_at && (
            <p className="text-xs text-gray-400 mt-1.5">
              Expires {new Date(invoice.paymob_link.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
      )}

      {/* Payments */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Payments ({(invoice.payments ?? []).length})
          </p>
          {canRecordPayment && (
            <button
              onClick={() => setModal('payment')}
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              + Record payment
            </button>
          )}
        </div>

        {(invoice.payments ?? []).length === 0 ? (
          <div className="py-6 text-center">
            <CreditCard size={20} className="mx-auto mb-2 text-gray-200" />
            <p className="text-xs text-gray-400">No payments recorded yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {invoice.payments!.map(p => (
              <div key={p.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800 capitalize">
                    {p.method.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(p.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {p.reference ? ` · ${p.reference}` : ''}
                    {p.recorded_by ? ` · by ${p.recorded_by}` : ''}
                  </p>
                </div>
                <span className="text-sm font-bold text-emerald-700">
                  {formatMinor(p.amount_minor, p.currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Void reason */}
      {invoice.voided_reason && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Void reason</p>
          <p className="text-sm text-gray-600">{invoice.voided_reason}</p>
        </div>
      )}

      <Link
        href="/billing/invoices"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to invoices
      </Link>

      {modal === 'payment' && (
        <RecordPaymentModal invoice={invoice} onSuccess={closeModal} onClose={() => setModal(null)} />
      )}
      {modal === 'void' && (
        <VoidModal invoiceId={invoice.id} onSuccess={closeModal} onClose={() => setModal(null)} />
      )}
      {modal === 'send' && (
        <SendModal
          invoiceId={invoice.id}
          studentName={invoice.student?.name ?? 'student'}
          onSuccess={closeModal}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
