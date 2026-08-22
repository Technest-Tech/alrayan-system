/** One percentage line skimmed off the gross margin (Ads, Charity, …). */
export interface ProfitabilityDeduction {
  key:     string
  label:   string
  percent: number
}

export interface ProfitabilityDeductionAmount extends ProfitabilityDeduction {
  amount_minor: number
}

/** Income as billed, before conversion into the report currency. */
export interface ProfitabilityIncomeSlice {
  currency:     string
  amount_minor: number
}

export interface ProfitabilityRow {
  teacher_id:         number
  name:               string
  photo_url:          string | null
  hours:              number
  lessons:            number
  income_minor:       number
  income_by_currency: ProfitabilityIncomeSlice[]
  rate_minor:         number
  rate_currency:      string
  tier_index:         number
  cost_minor:         number
  cost_report_minor:  number
  gross_margin_minor: number
  deductions:         ProfitabilityDeductionAmount[]
  net_profit_minor:   number
  margin_pct:         number | null
  excluded:           boolean
  /** True when some of this row's money had no FX rate and was left out. */
  partial:            boolean
}

export interface ProfitabilityTotals {
  hours:               number
  lessons:             number
  income_minor:        number
  cost_minor:          number
  gross_margin_minor:  number
  net_profit_minor:    number
  teacher_count:       number
  deductions:          ProfitabilityDeductionAmount[]
  avg_rate_minor:      number
  partner_count:       number
  partner_share_minor: number | null
}

export interface ProfitabilityReport {
  month:         string
  currency:      string
  cost_currency: string
  rows:          ProfitabilityRow[]
  totals:        ProfitabilityTotals
  deductions:    ProfitabilityDeduction[]
  partner_count: number
  currencies:    string[]
  fx: {
    source:        'live' | 'manual' | 'mixed' | 'unavailable'
    fetched_at:    string | null
    unconvertible: string[]
  }
  generated_at:  string
}

export interface ProfitabilitySettingsPayload {
  deductions?:      ProfitabilityDeduction[]
  partner_count?:   number
  report_currency?: string
}
