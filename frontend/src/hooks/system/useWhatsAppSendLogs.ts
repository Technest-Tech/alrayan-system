'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/system/api'
import type {
  WhatsAppConnectionStatus,
  WhatsAppLogFilters,
  WhatsAppSendLog,
} from '@/types/system/whatsappSendLog'

function toQuery(filters: WhatsAppLogFilters): string {
  const params = new URLSearchParams()
  if (filters.status) params.set('filter[status]', filters.status)
  if (filters.kind) params.set('filter[kind]', filters.kind)
  if (filters.recipient_phone) params.set('filter[recipient_phone]', filters.recipient_phone)
  if (filters.date_from) params.set('filter[date_from]', filters.date_from)
  if (filters.date_to) params.set('filter[date_to]', filters.date_to)
  if (filters.page) params.set('page', String(filters.page))
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export function useWhatsAppSendLogs(filters: WhatsAppLogFilters = {}) {
  return useQuery({
    queryKey: ['system', 'whatsapp-logs', filters],
    queryFn: () => api<Paginated<WhatsAppSendLog>>(`/whatsapp/logs${toQuery(filters)}`),
  })
}

export function useWhatsAppSendLog(id: number | string | null) {
  return useQuery({
    queryKey: ['system', 'whatsapp-logs', id],
    queryFn: () => api<{ data: WhatsAppSendLog }>(`/whatsapp/logs/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

export function useResendWhatsAppLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api<{ message: string }>(`/whatsapp/logs/${id}/resend`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'whatsapp-logs'] }),
  })
}

export function useWhatsAppConnectionStatus() {
  return useQuery({
    queryKey: ['system', 'whatsapp-status'],
    queryFn: () => api<WhatsAppConnectionStatus>('/whatsapp/status'),
    refetchInterval: 60_000,
  })
}
