export interface QualityReview {
  id: number
  teacher_id: number
  period_year: number
  period_month: number
  source: 'manual' | 'auto'
  attendance_score: number
  reports_score: number
  retention_score: number
  punctuality_score: number
  overall_score: number
  inputs: Record<string, number> | null
  notes: string | null
  bonus_recommendation_minor: number
  reviewer?: { id: number; name: string } | null
  created_at: string
}

export interface QualityLeaderboardEntry {
  id: number
  name?: string
  user: { id: number; name: string }
  latest_review: QualityReview | null
  trend: number[]
}
