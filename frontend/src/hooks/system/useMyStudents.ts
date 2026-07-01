'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/system/api'
import type { Student } from '@/types/system/student'

/**
 * The authenticated teacher's own students (card grid on /teacher/students).
 * Backed by the perm-free, server-scoped `GET /teachers/me/students`.
 */
export function useMyStudents(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['system', 'teachers', 'me', 'students'],
    queryFn: () => api<{ data: Student[] }>('/teachers/me/students').then(r => r.data),
    enabled: options.enabled ?? true,
  })
}
