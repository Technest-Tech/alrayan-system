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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useSubmitReview } from '@/hooks/system/useQualityTeacher'

interface ManualReviewSheetProps {
  teacherId: number | string
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

function getYearOptions(): number[] {
  const now = new Date()
  const years: number[] = []
  for (let i = 0; i < 3; i++) years.push(now.getFullYear() - i)
  return years
}

const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

function ScoreSlider({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <Label className="text-sm font-medium">{label}</Label>
        <span className="text-sm font-semibold tabular-nums w-8 text-right">{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-emerald-600 h-2 rounded-full"
      />
      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
        <span>0</span>
        <span>100</span>
      </div>
    </div>
  )
}

export function ManualReviewSheet({
  teacherId,
  open,
  onClose,
  onSuccess,
}: ManualReviewSheetProps) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [attendance, setAttendance] = useState(80)
  const [reports, setReports] = useState(80)
  const [retention, setRetention] = useState(80)
  const [punctuality, setPunctuality] = useState(80)
  const [notes, setNotes] = useState('')

  const submitReview = useSubmitReview()

  const overall = Math.round((attendance + reports + retention + punctuality) / 4)

  async function handleSubmit() {
    await submitReview.mutateAsync({
      teacherId,
      period_year: year,
      period_month: month,
      attendance_score: attendance,
      reports_score: reports,
      retention_score: retention,
      punctuality_score: punctuality,
      notes: notes.trim() || undefined,
    })
    onSuccess()
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Submit Manual Review</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 py-2">
          {/* Period */}
          <div className="flex gap-3">
            <div className="flex-1">
              <Label className="mb-1.5 block text-sm font-medium">Year</Label>
              <Select
                value={String(year)}
                onValueChange={v => setYear(Number(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getYearOptions().map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="mb-1.5 block text-sm font-medium">Month</Label>
              <Select
                value={String(month)}
                onValueChange={v => setMonth(Number(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_OPTIONS.map(m => (
                    <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sliders */}
          <ScoreSlider label="Attendance" value={attendance} onChange={setAttendance} />
          <ScoreSlider label="Reports" value={reports} onChange={setReports} />
          <ScoreSlider label="Retention" value={retention} onChange={setRetention} />
          <ScoreSlider label="Punctuality" value={punctuality} onChange={setPunctuality} />

          {/* Overall preview */}
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
            <span className="text-sm font-medium text-gray-600">Overall score (preview)</span>
            <span
              className={`text-xl font-bold tabular-nums ${
                overall >= 90 ? 'text-green-600' : overall >= 70 ? 'text-yellow-600' : 'text-red-600'
              }`}
            >
              {overall}
            </span>
          </div>

          {/* Notes */}
          <div>
            <Label className="mb-1.5 block text-sm font-medium">Notes (optional)</Label>
            <Textarea
              placeholder="Additional observations..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
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
            disabled={submitReview.isPending}
          >
            {submitReview.isPending ? 'Submitting...' : 'Submit Review'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
