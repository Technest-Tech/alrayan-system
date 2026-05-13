export type SessionStatus = 'scheduled' | 'attended' | 'absent' | 'cancelled' | 'rescheduled' | 'pending_substitute'
export type CancelledBy = 'student' | 'teacher' | 'admin' | 'system'

export interface SessionRef {
  id: number
  name: string | null
  timezone?: string
}

export interface Session {
  id: number
  student_id: number
  teacher_id: number
  schedule_pattern_id: number | null
  original_session_id: number | null
  scheduled_start: string
  scheduled_end: string
  duration_min: number
  status: SessionStatus
  cancelled_by: CancelledBy | null
  cancellation_reason: string | null
  zoom_meeting_id: string | null
  zoom_join_url: string | null
  attended_marked_at: string | null
  report_overdue_at: string | null
  has_report: boolean | null
  student?: SessionRef
  teacher?: SessionRef
  report?: SessionReport | null
}

export interface SessionDetail extends Session {
  zoom_start_url: string | null
  pattern?: SchedulePattern | null
  original_session?: Session | null
}

export interface SchedulePattern {
  id: number
  student_id: number
  teacher_id: number | null
  day_of_week: number
  start_time: string
  duration_min: number
  timezone: string
  valid_from: string
  valid_to: string | null
  teacher?: { id: number; name: string | null }
}

export interface SessionReport {
  id: number
  session_id: number
  teacher_id: number
  student_id: number
  covered_text: string
  performance: 'excellent' | 'good' | 'needs_improvement'
  homework_text: string | null
  next_session_notes: string | null
  submitted_at: string
  student?: { id: number; name: string }
  teacher?: { id: number; name: string | null }
  session?: Session
}

export interface MakeupRequest {
  id: number
  original_session_id: number
  requested_by_user_id: number
  proposed_start_at: string
  proposed_duration_min: number
  reason: string | null
  status: 'pending' | 'approved' | 'denied'
  review_note: string | null
  reviewed_at: string | null
  makeup_session_id: number | null
  original_session?: Session
  makeup_session?: Session | null
}

export interface ConflictItem {
  type: 'teacher_double_booking' | 'teacher_on_leave' | 'teacher_unavailable'
}

export interface PatternPreviewOccurrence {
  start: string
  end: string
  teacher: string
  has_conflict: boolean
}
