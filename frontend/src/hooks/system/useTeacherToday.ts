'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/system/api'
import type { Session } from '@/types/system/session'
import { useAuth } from '@/lib/system/auth'

export function useTeacherToday() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['system', 'sessions', 'teacher-today', user?.teacher_id],
    queryFn:  () => {
      const today = new Date().toISOString().split('T')[0]
      return api.get<{ data: Session[] }>(
        `/sessions?teacher_id=${user?.teacher_id}&from=${today}T00:00:00Z&to=${today}T23:59:59Z`
      )
    },
    enabled: !!user?.teacher_id,
  })
}
