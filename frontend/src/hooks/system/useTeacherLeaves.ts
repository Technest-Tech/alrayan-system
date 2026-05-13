'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/system/api'
import type { TeacherLeave } from '@/types/system/teacher'

interface LeaveFilters { status?: string; teacher_id?: string; page?: number }

export function useTeacherLeaves(filters: LeaveFilters = {}) {
  const params = new URLSearchParams()
  if (filters.status) params.set('filter[status]', filters.status)
  if (filters.teacher_id) params.set('filter[teacher_id]', filters.teacher_id)
  if (filters.page) params.set('page', String(filters.page))
  const qs = params.toString()
  return useQuery({
    queryKey: ['system', 'teacher-leaves', filters],
    queryFn: () => api<Paginated<TeacherLeave>>(`/teacher-leaves${qs ? '?' + qs : ''}`),
  })
}

export function useRequestLeave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { teacher_id?: number; start_date: string; end_date: string; reason: string }) =>
      api<{ data: TeacherLeave }>('/teacher-leaves', { method: 'POST', body: JSON.stringify(data) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'teacher-leaves'] }),
  })
}

export function useApproveLeave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, review_note }: { id: number; review_note?: string }) =>
      api<{ data: TeacherLeave }>(`/teacher-leaves/${id}/approve`, { method: 'POST', body: JSON.stringify({ review_note }) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'teacher-leaves'] }),
  })
}

export function useRejectLeave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, review_note }: { id: number; review_note?: string }) =>
      api<{ data: TeacherLeave }>(`/teacher-leaves/${id}/reject`, { method: 'POST', body: JSON.stringify({ review_note }) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'teacher-leaves'] }),
  })
}
