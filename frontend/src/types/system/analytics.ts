export interface AnalyticsKpis {
  total_income_minor:    number
  total_hours:           number
  avg_hours_per_teacher: number
  avg_rate_minor:        number
  total_lessons:         number
}

export interface TopTeacher {
  teacher_id: number
  name:       string
  hours:      number
}

export interface BestDay {
  weekday: number // 0 = Sunday … 6 = Saturday
  lessons: number
}

export interface HoursByMonthPoint {
  month: string // YYYY-MM
  hours: number
}

export interface TeacherBalance {
  teacher_id:   number
  name:         string
  photo_url:    string | null
  hours:        number
  lessons:      number
  income_minor: number
  rate_minor:   number
  currency:     string
  excluded:     boolean
}

export interface AnalyticsTeacherOption {
  id:   number
  name: string
}

export interface AnalyticsOverview {
  month:    string
  currency: string
  kpis:     AnalyticsKpis
  top_teachers: TopTeacher[]
  best_days:    BestDay[]
  hours_by_month: {
    series:         HoursByMonthPoint[]
    all_time_total: number
  }
  teacher_balances: TeacherBalance[]
  teachers:         AnalyticsTeacherOption[]
  excluded_count:   number
  generated_at:     string
}

export interface TeacherAdjustment {
  id:           number
  category:     string
  amount_minor: number
  reason:       string
}

export interface TeacherMonthBreakdown {
  teacher:       { id: number; name: string }
  month:         string
  currency:      string
  revenue_minor: number
  recompenses:   TeacherAdjustment[]
  deductions:    TeacherAdjustment[]
}
