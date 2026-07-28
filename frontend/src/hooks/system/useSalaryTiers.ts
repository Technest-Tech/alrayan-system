'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/system/api'
import type { SalaryTierOverview, MySalaryTier } from '@/types/system/salaryTiers'

/** Admin: the ladder + who sits on each tier for a month (YYYY-MM). */
export function useSalaryTiers(month: string) {
  return useQuery({
    queryKey: ['system', 'salary-tiers', month],
    queryFn: () => api<SalaryTierOverview>(`/salary-tiers?month=${month}`),
    staleTime: 60_000,
  })
}

/** Teacher portal: the signed-in teacher's own level this month. */
export function useMySalaryTier(month?: string) {
  return useQuery({
    queryKey: ['system', 'my-salary-tier', month ?? 'current'],
    queryFn: () => api<MySalaryTier>(`/teachers/me/salary-tier${month ? `?month=${month}` : ''}`),
    staleTime: 60_000,
  })
}
