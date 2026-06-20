'use client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/lib/money'
import { useApprovePayroll } from '@/hooks/system/usePayrollActions'
import { useI18n } from '@/lib/system/i18n'
import type { Payroll } from '@/types/system/payroll'

const MONTH_KEYS = [
  'schedule.months.january', 'schedule.months.february', 'schedule.months.march',
  'schedule.months.april', 'schedule.months.may', 'schedule.months.june',
  'schedule.months.july', 'schedule.months.august', 'schedule.months.september',
  'schedule.months.october', 'schedule.months.november', 'schedule.months.december',
]

interface ApprovePayrollDialogProps {
  payroll: Payroll
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function ApprovePayrollDialog({
  payroll,
  open,
  onClose,
  onSuccess,
}: ApprovePayrollDialogProps) {
  const { t } = useI18n()
  const periodLabel = (year: number, month: number) =>
    `${t(MONTH_KEYS[month - 1])} ${year}`
  const approve = useApprovePayroll()

  async function handleApprove() {
    await approve.mutateAsync(payroll.id)
    onSuccess?.()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('payroll.approveTitle')}</DialogTitle>
          <DialogDescription>
            {t('payroll.approveConfirm', {
              name: payroll.teacher?.name ?? t('payroll.teacherFallback', { id: String(payroll.teacher_id) }),
              period: periodLabel(payroll.period_year, payroll.period_month),
            })}
            <br />
            {t('payroll.detail.net')}: <strong>{formatMoney(payroll.net_salary_minor, 'EGP')}</strong>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleApprove}
            disabled={approve.isPending}
          >
            {approve.isPending ? `${t('common.approve')}...` : t('common.approve')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
