export type WalletSource =
  | 'overpayment'
  | 'manual_credit'
  | 'manual_debit'
  | 'invoice_credit'
  | 'adjustment'
  | 'refund'

export interface WalletTransaction {
  id: number
  student_id: number
  amount_minor: number
  currency: string
  source: WalletSource
  note: string | null
  balance_after_minor: number
  created_at: string
}

export interface WalletBalance {
  wallet_balance_minor: number
  currency: string
}
