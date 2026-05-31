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
