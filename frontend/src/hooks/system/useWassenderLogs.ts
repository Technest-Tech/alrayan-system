'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/system/api'
import type { WassenderLog, WassenderStats } from '@/types/system/wassenderLog'

export interface LogFilters {
  template_key?: string
  status?: string
  whatsapp_group_id?: string
  search?: string
  from?: string
  to?: string
  page?: number
  per_page?: number
}

export function useWassenderLogs(filters: LogFilters = {}) {
  const params = new URLSearchParams()
  if (filters.template_key) params.set('filter[template_key]', filters.template_key)
  if (filters.status)       params.set('filter[status]', filters.status)
  if (filters.whatsapp_group_id) params.set('filter[whatsapp_group_id]', filters.whatsapp_group_id)
  if (filters.search)   params.set('search', filters.search)
  if (filters.from)     params.set('from', filters.from)
  if (filters.to)       params.set('to', filters.to)
  if (filters.page)     params.set('page', String(filters.page))
  if (filters.per_page) params.set('per_page', String(filters.per_page))
  const qs = params.toString()
  return useQuery({
    queryKey: ['system', 'wassender-logs', filters],
    queryFn: () => api<Paginated<WassenderLog>>(`/wassender-logs${qs ? '?' + qs : ''}`),
  })
}

export function useWassenderStats(filters: Pick<LogFilters, 'from' | 'to'> = {}) {
  const params = new URLSearchParams()
  if (filters.from) params.set('from', filters.from)
  if (filters.to)   params.set('to', filters.to)
  const qs = params.toString()
  return useQuery({
    queryKey: ['system', 'wassender-stats', filters],
    queryFn: () => api<WassenderStats>(`/wassender-logs/stats${qs ? '?' + qs : ''}`),
    refetchInterval: 30_000,
  })
}

export function useWassenderLog(id: number | string | null) {
  return useQuery({
    queryKey: ['system', 'wassender-logs', id],
    queryFn: () => api<{ data: WassenderLog }>(`/wassender-logs/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

export function useRetryWassenderLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api<{ message: string }>(`/wassender-logs/${id}/retry`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system', 'wassender-logs'] })
      qc.invalidateQueries({ queryKey: ['system', 'wassender-stats'] })
    },
  })
}
