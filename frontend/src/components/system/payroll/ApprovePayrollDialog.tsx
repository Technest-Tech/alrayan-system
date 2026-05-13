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
import type { Payroll } from '@/types/system/payroll'

interface ApprovePayrollDialogProps {
  payroll: Payroll
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

function periodLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

export function ApprovePayrollDialog({
  payroll,
  open,
  onClose,
  onSuccess,
}: ApprovePayrollDialogProps) {
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
          <DialogTitle>Approve Payroll</DialogTitle>
          <DialogDescription>
            Approve payroll for{' '}
            <strong>{payroll.teacher?.name ?? `Teacher #${payroll.teacher_id}`}</strong>{' '}
            ({periodLabel(payroll.period_year, payroll.period_month)})?
            <br />
            Net: <strong>{formatMoney(payroll.net_salary_minor, 'EGP')}</strong>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            disabled={approve.isPending}
          >
            {approve.isPending ? 'Approving...' : 'Approve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
