'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/system/api'
import type { Paginated } from '@/lib/system/api'
import type { DirectoryUser, DirectoryFilters, UserStatus, UserStats } from '@/types/system/user-directory'

const KEY = ['system', 'user-directory'] as const

function buildQuery(filters: DirectoryFilters): string {
  const params = new URLSearchParams()
  if (filters.q)                params.set('filter[q]', filters.q)
  if (filters.role)             params.set('filter[role]', filters.role)
  if (filters.status)           params.set('filter[status]', filters.status)
  if (filters.language)         params.set('filter[language]', filters.language)
  if (filters.activity)         params.set('filter[activity]', filters.activity)
  if (filters.assigned_teacher) params.set('filter[assigned_teacher]', filters.assigned_teacher)
  if (filters.course)           params.set('filter[course]', filters.course)
  if (filters.sort)             params.set('sort', filters.sort)
  if (filters.page)             params.set('page', String(filters.page))
  params.set('per_page', String(filters.per_page ?? 20))
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export function useUserDirectory(filters: DirectoryFilters = {}) {
  return useQuery({
    queryKey: [...KEY, filters],
    queryFn: () => api<Paginated<DirectoryUser>>(`/users/directory${buildQuery(filters)}`),
  })
}

export function useUserStats() {
  return useQuery({
    queryKey: [...KEY, 'stats'],
    queryFn: () => api<UserStats>('/users/directory/stats'),
    staleTime: 30_000,
  })
}

export function useDirectoryUser(id: number | string | null) {
  return useQuery({
    queryKey: [...KEY, 'detail', id],
    queryFn: () => api<{ data: DirectoryUser }>(`/users/directory/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api<{ data: DirectoryUser }>('/users/directory', { method: 'POST', body: JSON.stringify(data) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      api<{ data: DirectoryUser }>(`/users/directory/${id}`, { method: 'PATCH', body: JSON.stringify(data) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api(`/users/directory/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

type Transition = Extract<UserStatus, 'active' | 'suspended' | 'archived'> | 'inactive'

const TRANSITION_PATH: Record<Transition, string> = {
  active:    'activate',
  inactive:  'deactivate',
  suspended: 'suspend',
  archived:  'archive',
}

export function useUserStatusTransition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, to }: { id: number; to: Transition }) =>
      api(`/users/directory/${id}/${TRANSITION_PATH[to]}`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
