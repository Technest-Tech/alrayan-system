export interface PnlTotals {
  from:           string
  to:             string
  base_currency:  string
  revenue:        number
  salaries:       number
  bonuses:        number
  expenses:       number
  total_costs:    number
  net_profit:     number
}

export interface PnlMonthRow {
  year:          number
  month:         number
  month_label:   string
  revenue:       number
  salaries:      number
  bonuses:       number
  expenses:      number
  total_costs:   number
  net_profit:    number
  base_currency: string
}

export interface PnlResponse {
  from:           string
  to:             string
  base_currency:  string
  monthly:        PnlMonthRow[]
  totals:         PnlTotals
  note:           string
}
