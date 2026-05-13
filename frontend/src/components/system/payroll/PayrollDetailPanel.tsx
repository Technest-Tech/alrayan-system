'use client'
import { useState } from 'react'
import { Plus, Download, CheckCircle, ArrowRightCircle } from 'lucide-react'
import { formatMoney } from '@/lib/money'
import { PayrollStatusBadge } from './PayrollStatusBadge'
import { PayrollAdjustmentsList } from './PayrollAdjustmentsList'
import { AddAdjustmentSheet } from './AddAdjustmentSheet'
import { ApprovePayrollDialog } from './ApprovePayrollDialog'
import { MarkTransferredDialog } from './MarkTransferredDialog'
import { useDeleteAdjustment } from '@/hooks/system/usePayrollAdjustments'
import type { Payroll } from '@/types/system/payroll'

const DURATION_RATES: Record<string, string> = {
  '30': '30 min',
  '45': '45 min',
  '60': '60 min',
  '90': '90 min',
}

interface PayrollDetailPanelProps {
  payroll: Payroll
  onUpdated?: () => void
}

function periodLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

export function PayrollDetailPanel({ payroll, onUpdated }: PayrollDetailPanelProps) {
  const [addOpen, setAddOpen] = useState(false)
  const [approveOpen, setApproveOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)

  const deleteAdjustment = useDeleteAdjustment()

  const adjustments = payroll.adjustments ?? []
  const breakdown = payroll.breakdown_by_duration ?? {}

  async function handleDeleteAdjustment(id: number) {
    await deleteAdjustment.mutateAsync(id)
    onUpdated?.()
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {periodLabel(payroll.period_year, payroll.period_month)}
          </p>
          <h2 className="text-lg font-semibold">
            {payroll.teacher?.name ?? `Teacher #${payroll.teacher_id}`}
          </h2>
        </div>
        <PayrollStatusBadge status={payroll.status} />
      </div>

      {/* Session breakdown */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Sessions</p>
        <div className="rounded-lg border divide-y text-sm">
          {Object.entries(breakdown).map(([dur, sessions]) => {
            const minutes = sessions * Number(dur)
            return (
              <div key={dur} className="flex items-center justify-between px-3 py-2 gap-2">
                <span className="text-gray-600">{DURATION_RATES[dur] ?? `${dur} min`}</span>
                <span className="text-gray-500 tabular-nums">{sessions} sessions</span>
                <span className="text-gray-500 tabular-nums">{minutes} min</span>
              </div>
            )
          })}
          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 font-medium">
            <span>Total</span>
            <span className="tabular-nums">{payroll.total_sessions} sessions</span>
            <span className="tabular-nums">{payroll.total_minutes} min</span>
          </div>
        </div>
      </div>

      {/* Salary breakdown */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Salary</p>
        <div className="rounded-lg border text-sm divide-y">
          <div className="flex justify-between px-3 py-2">
            <span className="text-gray-600">Base salary</span>
            <span className="tabular-nums">{formatMoney(payroll.base_salary_minor, 'EGP')}</span>
          </div>
          <div className="flex justify-between px-3 py-2 text-green-700">
            <span>Bonuses</span>
            <span className="tabular-nums">+{formatMoney(payroll.bonuses_minor, 'EGP')}</span>
          </div>
          <div className="flex justify-between px-3 py-2 text-red-600">
            <span>Deductions</span>
            <span className="tabular-nums">-{formatMoney(payroll.deductions_minor, 'EGP')}</span>
          </div>
          <div className="flex justify-between px-3 py-2 bg-gray-50 font-semibold">
            <span>Net salary</span>
            <span className="tabular-nums">{formatMoney(payroll.net_salary_minor, 'EGP')}</span>
          </div>
        </div>
      </div>

      {/* Adjustments */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Adjustments</p>
          {payroll.status === 'pending' && (
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-medium"
            >
              <Plus size={12} /> Add
            </button>
          )}
        </div>
        <PayrollAdjustmentsList
          adjustments={adjustments}
          payrollStatus={payroll.status}
          onDelete={handleDeleteAdjustment}
        />
      </div>

      {/* Approval info */}
      {payroll.approved_at && (
        <div className="text-xs text-gray-400">
          Approved {new Date(payroll.approved_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
          {payroll.approver && ` by ${payroll.approver.name}`}
        </div>
      )}
      {payroll.transferred_at && (
        <div className="text-xs text-gray-400">
          Transferred {new Date(payroll.transferred_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
          {payroll.transfer_reference && (
            <span className="ml-1 font-mono bg-gray-100 rounded px-1">{payroll.transfer_reference}</span>
          )}
        </div>
      )}
      {payroll.rejected_at && payroll.rejection_reason && (
        <div className="text-xs text-red-500">
          Rejected: {payroll.rejection_reason}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {payroll.status === 'pending' && (
          <button
            onClick={() => setApproveOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <CheckCircle size={14} /> Approve
          </button>
        )}
        {payroll.status === 'approved' && (
          <button
            onClick={() => setTransferOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
          >
            <ArrowRightCircle size={14} /> Mark Transferred
          </button>
        )}
        <a
          href={`/api/system/payrolls/${payroll.id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          <Download size={14} /> Download PDF
        </a>
      </div>

      {addOpen && (
        <AddAdjustmentSheet
          payrollId={payroll.id}
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onSuccess={() => onUpdated?.()}
        />
      )}
      {approveOpen && (
        <ApprovePayrollDialog
          payroll={payroll}
          open={approveOpen}
          onClose={() => setApproveOpen(false)}
          onSuccess={() => onUpdated?.()}
        />
      )}
      {transferOpen && (
        <MarkTransferredDialog
          payroll={payroll}
          open={transferOpen}
          onClose={() => setTransferOpen(false)}
          onSuccess={() => onUpdated?.()}
        />
      )}
    </div>
  )
}
