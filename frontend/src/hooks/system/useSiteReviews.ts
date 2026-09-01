'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/system/api'
import type {
  SiteReviewBulkAction,
  SiteReviewFilters,
  SiteReviewRow,
  SiteReviewStats,
} from '@/types/system/siteReview'

const KEY = ['system', 'site', 'reviews']

/** Laravel's paginator shape for the reviews list. */
interface ReviewPage {
  data: SiteReviewRow[]
  current_page: number
  last_page: number
  total: number
}

function toQuery(filters: SiteReviewFilters): string {
  const params = new URLSearchParams()
  if (filters.teacher_id) params.set('teacher_id', String(filters.teacher_id))
  if (filters.status) params.set('status', filters.status)
  if (filters.rating) params.set('rating', String(filters.rating))
  if (filters.search) params.set('search', filters.search)
  if (filters.page && filters.page > 1) params.set('page', String(filters.page))

  const query = params.toString()
  return query ? `?${query}` : ''
}

export function useSiteReviews(filters: SiteReviewFilters) {
  return useQuery({
    queryKey: [...KEY, 'list', filters],
    queryFn: () => api<ReviewPage>(`/site/reviews${toQuery(filters)}`),
    placeholderData: (previous) => previous,
  })
}

export function useSiteReviewStats() {
  return useQuery({
    queryKey: [...KEY, 'stats'],
    queryFn: () => api<{ data: SiteReviewStats }>('/site/reviews/stats').then((r) => r.data),
  })
}

/** Invalidate every reviews view — list, stats, and the per-teacher editor. */
function useRefreshReviews() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: KEY })
    qc.invalidateQueries({ queryKey: ['system', 'site', 'teachers'] })
  }
}

export function useUpdateSiteReview() {
  const refresh = useRefreshReviews()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<SiteReviewRow> & { id: number }) =>
      api<{ data: SiteReviewRow }>(`/site/reviews/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }).then((r) => r.data),
    onSuccess: refresh,
  })
}

export function useDeleteSiteReview() {
  const refresh = useRefreshReviews()
  return useMutation({
    mutationFn: (id: number) => api<null>(`/site/reviews/${id}`, { method: 'DELETE' }),
    onSuccess: refresh,
  })
}

export function useBulkSiteReviews() {
  const refresh = useRefreshReviews()
  return useMutation({
    mutationFn: ({ action, ids }: { action: SiteReviewBulkAction; ids: number[] }) =>
      api<{ data: { affected: number } }>('/site/reviews/bulk', {
        method: 'POST',
        body: JSON.stringify({ action, ids }),
      }).then((r) => r.data),
    onSuccess: refresh,
  })
}
