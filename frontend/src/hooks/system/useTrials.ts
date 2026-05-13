'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/system/api'

export interface TrialData {
  total_booked:    number
  completed:       number
  enrolled:        number
  not_converted:   number
  conversion_rate: number
  monthly_trend:   Array<{ month: string; booked: number; enrolled: number; conversion_rate: number }>
  best_teacher:    { name: string; enrolled_count: number } | null
}

export function useTrials(from?: string, to?: string) {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const qs = params.toString()
  return useQuery({
    queryKey: ['system', 'accounting', 'trials', from, to],
    queryFn: () => api<TrialData>(`/accounting/trials${qs ? '?' + qs : ''}`),
  })
}
