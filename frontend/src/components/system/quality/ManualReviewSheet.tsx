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
import { useI18n } from '@/lib/system/i18n'

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
  { value: 1, key: 'schedule.months.january' },
  { value: 2, key: 'schedule.months.february' },
  { value: 3, key: 'schedule.months.march' },
  { value: 4, key: 'schedule.months.april' },
  { value: 5, key: 'schedule.months.may' },
  { value: 6, key: 'schedule.months.june' },
  { value: 7, key: 'schedule.months.july' },
  { value: 8, key: 'schedule.months.august' },
  { value: 9, key: 'schedule.months.september' },
  { value: 10, key: 'schedule.months.october' },
  { value: 11, key: 'schedule.months.november' },
  { value: 12, key: 'schedule.months.december' },
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
  const { t } = useI18n()
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
          <SheetTitle>{t('quality.review.title')}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 py-2">
          {/* Period */}
          <div className="flex gap-3">
            <div className="flex-1">
              <Label className="mb-1.5 block text-sm font-medium">{t('quality.review.year')}</Label>
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
              <Label className="mb-1.5 block text-sm font-medium">{t('quality.review.month')}</Label>
              <Select
                value={String(month)}
                onValueChange={v => setMonth(Number(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_OPTIONS.map(m => (
                    <SelectItem key={m.value} value={String(m.value)}>{t(m.key)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sliders */}
          <ScoreSlider label={t('quality.metrics.attendance')} value={attendance} onChange={setAttendance} />
          <ScoreSlider label={t('quality.metrics.reports')} value={reports} onChange={setReports} />
          <ScoreSlider label={t('quality.metrics.retention')} value={retention} onChange={setRetention} />
          <ScoreSlider label={t('quality.metrics.punctuality')} value={punctuality} onChange={setPunctuality} />

          {/* Overall preview */}
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
            <span className="text-sm font-medium text-gray-600">{t('quality.review.overallPreview')}</span>
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
            <Label className="mb-1.5 block text-sm font-medium">{t('quality.review.notesOptional')}</Label>
            <Textarea
              placeholder={t('quality.review.notesPlaceholder')}
              value={notes}
              onChange={e => setNotes(e.target.value)}
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
            disabled={submitReview.isPending}
          >
            {submitReview.isPending ? t('common.submitting') : t('quality.review.submit')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
