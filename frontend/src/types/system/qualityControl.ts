/* Quality Control (checklist teacher evaluations) — mirrors backend `qc.*`. */

export interface QcCategoryItem {
  id: number
  category_id: number
  label: string
  penalty: number
  special_rule_key: string | null
  sort_order: number
  is_active: boolean
}

export interface QcCategory {
  id: number
  name: string
  weight: number
  sort_order: number
  is_active: boolean
  items: QcCategoryItem[]
  items_count?: number
  penalties_sum?: number
}

export interface QcSpecialRule {
  id: number
  rule_key: string
  rule_type: string
  label: string
  cap_value: number
  is_active: boolean
}

export interface QcConfig {
  categories: QcCategory[]
  special_rules: QcSpecialRule[]
}

export interface QcEvaluation {
  id: number
  teacher_id: number | null
  teacher_name: string | null
  student_id: number | null
  student_name: string | null
  quality_manager_id: number | null
  quality_manager_name: string | null
  duration_minutes: number
  score: number
  general_notes: string | null
  evaluated_at: string | null
  created_at: string
  updated_at: string
}

export interface QcEvaluationItem {
  id: number
  category_item_id: number | null
  category_name: string
  item_label: string
  penalty: number
  special_rule_key: string | null
  checked: boolean
}

export interface QcEvaluationDetail extends QcEvaluation {
  items: QcEvaluationItem[]
  checked_item_ids: number[]
}

export interface QcTopTeacher {
  teacher_id: number
  teacher_name: string | null
  evaluations_count: number
  avg_score: number
}

export interface QcSupervisorActivity {
  quality_manager_id: number
  name: string | null
  evaluations_count: number
  avg_score: number
}

export interface QcDashboard {
  kpis: {
    total: number
    this_month: number
    this_week: number
    average_score: number
    teachers_evaluated: number
  }
  top_teachers: {
    this_month: QcTopTeacher[]
    all_time: QcTopTeacher[]
  }
  supervisor_activity: QcSupervisorActivity[]
}

export interface QcAssignment {
  id: number
  quality_manager_id: number
  quality_manager_name: string | null
  teacher_id: number
  teacher_name: string | null
  created_at: string
}

/* ── Scoring (kept in lockstep with backend QcScorer::build) ────────────── */

export type QcRating = 'excellent' | 'good' | 'fair' | 'poor'

export const RATING_BANDS: { min: number; rating: QcRating }[] = [
  { min: 85, rating: 'excellent' },
  { min: 70, rating: 'good' },
  { min: 50, rating: 'fair' },
  { min: 0,  rating: 'poor' },
]

export function ratingFor(score: number): QcRating {
  return RATING_BANDS.find(b => score >= b.min)?.rating ?? 'poor'
}

export function ratingColor(rating: QcRating): string {
  switch (rating) {
    case 'excellent': return '#0E7C5A'
    case 'good':      return '#2563EB'
    case 'fair':      return '#9A7117'
    default:          return '#A6271E'
  }
}

/**
 * Live score preview for the evaluation modal — must match backend QcScorer.
 * Start at 100, subtract each unchecked item's penalty, then apply any active
 * `score_cap` rule whose linked item is unchecked.
 */
export function computeScore(
  categories: QcCategory[],
  rules: QcSpecialRule[],
  checkedIds: Set<number>,
): number {
  let score = 100
  const uncheckedRuleKeys = new Set<string>()

  for (const cat of categories) {
    for (const item of cat.items) {
      if (!checkedIds.has(item.id)) {
        score -= item.penalty
        if (item.special_rule_key) uncheckedRuleKeys.add(item.special_rule_key)
      }
    }
  }

  const activeRules = rules.filter(r => r.is_active)
  for (const key of uncheckedRuleKeys) {
    const rule = activeRules.find(r => r.rule_key === key)
    if (rule && rule.rule_type === 'score_cap') score = Math.min(score, rule.cap_value)
  }

  return Math.max(0, Math.min(100, Math.round(score)))
}
