import type { SiteTeacherReview } from './siteTeacher'

/** A review as the moderation queue sees it — with the teacher it belongs to. */
export interface SiteReviewRow extends SiteTeacherReview {
  created_at?: string
  teacher?: {
    id: number
    slug: string
    name: string
    image: string | null
  } | null
}

export interface SiteReviewStats {
  total: number
  approved: number
  pending: number
  average_rating: number
  /** Count per star rating, keyed '5' … '1'. */
  by_rating: Record<string, number>
}

export interface SiteReviewFilters {
  teacher_id?: number | null
  status?: 'approved' | 'pending' | null
  rating?: number | null
  search?: string | null
  page?: number
}

export type SiteReviewBulkAction = 'approve' | 'unapprove' | 'delete'
