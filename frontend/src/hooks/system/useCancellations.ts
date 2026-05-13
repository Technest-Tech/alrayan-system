'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/system/api'

export interface CancellationData {
  total_cancelled: number
  by_reason:       Record<string, number>
  by_teacher:      Array<{ teacher_name: string; count: number }>
  monthly_count:   Record<string, number>
  rate:            Array<{ month: string; month_label: string; cancelled: number; cancellation_rate: number }>
}

export function useCancellations(from?: string, to?: string) {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const qs = params.toString()
  return useQuery({
    queryKey: ['system', 'accounting', 'cancellations', from, to],
    queryFn: () => api<CancellationData>(`/accounting/cancellations${qs ? '?' + qs : ''}`),
  })
}
