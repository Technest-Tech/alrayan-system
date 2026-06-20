'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, X, Send, Ban, CreditCard,
  Copy, Check, Loader2, ExternalLink, Clock,
  CheckCircle2, AlertTriangle, FileText,
} from 'lucide-react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useInvoice, useVoidInvoice, useSendInvoice } from '@/hooks/system/useInvoice'
import { useRecordPayment } from '@/hooks/system/useRecordPayment'
import { formatMinor } from '@/lib/money'
import { useI18n } from '@/lib/system/i18n'
import type { Invoice, PaymentMethod } from '@/types/system/invoice'

const STATUS_CONFIG: Record<string, { key: string; classes: string; dot: string; icon: React.ReactNode }> = {
  draft:   { key: 'billing.status.draft',   classes: 'bg-gray-100 text-gray-600',       dot: 'bg-gray-400',    icon: <FileText size={13} /> },
  sent:    { key: 'billing.status.sent',    classes: 'bg-blue-50 text-blue-700',         dot: 'bg-blue-500',    icon: <Clock size={13} /> },
  paid:    { key: 'billing.status.paid',    classes: 'bg-emerald-50 text-emerald-700',   dot: 'bg-emerald-500', icon: <CheckCircle2 size={13} /> },
  overdue: { key: 'billing.status.overdue', classes: 'bg-red-50 text-red-700',           dot: 'bg-red-500',     icon: <AlertTriangle size={13} /> },
  void:    { key: 'billing.status.void',    classes: 'bg-gray-100 text-gray-400',        dot: 'bg-gray-300',    icon: <Ban size={13} /> },
}

const PAYMENT_METHODS: { value: PaymentMethod; key: string }[] = [
  { value: 'bank_transfer', key: 'billing.method.bankTransfer' },
  { value: 'paymob',        key: 'billing.method.paymob' },
  { value: 'paypal',        key: 'billing.method.paypal' },
  { value: 'vodafone_cash', key: 'billing.method.vodafoneCash' },
  { value: 'instapay',      key: 'billing.method.instapay' },
  { value: 'wallet',        key: 'billing.method.wallet' },
  { value: 'other',         key: 'billing.method.other' },
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
  const { t } = useI18n()
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
    <BlurModal title={t('billing.invoices.recordPaymentTitle')} subtitle={t('billing.invoices.fullAmount', { amount: formatMinor(invoice.total_minor, invoice.currency) })} onClose={onClose}>
      <div className="px-6 py-5 space-y-4">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {(error as Error).message}
          </div>
        )}

        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
          <p className="text-xs text-emerald-600 font-medium">{t('billing.invoices.amountToRecord')}</p>
          <p className="text-xl font-bold text-emerald-800 mt-0.5">
            {formatMinor(invoice.total_minor, invoice.currency)}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('billing.invoices.paymentMethod')}</label>
          <select
            value={method}
            onChange={e => setMethod(e.target.value as PaymentMethod)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            {PAYMENT_METHODS.map(m => (
              <option key={m.value} value={m.value}>{t(m.key)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t('billing.invoices.reference')}
            <span className="ml-1.5 text-xs font-normal text-gray-400">{t('common.optional')}</span>
          </label>
          <input
            value={reference}
            onChange={e => setReference(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-gray-400"
            placeholder={t('billing.invoices.referencePlaceholder')}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
        <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
          {t('common.cancel')}
        </button>
        <button
          onClick={submit}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
          style={{ background: 'rgb(14 124 90)' }}
        >
          {isPending ? <><Loader2 size={14} className="animate-spin" /> {t('billing.invoices.recording')}</> : <><CreditCard size={14} /> {t('billing.invoices.recordPayment')}</>}
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
  const { t } = useI18n()
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
    <BlurModal title={t('billing.invoices.voidTitle')} subtitle={t('billing.invoices.voidSubtitle')} onClose={onClose}>
      <div className="px-6 py-5 space-y-4">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {(error as Error).message}
          </div>
        )}
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          {t('billing.invoices.voidWarning')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('billing.invoices.voidReasonLabel')}</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none placeholder:text-gray-400"
            placeholder={t('billing.invoices.voidReasonPlaceholder')}
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
        <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
          {t('common.cancel')}
        </button>
        <button
          onClick={submit}
          disabled={isPending || !reason.trim()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold disabled:opacity-50 hover:bg-red-700 transition-colors"
        >
          {isPending ? <><Loader2 size={14} className="animate-spin" /> {t('billing.invoices.voiding')}</> : <><Ban size={14} /> {t('billing.invoices.voidInvoice')}</>}
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
  const [modal, setModal] = useState<'payment' | 'void' | 'send' | null>(null)

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
