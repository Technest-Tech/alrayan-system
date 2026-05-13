'use client'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/system/api'
import type { AuditLogEntry } from '@/types/system/auditLog'

interface AuditFilters {
  actor?: string
  action?: string
  target_type?: string
  from?: string
  to?: string
  q?: string
  page?: number
  per_page?: number
}

interface AuditLogPage {
  data: AuditLogEntry[]
  meta: { total: number; per_page: number; current_page: number; last_page: number }
}

export function useAuditLog(filters: AuditFilters = {}) {
  const params = new URLSearchParams()
  if (filters.actor) params.set('actor', filters.actor)
  if (filters.action) params.set('action', filters.action)
  if (filters.target_type) params.set('target_type', filters.target_type)
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  if (filters.q) params.set('q', filters.q)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.per_page) params.set('per_page', String(filters.per_page))
  const qs = params.toString()
  return useQuery({
    queryKey: ['system', 'audit-log', filters],
    queryFn: () => api<AuditLogPage>(`/audit-log${qs ? '?' + qs : ''}`),
  })
}

export function useAuditLogEntry(id: number | string | null, source: 'audit' | 'activity' = 'audit') {
  return useQuery({
    queryKey: ['system', 'audit-log', id, source],
    queryFn: () => api<{ data: AuditLogEntry }>(`/audit-log/${id}?source=${source}`).then(r => r.data),
    enabled: !!id,
  })
}

export function useExportAuditLog() {
  return useMutation({
    mutationFn: (filters: AuditFilters) =>
      api('/audit-log/export', { method: 'POST', body: JSON.stringify(filters) }),
  })
}
