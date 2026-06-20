'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/system/api'

export interface StudentPackageRow {
  id: number
  package_number: number
  package_hours: number
  consumed_hours: number
  status: 'pending' | 'paid'
  lessons_count?: number
  currency?: string
  tariff_at_time?: number
}

export function useStudentPackages(studentId: number | null) {
  return useQuery({
    queryKey: ['system', 'student-packages', studentId],
    queryFn: () => api<{ data: StudentPackageRow[] }>(`/student-packages?student_id=${studentId}`).then((r) => r.data),
    enabled: !!studentId,
  })
}
