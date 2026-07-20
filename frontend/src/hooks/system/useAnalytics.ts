'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/system/api'
import type { AnalyticsOverview, TeacherMonthBreakdown } from '@/types/system/analytics'

/** Teacher hours / rates / earnings overview for a month. `teacherId` filters the hours-by-month chart only. */
export function useAnalytics(month: string, teacherId: number | 'all') {
  return useQuery({
    queryKey: ['system', 'analytics', month, teacherId],
    queryFn: () =>
      api<AnalyticsOverview>(`/analytics?month=${month}&teacher_id=${teacherId}`),
    staleTime: 60_000,
  })
}

/** Per-teacher month drill-in for the modal (revenue + recompenses/deductions). */
export function useTeacherMonth(teacherId: number | null, month: string) {
  return useQuery({
    queryKey: ['system', 'analytics', 'teacher', teacherId, month],
    queryFn: () =>
      api<TeacherMonthBreakdown>(`/analytics/teachers/${teacherId}?month=${month}`),
    enabled: teacherId != null,
  })
}

/** Include/exclude a teacher from the analytics totals. */
export function useSetTeacherExclusion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ teacherId, excluded }: { teacherId: number; excluded: boolean }) =>
      api<{ exclude_from_analytics: boolean }>(`/analytics/teachers/${teacherId}/exclusion`, {
        method: 'PATCH',
        body: JSON.stringify({ excluded }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'analytics'] }),
  })
}
