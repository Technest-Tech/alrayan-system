export interface TeacherAvailabilitySlot {
  id: number
  teacher_id: number
  day_of_week: number // 0=Sun, 6=Sat
  start_time: string
  end_time: string
  timezone: string
}

export interface TeacherLeave {
  id: number
  teacher_id: number
  teacher_name: string | null
  start_date: string
  end_date: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by_user_id: number | null
  reviewed_by_name: string | null
  review_note: string | null
  reviewed_at: string | null
  created_at: string
}

export interface Teacher {
  id: number
  user_id: number
  name: string | null
  email: string | null
  phone: string | null
  whatsapp: string | null
  qualifications: string | null
  cv_url: string | null
  teachable_course_ids: number[]
  payment_method: 'vodafone_cash' | 'instapay' | 'wallet_other'
  payment_account_details?: string | null
  hourly_rate: number
  per_minute_rate_30: number
  per_minute_rate_45: number
  per_minute_rate_60: number
  is_active: boolean
  student_count?: number
  last_login_at: string | null
  invite_pending: boolean
  created_at: string
}

export interface TeacherDetail extends Teacher {
  availability: TeacherAvailabilitySlot[]
  notes: TeacherNote[]
}

export interface TeacherNote {
  id: number
  teacher_id: number
  author_user_id: number
  author_name: string | null
  author_role: string | null
  body: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}
