'use client'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/system/api'

export interface ExportKind {
  kind:  string
  label: string
}

export function useExportKinds() {
  return useQuery({
    queryKey: ['system', 'exports'],
    queryFn: () => api<{ data: ExportKind[] }>('/exports').then(r => r.data),
    staleTime: 300_000,
  })
}

export function useQueueExport() {
  return useMutation({
    mutationFn: (data: { kind: string; filters?: Record<string, unknown> }) =>
      api('/exports', { method: 'POST', body: JSON.stringify(data) }),
  })
}
