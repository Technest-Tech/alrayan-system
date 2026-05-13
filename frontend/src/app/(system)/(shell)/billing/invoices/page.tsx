'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useInvoices, type InvoiceFilters } from '@/hooks/system/useInvoices'
import { formatMinor } from '@/lib/money'
import type { InvoiceStatus } from '@/types/system/invoice'

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft:   'bg-gray-100 text-gray-600',
  sent:    'bg-blue-100 text-blue-700',
  paid:    'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  void:    'bg-gray-200 text-gray-500',
}

const ALL_STATUSES: InvoiceStatus[] = ['draft', 'sent', 'paid', 'overdue', 'void']

export default function InvoicesPage() {
  const [filters, setFilters] = useState<InvoiceFilters>({})
  const { data, isLoading, error } = useInvoices(filters)

  const invoices = data?.data ?? []
  const meta = data?.meta ?? null

  const toggleStatus = (s: InvoiceStatus) => {
    setFilters(f => ({
      ...f,
      'filter[status]': f['filter[status]'] === s ? undefined : s,
    }))
  }

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Student billing and invoices."
        actions={
          <Link
            href="/billing/invoices/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'rgb(14 124 90)' }}
          >
            <Plus size={16} />
            New invoice
          </Link>
        }
      />

      {/* Status filter chips */}
      <div className="mb-4 flex gap-2 flex-wrap">
        {ALL_STATUSES.map(s => (
          <button
            key={s}
            onClick={() => toggleStatus(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              filters['filter[status]'] === s
                ? STATUS_COLORS[s] + ' border-current'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-sm opacity-40">Loading…</div>
      ) : error ? (
        <div className="py-10 text-center text-sm text-red-500">{(error as Error).message}</div>
      ) : invoices.length === 0 ? (
        <div className="py-20 text-center text-sm opacity-40">No invoices found.</div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Number</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Student</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Period</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Due</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono">
                    <Link href={`/billing/invoices/${inv.id}`} className="text-blue-600 hover:underline">
                      {inv.invoice_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">{inv.student?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {inv.period_year && inv.period_month
                      ? new Date(inv.period_year, inv.period_month - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(inv.due_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium">
                    {formatMinor(inv.total_minor, inv.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[inv.status]}`}>
                      {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {meta && (
            <div className="border-t border-gray-200 px-4 py-3 text-xs text-gray-500 bg-gray-50">
              Page {meta.current_page} of {meta.last_page} · {meta.total} total
            </div>
          )}
        </div>
      )}
    </>
  )
}
