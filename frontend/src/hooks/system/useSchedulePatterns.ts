'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/system/api'
import type { SchedulePattern, PatternPreviewOccurrence } from '@/types/system/session'

export function useSchedulePatterns(studentId: number | null) {
  return useQuery({
    queryKey: ['system', 'schedule-patterns', studentId],
    queryFn:  () => api.get<SchedulePattern[]>(`/students/${studentId}/schedule-patterns`),
    enabled:  studentId !== null,
  })
}

export function useReplaceSchedulePatterns() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ studentId, effectiveDate, patterns, forceConflicts = false }: {
      studentId: number
      effectiveDate: string
      patterns: Array<{ day_of_week: number; start_time: string; duration_min: number; valid_to?: string | null }>
      forceConflicts?: boolean
    }) => api.put(`/students/${studentId}/schedule-patterns`, {
      effective_date: effectiveDate,
      patterns,
      force_conflicts: forceConflicts,
    }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['system', 'schedule-patterns', vars.studentId] })
      qc.invalidateQueries({ queryKey: ['system', 'sessions'] })
    },
  })
}

export function usePreviewSchedulePatterns() {
  return useMutation({
    mutationFn: ({ studentId, effectiveDate, patterns }: {
      studentId: number
      effectiveDate: string
      patterns: Array<{ day_of_week: number; start_time: string; duration_min: number }>
    }) => api.post<{ occurrences: PatternPreviewOccurrence[]; conflicts: unknown[] }>(
      `/students/${studentId}/schedule-patterns/preview`,
      { effective_date: effectiveDate, patterns },
    ),
  })
}
