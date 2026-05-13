'use client'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { api, type Paginated } from '@/lib/system/api'
import { formatMinor } from '@/lib/money'
import type { Payment } from '@/types/system/invoice'
import Link from 'next/link'

export default function PaymentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['system', 'payments'],
    queryFn: () => api<Paginated<Payment>>('/payments'),
  })

  const payments = data?.data ?? []
  const meta = data?.meta ?? null

  return (
    <>
      <PageHeader title="Payments" description="All recorded payments across invoices." />

      {isLoading ? (
        <div className="py-20 text-center text-sm opacity-40">Loading…</div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recorded by</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm opacity-40">
                    No payments recorded.
                  </td>
                </tr>
              ) : (
                payments.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(p.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">
                      <Link href={`/billing/invoices/${p.invoice_id}`} className="text-blue-600 hover:underline">
                        #{p.invoice_id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm capitalize text-gray-700">
                      {p.method.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.reference ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.recorded_by ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {formatMinor(p.amount_minor, p.currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {meta && meta.total > 0 && (
            <div className="border-t border-gray-200 px-4 py-3 text-xs text-gray-500 bg-gray-50">
              Page {meta.current_page} of {meta.last_page} · {meta.total} total
            </div>
          )}
        </div>
      )}
    </>
  )
}
