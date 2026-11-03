export const ACCOUNT_TYPES = ['bank', 'paypal', 'cash', 'mobile_wallet', 'other'] as const
export type AccountType = (typeof ACCOUNT_TYPES)[number]

/** Mirrors TreasuryAccount::CURRENCIES on the backend. */
export const ACCOUNT_CURRENCIES = ['EGP', 'USD', 'EUR', 'GBP', 'CAD', 'AED', 'SAR', 'KWD', 'BHD'] as const

export type MovementDirection = 'in' | 'out'
export type MovementKind =
  | 'income' | 'deposit' | 'withdrawal' | 'adjustment' | 'expense' | 'transfer'
  | 'student_payment' | 'teacher_salary'

/** Which account each kind of automatic money uses, per currency. */
export interface TreasuryRouting {
  data:       { students: Record<string, number>; teachers: Record<string, number> }
  currencies: { students: string[]; teachers: string[] }
}

export interface TreasuryAccount {
  id:                    number
  name:                  string
  type:                  AccountType
  currency:              string
  identifier:            string | null
  notes:                 string | null
  opening_balance_minor: number
  opening_date:          string
  is_active:             boolean
  balance_minor:         number
  month_in_minor:        number
  month_out_minor:       number
  transactions_count?:   number
}

export interface TreasuryMovement {
  id:             number
  account:        { id: number; name: string; currency: string }
  direction:      MovementDirection
  kind:           MovementKind
  amount_minor:   number
  occurred_on:    string
  description:    string
  counterparty:   string | null
  reference:      string | null
  expense_id:     number | null
  category:       string | null
  transfer_group: string | null
  source_type:    'package' | 'payroll' | null
  source_id:      number | null
  balance_after_minor?: number
  created_by:     string | null
  created_at:     string
}

export interface CurrencyTotal {
  currency:        string
  balance_minor:   number
  month_in_minor:  number
  month_out_minor: number
}

export interface TreasuryOverview {
  data:        TreasuryAccount[]
  totals:      CurrencyTotal[]
  grand_total: { currency: string; balance_minor: number; partial: boolean } | null
}

export interface StatementSummary {
  balance_at_start: number
  total_in:         number
  total_out:        number
  balance_at_end:   number
}

export interface MovementFilters {
  account_id?: number | string
  direction?:  string
  kind?:       string
  from?:       string
  to?:         string
  q?:          string
  page?:       number
  per_page?:   number
}
