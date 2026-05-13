import { formatMoney } from '@/lib/money'
import { PayrollStatusBadge } from '@/components/system/payroll/PayrollStatusBadge'
import type { Payroll } from '@/types/system/payroll'

interface SalaryHistoryTableProps {
  history: Payroll[]
  onSelect?: (payroll: Payroll) => void
  selectedId?: number
}

function periodLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
}

export function SalaryHistoryTable({ history, onSelect, selectedId }: SalaryHistoryTableProps) {
  if (history.length === 0) {
    return <p className="py-8 text-center text-sm opacity-40">No salary history yet.</p>
  }

  return (
    <div className="rounded-xl border overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Period</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Net EGP</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Reference</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {history.map(p => (
            <tr
              key={p.id}
              onClick={() => onSelect?.(p)}
              className={`transition-colors ${onSelect ? 'cursor-pointer hover:bg-gray-50' : ''} ${selectedId === p.id ? 'bg-blue-50' : ''}`}
            >
              <td className="px-4 py-3 font-medium">
                {periodLabel(p.period_year, p.period_month)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums font-medium">
                {formatMoney(p.net_salary_minor, 'EGP')}
              </td>
              <td className="px-4 py-3">
                <PayrollStatusBadge status={p.status} />
              </td>
              <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                {p.transfer_reference ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
