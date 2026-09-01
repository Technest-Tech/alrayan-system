'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/system/api'

export type SiteSettings = Record<string, string>

const KEY = ['system', 'site', 'settings']

export function useSiteSettings() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api<{ data: SiteSettings }>('/site/settings').then((r) => r.data),
  })
}

export function useUpdateSiteSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: SiteSettings) =>
      api<{ message: string }>('/site/settings', { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
