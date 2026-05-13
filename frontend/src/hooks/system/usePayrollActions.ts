'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/system/api'
import type { Payroll } from '@/types/system/payroll'

export function useApprovePayroll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number | string) =>
      api<{ data: Payroll }>(`/payrolls/${id}/approve`, { method: 'POST' }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system', 'payrolls'] })
    },
  })
}

export function useRejectPayroll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: number | string; reason: string }) =>
      api<{ data: Payroll }>(`/payrolls/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system', 'payrolls'] })
    },
  })
}

export function useMarkTransferred() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, transfer_reference }: { id: number | string; transfer_reference: string }) =>
      api<{ data: Payroll }>(`/payrolls/${id}/transfer`, {
        method: 'POST',
        body: JSON.stringify({ transfer_reference }),
      }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system', 'payrolls'] })
    },
  })
}

export function useBulkApprove() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: (number | string)[]) =>
      api<{ message: string }>('/payrolls/bulk-approve', {
        method: 'POST',
        body: JSON.stringify({ ids }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system', 'payrolls'] })
    },
  })
}

export function useBulkTransfer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: (number | string)[]) =>
      api<{ message: string }>('/payrolls/bulk-transfer', {
        method: 'POST',
        body: JSON.stringify({ ids }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system', 'payrolls'] })
    },
  })
}

export function useRecalculate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (period?: { year: number; month: number }) =>
      api<{ message: string }>('/payrolls/recalculate', {
        method: 'POST',
        body: period ? JSON.stringify(period) : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system', 'payrolls'] })
    },
  })
}
