'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/system/api'
import type { Paginated } from '@/lib/system/api'

export interface SystemUserRecord {
  id:            number
  name:          string
  email:         string
  role:          'admin' | 'supervisor' | 'teacher'
  permissions:   string[]
  is_active:     boolean
  last_login_at: string | null
}

export interface InvitePayload {
  name:        string
  email:       string
  role:        'admin' | 'supervisor' | 'teacher'
  permissions?: string[]
}

export interface UpdatePayload {
  name?:        string
  role?:        'admin' | 'supervisor' | 'teacher'
  permissions?: string[]
}

export function useUsers() {
  return useQuery({
    queryKey: ['system-users'],
    queryFn: () => api<Paginated<SystemUserRecord>>('/users'),
    staleTime: 30_000,
  })
}

export function useInviteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: InvitePayload) =>
      api<SystemUserRecord>('/users/invite', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system-users'] }),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePayload }) =>
      api<SystemUserRecord>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system-users'] }),
  })
}

export function useDeactivateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api<SystemUserRecord>(`/users/${id}/deactivate`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system-users'] }),
  })
}

export function useActivateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api<SystemUserRecord>(`/users/${id}/activate`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system-users'] }),
  })
}

export function useResendInvite() {
  return useMutation({
    mutationFn: (id: number) =>
      api(`/users/${id}/resend-invite`, { method: 'POST' }),
  })
}
