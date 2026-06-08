export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void'
export type InvoiceType = 'advance' | 'monthly' | 'reactivation' | 'manual'
export type PaymentMethod = 'xpay' | 'bank_transfer' | 'paypal' | 'vodafone_cash' | 'instapay' | 'wallet' | 'other'

export interface InvoiceSnapshot {
  student_name?: string | null
  course_name?: string | null
  teacher_name?: string | null
  sessions_per_month?: number | null
  session_duration_min?: number | null
  currency?: string | null
  description?: string | null
  [key: string]: string | number | null | undefined
}

export interface InvoiceSnapshot {
  student_name?: string | null
  course_name?: string | null
  teacher_name?: string | null
  sessions_per_month?: number | null
  session_duration_min?: number | null
  currency?: string | null
  description?: string | null
  [key: string]: string | number | null | undefined
}

export interface InvoiceLine {
  id: number
  description: string
  kind: 'monthly' | 'pro_rata' | 'outstanding' | 'adjustment' | 'discount'
  quantity: number
  session_duration_min: number | null
  unit_price_minor: number
  line_total_minor: number
  source_invoice_id: number | null
}

export interface Invoice {
  id: number
  invoice_number: string
  payment_token: string | null
  type: InvoiceType
  period_year: number | null
  period_month: number | null
  currency: string
  subtotal_minor: number
  discount_minor: number
  wallet_credit_minor: number
  total_minor: number
  status: InvoiceStatus
  issued_at: string | null
  due_at: string
  paid_at: string | null
  voided_at: string | null
  voided_reason: string | null
  snapshot: InvoiceSnapshot | null
  description?: string | null
  student?: {
    id: number
    name: string
    email?: string | null
    phone?: string | null
    whatsapp?: string | null
    currency?: string
  }
  lines?: InvoiceLine[]
  payments?: Payment[]
  xpay_link?: { iframe_url: string; transaction_uuid: string | null; expires_at: string | null; is_active: boolean } | null
}

export interface Payment {
  id: number
  invoice_id: number
  amount_minor: number
  currency: string
  method: PaymentMethod
  reference: string | null
  paid_at: string
  recorded_by: string | null
}
