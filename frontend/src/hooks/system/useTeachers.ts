'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/system/api'
import type { Teacher, TeacherDetail } from '@/types/system/teacher'

interface TeacherFilters {
  is_active?: string
  course?: string
  q?: string
  page?: number
}

export function useTeachers(filters: TeacherFilters = {}) {
  const params = new URLSearchParams()
  if (filters.is_active) params.set('filter[is_active]', filters.is_active)
  if (filters.course) params.set('filter[course]', filters.course)
  if (filters.q) params.set('q', filters.q)
  if (filters.page) params.set('page', String(filters.page))

  const qs = params.toString()
  return useQuery({
    queryKey: ['system', 'teachers', filters],
    queryFn: () => api<Paginated<Teacher>>(`/teachers${qs ? '?' + qs : ''}`),
  })
}

export function useTeacher(id: number | string) {
  return useQuery({
    queryKey: ['system', 'teachers', id],
    queryFn: () => api<{ data: TeacherDetail }>(`/teachers/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

export function useUpdateTeacher(id: number | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<TeacherDetail>) =>
      api<{ data: TeacherDetail }>(`/teachers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system', 'teachers', id] })
      qc.invalidateQueries({ queryKey: ['system', 'teachers'] })
    },
  })
}

export function useActivateTeacher() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api<{ data: TeacherDetail }>(`/teachers/${id}/activate`, { method: 'POST' }).then(r => r.data),
    onSuccess: (_, id) => qc.invalidateQueries({ queryKey: ['system', 'teachers', id] }),
  })
}

export function useDeactivateTeacher() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api<{ data: TeacherDetail }>(`/teachers/${id}/deactivate`, { method: 'POST' }).then(r => r.data),
    onSuccess: (_, id) => qc.invalidateQueries({ queryKey: ['system', 'teachers', id] }),
  })
}
