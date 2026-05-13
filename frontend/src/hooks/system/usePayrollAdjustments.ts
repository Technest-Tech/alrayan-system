'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/system/api'
import type { PayrollAdjustment, AdjustmentType, AdjustmentCategory } from '@/types/system/payroll'

interface AddAdjustmentPayload {
  payrollId: number | string
  type: AdjustmentType
  category: AdjustmentCategory
  amount_minor: number
  reason: string
}

interface UpdateAdjustmentPayload {
  id: number | string
  type?: AdjustmentType
  category?: AdjustmentCategory
  amount_minor?: number
  reason?: string
}

export function useAddAdjustment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ payrollId, ...body }: AddAdjustmentPayload) =>
      api<{ data: PayrollAdjustment }>(`/payrolls/${payrollId}/adjustments`, {
        method: 'POST',
        body: JSON.stringify(body),
      }).then(r => r.data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['system', 'payrolls', variables.payrollId] })
      qc.invalidateQueries({ queryKey: ['system', 'payrolls'] })
    },
  })
}

export function useUpdateAdjustment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateAdjustmentPayload) =>
      api<{ data: PayrollAdjustment }>(`/payroll-adjustments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system', 'payrolls'] })
    },
  })
}

export function useDeleteAdjustment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number | string) =>
      api<void>(`/payroll-adjustments/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system', 'payrolls'] })
    },
  })
}
