'use client'
import { useQuery } from '@tanstack/react-query'
import { api, clearToken } from './api'
import type { AuthUser } from '@/types/system/auth'

export function useUser() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => api<AuthUser>('/auth/me'),
    staleTime: 60_000,
    retry: false,
  })
}

export async function logout() {
  await api('/auth/logout', { method: 'POST' }).catch(() => {})
  clearToken()
  window.location.href = '/login'
}
