export interface SystemCourse {
  id: number
  name: string
  slug: string
  description: string | null
  level: string | null
  age_group: string | null
  is_active_for_system: boolean
  active_student_count: number
  paused_student_count: number
  total_student_count: number
  teacher_count: number
}
