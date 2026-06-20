'use client'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMarkTransferred } from '@/hooks/system/usePayrollActions'
import { useI18n } from '@/lib/system/i18n'
import type { Payroll } from '@/types/system/payroll'

interface MarkTransferredDialogProps {
  payroll: Payroll
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function MarkTransferredDialog({
  payroll,
  open,
  onClose,
  onSuccess,
}: MarkTransferredDialogProps) {
  const { t } = useI18n()
  const [reference, setReference] = useState('')
  const markTransferred = useMarkTransferred()

  async function handleSubmit() {
    if (!reference.trim()) return
    await markTransferred.mutateAsync({
      id: payroll.id,
      transfer_reference: reference.trim(),
    })
    setReference('')
    onSuccess?.()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('payroll.markTransferredTitle')}</DialogTitle>
        </DialogHeader>

        <div className="py-2">
          <Label htmlFor="transfer-ref" className="mb-1.5 block text-sm font-medium">
            {t('payroll.transferReference')} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="transfer-ref"
            placeholder={t('payroll.transferReferencePlaceholder')}
            value={reference}
            onChange={e => setReference(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reference.trim() || markTransferred.isPending}
          >
            {markTransferred.isPending ? t('common.saving') : t('payroll.markTransferredTitle')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
