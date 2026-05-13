export type PayrollStatus = 'pending' | 'approved' | 'rejected' | 'transferred'
export type AdjustmentType = 'bonus' | 'deduction'
export type AdjustmentCategory =
  | 'performance' | 'retention' | 'reports_consistency' | 'tenure' | 'other_bonus'
  | 'unauthorized_absence' | 'late_report' | 'late_arrival' | 'quality_issue' | 'other_deduction'

export interface PayrollAdjustment {
  id: number
  payroll_id: number
  type: AdjustmentType
  category: AdjustmentCategory
  amount_minor: number
  reason: string
  added_by?: { id: number; name: string }
  created_at: string
}

export interface Payroll {
  id: number
  teacher_id: number
  period_year: number
  period_month: number
  total_sessions: number
  total_minutes: number
  breakdown_by_duration: Record<string, number>
  base_salary_minor: number
  bonuses_minor: number
  deductions_minor: number
  net_salary_minor: number
  status: PayrollStatus
  approved_at: string | null
  rejected_at: string | null
  rejection_reason: string | null
  transferred_at: string | null
  transfer_reference: string | null
  snapshot: Record<string, number> | null
  teacher?: { id: number; name: string; payment_method?: string }
  adjustments?: PayrollAdjustment[]
  approver?: { id: number; name: string } | null
  created_at: string
}

export interface SalaryStatement {
  teacher: { id: number; name: string; payment_method?: string }
  current: Payroll | null
  history: Payroll[]
}
