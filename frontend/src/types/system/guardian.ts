export interface GuardianStudentRef {
  id: number
  name: string
  status: string
}

export interface Guardian {
  id: number
  name: string
  whatsapp: string
  students: GuardianStudentRef[]
  created_at: string
}
