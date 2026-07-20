'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/system/api'
import type {
  QcAssignment,
  QcCategory,
  QcConfig,
  QcDashboard,
  QcEvaluation,
  QcEvaluationDetail,
  QcSpecialRule,
} from '@/types/system/qualityControl'

const ROOT = ['system', 'qc'] as const

export interface QcEvaluationFilters {
  quality_manager_id?: string
  teacher_id?: string
  min_score?: string
  max_score?: string
  from_date?: string
  to_date?: string
  page?: number
  per_page?: number
}

export interface QcEvaluationsResponse {
  data: QcEvaluation[]
  meta: { current_page: number; last_page: number; per_page: number; total: number }
  summary: { count: number; total_duration_minutes: number }
}

/* ── Dashboard / config / evaluations (reads) ───────────────────────────── */

export function useQcDashboard() {
  return useQuery({
    queryKey: [...ROOT, 'dashboard'],
    queryFn: () => api<{ data: QcDashboard }>('/quality-control/dashboard').then(r => r.data),
  })
}

export function useQcConfig() {
  return useQuery({
    queryKey: [...ROOT, 'config'],
    queryFn: () => api<{ data: QcConfig }>('/quality-control/config').then(r => r.data),
  })
}

export function useQcEvaluations(filters: QcEvaluationFilters = {}) {
  const params = new URLSearchParams()
  if (filters.quality_manager_id) params.set('filter[quality_manager_id]', filters.quality_manager_id)
  if (filters.teacher_id)         params.set('filter[teacher_id]', filters.teacher_id)
  if (filters.min_score)          params.set('filter[min_score]', filters.min_score)
  if (filters.max_score)          params.set('filter[max_score]', filters.max_score)
  if (filters.from_date)          params.set('filter[from_date]', filters.from_date)
  if (filters.to_date)            params.set('filter[to_date]', filters.to_date)
  if (filters.page)               params.set('page', String(filters.page))
  if (filters.per_page)           params.set('per_page', String(filters.per_page))
  const qs = params.toString()

  return useQuery({
    queryKey: [...ROOT, 'evaluations', filters],
    queryFn: () => api<QcEvaluationsResponse>(`/quality-control/evaluations${qs ? '?' + qs : ''}`),
  })
}

export function useQcEvaluation(id: number | string | null) {
  return useQuery({
    queryKey: [...ROOT, 'evaluations', 'detail', id],
    queryFn: () => api<{ data: QcEvaluationDetail }>(`/quality-control/evaluations/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

/* ── Evaluation mutations ───────────────────────────────────────────────── */

export function useCreateQcEvaluation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api<{ data: QcEvaluationDetail }>('/quality-control/evaluations', { method: 'POST', body: JSON.stringify(data) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ROOT }),
  })
}

export function useUpdateQcEvaluation(id: number | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api<{ data: QcEvaluationDetail }>(`/quality-control/evaluations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ROOT }),
  })
}

export function useDeleteQcEvaluation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api<{ message: string }>(`/quality-control/evaluations/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ROOT }),
  })
}

/* ── Settings: categories + sub-items ───────────────────────────────────── */

export function useQcCategories() {
  return useQuery({
    queryKey: [...ROOT, 'categories'],
    queryFn: () => api<{ data: QcCategory[] }>('/quality-control/categories').then(r => r.data),
  })
}

export function useCreateQcCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; weight?: number }) =>
      api<{ data: QcCategory }>('/quality-control/categories', { method: 'POST', body: JSON.stringify(data) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ROOT }),
  })
}

export function useUpdateQcCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Record<string, unknown>) =>
      api<{ data: QcCategory }>(`/quality-control/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ROOT }),
  })
}

export function useDeleteQcCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api(`/quality-control/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ROOT }),
  })
}

export function useCreateQcItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ categoryId, ...data }: { categoryId: number; label: string; penalty?: number; special_rule_key?: string | null }) =>
      api(`/quality-control/categories/${categoryId}/items`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ROOT }),
  })
}

export function useUpdateQcItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Record<string, unknown>) =>
      api(`/quality-control/category-items/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ROOT }),
  })
}

export function useDeleteQcItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api(`/quality-control/category-items/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ROOT }),
  })
}

/* ── Settings: special rules ────────────────────────────────────────────── */

export function useQcSpecialRules() {
  return useQuery({
    queryKey: [...ROOT, 'special-rules'],
    queryFn: () => api<{ data: QcSpecialRule[] }>('/quality-control/special-rules').then(r => r.data),
  })
}

export function useCreateQcSpecialRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { rule_key: string; label: string; cap_value: number; rule_type?: string }) =>
      api<{ data: QcSpecialRule }>('/quality-control/special-rules', { method: 'POST', body: JSON.stringify(data) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ROOT }),
  })
}

export function useUpdateQcSpecialRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Record<string, unknown>) =>
      api<{ data: QcSpecialRule }>(`/quality-control/special-rules/${id}`, { method: 'PATCH', body: JSON.stringify(data) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ROOT }),
  })
}

export function useDeleteQcSpecialRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api(`/quality-control/special-rules/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ROOT }),
  })
}

/* ── Settings: assignments ──────────────────────────────────────────────── */

export function useQcAssignments() {
  return useQuery({
    queryKey: [...ROOT, 'assignments'],
    queryFn: () => api<{ data: QcAssignment[] }>('/quality-control/assignments').then(r => r.data),
  })
}

export function useCreateQcAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { quality_manager_id: number; teacher_id: number }) =>
      api<{ data: QcAssignment }>('/quality-control/assignments', { method: 'POST', body: JSON.stringify(data) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ROOT }),
  })
}

export function useDeleteQcAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api(`/quality-control/assignments/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ROOT }),
  })
}
