'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/system/api'

/** Money is reported per currency and never summed across them. */
export type MoneyByCurrency = Record<string, number>

export interface DashboardKpis {
  // People
  total_users:           number
  total_students:        number
  total_teachers:        number
  active_teachers:       number
  active_students:       number
  active_students_delta: number
  trial_students:        number
  paused_students:       number
  suspended_students:    number
  // Teaching activity
  lessons_today:         number
  lessons_month:         number
  hours_today:           number
  hours_month:           number
  hours_last_month:      number
  hours_total:           number
  // Money
  month_revenue:         MoneyByCurrency
  last_month_revenue:    MoneyByCurrency
  outstanding:           MoneyByCurrency
  conversion_rate:       number
}

export interface DashboardAlert {
  kind:  string
  count: number
  href:  string
}

export interface DashboardActivity {
  text: string
  at:   string
}

export interface HoursPoint   { month: string; label: string; hours: number; lessons: number }
export interface RevenuePoint { month: string; label: string; amount: number; currency: string }
export interface StudentPoint { month: string; label: string; active: number; new: number; cancelled: number }
export interface StatusSlice  { status: string; count: number }

export interface DashboardCharts {
  hours_12m:          HoursPoint[]
  student_growth_12m: StudentPoint[]
  revenue_12m:        RevenuePoint[]
  lesson_status_30d:  StatusSlice[]
}

export interface DashboardData {
  base_currency:   string
  kpis:            DashboardKpis
  alerts:          DashboardAlert[]
  recent_activity: DashboardActivity[]
  charts:          DashboardCharts
}

export function useDashboard() {
  return useQuery({
    queryKey: ['system-dashboard'],
    queryFn: () => api<DashboardData>('/dashboard'),
    staleTime: 30_000,
  })
}
