'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/system/api'

export interface BillingPreview {
  outstanding: Array<{ number: string; amount_minor: number }>
  pro_rata: {
    amount_minor: number
    days_in_month: number
    remaining_days: number
    monthly_minor: number
  }
  total_minor: number
  currency: string
}

export function useStudentBillingState(studentId: number | string) {
  return useQuery({
    queryKey: ['system', 'students', studentId, 'billing-state'],
    queryFn: () => api<BillingPreview>(`/students/${studentId}/billing-state`),
    enabled: !!studentId,
  })
}
