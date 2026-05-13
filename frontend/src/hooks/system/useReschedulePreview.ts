'use client'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/system/api'
import type { ConflictItem } from '@/types/system/session'

export function useReschedulePreview() {
  return useMutation({
    mutationFn: ({ sessionId, scheduledStart }: { sessionId: number; scheduledStart: string }) =>
      api.post<{ proposed_start: string; proposed_end: string; conflicts: ConflictItem[] }>(
        `/sessions/${sessionId}/reschedule/preview`,
        { scheduled_start: scheduledStart }
      ),
  })
}
