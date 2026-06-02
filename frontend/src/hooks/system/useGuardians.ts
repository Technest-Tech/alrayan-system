'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/system/api'
import type { Guardian } from '@/types/system/guardian'

export function useSearchGuardians(whatsapp: string) {
  return useQuery({
    queryKey: ['system', 'guardians', 'search', whatsapp],
    queryFn:  () => api<{ data: Guardian[] }>(`/guardians?whatsapp=${encodeURIComponent(whatsapp)}`).then(r => r.data),
    enabled:  whatsapp.length >= 5,
    staleTime: 10_000,
  })
}

export function useCreateGuardian() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; whatsapp?: string }) =>
      api<{ data: Guardian }>('/guardians', { method: 'POST', body: JSON.stringify(data) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'guardians'] }),
  })
}
