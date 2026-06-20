'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/system/api'
import type { Task, TaskDetail } from '@/types/system/task'

export interface TaskFilters {
  status?: string
  type?: string
  priority?: string
  assignee_role?: string
  student_id?: string
  teacher_id?: string
  mine?: boolean
  from_date?: string
  to_date?: string
  q?: string
  page?: number
  per_page?: number
}

export function useTasks(filters: TaskFilters = {}) {
  const params = new URLSearchParams()
  if (filters.status)        params.set('filter[status]', filters.status)
  if (filters.type)          params.set('filter[type]', filters.type)
  if (filters.priority)      params.set('filter[priority]', filters.priority)
  if (filters.assignee_role) params.set('filter[assignee_role]', filters.assignee_role)
  if (filters.student_id)    params.set('filter[student_id]', filters.student_id)
  if (filters.teacher_id)    params.set('filter[teacher_id]', filters.teacher_id)
  if (filters.mine)          params.set('filter[mine]', '1')
  if (filters.from_date)     params.set('filter[from_date]', filters.from_date)
  if (filters.to_date)       params.set('filter[to_date]', filters.to_date)
  if (filters.q)             params.set('filter[q]', filters.q)
  if (filters.page)          params.set('page', String(filters.page))
  if (filters.per_page)      params.set('per_page', String(filters.per_page))
  const qs = params.toString()
  return useQuery({
    queryKey: ['system', 'tasks', filters],
    queryFn: () => api<Paginated<Task>>(`/tasks${qs ? '?' + qs : ''}`),
  })
}

export function useTask(id: number | string | null) {
  return useQuery({
    queryKey: ['system', 'tasks', 'detail', id],
    queryFn: () => api<{ data: TaskDetail }>(`/tasks/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api<{ data: TaskDetail }>('/tasks', { method: 'POST', body: JSON.stringify(data) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'tasks'] }),
  })
}

export function useUpdateTask(id: number | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api<{ data: TaskDetail }>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'tasks'] }),
  })
}

export function useAssignTask(id: number | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { assignee_role?: string | null; assignee_user_id?: number | null }) =>
      api<{ data: TaskDetail }>(`/tasks/${id}/assign`, { method: 'POST', body: JSON.stringify(data) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'tasks'] }),
  })
}

export function useDecideTask(id: number | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ decision, notes }: { decision: 'approve' | 'reject'; notes?: string }) =>
      api<{ data: TaskDetail }>(`/tasks/${id}/${decision}`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'tasks'] }),
  })
}

export function usePostponeTask(id: number | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { due_at?: string }) =>
      api<{ data: TaskDetail }>(`/tasks/${id}/postpone`, { method: 'POST', body: JSON.stringify(data) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'tasks'] }),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api<{ message: string }>(`/tasks/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'tasks'] }),
  })
}

export function useAddTaskNote(id: number | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: string) =>
      api<{ data: TaskNoteResponse }>(`/tasks/${id}/notes`, { method: 'POST', body: JSON.stringify({ body }) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'tasks'] }),
  })
}

interface TaskNoteResponse {
  id: number
  body: string
  actor_name: string | null
  created_at: string
}
