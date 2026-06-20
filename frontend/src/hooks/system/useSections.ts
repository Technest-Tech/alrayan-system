'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/system/api'

export interface LeadSection {
  id: string
  name: string
}

const KEY = ['system', 'settings', 'sections']

export function useSections() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api<{ data: LeadSection[] }>('/settings/sections').then(r => r.data),
    staleTime: 60_000,
  })
}

export function useUpdateSections() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sections: LeadSection[]) =>
      api<{ data: LeadSection[] }>('/settings/sections', {
        method: 'PUT',
        body: JSON.stringify({ sections }),
      }).then(r => r.data),
    onSuccess: data => qc.setQueryData(KEY, data),
  })
}
