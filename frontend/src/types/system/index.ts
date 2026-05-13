export interface SystemUser {
  id: number
  name: string
  email: string
  role: 'admin' | 'supervisor' | 'teacher' | null
  is_active: boolean
  last_login_at: string | null
}

export interface ApiMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: ApiMeta
  links: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
}

export type { Lead, LeadDetail, LeadFollowUp, LeadAnalytics, LeadStatus, LeadSource, LeadLostReason } from './lead'
export type { WhatsAppGroup, WhatsAppGroupType, WhatsAppGroupStatus } from './whatsappGroup'
export type { MessageTemplate } from './messageTemplate'
export type { WassenderLog, WassenderLogStatus } from './wassenderLog'

export type SortDirection = 'asc' | 'desc'

export interface SortState {
  column: string
  direction: SortDirection
}

export interface FilterState {
  q?: string
  status?: string
  from?: string
  to?: string
  [key: string]: string | undefined
}
