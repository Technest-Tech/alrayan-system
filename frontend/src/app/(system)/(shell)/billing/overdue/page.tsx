'use client'
import Link from 'next/link'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useInvoices } from '@/hooks/system/useInvoices'
import { formatMinor } from '@/lib/money'

export default function OverduePage() {
  const { data, isLoading } = useInvoices({ 'filter[status]': 'overdue' })
  const invoices = data?.data ?? []

  const totalsByCurrency = invoices.reduce<Record<string, number>>((acc, inv) => {
    acc[inv.currency] = (acc[inv.currency] ?? 0) + inv.total_minor
    return acc
  }, {})

  return (
    <>
      <PageHeader
        title="Overdue Invoices"
        description="Students with outstanding overdue payments."
      />

      {/* Totals by currency */}
      {Object.keys(totalsByCurrency).length > 0 && (
        <div className="flex gap-3 mb-6 flex-wrap">
          {Object.entries(totalsByCurrency).map(([cur, total]) => (
            <div key={cur} className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm">
              <span className="font-semibold text-red-700">{formatMinor(total, cur)}</span>
              <span className="text-red-400 ml-1">overdue</span>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center text-sm opacity-40">Loading…</div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm opacity-40">
                    No overdue invoices.
                  </td>
                </tr>
              ) : (
                invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-red-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono">
                      <Link href={`/billing/invoices/${inv.id}`} className="text-blue-600 hover:underline">
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {inv.student?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {inv.period_year && inv.period_month
                        ? new Date(inv.period_year, inv.period_month - 1).toLocaleDateString('en-US', {
                            month: 'short',
                            year: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-red-600 font-medium">
                      {new Date(inv.due_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-red-700">
                      {formatMinor(inv.total_minor, inv.currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
