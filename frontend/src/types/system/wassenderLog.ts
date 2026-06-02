export type WassenderLogStatus = 'queued' | 'sending' | 'sent' | 'failed' | 'dead'

export interface WassenderLog {
  id: number
  template_key: string | null
  whatsapp_group_id: number | null
  whatsapp_group: {
    id: number
    type: string
    invite_link: string
    linked_name: string | null
  } | null
  recipient_phone: string | null
  rendered_message: string
  status: WassenderLogStatus
  external_message_id: string | null
  attempt_count: number
  error: string | null
  payload: Record<string, unknown> | null
  sent_at: string | null
  created_at: string
}

export interface WassenderStats {
  sent: number
  failed: number
  dead: number
  queued: number
  sending: number
  total: number
}
