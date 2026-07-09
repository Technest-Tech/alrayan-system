export type WhatsAppSendStatus = 'QUEUED' | 'ACCEPTED' | 'DUPLICATE' | 'FAILED'

export type WhatsAppSendKind = 'TEXT' | 'IMAGE' | 'REPORT'

export interface WhatsAppSendLog {
  id: number
  recipient_phone: string
  kind: WhatsAppSendKind
  body: string | null
  body_preview: string | null
  image_url: string | null
  caption: string | null
  idempotency_key: string
  status: WhatsAppSendStatus
  provider_message_id: string | null
  http_status: number | null
  error: string | null
  attempt_count: number
  created_at: string
  updated_at: string
}

export interface WhatsAppConnectionStatus {
  status: string
  connected: boolean
}

export interface WhatsAppLogFilters {
  status?: WhatsAppSendStatus
  kind?: WhatsAppSendKind
  recipient_phone?: string
  date_from?: string
  date_to?: string
  page?: number
}
