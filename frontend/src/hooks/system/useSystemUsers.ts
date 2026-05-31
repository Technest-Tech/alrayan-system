'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/system/api'
import type { SystemUser, RolesResponse } from '@/types/system/user'

interface SystemUserFilters {
  q?: string
  role?: string
  page?: number
  per_page?: number
}

export function useSystemUsers(filters: SystemUserFilters = {}) {
  const params = new URLSearchParams()
  if (filters.q) params.set('filter[q]', filters.q)
  if (filters.role) params.set('filter[role]', filters.role)
  if (filters.page) params.set('page', String(filters.page))
  const qs = params.toString()

  return useQuery({
    queryKey: ['system', 'users', filters],
    queryFn: () => api<Paginated<SystemUser>>(`/users${qs ? '?' + qs : ''}`),
  })
}

export function useRoles() {
  return useQuery({
    queryKey: ['system', 'roles'],
    queryFn: () => api<{ data: RolesResponse }>('/roles').then(r => r.data),
  })
}

export function useInviteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api<{ data: SystemUser }>('/users/invite', { method: 'POST', body: JSON.stringify(data) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'users'] }),
  })
}

export function useToggleUserActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      api<{ data: SystemUser }>(`/users/${id}/${active ? 'activate' : 'deactivate'}`, { method: 'POST' }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'users'] }),
  })
}
