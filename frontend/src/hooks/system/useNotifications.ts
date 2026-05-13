'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/system/api'
import type { SysNotification } from '@/types/system/notification'
import type { Paginated } from '@/lib/system/api'

export function useNotifications(params: { per_page?: number } = {}) {
  const qs = params.per_page ? `?per_page=${params.per_page}` : ''
  return useQuery({
    queryKey: ['system-notifications', params],
    queryFn: () => api<Paginated<SysNotification>>(`/notifications${qs}`),
    staleTime: 30_000,
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['system-notifications-unread'],
    queryFn: () => api<{ count: number }>('/notifications/unread-count'),
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}

export function useMarkAllRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api('/notifications/read-all', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['system-notifications-unread'] })
    },
  })
}

export function useMarkRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api(`/notifications/${id}/read`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['system-notifications-unread'] })
    },
  })
}
