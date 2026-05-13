'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/system/api'

export interface RevenueData {
  from:          string
  to:            string
  base_currency: string
  totals:        Array<{ currency: string; total_minor: number; payment_count: number }>
  by_course:     Array<{ course_id: number; course_name: string; currency: string; total_minor: number; payment_count: number }>
  by_month:      Array<{ year: number; month: number; currency: string; total_minor: number; base_minor: number }>
}

export function useRevenue(from?: string, to?: string) {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const qs = params.toString()
  return useQuery({
    queryKey: ['system', 'accounting', 'revenue', from, to],
    queryFn: () => api<RevenueData>(`/accounting/revenue${qs ? '?' + qs : ''}`),
  })
}
