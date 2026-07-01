export interface AuthUser {
  id: number
  name: string
  email: string
  role: 'admin' | 'supervisor' | 'teacher'
  permissions: string[]
  is_active: boolean
  teacher_id?: number | null
  // Profile fields — power the teacher dashboard header + settings prefill.
  phone?: string | null
  whatsapp?: string | null
  photo_url?: string | null
  language?: string | null
  birthday?: string | null
  gender?: 'male' | 'female' | null
}
