'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/system/api'
import type { SalaryStatement } from '@/types/system/payroll'

export function useTeacherSalary(
  teacherId: number | string,
  year?: number,
  month?: number,
) {
  const params = new URLSearchParams()
  if (year) params.set('year', String(year))
  if (month) params.set('month', String(month))
  const qs = params.toString()

  return useQuery({
    queryKey: ['system', 'teachers', teacherId, 'salary', year, month],
    queryFn: () =>
      api<SalaryStatement>(`/teachers/${teacherId}/salary-statement${qs ? '?' + qs : ''}`),
    enabled: !!teacherId,
  })
}
