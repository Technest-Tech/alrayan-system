'use client'
import { useEffect, useState } from 'react'
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
    mutationFn: () => api<{ ids: number[] }>('/notifications/read-all', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['system-notifications-unread'] })
    },
  })
}

/**
 * Seeing the inbox counts as reading it: while the calling component is mounted (the bell's
 * dropdown, the inbox page) everything unread is marked read, so the badge clears — including
 * anything that arrives while it stays open. Returns the ids that were unread, so the view can
 * keep showing them as new until it is closed.
 */
export function useMarkSeen(): ReadonlySet<number> {
  const { data } = useUnreadCount()
  const { mutate } = useMarkAllRead()
  const [fresh, setFresh] = useState<ReadonlySet<number>>(() => new Set())
  const count = data?.count ?? 0

  useEffect(() => {
    if (count === 0) return
    mutate(undefined, {
      onSuccess: ({ ids }) => setFresh(prev => new Set([...prev, ...ids])),
    })
  }, [count, mutate])

  return fresh
}
