'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/system/api'
import type {
  StudentAnalyticsFilters,
  StudentAnalyticsResponse,
} from '@/types/system/studentAnalytics'

export function useStudentAnalytics(filters: StudentAnalyticsFilters) {
  const params = new URLSearchParams({
    period: filters.period,
    page: String(filters.page),
    per_page: String(filters.per_page),
    sort: filters.sort,
    direction: filters.direction,
  })

  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.teacher_id) params.set('teacher_id', filters.teacher_id)

  return useQuery({
    queryKey: ['system', 'students', 'analytics', filters],
    queryFn: () => api<StudentAnalyticsResponse>(`/students/analytics?${params.toString()}`),
    placeholderData: keepPreviousData,
  })
}
