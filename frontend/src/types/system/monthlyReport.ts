export interface MonthlyReport {
  id:            number
  period_year:   number
  period_month:  number
  label:         string
  summary: {
    revenue_by_currency: Array<{ currency: string; total_minor: number; payment_count: number }>
    net_profit:          number | null
    base_currency:       string
  }
  pdf_path:     string | null
  xlsx_path:    string | null
  generated_at: string | null
  generated_by: string
}
