'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/system/api'
import type { SessionReport } from '@/types/system/session'

interface ReportFilters {
  teacher_id?: number | string
  student_id?: number | string
  from?: string
  to?: string
  page?: number
}

export function useSessionReports(filters: ReportFilters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => v !== undefined && params.set(k, String(v)))

  return useQuery({
    queryKey: ['system', 'session-reports', filters],
    queryFn:  () => api<Paginated<SessionReport>>(`/session-reports?${params}`),
  })
}

export function useSessionReport(sessionId: number | null) {
  return useQuery({
    queryKey:  ['system', 'session-reports', 'session', sessionId],
    queryFn:   () => api<SessionReport>(`/sessions/${sessionId}/report`),
    enabled:   sessionId !== null,
    retry:     false,
  })
}

export function useSubmitReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, data }: {
      sessionId: number
      data: { covered_text: string; performance: string; homework_text?: string; next_session_notes?: string }
    }) => api<SessionReport>(`/sessions/${sessionId}/report`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['system', 'session-reports'] })
      qc.invalidateQueries({ queryKey: ['system', 'session-reports', 'session', vars.sessionId] })
      qc.invalidateQueries({ queryKey: ['system', 'sessions'] })
    },
  })
}

export function useUpdateReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: {
      id: number
      data: Partial<{ covered_text: string; performance: string; homework_text: string; next_session_notes: string }>
    }) => api<SessionReport>(`/session-reports/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'session-reports'] }),
  })
}

export function useStudentReports(studentId: number | null) {
  return useQuery({
    queryKey: ['system', 'session-reports', 'student', studentId],
    queryFn:  () => api<Paginated<SessionReport>>(`/students/${studentId}/reports`),
    enabled:  studentId !== null,
  })
}

export function useTeacherReports(teacherId: number | null) {
  return useQuery({
    queryKey: ['system', 'session-reports', 'teacher', teacherId],
    queryFn:  () => api<Paginated<SessionReport>>(`/teachers/${teacherId}/reports`),
    enabled:  teacherId !== null,
  })
}
