export interface ExpenseCategory {
  id:         number
  name:       string
  slug:       string
  is_default: boolean
  is_active:  boolean
}

export interface Expense {
  id:           number
  category:     { id: number; name: string; slug: string }
  amount_minor: number
  currency:     string
  description:  string
  occurred_on:  string
  created_by:   string | null
  created_at:   string
}
