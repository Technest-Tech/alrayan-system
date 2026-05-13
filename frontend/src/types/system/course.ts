export interface SystemCourse {
  id: number
  name: string
  slug: string
  description: string | null
  is_active_for_system: boolean
  active_student_count: number
}
