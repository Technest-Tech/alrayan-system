'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/system/api'
import type { PnlResponse } from '@/types/system/pnl'

export function useProfitLoss(from?: string, to?: string, base?: string) {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  if (base) params.set('base', base)
  const qs = params.toString()
  return useQuery({
    queryKey: ['system', 'accounting', 'pnl', from, to, base],
    queryFn: () => api<PnlResponse>(`/accounting/profit-loss${qs ? '?' + qs : ''}`),
  })
}
