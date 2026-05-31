export type LeadStatus =
  | 'new_lead'
  | 'interested'
  | 'waiting_for_trial'
  | 'waiting_for_payment'
  | 'closed'
  | 'not_interested'
  | 'lost'

export type LeadSource =
  | 'google_ads'
  | 'facebook_ads'
  | 'instagram_ads'
  | 'whatsapp_direct'
  | 'student_referral'
  | 'website_form'
  | 'manual_entry'

export type LeadPlatform =
  | 'website'
  | 'facebook'
  | 'instagram'
  | 'youtube'
  | 'whatsapp'
  | 'tiktok'
  | 'other'

export type LeadPriority = 'low' | 'medium' | 'high'

export type LeadLostReason = 'price' | 'schedule' | 'teacher' | 'no_response' | 'personal' | 'quality' | 'other'

export interface LeadContactEntry {
  value: string
  primary?: boolean
}

export interface Lead {
  id: number
  name: string
  email: string | null
  phone: string | null
  whatsapp: string | null
  age: number | null
  gender: 'male' | 'female' | 'other' | null
  country: string | null
  city: string | null
  source: LeadSource | null
  source_detail: string | null
  platform: LeadPlatform | null
  platform_url: string | null
  priority: LeadPriority
  status: LeadStatus
  lost_reason: LeadLostReason | null
  lost_notes: string | null
  notes: string | null
  rejection_reason: string | null
  package_type: number | null
  package_hours: number | null
  subscription_price: string | null
  currency: string | null
  payment_method: string | null
  is_family_lead: boolean
  assigned_supervisor_id: number | null
  supervisor_name: string | null
  trial_booking_id: number | null
  converted_to_student_id: number | null
  course_interest: { id: number; name: string } | null
  follow_ups_count?: number
  pending_follow_ups_count?: number
  payload: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface LeadActivity {
  id: number
  event: string
  description: string | null
  properties: Record<string, unknown> | null
  causer_name: string | null
  created_at: string
}

export interface LeadDetail extends Lead {
  supervisor: { id: number; name: string } | null
  follow_ups: LeadFollowUp[]
  activities: LeadActivity[]
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

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new_lead:            'New Lead',
  interested:          'Interested',
  waiting_for_trial:   'Waiting for Trial',
  waiting_for_payment: 'Waiting for Payment',
  closed:              'Closed',
  not_interested:      'Not Interested',
  lost:                'Lost',
}

export const LEAD_PRIORITY_LABELS: Record<LeadPriority, string> = {
  low:    'Low',
  medium: 'Medium',
  high:   'High',
}

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  google_ads:       'Google Ads',
  facebook_ads:     'Facebook Ads',
  instagram_ads:    'Instagram',
  whatsapp_direct:  'WhatsApp',
  student_referral: 'Referral',
  website_form:     'Website Form',
  manual_entry:     'Manual',
}

export const LEAD_PLATFORM_LABELS: Record<LeadPlatform, string> = {
  website:   'Website',
  facebook:  'Facebook',
  instagram: 'Instagram',
  youtube:   'YouTube',
  whatsapp:  'WhatsApp',
  tiktok:    'TikTok',
  other:     'Other',
}
