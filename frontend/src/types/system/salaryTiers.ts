/** The teacher salary ladder: taught hours in a month decide the rate the whole month pays. */

export interface SalaryTier {
  index:      number
  min_hours:  number
  max_hours:  number | null
  rate_minor: number
  currency:   string
}

export interface TeacherOnTier {
  teacher_id:    number
  name:          string
  photo_url:     string | null
  hours:         number
  lessons:       number
  tier_index:    number
  rate_minor:    number
  salary_minor:  number
  hours_to_next: number
  progress_pct:  number
  excluded:      boolean
}

export interface SalaryTierStats extends SalaryTier {
  label:              string
  teacher_count:      number
  total_hours:        number
  total_lessons:      number
  total_salary_minor: number
  share_pct:          number
  teachers:           TeacherOnTier[]
}

export interface SalaryTierKpis {
  teacher_count:      number
  active_teachers:    number
  total_hours:        number
  total_salary_minor: number
  avg_rate_minor:     number
  avg_hours:          number
  top_tier_index:     number | null
}

export interface SalaryTierOverview {
  month:        string
  currency:     string
  tiers:        SalaryTierStats[]
  kpis:         SalaryTierKpis
  teachers:     TeacherOnTier[]
  generated_at: string
}

export interface SalaryTierHistoryPoint {
  month:        string
  label:        string
  hours:        number
  tier_index:   number
  rate_minor:   number
  salary_minor: number
}

/** Where the signed-in teacher stands on the ladder this month. */
export interface MySalaryTier {
  month:                  string
  currency:               string
  hours:                  number
  lessons:                number
  tier:                   SalaryTier
  next_tier:              SalaryTier | null
  hours_to_next:          number
  progress_pct:           number
  rate_minor:             number
  salary_minor:           number
  next_tier_salary_minor: number | null
  ladder:                 SalaryTier[]
  history:                SalaryTierHistoryPoint[]
}
