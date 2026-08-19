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

export interface CreateCoursePayload {
  name: string
  level?: string
  age_group?: string | null
  description?: string | null
}

export function useCreateCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCoursePayload) =>
      api<{ data: SystemCourse }>('/courses', {
        method: 'POST',
        body: JSON.stringify(data),
      }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system', 'courses'] })
      qc.invalidateQueries({ queryKey: ['system', 'subject-options'] })
    },
  })
}

export function useDeleteCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api(`/courses/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system', 'courses'] })
      qc.invalidateQueries({ queryKey: ['system', 'subject-options'] })
    },
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system', 'courses'] })
      qc.invalidateQueries({ queryKey: ['system', 'subject-options'] })
    },
  })
}

/** Subject picker options for lessons/schedules — readable by teachers, unlike the
 *  full course list which carries enrolment analytics. */
export interface SubjectOption {
  id: number
  name: string
  is_active_for_system: boolean
}

export function useSubjectOptions() {
  return useQuery({
    queryKey: ['system', 'subject-options'],
    queryFn: () => api<{ data: SubjectOption[] }>('/subjects').then(r => r.data),
    staleTime: 60_000,
  })
}
