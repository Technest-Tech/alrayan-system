'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/system/api'
import type { WhatsAppGroup } from '@/types/system/whatsappGroup'

interface GroupFilters {
  type?: string
  status?: string
  page?: number
}

export function useWhatsAppGroups(filters: GroupFilters = {}) {
  const params = new URLSearchParams()
  if (filters.type) params.set('filter[type]', filters.type)
  if (filters.status) params.set('filter[status]', filters.status)
  if (filters.page) params.set('page', String(filters.page))
  const qs = params.toString()
  return useQuery({
    queryKey: ['system', 'whatsapp-groups', filters],
    queryFn: () => api<Paginated<WhatsAppGroup>>(`/whatsapp-groups${qs ? '?' + qs : ''}`),
  })
}

export function useCreateWhatsAppGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api<{ data: WhatsAppGroup }>('/whatsapp-groups', { method: 'POST', body: JSON.stringify(data) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'whatsapp-groups'] }),
  })
}

export function useStopWhatsAppGroup(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api<{ data: WhatsAppGroup }>(`/whatsapp-groups/${id}/stop`, { method: 'POST' }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'whatsapp-groups'] }),
  })
}

export function useReactivateWhatsAppGroup(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api<{ data: WhatsAppGroup }>(`/whatsapp-groups/${id}/reactivate`, { method: 'POST' }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'whatsapp-groups'] }),
  })
}
