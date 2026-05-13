'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/system/api'
import type { MonthlyReport } from '@/types/system/monthlyReport'

export function useMonthlyReports() {
  return useQuery({
    queryKey: ['system', 'monthly-reports'],
    queryFn: () => api<Paginated<MonthlyReport>>('/monthly-reports'),
  })
}

export function useRegenerateMonthlyReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { year: number; month: number }) =>
      api<{ data: MonthlyReport }>('/monthly-reports/regenerate', { method: 'POST', body: JSON.stringify(data) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'monthly-reports'] }),
  })
}
