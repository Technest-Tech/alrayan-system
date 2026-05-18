'use client'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { CreditCard, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { api, type Paginated } from '@/lib/system/api'
import { formatMinor } from '@/lib/money'
import type { Payment, PaymentMethod } from '@/types/system/invoice'

const METHOD_CONFIG: Record<PaymentMethod, { label: string; classes: string }> = {
  bank_transfer: { label: 'Bank Transfer',  classes: 'bg-blue-50 text-blue-700' },
  paymob:        { label: 'Paymob',         classes: 'bg-purple-50 text-purple-700' },
  paypal:        { label: 'PayPal',         classes: 'bg-indigo-50 text-indigo-700' },
  vodafone_cash: { label: 'Vodafone Cash',  classes: 'bg-red-50 text-red-700' },
  instapay:      { label: 'InstaPay',       classes: 'bg-emerald-50 text-emerald-700' },
  wallet:        { label: 'Wallet',         classes: 'bg-amber-50 text-amber-700' },
  other:         { label: 'Other',          classes: 'bg-gray-100 text-gray-600' },
}

export default function PaymentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['system', 'payments'],
    queryFn: () => api<Paginated<Payment>>('/payments'),
  })

  const payments = data?.data ?? []
  const meta = data?.meta ?? null

  const totalByCurrency = payments.reduce<Record<string, number>>((acc, p) => {
    acc[p.currency] = (acc[p.currency] ?? 0) + p.amount_minor
    return acc
  }, {})

  return (
    <>
      <PageHeader title="Payments" description="All recorded payments across invoices." />

      {/* Totals */}
      {Object.keys(totalByCurrency).length > 0 && (
        <div className="flex gap-3 mb-6 flex-wrap">
          {Object.entries(totalByCurrency).map(([cur, total]) => (
            <div key={cur} className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3">
              <p className="text-xs text-emerald-600 font-medium">Total collected</p>
              <p className="text-xl font-bold text-emerald-800 mt-0.5 tabular-nums">
                {formatMinor(total, cur)}
              </p>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="py-20 flex flex-col items-center gap-3 text-gray-400">
          <Loader2 size={22} className="animate-spin" />
          <p className="text-sm">Loading payments…</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Invoice</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Method</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Reference</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Recorded by</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <CreditCard size={24} className="mx-auto mb-2 text-gray-200" />
                    <p className="text-sm text-gray-400">No payments recorded yet.</p>
                  </td>
                </tr>
              ) : (
                payments.map(p => {
                  const methodCfg = METHOD_CONFIG[p.method] ?? METHOD_CONFIG.other
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3.5 text-sm text-gray-600">
                        {new Date(p.paid_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/billing/invoices/${p.invoice_id}`}
                          className="text-sm font-mono font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                        >
                          #{p.invoice_id}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${methodCfg.classes}`}>
                          {methodCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-500 font-mono">
                        {p.reference ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-500">
                        {p.recorded_by ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-right font-bold text-gray-900 tabular-nums">
                        {formatMinor(p.amount_minor, p.currency)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>

          {meta && meta.total > 0 && (
            <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between bg-gray-50/60">
              <span className="text-xs text-gray-400">
                Showing {payments.length} of {meta.total} payments
              </span>
              <span className="text-xs text-gray-400">
                Page {meta.current_page} of {meta.last_page}
              </span>
            </div>
          )}
        </div>
      )}
    </>
  )
}
