'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/system/api'

export interface AcademySettings {
  'academy.name':             string
  'academy.logo_path':        string | null
  'academy.support_email':    string
  'academy.support_phone':    string
  'academy.support_whatsapp': string
  'academy.address':          string
  'academy.default_timezone': string
  'academy.footer_text':      string
}

export function useAcademy() {
  return useQuery({
    queryKey: ['system', 'settings', 'academy'],
    queryFn: () => api<{ data: AcademySettings }>('/settings/academy').then(r => r.data),
    staleTime: 30_000,
  })
}

export function useUpdateAcademy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<AcademySettings>) =>
      api('/settings/academy', { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'settings', 'academy'] }),
  })
}
