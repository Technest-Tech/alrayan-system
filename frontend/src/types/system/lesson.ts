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
  status: 'pending' | 'paid'
  needs_reconfirmation: boolean
  paid_at: string | null
  consumed_hours: number
  lessons_count?: number
}

export interface LessonTeacher { id: number; name: string }
export interface LessonStudent { id: number; name: string }

export type LessonStatus = 'scheduled' | 'attended' | 'paid_absence' | 'absent' | 'cancelled'

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
  added_by_name: string | null
  teacher: LessonTeacher
  student: LessonStudent
  subject: LessonSubject | null
  evaluation: LessonEvaluation | null
  package: StudentPackage
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
  teacher: LessonTeacher
  student: LessonStudent
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
  content?: string
  notes?: string
  homework?: string
  subject_details?: Record<string, string>
}

export interface StoreLessonSchedulePayload {
  teacher_id: number
  student_id: number
  subject_id?: number | null
  recurrence: LessonSchedule['recurrence']
  start_date: string
  slots: Omit<ScheduleSlot, 'id'>[]
}
