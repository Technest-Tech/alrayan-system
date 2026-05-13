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
import type { AdjustmentType, AdjustmentCategory } from '@/types/system/payroll'

const BONUS_CATEGORIES: { value: AdjustmentCategory; label: string }[] = [
  { value: 'performance',         label: 'Performance' },
  { value: 'retention',           label: 'Retention' },
  { value: 'reports_consistency', label: 'Reports consistency' },
  { value: 'tenure',              label: 'Tenure' },
  { value: 'other_bonus',         label: 'Other bonus' },
]

const DEDUCTION_CATEGORIES: { value: AdjustmentCategory; label: string }[] = [
  { value: 'unauthorized_absence', label: 'Unauthorized absence' },
  { value: 'late_report',          label: 'Late report' },
  { value: 'late_arrival',         label: 'Late arrival' },
  { value: 'quality_issue',        label: 'Quality issue' },
  { value: 'other_deduction',      label: 'Other deduction' },
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
  const [type, setType] = useState<AdjustmentType>('bonus')
  const [category, setCategory] = useState<AdjustmentCategory | ''>('')
  const [amountEgp, setAmountEgp] = useState('')
  const [reason, setReason] = useState('')

  const addAdjustment = useAddAdjustment()

  const categories = type === 'bonus' ? BONUS_CATEGORIES : DEDUCTION_CATEGORIES

  function handleTypeChange(t: AdjustmentType) {
    setType(t)
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
          <SheetTitle>Add Adjustment</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 py-2">
          {/* Type radio */}
          <div>
            <Label className="mb-2 block text-sm font-medium">Type</Label>
            <div className="flex gap-3">
              {(['bonus', 'deduction'] as AdjustmentType[]).map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="adj-type"
                    value={t}
                    checked={type === t}
                    onChange={() => handleTypeChange(t)}
                    className="accent-emerald-600"
                  />
                  <span className="text-sm capitalize">{t}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <Label className="mb-1.5 block text-sm font-medium">Category</Label>
            <Select
              value={category}
              onValueChange={v => setCategory(v as AdjustmentCategory)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div>
            <Label className="mb-1.5 block text-sm font-medium">Amount (EGP)</Label>
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
            <Label className="mb-1.5 block text-sm font-medium">Reason</Label>
            <Textarea
              placeholder="Explain the reason for this adjustment..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!category || !amountEgp || !reason.trim() || addAdjustment.isPending}
          >
            {addAdjustment.isPending ? 'Saving...' : 'Save'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
