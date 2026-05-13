'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/system/api'

export interface DashboardKpis {
  active_students:       number
  active_students_delta: number
  trial_students:        number
  trial_students_delta:  number
  paused_students:       number
  suspended_students:    number
  today_sessions:        number
  month_revenue:         Record<string, number>
  outstanding:           Record<string, number>
  conversion_rate:       number
}

export interface DashboardAlert {
  kind:  string
  count: number
  href:  string
}

export interface DashboardActivity {
  icon: string
  text: string
  at:   string
}

export interface RevenuePoint    { month: string; amount: number }
export interface StudentPoint    { month: string; count: number }
export interface ExpenseSlice    { category: string; amount: number }
export interface CancellationBar { reason: string; count: number }

export interface DashboardCharts {
  revenue_12m:           RevenuePoint[]
  student_growth_12m:    StudentPoint[]
  expenses_breakdown_30d: ExpenseSlice[]
  cancellation_reasons:  CancellationBar[]
}

export interface DashboardData {
  kpis:            DashboardKpis
  alerts:          DashboardAlert[]
  recent_activity: DashboardActivity[]
  charts:          DashboardCharts
}

export function useDashboard() {
  return useQuery({
    queryKey: ['system-dashboard'],
    queryFn: () => api<DashboardData>('/dashboard'),
    staleTime: 60_000,
  })
}
