'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/system/api'
import type { Session } from '@/types/system/session'
import { useUser } from '@/lib/system/auth'

export function useTeacherToday() {
  const { data: user } = useUser()

  return useQuery({
    queryKey: ['system', 'sessions', 'teacher-today', user?.teacher_id],
    queryFn:  () => {
      const today = new Date().toISOString().split('T')[0]
      return api<{ data: Session[] }>(
        `/sessions?teacher_id=${user?.teacher_id}&from=${today}T00:00:00Z&to=${today}T23:59:59Z`
      )
    },
    enabled: !!user?.teacher_id,
  })
}
