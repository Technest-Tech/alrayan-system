'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useInvoice } from '@/hooks/system/useInvoice'
import { useRecordPayment } from '@/hooks/system/useRecordPayment'
import { formatMinor } from '@/lib/money'
import type { Invoice } from '@/types/system/invoice'

const STATUS_COLORS: Record<string, string> = {
  draft:   'bg-gray-100 text-gray-600',
  sent:    'bg-blue-100 text-blue-700',
  paid:    'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  void:    'bg-gray-200 text-gray-500',
}

const PAYMENT_METHODS = [
  'bank_transfer',
  'paypal',
  'vodafone_cash',
  'instapay',
  'wallet',
  'other',
]

function RecordPaymentModal({
  invoice,
  onSuccess,
  onCancel,
}: {
  invoice: Invoice
  onSuccess: () => void
  onCancel: () => void
}) {
  const { mutateAsync, isPending, error } = useRecordPayment(invoice.id)
  const [method, setMethod] = useState('bank_transfer')
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Record Payment</h3>
        {error && (
          <p className="mb-3 text-sm text-red-600">{(error as Error).message}</p>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <p className="text-sm text-gray-600">
              {formatMinor(invoice.total_minor, invoice.currency)} (full amount)
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
            <select
              value={method}
              onChange={e => setMethod(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              {PAYMENT_METHODS.map(m => (
                <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reference (optional)
            </label>
            <input
              value={reference}
              onChange={e => setReference(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Bank ref, transaction ID…"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={isPending}
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? 'Recording…' : 'Record payment'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: invoice, isLoading, error, refetch } = useInvoice(id)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  if (isLoading) {
    return <div className="py-20 text-center text-sm opacity-40">Loading…</div>
  }
  if (error || !invoice) {
    return (
      <div className="py-10 text-center text-sm text-red-500">
        {(error as Error)?.message ?? 'Invoice not found'}
      </div>
    )
  }

  const canRecordPayment = ['sent', 'overdue'].includes(invoice.status)

  return (
    <>
      <PageHeader
        title={invoice.invoice_number}
        description={[invoice.student?.name, invoice.snapshot?.course_name as string | undefined]
          .filter(Boolean)
          .join(' · ')}
        actions={
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[invoice.status]}`}>
            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
          </span>
        }
      />

      {/* Meta grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 text-sm">
        <div>
          <span className="text-gray-500">Issued</span>
          <p className="font-medium">
            {invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString() : '—'}
          </p>
        </div>
        <div>
          <span className="text-gray-500">Due</span>
          <p className="font-medium">{new Date(invoice.due_at).toLocaleDateString()}</p>
        </div>
        {invoice.period_year && invoice.period_month && (
          <div>
            <span className="text-gray-500">Period</span>
            <p className="font-medium">
              {new Date(invoice.period_year, invoice.period_month - 1).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        )}
        <div>
          <span className="text-gray-500">Currency</span>
          <p className="font-medium">{invoice.currency}</p>
        </div>
      </div>

      {/* Line items */}
      <div className="rounded-xl border overflow-hidden mb-6" style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit price</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {(invoice.lines ?? []).map(line => (
              <tr key={line.id}>
                <td className="px-4 py-3 text-sm">{line.description}</td>
                <td className="px-4 py-3 text-sm text-center">{line.quantity}</td>
                <td className="px-4 py-3 text-sm text-right">
                  {formatMinor(line.unit_price_minor, invoice.currency)}
                </td>
                <td className="px-4 py-3 text-sm text-right font-medium">
                  {formatMinor(line.line_total_minor, invoice.currency)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 divide-y divide-gray-200">
            {invoice.discount_minor > 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-2 text-sm text-right text-gray-500">Discount</td>
                <td className="px-4 py-2 text-sm text-right text-red-600">
                  -{formatMinor(invoice.discount_minor, invoice.currency)}
                </td>
              </tr>
            )}
            {invoice.wallet_credit_minor > 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-2 text-sm text-right text-gray-500">Wallet credit</td>
                <td className="px-4 py-2 text-sm text-right text-green-600">
                  -{formatMinor(invoice.wallet_credit_minor, invoice.currency)}
                </td>
              </tr>
            )}
            <tr>
              <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-right">Total due</td>
              <td className="px-4 py-3 text-sm font-bold text-right">
                {formatMinor(invoice.total_minor, invoice.currency)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Paymob payment link */}
      {invoice.paymob_link && (
        <div className="rounded-xl border p-4 mb-6" style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}>
          <p className="text-sm font-medium text-gray-700 mb-2">Payment link (Paymob)</p>
          <div className="flex items-center gap-2">
            <code className="text-xs text-gray-600 truncate flex-1 bg-gray-50 rounded px-2 py-1">
              {invoice.paymob_link.url}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(invoice.paymob_link!.url)}
              className="text-xs text-blue-600 hover:underline shrink-0"
            >
              Copy
            </button>
          </div>
          {invoice.paymob_link.expires_at && (
            <p className="text-xs text-gray-400 mt-1">
              Expires {new Date(invoice.paymob_link.expires_at).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Payments */}
      <div className="rounded-xl border p-4 mb-6" style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}>
        <p className="text-sm font-medium text-gray-700 mb-3">
          Payments ({(invoice.payments ?? []).length})
        </p>
        {(invoice.payments ?? []).length === 0 ? (
          <p className="text-sm text-gray-400 mb-3">No payments recorded.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {invoice.payments!.map(p => (
              <div key={p.id} className="py-2 flex justify-between text-sm">
                <span className="text-gray-600">
                  {p.method.replace(/_/g, ' ')}
                  {p.reference ? ` · ${p.reference}` : ''}
                </span>
                <span className="font-medium">{formatMinor(p.amount_minor, p.currency)}</span>
              </div>
            ))}
          </div>
        )}
        {canRecordPayment && (
          <button
            onClick={() => setShowPaymentModal(true)}
            className="mt-3 text-sm text-blue-600 hover:underline font-medium"
          >
            + Record payment
          </button>
        )}
      </div>

      <Link
        href="/billing/invoices"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={14} />
        Back to invoices
      </Link>

      {showPaymentModal && (
        <RecordPaymentModal
          invoice={invoice}
          onSuccess={() => { setShowPaymentModal(false); refetch() }}
          onCancel={() => setShowPaymentModal(false)}
        />
      )}
    </>
  )
}
