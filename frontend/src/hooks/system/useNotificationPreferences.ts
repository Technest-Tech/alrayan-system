'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/system/api'

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['system', 'notification-preferences'],
    queryFn: () => api<{ muted_types: string[]; all_types: Record<string, string[]> }>('/notifications/preferences'),
  })
}

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (mutedTypes: string[]) =>
      api<{ message: string }>('/notifications/preferences', { method: 'PUT', body: JSON.stringify({ muted_types: mutedTypes }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'notification-preferences'] }),
  })
}
