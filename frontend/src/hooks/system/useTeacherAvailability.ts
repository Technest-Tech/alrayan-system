'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/system/api'
import type { TeacherAvailabilitySlot } from '@/types/system/teacher'

interface AvailabilityPayload {
  availability: { day_of_week: number; start_time: string; end_time: string }[]
  timezone: string
}

export function useUpdateAvailability(teacherId: number | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: AvailabilityPayload) =>
      api<{ data: TeacherAvailabilitySlot[] }>(`/teachers/${teacherId}/availability`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'teachers', teacherId] }),
  })
}
