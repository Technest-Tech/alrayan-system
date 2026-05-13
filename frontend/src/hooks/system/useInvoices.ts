'use client'
import { useQuery } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/system/api'
import type { Invoice } from '@/types/system/invoice'

export interface InvoiceFilters {
  'filter[status]'?: string
  'filter[student_id]'?: number | string
  'filter[type]'?: string
  page?: number
  per_page?: number
}

export function useInvoices(filters: InvoiceFilters = {}) {
  const params = new URLSearchParams()
  if (filters['filter[status]']) params.set('filter[status]', filters['filter[status]']!)
  if (filters['filter[student_id]']) params.set('filter[student_id]', String(filters['filter[student_id]']))
  if (filters['filter[type]']) params.set('filter[type]', filters['filter[type]']!)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.per_page) params.set('per_page', String(filters.per_page))

  const qs = params.toString()
  return useQuery({
    queryKey: ['system', 'invoices', filters],
    queryFn: () => api<Paginated<Invoice>>(`/invoices${qs ? '?' + qs : ''}`),
  })
}
