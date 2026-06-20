'use client'
import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useAddAdjustment } from '@/hooks/system/usePayrollAdjustments'
import { useI18n } from '@/lib/system/i18n'
import type { AdjustmentType, AdjustmentCategory } from '@/types/system/payroll'

const BONUS_CATEGORIES: { value: AdjustmentCategory; key: string }[] = [
  { value: 'performance',         key: 'payroll.adjustments.performance' },
  { value: 'retention',           key: 'payroll.adjustments.retention' },
  { value: 'reports_consistency', key: 'payroll.adjustments.reportsConsistency' },
  { value: 'tenure',              key: 'payroll.adjustments.tenure' },
  { value: 'other_bonus',         key: 'payroll.adjustments.otherBonus' },
]

const DEDUCTION_CATEGORIES: { value: AdjustmentCategory; key: string }[] = [
  { value: 'unauthorized_absence', key: 'payroll.adjustments.unauthorizedAbsence' },
  { value: 'late_report',          key: 'payroll.adjustments.lateReport' },
  { value: 'late_arrival',         key: 'payroll.adjustments.lateArrival' },
  { value: 'quality_issue',        key: 'payroll.adjustments.qualityIssue' },
  { value: 'other_deduction',      key: 'payroll.adjustments.otherDeduction' },
]

interface AddAdjustmentSheetProps {
  payrollId: number
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddAdjustmentSheet({
  payrollId,
  open,
  onClose,
  onSuccess,
}: AddAdjustmentSheetProps) {
  const { t } = useI18n()
  const [type, setType] = useState<AdjustmentType>('bonus')
  const [category, setCategory] = useState<AdjustmentCategory | ''>('')
  const [amountEgp, setAmountEgp] = useState('')
  const [reason, setReason] = useState('')

  const addAdjustment = useAddAdjustment()

  const categories = type === 'bonus' ? BONUS_CATEGORIES : DEDUCTION_CATEGORIES

  function handleTypeChange(nextType: AdjustmentType) {
    setType(nextType)
    setCategory('')
  }

  async function handleSubmit() {
    if (!category || !amountEgp || !reason.trim()) return
    const amount_minor = Math.round(parseFloat(amountEgp) * 100)
    if (isNaN(amount_minor) || amount_minor <= 0) return

    await addAdjustment.mutateAsync({
      payrollId,
      type,
      category: category as AdjustmentCategory,
      amount_minor,
      reason: reason.trim(),
    })

    setType('bonus')
    setCategory('')
    setAmountEgp('')
    setReason('')
    onSuccess()
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('payroll.adjustments.addTitle')}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 py-2">
          {/* Type radio */}
          <div>
            <Label className="mb-2 block text-sm font-medium">{t('payroll.adjustments.type')}</Label>
            <div className="flex gap-3">
              {(['bonus', 'deduction'] as AdjustmentType[]).map(opt => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="adj-type"
                    value={opt}
                    checked={type === opt}
                    onChange={() => handleTypeChange(opt)}
                    className="accent-emerald-600"
                  />
                  <span className="text-sm">{t(`payroll.adjustments.${opt}`)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <Label className="mb-1.5 block text-sm font-medium">{t('payroll.adjustments.category')}</Label>
            <Select
              value={category}
              onValueChange={v => setCategory(v as AdjustmentCategory)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('payroll.adjustments.selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.value} value={c.value}>
                    {t(c.key)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div>
            <Label className="mb-1.5 block text-sm font-medium">{t('payroll.adjustments.amountEgp')}</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amountEgp}
              onChange={e => setAmountEgp(e.target.value)}
            />
          </div>

          {/* Reason */}
          <div>
            <Label className="mb-1.5 block text-sm font-medium">{t('common.reason')}</Label>
            <Textarea
              placeholder={t('payroll.adjustments.reasonPlaceholder')}
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!category || !amountEgp || !reason.trim() || addAdjustment.isPending}
          >
            {addAdjustment.isPending ? t('common.saving') : t('common.save')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
