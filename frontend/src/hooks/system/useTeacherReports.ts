'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/system/api'

export type ReportPeriod = 30 | 90 | 180

export interface SessionStats {
  total: number
  attended: number
  absent: number
  cancelled: number
  scheduled: number
  hours_taught: number
  attendance_rate: number | null
}

export interface MonthlySession {
  month: string
  attended: number
  cancelled: number
  absent: number
  scheduled: number
}

export interface LeaveStats {
  days_taken_this_year: number
  pending_requests: number
}

export interface PayrollEntry {
  period: string
  base_salary_minor: number
  net_salary_minor: number
  status: string
}

export interface TeacherReportSummary {
  period_days: number
  sessions: SessionStats
  monthly_sessions: MonthlySession[]
  active_students: number
  leave: LeaveStats
  payrolls: PayrollEntry[]
}

export function useTeacherReportSummary(teacherId: number | string, period: ReportPeriod = 30) {
  return useQuery({
    queryKey: ['system', 'teachers', teacherId, 'report-summary', period],
    queryFn: () => api<TeacherReportSummary>(`/teachers/${teacherId}/report-summary?period=${period}`),
    enabled: !!teacherId,
  })
}

export interface TeacherTodayLesson {
  id: number
  time: string
  student: string | null
  status: string
  duration_min: number
}

export interface TeacherProfileStats {
  month: string
  currency: string
  total_students: number
  active_students: number
  non_active_students: number
  pending_reports: number
  hours_this_month: number
  hours_last_month: number
  revenue_minor: number
  revenue_last_minor: number
  hours_today: number
  hours_prev_week_day: number
  hours_last_7: number
  hours_prev_7: number
  quality_score: number
  quality_reviews_30d: number
  calendar: Record<string, number>
  today: {
    attended: number
    scheduled: number
    lessons: TeacherTodayLesson[]
  }
}

export interface Racer {
  teacher_id: number
  name: string | null
  photo_url: string | null
  hours: number
  rank: number
}

export type RaceRange = 'month' | 'all' | 'custom'

export interface RaceFilter {
  range: RaceRange
  month?: string   // YYYY-MM (range='month')
  from?: string    // YYYY-MM-DD (range='custom')
  to?: string      // YYYY-MM-DD (range='custom')
}

export interface TeacherRaceData {
  range: RaceRange
  month: string | null
  from: string | null
  to: string | null
  leader_hours: number
  racers: Racer[]
}

/** Teacher Race leaderboard — all active teachers ranked by hours in the selected window. */
export function useTeacherRace(filter: RaceFilter) {
  const qs = new URLSearchParams()
  if (filter.range === 'all') qs.set('range', 'all')
  else if (filter.range === 'custom' && filter.from && filter.to) {
    qs.set('range', 'custom')
    qs.set('from', filter.from)
    qs.set('to', filter.to)
  } else if (filter.month) qs.set('month', filter.month)
  const q = qs.toString()
  return useQuery({
    queryKey: ['system', 'teachers', 'race', filter.range, filter.month ?? '', filter.from ?? '', filter.to ?? ''],
    queryFn: () => api<TeacherRaceData>(`/teachers/race${q ? `?${q}` : ''}`),
    enabled: filter.range !== 'custom' || (!!filter.from && !!filter.to),
    placeholderData: (previousData) => previousData,
  })
}

/** Rich teacher-profile dashboard stats. `month` is YYYY-MM (defaults to current month server-side). */
export function useTeacherProfileStats(teacherId: number | string | null | undefined, month?: string) {
  return useQuery({
    queryKey: ['system', 'teachers', teacherId, 'profile-stats', month ?? 'current'],
    queryFn: () =>
      api<TeacherProfileStats>(`/teachers/${teacherId}/profile-stats${month ? `?month=${month}` : ''}`),
    enabled: !!teacherId,
  })
}
