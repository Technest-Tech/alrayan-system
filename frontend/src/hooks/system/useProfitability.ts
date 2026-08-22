'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/system/api'
import type { ProfitabilityReport, ProfitabilitySettingsPayload } from '@/types/system/profitability'

/** Per-teacher income → cost → margin → net profit for one month. */
export function useProfitability(month: string, currency: string | null) {
  return useQuery({
    queryKey: ['system', 'profitability', month, currency],
    queryFn: () =>
      api<ProfitabilityReport>(
        `/accounting/profitability?month=${month}${currency ? `&currency=${currency}` : ''}`,
      ),
    staleTime: 60_000,
  })
}

/** Persist the percentage lines / partner split / default currency. */
export function useSaveProfitabilitySettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ProfitabilitySettingsPayload) =>
      api<unknown>('/accounting/profitability/settings', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'profitability'] }),
  })
}
