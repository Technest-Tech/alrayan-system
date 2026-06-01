'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/system/api'

export interface AutoBillingSessionRow {
  id:                   number
  scheduled_start:      string | null
  scheduled_end:        string | null
  duration_min:         number
  status:               string
  cancelled_by:         string | null
  apology_received:     boolean
  quota_impact:         'counted' | 'counted_no_show' | 'free_teacher' | 'free_excused' | 'free'
  counts_against_quota: boolean
  teacher_name:         string | null
  cost_minor:           number
}

export interface AutoBillingRow {
  student_id:              number
  student_name:            string
  whatsapp:                string | null
  currency:                string
  monthly_price_minor:     number
  sessions_per_month:      number
  session_duration_min:    number
  per_session_price_minor: number
  counted_sessions:        number
  free_sessions:           number
  remaining_quota:         number
  total_duration_min:      number
  counted_duration_min:    number
  total_cost_minor:        number
  paid:                    boolean
  invoice_id:              number | null
  invoice_status:          string | null
  course_name:             string | null
  last_session_at:         string | null
  sessions:                AutoBillingSessionRow[]
}

export interface AutoBillingMeta {
  period:           string
  row_count:        number
  total_cost_minor: number
}

export interface AutoBillingFilters {
  period?: string                       // YYYY-MM (defaults to current month server-side)
  search?: string
  status?: 'paid' | 'unpaid'
}

/** Fetch the live automatic-billing table for a period. */
export function useAutoBilling(filters: AutoBillingFilters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, String(v)) })
  return useQuery({
    queryKey: ['system', 'billing', 'automatic', filters],
    queryFn:  () => api<{ data: AutoBillingRow[]; meta: AutoBillingMeta }>(
      `/billing/automatic?${params.toString()}`,
    ),
  })
}

/** Mark a student's current-period bill as paid (creates/updates monthly invoice). */
export function useMarkBillPaid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ studentId, period }: { studentId: number; period: string }) =>
      api<{ message: string; invoice_id: number }>(
        `/billing/automatic/${studentId}/mark-paid`,
        { method: 'POST', body: JSON.stringify({ period }) },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'billing', 'automatic'] }),
  })
}

/** Send the bill summary to the student via Wassender (WhatsApp). */
export function useSendBillWhatsApp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ studentId, period }: { studentId: number; period: string }) =>
      api<{ message: string; recipient: string }>(
        `/billing/automatic/${studentId}/send-whatsapp`,
        { method: 'POST', body: JSON.stringify({ period }) },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'billing', 'automatic'] }),
  })
}
