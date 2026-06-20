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
import { useI18n } from '@/lib/system/i18n'
import type { Payroll } from '@/types/system/payroll'

const MONTH_KEYS = [
  'schedule.months.january', 'schedule.months.february', 'schedule.months.march',
  'schedule.months.april', 'schedule.months.may', 'schedule.months.june',
  'schedule.months.july', 'schedule.months.august', 'schedule.months.september',
  'schedule.months.october', 'schedule.months.november', 'schedule.months.december',
]

interface PayrollDetailPanelProps {
  payroll: Payroll
  onUpdated?: () => void
}

export function PayrollDetailPanel({ payroll, onUpdated }: PayrollDetailPanelProps) {
  const { t } = useI18n()
  const periodLabel = (year: number, month: number) =>
    `${t(MONTH_KEYS[month - 1])} ${year}`
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
            {payroll.teacher?.name ?? t('payroll.teacherFallback', { id: String(payroll.teacher_id) })}
          </h2>
        </div>
        <PayrollStatusBadge status={payroll.status} />
      </div>

      {/* Session breakdown */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{t('common.sessions')}</p>
        <div className="rounded-lg border divide-y text-sm">
          {Object.entries(breakdown).map(([dur, sessions]) => {
            const minutes = sessions * Number(dur)
            return (
              <div key={dur} className="flex items-center justify-between px-3 py-2 gap-2">
                <span className="text-gray-600">{t('payroll.detail.minutesLabel', { n: dur })}</span>
                <span className="text-gray-500 tabular-nums">{t('payroll.detail.sessionsCount', { n: String(sessions) })}</span>
                <span className="text-gray-500 tabular-nums">{t('payroll.detail.minutesLabel', { n: String(minutes) })}</span>
              </div>
            )
          })}
          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 font-medium">
            <span>{t('common.total')}</span>
            <span className="tabular-nums">{t('payroll.detail.sessionsCount', { n: String(payroll.total_sessions) })}</span>
            <span className="tabular-nums">{t('payroll.detail.minutesLabel', { n: String(payroll.total_minutes) })}</span>
          </div>
        </div>
      </div>

      {/* Salary breakdown */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{t('payroll.detail.salary')}</p>
        <div className="rounded-lg border text-sm divide-y">
          <div className="flex justify-between px-3 py-2">
            <span className="text-gray-600">{t('payroll.detail.baseSalary')}</span>
            <span className="tabular-nums">{formatMoney(payroll.base_salary_minor, 'EGP')}</span>
          </div>
          <div className="flex justify-between px-3 py-2 text-green-700">
            <span>{t('payroll.adjustments.bonuses')}</span>
            <span className="tabular-nums">+{formatMoney(payroll.bonuses_minor, 'EGP')}</span>
          </div>
          <div className="flex justify-between px-3 py-2 text-red-600">
            <span>{t('payroll.adjustments.deductions')}</span>
            <span className="tabular-nums">-{formatMoney(payroll.deductions_minor, 'EGP')}</span>
          </div>
          <div className="flex justify-between px-3 py-2 bg-gray-50 font-semibold">
            <span>{t('payroll.detail.netSalary')}</span>
            <span className="tabular-nums">{formatMoney(payroll.net_salary_minor, 'EGP')}</span>
          </div>
        </div>
      </div>

      {/* Adjustments */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{t('payroll.detail.adjustments')}</p>
          {payroll.status === 'pending' && (
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-medium"
            >
              <Plus size={12} /> {t('common.add')}
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
          {t('payroll.detail.approvedOn', { date: new Date(payroll.approved_at).toLocaleDateString(undefined, { dateStyle: 'medium' }) })}
          {payroll.approver && ` ${t('payroll.detail.byPerson', { name: payroll.approver.name })}`}
        </div>
      )}
      {payroll.transferred_at && (
        <div className="text-xs text-gray-400">
          {t('payroll.detail.transferredOn', { date: new Date(payroll.transferred_at).toLocaleDateString(undefined, { dateStyle: 'medium' }) })}
          {payroll.transfer_reference && (
            <span className="ml-1 font-mono bg-gray-100 rounded px-1">{payroll.transfer_reference}</span>
          )}
        </div>
      )}
      {payroll.rejected_at && payroll.rejection_reason && (
        <div className="text-xs text-red-500">
          {t('payroll.detail.rejectedReason', { reason: payroll.rejection_reason })}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {payroll.status === 'pending' && (
          <button
            onClick={() => setApproveOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <CheckCircle size={14} /> {t('common.approve')}
          </button>
        )}
        {payroll.status === 'approved' && (
          <button
            onClick={() => setTransferOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
          >
            <ArrowRightCircle size={14} /> {t('payroll.markTransferredTitle')}
          </button>
        )}
        <a
          href={`/api/system/payrolls/${payroll.id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          <Download size={14} /> {t('payroll.detail.downloadPdf')}
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
