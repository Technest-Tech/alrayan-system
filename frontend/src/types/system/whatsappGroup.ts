export type WhatsAppGroupType = 'student' | 'teacher'
export type WhatsAppGroupStatus = 'active' | 'stopped'

export interface WhatsAppGroup {
  id: number
  type: WhatsAppGroupType
  invite_link: string
  status: WhatsAppGroupStatus
  external_group_id: string | null
  linked_student_id: number | null
  linked_student: { id: number; name: string } | null
  linked_teacher_id: number | null
  linked_teacher: { id: number; name: string | null } | null
  created_at: string
}
