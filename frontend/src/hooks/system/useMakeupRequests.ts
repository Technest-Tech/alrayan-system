'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/system/api'
import type { MakeupRequest } from '@/types/system/session'

export function useMakeupRequests(status?: string) {
  const params = status ? `?status=${status}` : ''
  return useQuery({
    queryKey: ['system', 'makeup-requests', status],
    queryFn:  () => api<Paginated<MakeupRequest>>(`/makeup-requests${params}`),
  })
}

export function useRequestMakeup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      original_session_id: number
      proposed_start_at: string
      proposed_duration_min: number
      reason?: string
    }) => api<MakeupRequest>('/makeup-requests', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'makeup-requests'] }),
  })
}

export function useApproveMakeup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, review_note }: { id: number; review_note?: string }) =>
      api<MakeupRequest>(`/makeup-requests/${id}/approve`, { method: 'POST', body: JSON.stringify({ review_note }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system', 'makeup-requests'] })
      qc.invalidateQueries({ queryKey: ['system', 'sessions'] })
    },
  })
}

export function useDenyMakeup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, review_note }: { id: number; review_note?: string }) =>
      api<MakeupRequest>(`/makeup-requests/${id}/deny`, { method: 'POST', body: JSON.stringify({ review_note }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'makeup-requests'] }),
  })
}
