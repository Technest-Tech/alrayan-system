'use client'
import { Trash2, Plus, Minus } from 'lucide-react'
import { formatMoney } from '@/lib/money'
import { useI18n } from '@/lib/system/i18n'
import type { PayrollAdjustment, PayrollStatus } from '@/types/system/payroll'

const CATEGORY_KEYS: Record<string, string> = {
  performance:            'payroll.adjustments.performanceBonus',
  retention:              'payroll.adjustments.retentionBonus',
  reports_consistency:    'payroll.adjustments.reportsConsistency',
  tenure:                 'payroll.adjustments.tenureBonus',
  other_bonus:            'payroll.adjustments.otherBonus',
  unauthorized_absence:   'payroll.adjustments.unauthorizedAbsence',
  late_report:            'payroll.adjustments.lateReport',
  late_arrival:           'payroll.adjustments.lateArrival',
  quality_issue:          'payroll.adjustments.qualityIssue',
  other_deduction:        'payroll.adjustments.otherDeduction',
}

interface PayrollAdjustmentsListProps {
  adjustments: PayrollAdjustment[]
  payrollStatus: PayrollStatus
  onDelete: (id: number) => void
}

export function PayrollAdjustmentsList({
  adjustments,
  payrollStatus,
  onDelete,
}: PayrollAdjustmentsListProps) {
  const { t } = useI18n()
  const bonuses = adjustments.filter(a => a.type === 'bonus')
  const deductions = adjustments.filter(a => a.type === 'deduction')
  const canDelete = payrollStatus === 'pending'

  if (adjustments.length === 0) {
    return <p className="text-sm text-gray-400 py-2">{t('payroll.adjustments.empty')}</p>
  }

  function renderGroup(items: PayrollAdjustment[], label: string, sign: '+' | '-', colorClass: string) {
    if (items.length === 0) return null
    return (
      <div className="mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">{label}</p>
        <ul className="space-y-1">
          {items.map(adj => (
            <li key={adj.id} className="flex items-center gap-2 text-sm">
              <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${colorClass}`}>
                {sign === '+' ? <Plus size={10} /> : <Minus size={10} />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="font-medium">{CATEGORY_KEYS[adj.category] ? t(CATEGORY_KEYS[adj.category]) : adj.category}</span>
                {adj.reason && (
                  <span className="ml-1 text-gray-400">— {adj.reason}</span>
                )}
              </span>
              <span className={`font-medium tabular-nums ${sign === '+' ? 'text-green-700' : 'text-red-600'}`}>
                {sign}{formatMoney(adj.amount_minor, 'EGP')}
              </span>
              {canDelete && (
                <button
                  onClick={() => onDelete(adj.id)}
                  className="ml-1 text-gray-300 hover:text-red-500 transition-colors"
                  title="Delete adjustment"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div>
      {renderGroup(bonuses, 'Bonuses', '+', 'bg-green-100 text-green-700')}
      {renderGroup(deductions, 'Deductions', '-', 'bg-red-100 text-red-600')}
    </div>
  )
}
