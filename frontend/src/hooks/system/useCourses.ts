'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/system/api'
import type { SystemCourse } from '@/types/system/course'

export function useCourses() {
  return useQuery({
    queryKey: ['system', 'courses'],
    queryFn: () => api<{ data: SystemCourse[] }>('/courses').then(r => r.data),
  })
}

export function useToggleCourseActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, is_active_for_system }: { id: number; is_active_for_system: boolean }) =>
      api<{ data: SystemCourse }>(`/courses/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active_for_system }),
      }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'courses'] }),
  })
}
