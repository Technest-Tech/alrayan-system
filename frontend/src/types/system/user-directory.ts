export type UserRole =
  | 'admin' | 'supervisor' | 'quality' | 'teacher' | 'accountant' | 'parent' | 'student'

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'archived'

export const USER_ROLES: { value: UserRole; label: string }[] = [
  { value: 'admin',      label: 'Admin' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'quality',    label: 'Quality' },
  { value: 'teacher',    label: 'Teacher' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'parent',     label: 'Parent' },
  { value: 'student',    label: 'Student' },
]

export const USER_STATUSES: { value: UserStatus; label: string }[] = [
  { value: 'active',    label: 'Active' },
  { value: 'inactive',  label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'archived',  label: 'Archived' },
]

/** Roles that authenticate and therefore require a real, unique email. */
export const LOGIN_ROLES: UserRole[] = ['admin', 'supervisor', 'quality', 'teacher', 'accountant']

export interface DirectoryEmail {
  email: string
  label?: string | null
  is_primary: boolean
}

export interface DirectoryPhone {
  phone: string
  type: string
  label?: string | null
  is_primary: boolean
}

export interface StudentProfile {
  id: number
  student_type: 'child' | 'adult'
  country: string | null
  timezone: string | null
  status: string
  sessions_per_month: number
  session_duration_min: number
  currency: string
  monthly_price_minor: number
  package_hours_default?: number
  hourly_rate_minor?: number
  source?: string
  course: { id: number; name: string } | null
  assigned_teacher: { id: number; name: string | null } | null
  guardian: { id: number; name: string; whatsapp: string | null } | null
}

export interface TeacherProfile {
  id: number
  qualifications: string | null
  payment_method: string | null
  hourly_rate: number | null
  currency: string | null
  accepts_new_students: boolean | null
  teachable_course_ids: number[] | null
  is_active: boolean
  students_count: number | null
}

export interface ParentProfile {
  id: number
  whatsapp: string | null
}

export interface DirectoryUser {
  id: number
  name: string
  email: string | null
  phone: string | null
  whatsapp: string | null
  role: UserRole
  roles?: string[]
  permissions?: string[]
  status: UserStatus
  is_active: boolean
  language: string | null
  birthday: string | null
  gender: 'male' | 'female' | null
  photo_url: string | null
  notes: string | null
  documents: Record<string, string> | null
  emails?: DirectoryEmail[]
  phones?: DirectoryPhone[]
  last_login_at: string | null
  invite_pending: boolean
  profile: StudentProfile | TeacherProfile | ParentProfile | null
  created_at: string | null
}

export interface UserStats {
  total: number
  students: number
  teachers: number
  parents: number
  staff: number
  active: number
  inactive: number
  suspended: number
  archived: number
}

export interface DirectoryFilters {
  q?: string
  role?: string
  status?: string
  language?: string
  activity?: string
  assigned_teacher?: string
  course?: string
  sort?: string
  page?: number
  per_page?: number
}
