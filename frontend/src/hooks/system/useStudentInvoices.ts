'use client'
import { useQuery } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/system/api'
import type { Invoice } from '@/types/system/invoice'

export function useStudentInvoices(studentId: number | string) {
  return useQuery({
    queryKey: ['system', 'students', studentId, 'invoices'],
    queryFn: () =>
      api<Paginated<Invoice>>(`/students/${studentId}/invoices`),
    enabled: !!studentId,
  })
}
