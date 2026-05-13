'use client'
import { useQuery } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/system/api'
import type { Payroll } from '@/types/system/payroll'

export interface PayrollFilters {
  status?: string
  period_year?: number | string
  period_month?: number | string
  teacher_id?: number | string
  page?: number
  per_page?: number
}

export function usePayrolls(filters: PayrollFilters = {}) {
  const params = new URLSearchParams()
  if (filters.status) params.set('filter[status]', filters.status)
  if (filters.period_year) params.set('filter[period_year]', String(filters.period_year))
  if (filters.period_month) params.set('filter[period_month]', String(filters.period_month))
  if (filters.teacher_id) params.set('filter[teacher_id]', String(filters.teacher_id))
  if (filters.page) params.set('page', String(filters.page))
  if (filters.per_page) params.set('per_page', String(filters.per_page))

  const qs = params.toString()
  return useQuery({
    queryKey: ['system', 'payrolls', filters],
    queryFn: () => api<Paginated<Payroll>>(`/payrolls${qs ? '?' + qs : ''}`),
  })
}
