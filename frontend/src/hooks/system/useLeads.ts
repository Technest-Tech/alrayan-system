'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/system/api'
import type { Lead, LeadDetail, LeadAnalytics } from '@/types/system/lead'

interface LeadFilters {
  status?: string
  source?: string
  platform?: string
  priority?: string
  assigned_supervisor_id?: string
  course_interest_id?: string
  from_date?: string
  to_date?: string
  q?: string
  page?: number
  per_page?: number
}

export function useLeads(filters: LeadFilters = {}) {
  const params = new URLSearchParams()
  if (filters.status)                 params.set('filter[status]', filters.status)
  if (filters.source)                 params.set('filter[source]', filters.source)
  if (filters.platform)               params.set('filter[platform]', filters.platform)
  if (filters.priority)               params.set('filter[priority]', filters.priority)
  if (filters.assigned_supervisor_id) params.set('filter[assigned_supervisor_id]', filters.assigned_supervisor_id)
  if (filters.course_interest_id)     params.set('filter[course_interest_id]', filters.course_interest_id)
  if (filters.from_date)              params.set('filter[from_date]', filters.from_date)
  if (filters.to_date)                params.set('filter[to_date]', filters.to_date)
  if (filters.q)                      params.set('filter[q]', filters.q)
  if (filters.page)                   params.set('page', String(filters.page))
  if (filters.per_page)               params.set('per_page', String(filters.per_page))
  const qs = params.toString()
  return useQuery({
    queryKey: ['system', 'leads', filters],
    queryFn: () => api<Paginated<Lead>>(`/leads${qs ? '?' + qs : ''}`),
  })
}

export function useLead(id: number | string | null) {
  return useQuery({
    queryKey: ['system', 'leads', id],
    queryFn: () => api<{ data: LeadDetail }>(`/leads/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

export function useLeadAnalytics(from: string, to: string) {
  return useQuery({
    queryKey: ['system', 'leads', 'analytics', from, to],
    queryFn: () => api<LeadAnalytics>(`/leads/analytics?from=${from}&to=${to}`),
  })
}

export function useCreateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api<{ data: LeadDetail }>('/leads', { method: 'POST', body: JSON.stringify(data) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'leads'] }),
  })
}

export function useUpdateLead(id: number | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api<{ data: LeadDetail }>(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(data) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'leads'] }),
  })
}

export function useAssignLead(id: number | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (supervisorId: number) =>
      api<{ data: LeadDetail }>(`/leads/${id}/assign`, { method: 'POST', body: JSON.stringify({ supervisor_id: supervisorId }) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'leads'] }),
  })
}

export function useMarkLeadLost(id: number | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { lost_reason: string; lost_notes?: string }) =>
      api<{ data: LeadDetail }>(`/leads/${id}/mark-lost`, { method: 'POST', body: JSON.stringify(data) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'leads'] }),
  })
}

export function useDeleteLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api<{ message: string }>(`/leads/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'leads'] }),
  })
}

export function useConvertLead(id: number | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api<{ message: string; student_id: number }>(`/leads/${id}/convert`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'leads'] }),
  })
}
