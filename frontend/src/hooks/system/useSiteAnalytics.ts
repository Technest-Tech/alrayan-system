'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/system/api'
import type { SiteAnalytics } from '@/types/system/siteAnalytics'

/**
 * Traffic figures for the public site over a date window.
 *
 * Both dates are `YYYY-MM-DD`. Omitting them asks the server for its default
 * window (the last 30 days).
 */
export function useSiteAnalytics(from?: string, to?: string) {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const query = params.toString()

  return useQuery({
    queryKey: ['system', 'site', 'analytics', from ?? null, to ?? null],
    queryFn: () =>
      api<{ data: SiteAnalytics }>(`/site/analytics${query ? `?${query}` : ''}`).then((r) => r.data),
    // Traffic only moves as fast as people browse; don't refetch on every focus.
    staleTime: 60_000,
  })
}
