export type LeadStatus = 'new' | 'contacted' | 'trial_booked' | 'trial_completed' | 'enrolled' | 'lost'
export type LeadSource = 'google_ads' | 'facebook_ads' | 'instagram_ads' | 'whatsapp_direct' | 'student_referral' | 'website_form' | 'manual_entry'
export type LeadLostReason = 'price' | 'schedule' | 'teacher' | 'no_response' | 'personal' | 'quality' | 'other'

export interface Lead {
  id: number
  name: string
  email: string | null
  phone: string | null
  whatsapp: string | null
  country: string | null
  source: LeadSource
  source_detail: string | null
  status: LeadStatus
  lost_reason: LeadLostReason | null
  lost_notes: string | null
  assigned_supervisor_id: number | null
  supervisor_name: string | null
  trial_booking_id: number | null
  converted_to_student_id: number | null
  course_interest: { id: number; name: string } | null
  follow_ups_count?: number
  pending_follow_ups_count?: number
  created_at: string
  updated_at: string
}

export interface LeadDetail extends Lead {
  payload: Record<string, unknown> | null
  supervisor: { id: number; name: string } | null
  follow_ups: LeadFollowUp[]
}

export interface LeadFollowUp {
  id: number
  lead_id: number
  actor_user_id: number | null
  actor_name: string | null
  due_at: string
  action: string
  notes: string | null
  completed_at: string | null
  completion_notes: string | null
  created_at: string
}

export interface LeadAnalytics {
  funnel: {
    leads: number
    contacted: number
    trials: number
    enrolled: number
  }
  by_source: Array<{ source: LeadSource; total: number; enrolled_count: number }>
  by_supervisor: Array<{ assigned_supervisor_id: number; total: number; enrolled_count: number; supervisor?: { id: number; name: string } }>
  trend_daily: Array<{ date: string; leads_count: number; trials_count: number; enrolled_count: number }>
}
