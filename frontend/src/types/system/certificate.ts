export type CertificateType = 'course_completion' | 'hifz_milestone' | 'ijazah' | 'other'

export interface Certificate {
  id:                 number
  certificate_number: string
  type:               CertificateType
  title:              string
  description:        string | null
  issued_on:          string
  is_revoked:         boolean
  revoked_at:         string | null
  student:            { id: number; name: string } | null
  course:             { id: number; name: string } | null
  teacher:            { id: number; name: string } | null
  issued_by:          string | null
  created_at:         string
}

export const CERTIFICATE_TYPE_LABELS: Record<CertificateType, string> = {
  course_completion: 'Course Completion',
  hifz_milestone:   'Hifz / Memorization Milestone',
  ijazah:           'Ijazah',
  other:            'Other',
}
