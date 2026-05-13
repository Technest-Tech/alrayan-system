'use client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface MonthPickerProps {
  value?: string
  onChange: (period: string) => void
}

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

function formatPeriod(period: string): string {
  const [year, month] = period.split('-')
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

export function MonthPicker({ value, onChange }: MonthPickerProps) {
  const months = getLastTwelveMonths()

  return (
    <Select value={value ?? months[0]} onValueChange={onChange}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Select period" />
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
