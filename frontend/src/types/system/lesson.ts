export interface LessonSubjectField {
  key: string
  label: string
  type: 'text' | 'select' | 'number'
  options?: string[]
}

export interface LessonSubject {
  id: number
  name: string
  fields: LessonSubjectField[] | null
  sort_order: number
}

export interface LessonEvaluation {
  id: number
  label: string
  sort_order: number
}

export interface StudentPackage {
  id: number
  student_id: number
  package_number: number
  package_hours: number
  tariff_at_time: number
  currency: string
  status: 'pending' | 'paid' | 'suspended'
  needs_reconfirmation: boolean
  paid_at: string | null
  consumed_hours: number
  lessons_count?: number
}

export interface LessonTeacher { id: number; name: string }
export interface LessonStudent { id: number; name: string }

export type LessonStatus =
  | 'scheduled'
  | 'attended'
  | 'paid_absence'
  | 'absent'
  | 'trial'
  | 'free'
  | 'cancelled_by_student'
  | 'cancelled_by_teacher'

/** Statuses that consume hours from the student's package. */
export const CONSUMING_STATUSES: LessonStatus[] = ['attended', 'paid_absence', 'cancelled_by_student']

/** Per-package consumption for one lesson (a boundary lesson has >1). */
export interface LessonAllocation {
  package_id: number
  package_number: number | null
  hours: number
  cumulative_hours: number
}

export interface Lesson {
  id: number
  package_id: number
  schedule_id: number | null
  teacher_id: number
  student_id: number
  subject_id: number | null
  evaluation_id: number | null
  scheduled_at: string
  duration_minutes: number
  status: LessonStatus
  session_number_hours: number
  content: string | null
  notes: string | null
  homework: string | null
  souvenir_image: string | null
  subject_details: Record<string, string> | null
  trial_evaluation: TrialEvaluation | null
  added_by_name: string | null
  // Null once the profile is hard-deleted — the API nulls these rather than omitting them.
  teacher: LessonTeacher | null
  student: LessonStudent | null
  subject: LessonSubject | null
  evaluation: LessonEvaluation | null
  package: StudentPackage
  allocations?: LessonAllocation[]
}

export interface ScheduleSlot {
  id?: number
  day_of_week: number
  start_time: string
  duration_minutes: number
}

export interface LessonSchedule {
  id: number
  teacher_id: number
  student_id: number
  subject_id: number | null
  recurrence: 'none' | 'weekly' | 'biweekly' | 'every_4_weeks' | 'custom'
  start_date: string
  is_active: boolean
  // Null once the profile is hard-deleted — the API nulls these rather than omitting them.
  teacher: LessonTeacher | null
  student: LessonStudent | null
  subject: LessonSubject | null
  slots: ScheduleSlot[]
}

export interface CalendarDay {
  date: string
  lessons: Lesson[]
}

export interface StoreLessonPayload {
  teacher_id: number
  student_id: number
  scheduled_at: string
  duration_minutes: number
  subject_id?: number | null
  evaluation_id?: number | null
  status?: LessonStatus
  /** Report fields are sent as null, not omitted, so clearing one on an edit erases it. */
  content?: string | null
  notes?: string | null
  homework?: string | null
  subject_details?: Record<string, string> | null
  trial_evaluation?: TrialEvaluation | null
  /** Public URL of the uploaded souvenir image, as returned by the /uploads endpoint. */
  souvenir_image?: string | null
  /** Queues the rendered report image to the student's (or their guardian's) WhatsApp. */
  send_report?: boolean
}

/** Trial-lesson assessment captured when a lesson's status is `trial`. */
export interface TrialEvaluation {
  student_level?: string
  reading_ability?: string
  memorization_level?: string
  behavior?: string[]
  motivation?: string[]
  learning_style?: string[]
  expectations?: string
  teacher_notes?: string
}

export interface StoreLessonSchedulePayload {
  teacher_id: number
  student_id: number
  subject_id?: number | null
  recurrence: LessonSchedule['recurrence']
  start_date: string
  slots: Omit<ScheduleSlot, 'id'>[]
}
