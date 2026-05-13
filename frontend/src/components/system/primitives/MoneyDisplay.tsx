interface MoneyDisplayProps {
  /** Amount in smallest currency unit (cents) */
  value: number
  currency?: string
  locale?: string
}

export function MoneyDisplay({ value, currency = 'USD', locale = 'en-US' }: MoneyDisplayProps) {
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value / 100)

  return <span className="tabular">{formatted}</span>
}
