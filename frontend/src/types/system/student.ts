export type StudentStatus = 'trial' | 'active' | 'paused' | 'suspended' | 'cancelled'
export type AgeCategory = 'child' | 'adult'
export type StudentSource = 'lead' | 'manual' | 'referral' | 'trial_booking'

export interface StudentCourseRef {
  id: number
  name: string
}

export interface StudentTeacherRef {
  id: number
  name: string | null
}

export interface StudentSibling {
  id: number
  name: string
  discount_pct: number
  course: string | null
  teacher_name: string | null
}

export interface StudentTimelineEntry {
  id: number
  event_type: string
  payload: Record<string, unknown> | null
  actor_user_id: number | null
  actor_name: string | null
  created_at: string
}

export interface StudentNote {
  id: number
  student_id: number
  author_user_id: number
  author_name: string | null
  author_role: string | null
  body: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Student {
  id: number
  name: string
  email: string | null
  phone: string | null
  whatsapp: string | null
  country: string
  timezone: string
  age_category: AgeCategory
  course: StudentCourseRef | null
  assigned_teacher: StudentTeacherRef | null
  status: StudentStatus
  sessions_per_month: number
  session_duration_min: number
  currency: string
  monthly_price_minor: number
  custom_discount_pct: number
  whatsapp_group_id: number | null
  whatsapp_group_link: string | null
  whatsapp_group_status: 'active' | 'stopped' | 'none'
  source: StudentSource
  enrolled_at: string | null
  created_at: string
}

export interface StudentDetail extends Student {
  parent_name: string | null
  parent_phone: string | null
  parent_whatsapp: string | null
  parent_email: string | null
  wallet_balance_minor: number
  wallet_currency: string
  trial_booking_id: number | null
  paused_at: string | null
  suspended_at: string | null
  cancelled_at: string | null
  cancellation_reason: string | null
  cancellation_notes: string | null
  siblings: StudentSibling[]
  timeline: StudentTimelineEntry[]
  notes: StudentNote[]
  updated_at: string
}
