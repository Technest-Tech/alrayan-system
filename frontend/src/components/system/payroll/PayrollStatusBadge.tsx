'use client'
import { useI18n } from '@/lib/system/i18n'
import type { PayrollStatus } from '@/types/system/payroll'

const STATUS_CLASSES: Record<PayrollStatus, string> = {
  pending:     'bg-yellow-100 text-yellow-800',
  approved:    'bg-blue-100 text-blue-700',
  transferred: 'bg-green-100 text-green-700',
  rejected:    'bg-red-100 text-red-700',
}

const STATUS_KEYS: Record<PayrollStatus, string> = {
  pending:     'status.pending',
  approved:    'status.approved',
  transferred: 'payroll.status.transferred',
  rejected:    'status.rejected',
}

interface PayrollStatusBadgeProps {
  status: PayrollStatus
}

export function PayrollStatusBadge({ status }: PayrollStatusBadgeProps) {
  const { t } = useI18n()
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}>
      {t(STATUS_KEYS[status])}
    </span>
  )
}
