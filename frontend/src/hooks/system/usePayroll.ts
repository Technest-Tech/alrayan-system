'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/system/api'
import type { Payroll } from '@/types/system/payroll'

export function usePayroll(id: number | string) {
  return useQuery({
    queryKey: ['system', 'payrolls', id],
    queryFn: () =>
      api<{ data: Payroll }>(`/payrolls/${id}`).then(r => r.data),
    enabled: !!id,
  })
}
