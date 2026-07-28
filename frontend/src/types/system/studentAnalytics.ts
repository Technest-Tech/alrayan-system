export interface AnalyticsValue {
  key?: string
  label: string
  value: number
}

export interface StudentAnalyticsMonthPoint {
  month: string
  value?: number
  lessons?: number
  active_students?: number
  negative?: number
  positive?: number
}

export interface StudentAnalyticsRecord {
  id: number
  name: string
  teacher: { id: number; name: string | null } | null
  course: string | null
  phone: string | null
  currency: string
  package_hours: number
  package_price_minor: number
  price_per_hour_minor: number
  teacher_rate: number
  teacher_currency: string | null
  hours_left: number
  remaining_balance_minor: number
  lessons: number
  last_activity: string | null
  status: 'trial' | 'active' | 'paused' | 'suspended' | 'cancelled'
}

export interface StudentAnalyticsResponse {
  generated_at: string
  period: {
    preset: '30d' | '90d' | '12m' | 'all'
    from: string | null
    to: string
  }
  overview: {
    total_students: number
    active_students: number
    inactive_students: number
    archived_students: number
    average_package_hours: number
    average_tariff_by_currency: Array<{ currency: string; minor: number }>
    total_lessons: number
    average_lessons_per_student: number
  }
  stopped: {
    currently_stopped: number
    stopped_period: number
    returned_period: number
    return_rate: number
    average_pause_days: number
    upcoming_returns: number
    overdue_returns: number
    reasons: AnalyticsValue[]
    monthly: StudentAnalyticsMonthPoint[]
  }
  archived: {
    currently_archived: number
    archived_period: number
    reactivated_period: number
    in_grace_window: number
    approaching_archive: number
    at_risk_new: number
    archive_rate: number
    reasons: AnalyticsValue[]
    monthly: StudentAnalyticsMonthPoint[]
  }
  charts: {
    status: AnalyticsValue[]
    currencies: AnalyticsValue[]
    package_sizes: AnalyticsValue[]
    activity: StudentAnalyticsMonthPoint[]
    lessons_per_month: StudentAnalyticsMonthPoint[]
    package_utilization: AnalyticsValue[]
    active_students_per_month: StudentAnalyticsMonthPoint[]
    average_lessons_per_student: StudentAnalyticsMonthPoint[]
  }
  filters: {
    teachers: Array<{ id: number; name: string }>
  }
  records: {
    data: StudentAnalyticsRecord[]
    meta: {
      current_page: number
      from: number | null
      last_page: number
      per_page: number
      to: number | null
      total: number
    }
  }
}

export interface StudentAnalyticsFilters {
  period: '30d' | '90d' | '12m' | 'all'
  q: string
  status: string
  teacher_id: string
  page: number
  per_page: number
  sort: string
  direction: 'asc' | 'desc'
}
