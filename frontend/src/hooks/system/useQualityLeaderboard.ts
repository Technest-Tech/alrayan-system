'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/system/api'
import type { QualityLeaderboardEntry } from '@/types/system/quality'

export function useQualityLeaderboard() {
  return useQuery({
    queryKey: ['system', 'quality', 'leaderboard'],
    queryFn: () =>
      api<{ data: QualityLeaderboardEntry[] }>('/quality').then(r => r.data),
  })
}
