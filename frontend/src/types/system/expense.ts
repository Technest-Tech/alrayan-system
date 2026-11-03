export interface ExpenseCategory {
  id:         number
  name:       string
  slug:       string
  is_default: boolean
  is_active:  boolean
}

export type ExpenseItemType = 'fixed' | 'variable'

export interface Expense {
  id:           number
  category:     { id: number; name: string; slug: string }
  account:      { id: number; name: string; currency: string } | null
  item:         { id: number; name: string; type: ExpenseItemType } | null
  period:       string | null
  amount_minor: number
  currency:     string
  description:  string
  occurred_on:  string
  created_by:   string | null
  created_at:   string
}

export interface MoneyTotal {
  currency:    string
  total_minor: number
}

export interface ExpenseItem {
  id:                   number
  name:                 string
  type:                 ExpenseItemType
  category:             { id: number; name: string }
  default_amount_minor: number | null
  currency:             string
  default_account:      { id: number; name: string; currency: string; is_active: boolean } | null
  due_day:              number | null
  auto_record:          boolean
  due_on:               string | null
  is_active:            boolean
  notes:                string | null
  is_recorded:          boolean
  /** False for months before the item existed: it can be backfilled but isn't due. */
  is_expected:          boolean
  is_overdue:           boolean
  recorded:             MoneyTotal[]
  expenses:             { id: number; amount_minor: number; currency: string; occurred_on: string }[]
}

export interface ExpenseItemsResponse {
  data:    ExpenseItem[]
  month:   string
  summary: {
    fixed_expected:    MoneyTotal[]
    fixed_outstanding: MoneyTotal[]
    recorded:          MoneyTotal[]
    one_off:           MoneyTotal[]
  }
}
