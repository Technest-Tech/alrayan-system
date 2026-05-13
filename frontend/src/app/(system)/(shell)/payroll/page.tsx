'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { MonthPicker } from '@/components/system/payroll/MonthPicker'
import { PayrollStatusBadge } from '@/components/system/payroll/PayrollStatusBadge'
import { BulkApproveBar } from '@/components/system/payroll/BulkApproveBar'
import { ApprovePayrollDialog } from '@/components/system/payroll/ApprovePayrollDialog'
import { MarkTransferredDialog } from '@/components/system/payroll/MarkTransferredDialog'
import { usePayrolls } from '@/hooks/system/usePayrolls'
import { useRecalculate } from '@/hooks/system/usePayrollActions'
import { formatMoney } from '@/lib/money'
import type { Payroll } from '@/types/system/payroll'

function currentPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function PayrollPage() {
  const router = useRouter()
  const [period, setPeriod] = useState(currentPeriod())
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [approvePayroll, setApprovePayroll] = useState<Payroll | null>(null)
  const [transferPayroll, setTransferPayroll] = useState<Payroll | null>(null)

  const [year, month] = period.split('-').map(Number)
  const { data, isLoading, error, refetch } = usePayrolls({
    period_year: year,
    period_month: month,
  })
  const recalculate = useRecalculate()

  const payrolls = data?.data ?? []

  function toggleRow(id: number) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function toggleAll() {
    if (selectedIds.length === payrolls.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(payrolls.map(p => p.id))
    }
  }

  async function handleRecalculate() {
    await recalculate.mutateAsync({ year, month })
  }

  return (
    <>
      <PageHeader
        title="Payroll"
        description="Teacher payroll and disbursements."
        actions={
          <button
            onClick={handleRecalculate}
            disabled={recalculate.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={recalculate.isPending ? 'animate-spin' : ''} />
            Recalculate pending
          </button>
        }
      />

      <div className="mb-4">
        <MonthPicker value={period} onChange={setPeriod} />
      </div>

      {selectedIds.length > 0 && (
        <div className="mb-4">
          <BulkApproveBar selectedIds={selectedIds} onClear={() => setSelectedIds([])} />
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center text-sm opacity-40">Loading...</div>
      ) : error ? (
        <div className="py-10 text-center text-sm text-red-500">{(error as Error).message}</div>
      ) : payrolls.length === 0 ? (
        <div className="py-20 text-center text-sm opacity-40">No payrolls for this period.</div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === payrolls.length && payrolls.length > 0}
                    onChange={toggleAll}
                    className="accent-emerald-600"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Teacher</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">Sessions</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">Minutes</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Base EGP</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Net EGP</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {payrolls.map(p => (
                <tr
                  key={p.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/payroll/teacher/${p.teacher_id}`)}
                >
                  <td
                    className="px-4 py-3"
                    onClick={e => { e.stopPropagation(); toggleRow(p.id) }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(p.id)}
                      onChange={() => toggleRow(p.id)}
                      className="accent-emerald-600"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {p.teacher?.name ?? `Teacher #${p.teacher_id}`}
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums">{p.total_sessions}</td>
                  <td className="px-4 py-3 text-center tabular-nums">{p.total_minutes}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatMoney(p.base_salary_minor, 'EGP')}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{formatMoney(p.net_salary_minor, 'EGP')}</td>
                  <td className="px-4 py-3">
                    <PayrollStatusBadge status={p.status} />
                  </td>
                  <td
                    className="px-4 py-3"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2">
                      {p.status === 'pending' && (
                        <button
                          onClick={() => setApprovePayroll(p)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Approve
                        </button>
                      )}
                      {p.status === 'approved' && (
                        <button
                          onClick={() => setTransferPayroll(p)}
                          className="text-xs text-green-700 hover:text-green-900 font-medium"
                        >
                          Mark transferred
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {approvePayroll && (
        <ApprovePayrollDialog
          payroll={approvePayroll}
          open={!!approvePayroll}
          onClose={() => setApprovePayroll(null)}
          onSuccess={() => refetch()}
        />
      )}
      {transferPayroll && (
        <MarkTransferredDialog
          payroll={transferPayroll}
          open={!!transferPayroll}
          onClose={() => setTransferPayroll(null)}
          onSuccess={() => refetch()}
        />
      )}
    </>
  )
}
