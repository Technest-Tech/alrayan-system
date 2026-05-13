'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/system/api'
import type { WassenderLog } from '@/types/system/wassenderLog'

interface LogFilters {
  template_key?: string
  status?: string
  whatsapp_group_id?: string
  page?: number
}

export function useWassenderLogs(filters: LogFilters = {}) {
  const params = new URLSearchParams()
  if (filters.template_key) params.set('filter[template_key]', filters.template_key)
  if (filters.status) params.set('filter[status]', filters.status)
  if (filters.whatsapp_group_id) params.set('filter[whatsapp_group_id]', filters.whatsapp_group_id)
  if (filters.page) params.set('page', String(filters.page))
  const qs = params.toString()
  return useQuery({
    queryKey: ['system', 'wassender-logs', filters],
    queryFn: () => api<Paginated<WassenderLog>>(`/wassender-logs${qs ? '?' + qs : ''}`),
  })
}

export function useWassenderLog(id: number | string | null) {
  return useQuery({
    queryKey: ['system', 'wassender-logs', id],
    queryFn: () => api<{ data: WassenderLog }>(`/wassender-logs/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

export function useRetryWassenderLog(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api<{ message: string }>(`/wassender-logs/${id}/retry`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'wassender-logs'] }),
  })
}
