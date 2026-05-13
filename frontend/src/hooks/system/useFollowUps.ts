'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/system/api'
import type { LeadFollowUp } from '@/types/system/lead'

export function useFollowUps(leadId: number | string | null) {
  return useQuery({
    queryKey: ['system', 'leads', leadId, 'follow-ups'],
    queryFn: () => api<{ data: LeadFollowUp[] }>(`/leads/${leadId}/follow-ups`).then(r => r.data),
    enabled: !!leadId,
  })
}

export function useCreateFollowUp(leadId: number | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { due_at: string; action: string; notes?: string }) =>
      api<{ data: LeadFollowUp }>(`/leads/${leadId}/follow-ups`, { method: 'POST', body: JSON.stringify(data) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'leads', leadId] }),
  })
}

export function useCompleteFollowUp(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (notes?: string) =>
      api<{ data: LeadFollowUp }>(`/lead-follow-ups/${id}/complete`, { method: 'POST', body: JSON.stringify({ completion_notes: notes }) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'leads'] }),
  })
}

export function useDeleteFollowUp(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api(`/lead-follow-ups/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'leads'] }),
  })
}
