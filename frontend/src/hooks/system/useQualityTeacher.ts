'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/system/api'
import type { QualityReview } from '@/types/system/quality'

export function useQualityTeacher(teacherId: number | string, page = 1) {
  return useQuery({
    queryKey: ['system', 'quality', 'teacher', teacherId, page],
    queryFn: () =>
      api<Paginated<QualityReview>>(`/quality/${teacherId}?page=${page}`),
    enabled: !!teacherId,
  })
}

interface SubmitReviewPayload {
  teacherId: number | string
  period_year: number
  period_month: number
  attendance_score: number
  reports_score: number
  retention_score: number
  punctuality_score: number
  notes?: string
}

export function useSubmitReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ teacherId, ...body }: SubmitReviewPayload) =>
      api<{ data: QualityReview }>(`/quality/${teacherId}`, {
        method: 'POST',
        body: JSON.stringify(body),
      }).then(r => r.data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['system', 'quality', 'teacher', variables.teacherId] })
      qc.invalidateQueries({ queryKey: ['system', 'quality', 'leaderboard'] })
    },
  })
}

export function useApplyBonus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ reviewId, teacherId }: { reviewId: number; teacherId: number | string }) =>
      api<{ message: string }>(`/quality/reviews/${reviewId}/apply-bonus`, {
        method: 'POST',
      }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['system', 'quality', 'teacher', variables.teacherId] })
      qc.invalidateQueries({ queryKey: ['system', 'payrolls'] })
    },
  })
}
