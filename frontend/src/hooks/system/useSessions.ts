'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/system/api'
import type { Session } from '@/types/system/session'

interface SessionFilters {
  teacher_id?: number | string
  student_id?: number | string
  status?: string
  from?: string
  to?: string
  page?: number
}

export function useSessions(filters: SessionFilters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => v !== undefined && params.set(k, String(v)))

  return useQuery({
    queryKey: ['system', 'sessions', filters],
    queryFn:  () => api.get<Paginated<Session>>(`/sessions?${params}`),
  })
}

export function useSession(id: number | null) {
  return useQuery({
    queryKey:  ['system', 'sessions', id],
    queryFn:   () => api.get<Session>(`/sessions/${id}`),
    enabled:   id !== null,
  })
}

export function useMarkAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, cancelled_by, cancellation_reason }: {
      id: number
      status: 'attended' | 'absent' | 'cancelled'
      cancelled_by?: string
      cancellation_reason?: string
    }) => api.post(`/sessions/${id}/attendance`, { status, cancelled_by, cancellation_reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'sessions'] }),
  })
}

export function useRescheduleSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, scheduled_start, force_conflicts = false }: {
      id: number
      scheduled_start: string
      force_conflicts?: boolean
    }) => api.patch(`/sessions/${id}/reschedule`, { scheduled_start, force_conflicts }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'sessions'] }),
  })
}

export function useCancelSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, cancelled_by, cancellation_reason }: {
      id: number
      cancelled_by: string
      cancellation_reason?: string
    }) => api.post(`/sessions/${id}/cancel`, { cancelled_by, cancellation_reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'sessions'] }),
  })
}

export function useBulkAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (items: Array<{ session_id: number; status: string; cancelled_by?: string }>) =>
      api.post('/sessions/bulk-attendance', { items }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'sessions'] }),
  })
}

export function useSessionConflicts() {
  return useQuery({
    queryKey: ['system', 'sessions', 'conflicts'],
    queryFn:  () => api.get<Array<{ session: Session; conflicts: Array<{ type: string }> }>>('/sessions/conflicts'),
  })
}
