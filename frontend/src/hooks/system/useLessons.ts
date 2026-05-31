'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/system/api'
import type {
  Lesson,
  CalendarDay,
  LessonSubject,
  LessonEvaluation,
  StudentPackage,
  LessonSchedule,
  StoreLessonPayload,
  StoreLessonSchedulePayload,
} from '@/types/system/lesson'

/* ─── Calendar feed ──────────────────────────────────────── */
interface CalendarFeedParams {
  teacherId?: number
  studentIds?: number[]
  start: string
  end: string
}

export function useCalendarFeed({ teacherId, studentIds, start, end }: CalendarFeedParams) {
  const params = new URLSearchParams()
  params.set('start', start)
  params.set('end', end)
  if (teacherId) params.set('teacher_id', String(teacherId))
  if (studentIds?.length) {
    studentIds.forEach(id => params.append('student_id[]', String(id)))
  }

  return useQuery({
    queryKey: ['system', 'calendar', { teacherId, studentIds, start, end }],
    queryFn: () => api<{ data: CalendarDay[] }>(`/calendar?${params}`).then(r => r.data),
    enabled: !!(start && end),
  })
}

/* ─── Lessons list ───────────────────────────────────────── */
interface LessonFilters {
  teacher_id?: number | string
  student_id?: number | string
  status?: string
  package_id?: number | string
  sort?: string
  per_page?: number
  page?: number
}

export function useLessons(filters: LessonFilters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '') params.set(k, String(v))
  })

  return useQuery({
    queryKey: ['system', 'lessons', filters],
    queryFn: () => api<Paginated<Lesson>>(`/lessons?${params}`),
  })
}

/* ─── Single lesson ──────────────────────────────────────── */
export function useLesson(id: number | null) {
  return useQuery({
    queryKey: ['system', 'lessons', id],
    queryFn: () => api<Lesson>(`/lessons/${id}`),
    enabled: id !== null,
  })
}

/* ─── Lesson subjects ────────────────────────────────────── */
export function useLessonSubjects() {
  return useQuery({
    queryKey: ['system', 'lesson-subjects'],
    queryFn: () => api<{ data: LessonSubject[] }>('/lesson-subjects').then(r => r.data),
  })
}

/* ─── Lesson evaluations ─────────────────────────────────── */
export function useLessonEvaluations() {
  return useQuery({
    queryKey: ['system', 'lesson-evaluations'],
    queryFn: () => api<{ data: LessonEvaluation[] }>('/lesson-evaluations').then(r => r.data),
  })
}

/* ─── Student packages ───────────────────────────────────── */
export function useStudentPackages(studentId: number | undefined | null) {
  return useQuery({
    queryKey: ['system', 'student-packages', studentId],
    queryFn: () => api<{ data: StudentPackage[] }>(`/student-packages?student_id=${studentId}`).then(r => r.data),
    enabled: !!studentId,
  })
}

/* ─── Lesson schedules ───────────────────────────────────── */
interface ScheduleFilters {
  teacherId?: number
  studentId?: number
}

export function useLessonSchedules({ teacherId, studentId }: ScheduleFilters = {}) {
  const params = new URLSearchParams()
  if (teacherId) params.set('teacher_id', String(teacherId))
  if (studentId) params.set('student_id', String(studentId))

  return useQuery({
    queryKey: ['system', 'lesson-schedules', { teacherId, studentId }],
    queryFn: () => api<{ data: LessonSchedule[] }>(`/lesson-schedules?${params}`).then(r => r.data),
  })
}

/* ─── Create lesson ──────────────────────────────────────── */
export function useCreateLesson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: StoreLessonPayload) =>
      api<Lesson>('/lessons', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system', 'lessons'] })
      qc.invalidateQueries({ queryKey: ['system', 'calendar'] })
    },
  })
}

/* ─── Update lesson ──────────────────────────────────────── */
export function useUpdateLesson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<StoreLessonPayload> & { id: number }) =>
      api<Lesson>(`/lessons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['system', 'lessons', id] })
      qc.invalidateQueries({ queryKey: ['system', 'lessons'] })
      qc.invalidateQueries({ queryKey: ['system', 'calendar'] })
    },
  })
}

/* ─── Delete lesson ──────────────────────────────────────── */
export function useDeleteLesson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api(`/lessons/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system', 'lessons'] })
      qc.invalidateQueries({ queryKey: ['system', 'calendar'] })
    },
  })
}

/* ─── Create lesson schedule ─────────────────────────────── */
export function useCreateLessonSchedule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: StoreLessonSchedulePayload) =>
      api<LessonSchedule>('/lesson-schedules', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'lesson-schedules'] }),
  })
}

/* ─── Update student package ─────────────────────────────── */
export function useUpdateStudentPackage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<StudentPackage> & { id: number }) =>
      api<StudentPackage>(`/student-packages/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'student-packages'] }),
  })
}

/* ─── Confirm student package ────────────────────────────── */
export function useConfirmStudentPackage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api<StudentPackage>(`/student-packages/${id}/confirm`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'student-packages'] }),
  })
}

/* ─── Lesson subject mutations ───────────────────────────── */
export function useCreateLessonSubject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; fields?: LessonSubject['fields']; sort_order?: number }) =>
      api<LessonSubject>('/lesson-subjects', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'lesson-subjects'] }),
  })
}

export function useUpdateLessonSubject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<LessonSubject> & { id: number }) =>
      api<LessonSubject>(`/lesson-subjects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'lesson-subjects'] }),
  })
}

export function useDeleteLessonSubject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api(`/lesson-subjects/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'lesson-subjects'] }),
  })
}

/* ─── Lesson evaluation mutations ────────────────────────── */
export function useCreateLessonEvaluation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { label: string; sort_order?: number }) =>
      api<LessonEvaluation>('/lesson-evaluations', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'lesson-evaluations'] }),
  })
}

export function useUpdateLessonEvaluation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<LessonEvaluation> & { id: number }) =>
      api<LessonEvaluation>(`/lesson-evaluations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'lesson-evaluations'] }),
  })
}

export function useDeleteLessonEvaluation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api(`/lesson-evaluations/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'lesson-evaluations'] }),
  })
}
