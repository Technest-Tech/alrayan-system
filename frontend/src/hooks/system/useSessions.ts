'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/system/api'
import type { Session } from '@/types/system/session'

interface SessionFilters {
  teacher_id?: number | string
  student_id?: number | string
  status?: string
  from?: string
  to?: string
  page?: number
  per_page?: number
}

export function useSessions(filters: SessionFilters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => v !== undefined && params.set(k, String(v)))

  return useQuery({
    queryKey: ['system', 'sessions', filters],
    queryFn:  () => api<Paginated<Session>>(`/sessions?${params}`),
  })
}

export function useSession(id: number | null) {
  return useQuery({
    queryKey:  ['system', 'sessions', id],
    queryFn:   () => api<Session>(`/sessions/${id}`),
    enabled:   id !== null,
  })
}

export function useMarkAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, cancelled_by, cancellation_reason, apology_received }: {
      id: number
      status: 'attended' | 'absent' | 'cancelled'
      cancelled_by?: 'student' | 'teacher' | 'admin'
      cancellation_reason?: string
      /** Only meaningful when status='absent' and cancelled_by='student'. */
      apology_received?: boolean
    }) => api(`/sessions/${id}/attendance`, {
      method: 'POST',
      body:   JSON.stringify({ status, cancelled_by, cancellation_reason, apology_received }),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'sessions'] }),
  })
}

export function useRescheduleSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, scheduled_start, force_conflicts = false }: {
      id: number
      scheduled_start: string
      force_conflicts?: boolean
    }) => api(`/sessions/${id}/reschedule`, { method: 'PATCH', body: JSON.stringify({ scheduled_start, force_conflicts }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'sessions'] }),
  })
}

export function useCancelSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, cancelled_by, cancellation_reason }: {
      id: number
      cancelled_by: string
      cancellation_reason?: string
    }) => api(`/sessions/${id}/cancel`, { method: 'POST', body: JSON.stringify({ cancelled_by, cancellation_reason }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'sessions'] }),
  })
}

/**
 * Send a session-related message via Wassender.
 *
 *   - kind=text   → sends raw text (parent report, teacher template, etc.)
 *   - kind=image  → uploads base64 PNG to public storage and sends image
 *
 * Target defaults to 'student' (student's WhatsApp); pass 'teacher' to
 * deliver the teacher template / request to the assigned teacher.
 */
export function useSendSessionReportWhatsApp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, ...body }:
      | { sessionId: number; kind: 'text';  text:  string; target?: 'student' | 'teacher' }
      | { sessionId: number; kind: 'image'; image: string; target?: 'student' | 'teacher'; caption?: string }
    ) => api<{ message: string; external_message_id?: string; recipient: string }>(
      `/sessions/${sessionId}/send-report-whatsapp`,
      { method: 'POST', body: JSON.stringify(body) },
    ),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['system', 'sessions', vars.sessionId] }),
  })
}

export function useBulkAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (items: Array<{
      session_id: number
      status: 'attended' | 'absent' | 'cancelled'
      cancelled_by?: 'student' | 'teacher' | 'admin'
      cancellation_reason?: string
      apology_received?: boolean
    }>) =>
      api('/sessions/bulk-attendance', { method: 'POST', body: JSON.stringify({ items }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'sessions'] }),
  })
}

export function useStudentSessions(studentId: number | undefined | null) {
  return useQuery({
    queryKey: ['system', 'sessions', { student_id: studentId, per_page: 20 }],
    queryFn:  () => api<Paginated<Session>>(`/sessions?student_id=${studentId}&per_page=20`),
    enabled:  !!studentId,
  })
}

export function useCreateSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      student_id: number
      teacher_id: number
      scheduled_start: string
      duration_min: number
    }) => api<Session>('/sessions', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['system', 'sessions'] })
      qc.invalidateQueries({ queryKey: ['system', 'sessions', { student_id: vars.student_id }] })
    },
  })
}

export function useSessionConflicts() {
  return useQuery({
    queryKey: ['system', 'sessions', 'conflicts'],
    queryFn:  () => api<Array<{ session: Session; conflicts: Array<{ type: string }> }>>('/sessions/conflicts'),
  })
}

interface AvailabilityConflict {
  type: 'teacher_double_booking' | 'teacher_on_leave' | 'teacher_unavailable'
  related?: {
    session_id?: number
    scheduled_start?: string
    scheduled_end?: string
    student?: { id: number; name: string }
    start_date?: string
    end_date?: string
  } | null
}

interface AvailabilityResult {
  available: boolean
  conflicts: AvailabilityConflict[]
}

export function useCheckTeacherAvailability(params: {
  teacher_id: number
  scheduled_start: string
  duration_min: number
} | null) {
  return useQuery({
    queryKey: ['system', 'teacher-availability', params],
    queryFn:  () => api<AvailabilityResult>(
      `/teachers/${params!.teacher_id}/check-availability`,
      { method: 'POST', body: JSON.stringify({ scheduled_start: params!.scheduled_start, duration_min: params!.duration_min }) },
    ),
    enabled:   !!(params?.teacher_id && params?.scheduled_start),
    staleTime: 20_000,
    retry:     false,
  })
}
