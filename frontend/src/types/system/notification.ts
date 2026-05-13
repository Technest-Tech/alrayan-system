export interface SysNotification {
  id: number
  type: string
  title: string
  body: string | null
  link: string | null
  payload: Record<string, unknown> | null
  read_at: string | null
  created_at: string
  updated_at: string
}
