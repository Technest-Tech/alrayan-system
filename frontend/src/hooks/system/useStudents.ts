'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/system/api'
import type { Student, StudentDetail } from '@/types/system/student'

interface StudentFilters {
  status?: string
  course_id?: string
  assigned_teacher_id?: string
  country?: string
  age_category?: string
  q?: string
  page?: number
  per_page?: number
}

export function useStudents(filters: StudentFilters = {}) {
  const params = new URLSearchParams()
  if (filters.status) params.set('filter[status]', filters.status)
  if (filters.course_id) params.set('filter[course_id]', filters.course_id)
  if (filters.assigned_teacher_id) params.set('filter[assigned_teacher_id]', filters.assigned_teacher_id)
  if (filters.country) params.set('filter[country]', filters.country)
  if (filters.age_category) params.set('filter[age_category]', filters.age_category)
  if (filters.q) params.set('filter[q]', filters.q)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.per_page) params.set('per_page', String(filters.per_page))

  const qs = params.toString()
  return useQuery({
    queryKey: ['system', 'students', filters],
    queryFn: () => api<Paginated<Student>>(`/students${qs ? '?' + qs : ''}`),
  })
}

export function useStudent(id: number | string) {
  return useQuery({
    queryKey: ['system', 'students', id],
    queryFn: () => api<{ data: StudentDetail }>(`/students/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

export function useCreateStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api<{ data: StudentDetail }>('/students', { method: 'POST', body: JSON.stringify(data) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'students'] }),
  })
}

export function useUpdateStudent(id: number | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api<{ data: StudentDetail }>(`/students/${id}`, { method: 'PATCH', body: JSON.stringify(data) }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system', 'students', id] })
      qc.invalidateQueries({ queryKey: ['system', 'students'] })
    },
  })
}

export function useStudentTransition(studentId: number | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { to: string; reason?: string; notes?: string }) =>
      api<{ data: StudentDetail }>(`/students/${studentId}/transition`, { method: 'POST', body: JSON.stringify(data) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'students', studentId] }),
  })
}

export function useLinkSibling(studentId: number | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { sibling_id: number; discount_pct: number }) =>
      api<{ data: StudentDetail }>(`/students/${studentId}/siblings`, { method: 'POST', body: JSON.stringify(data) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'students', studentId] }),
  })
}

export function useUnlinkSibling(studentId: number | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (siblingId: number) =>
      api<{ data: StudentDetail }>(`/students/${studentId}/siblings/${siblingId}`, { method: 'DELETE' }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'students', studentId] }),
  })
}
