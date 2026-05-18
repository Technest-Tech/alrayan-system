'use client'
import Link from 'next/link'
import { AlertTriangle, Loader2, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useInvoices } from '@/hooks/system/useInvoices'
import { formatMinor } from '@/lib/money'

function daysOverdue(dueAt: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(dueAt).getTime()) / 86_400_000))
}

function OverdueBadge({ days }: { days: number }) {
  const urgent = days >= 30
  const warning = days >= 7
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
        urgent ? 'bg-red-100 text-red-700' : warning ? 'bg-amber-100 text-amber-700' : 'bg-orange-50 text-orange-600'
      }`}
    >
      {days}d overdue
    </span>
  )
}

export default function OverduePage() {
  const { data, isLoading } = useInvoices({ 'filter[status]': 'overdue' })
  const invoices = data?.data ?? []

  const totalsByCurrency = invoices.reduce<Record<string, number>>((acc, inv) => {
    acc[inv.currency] = (acc[inv.currency] ?? 0) + inv.total_minor
    return acc
  }, {})

  const urgentCount = invoices.filter(inv => daysOverdue(inv.due_at) >= 30).length

  return (
    <>
      <PageHeader
        title="Overdue Invoices"
        description="Students with outstanding overdue payments."
      />

      {/* Summary cards */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3">
          <p className="text-xs text-red-500 font-medium">Total overdue</p>
          <p className="text-2xl font-bold text-red-800 mt-0.5 tabular-nums">{invoices.length}</p>
          <p className="text-xs text-red-400 mt-0.5">invoices</p>
        </div>

        {Object.entries(totalsByCurrency).map(([cur, total]) => (
          <div key={cur} className="rounded-xl border border-red-200 bg-red-50 px-5 py-3">
            <p className="text-xs text-red-500 font-medium">Outstanding ({cur})</p>
            <p className="text-2xl font-bold text-red-800 mt-0.5 tabular-nums">
              {formatMinor(total, cur)}
            </p>
            <p className="text-xs text-red-400 mt-0.5">total overdue</p>
          </div>
        ))}

        {urgentCount > 0 && (
          <div className="rounded-xl border border-red-300 bg-red-100 px-5 py-3">
            <p className="text-xs text-red-600 font-medium">Critical (30+ days)</p>
            <p className="text-2xl font-bold text-red-900 mt-0.5 tabular-nums">{urgentCount}</p>
            <p className="text-xs text-red-500 mt-0.5">need urgent follow-up</p>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center gap-3 text-gray-400">
          <Loader2 size={22} className="animate-spin" />
          <p className="text-sm">Loading overdue invoices…</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
            <AlertTriangle size={22} className="text-emerald-400" />
          </div>
          <p className="text-sm font-medium text-gray-500">No overdue invoices</p>
          <p className="text-xs text-gray-400">All students are up to date with their payments.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Invoice</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Period</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Due date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Overdue</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {invoices.map(inv => {
                const days = daysOverdue(inv.due_at)
                const initials = (inv.student?.name ?? '?').charAt(0).toUpperCase()
                return (
                  <tr key={inv.id} className="hover:bg-red-50/40 transition-colors group">
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/billing/invoices/${inv.id}`}
                        className="text-sm font-mono font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                      >
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center text-xs font-bold text-red-600 shrink-0">
                          {initials}
                        </div>
                        <span className="text-sm text-gray-800 font-medium">{inv.student?.name ?? '—'}</span>
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
                    <td className="px-4 py-3.5 text-sm text-red-600 font-medium">
                      {new Date(inv.due_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3.5">
                      <OverdueBadge days={days} />
                    </td>
                    <td className="px-4 py-3.5 text-sm text-right font-bold text-red-700 tabular-nums">
                      {formatMinor(inv.total_minor, inv.currency)}
                    </td>
                    <td className="px-4 py-3.5">
                      <Link href={`/billing/invoices/${inv.id}`} className="text-gray-200 group-hover:text-gray-400 transition-colors">
                        <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/60">
            <span className="text-xs text-gray-400">{invoices.length} overdue invoice{invoices.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}
    </>
  )
}
