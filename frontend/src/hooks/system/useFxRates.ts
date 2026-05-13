'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/system/api'

export interface FxRate {
  pair:       string
  from:       string
  to:         string
  rate:       number | null
  updated_at: string | null
  is_stale:   boolean
}

export function useFxRates() {
  return useQuery({
    queryKey: ['system', 'settings', 'fx-rates'],
    queryFn: () => api<{ data: FxRate[] }>('/settings/fx-rates').then(r => r.data),
    staleTime: 30_000,
  })
}

export function useUpdateFxRates() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (rates: Array<{ pair: string; rate: number }>) =>
      api('/settings/fx-rates', { method: 'PUT', body: JSON.stringify({ rates }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'settings', 'fx-rates'] }),
  })
}
