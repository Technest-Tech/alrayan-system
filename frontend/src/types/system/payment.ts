export type PackageStatus = 'pending' | 'paid' | 'suspended'

export interface PaymentRow {
  package_id:            number
  student_id:            number
  student_name:          string
  phone:                 string | null
  teacher_name:          string | null
  payment_status:        PackageStatus
  package_number:        number
  package_hours:         number
  consumed_hours:        number
  tariff_at_time:        number
  currency:              string
  notes:                 string | null
  paid_at:               string | null
  needs_reconfirmation:  boolean
}

export interface PaymentStats {
  pending_students:     number
  multiple_unpaid:      number
  total_pending_minor:  number
  received_month_minor: number
  currency:             string
}

export interface PackageRow {
  id:                   number
  student_id:           number
  package_number:       number
  package_hours:        number
  tariff_at_time:       number
  currency:             string
  status:               PackageStatus
  needs_reconfirmation: boolean
  paid_at:              string | null
  notes:                string | null
  consumed_hours:       number
  lessons_count?:       number
}
