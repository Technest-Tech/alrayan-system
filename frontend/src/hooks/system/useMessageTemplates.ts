'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/system/api'
import type { MessageTemplate } from '@/types/system/messageTemplate'

export function useMessageTemplates() {
  return useQuery({
    queryKey: ['system', 'message-templates'],
    queryFn: () => api<{ data: MessageTemplate[] }>('/message-templates').then(r => r.data),
  })
}

export function useMessageTemplate(id: number | string | null) {
  return useQuery({
    queryKey: ['system', 'message-templates', id],
    queryFn: () => api<{ data: MessageTemplate }>(`/message-templates/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

export function useUpdateMessageTemplate(id: number | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { body?: string; label?: string; is_active?: boolean }) =>
      api<{ data: MessageTemplate }>(`/message-templates/${id}`, { method: 'PATCH', body: JSON.stringify(data) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'message-templates'] }),
  })
}

export function useTemplatePreview(id: number | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (variables: Record<string, string>) =>
      api<{ rendered: string }>(`/message-templates/${id}/preview`, { method: 'POST', body: JSON.stringify({ variables }) }),
  })
}
