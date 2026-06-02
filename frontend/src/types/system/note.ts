export type NoteType = 'general' | 'hr' | 'performance' | 'warning' | 'commendation'

export interface Note {
  id: number
  author_user_id: number
  author_name: string | null
  author_role: string | null
  body: string
  note_type: NoteType
  pinned: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}
