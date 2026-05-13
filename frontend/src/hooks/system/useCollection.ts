'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/system/api'

export interface CollectionData {
  total_issued:                  number
  paid_on_time:                  number
  paid_late:                     number
  unpaid:                        number
  collection_rate:               number
  average_days_delay:            number
  outstanding_minor_by_currency: Record<string, number>
  trend: Array<{ month: string; collection_rate: number; avg_days_delay: number }>
}

export function useCollection(from?: string, to?: string) {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const qs = params.toString()
  return useQuery({
    queryKey: ['system', 'accounting', 'collection', from, to],
    queryFn: () => api<CollectionData>(`/accounting/collection${qs ? '?' + qs : ''}`),
  })
}
