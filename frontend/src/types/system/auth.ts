export interface AuthUser {
  id: number
  name: string
  email: string
  role: 'admin' | 'supervisor' | 'teacher'
  permissions: string[]
  is_active: boolean
  teacher_id?: number | null
}
