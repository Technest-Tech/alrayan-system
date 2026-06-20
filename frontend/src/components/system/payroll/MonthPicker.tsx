'use client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useI18n } from '@/lib/system/i18n'

interface MonthPickerProps {
  value?: string
  onChange: (period: string) => void
}

const MONTH_KEYS = [
  'schedule.months.january',
  'schedule.months.february',
  'schedule.months.march',
  'schedule.months.april',
  'schedule.months.may',
  'schedule.months.june',
  'schedule.months.july',
  'schedule.months.august',
  'schedule.months.september',
  'schedule.months.october',
  'schedule.months.november',
  'schedule.months.december',
] as const

function getLastTwelveMonths(): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    months.push(`${y}-${m}`)
  }
  return months
}

export function MonthPicker({ value, onChange }: MonthPickerProps) {
  const { t } = useI18n()
  const months = getLastTwelveMonths()

  function formatPeriod(period: string): string {
    const [year, month] = period.split('-')
    return `${t(MONTH_KEYS[Number(month) - 1])} ${year}`
  }

  return (
    <Select value={value ?? months[0]} onValueChange={onChange}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder={t('payroll.selectPeriod')} />
      </SelectTrigger>
      <SelectContent>
        {months.map(m => (
          <SelectItem key={m} value={m}>
            {formatPeriod(m)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
