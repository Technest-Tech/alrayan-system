'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/system/api'
import type { Certificate } from '@/types/system/certificate'

interface CertFilters {
  type?: string
  student_id?: number | string
  q?: string
  page?: number
  per_page?: number
}

export function useCertificates(filters: CertFilters = {}) {
  const params = new URLSearchParams()
  if (filters.type) params.set('filter[type]', filters.type)
  if (filters.student_id) params.set('filter[student_id]', String(filters.student_id))
  if (filters.q) params.set('filter[q]', filters.q)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.per_page) params.set('per_page', String(filters.per_page))
  const qs = params.toString()
  return useQuery({
    queryKey: ['system', 'certificates', filters],
    queryFn: () => api<Paginated<Certificate>>(`/certificates${qs ? '?' + qs : ''}`),
  })
}

export function useCertificate(id: number | string | null) {
  return useQuery({
    queryKey: ['system', 'certificates', id],
    queryFn: () => api<{ data: Certificate }>(`/certificates/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

export function useStudentCertificates(studentId: number | string) {
  return useQuery({
    queryKey: ['system', 'students', studentId, 'certificates'],
    queryFn: () => api<{ data: Certificate[] }>(`/students/${studentId}/certificates`).then(r => r.data),
    enabled: !!studentId,
  })
}

export function useIssueCertificate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api<{ data: Certificate }>('/certificates', { method: 'POST', body: JSON.stringify(data) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'certificates'] }),
  })
}

export function useRevokeCertificate(id: number | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api<{ data: Certificate }>(`/certificates/${id}/revoke`, { method: 'POST' }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'certificates'] }),
  })
}
