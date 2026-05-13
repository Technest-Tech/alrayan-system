'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/system/api'
import type { WalletBalance, WalletTransaction } from '@/types/system/wallet'

export function useWalletBalance(studentId: number | string) {
  return useQuery({
    queryKey: ['system', 'students', studentId, 'wallet'],
    queryFn: () => api<WalletBalance>(`/students/${studentId}/wallet`),
    enabled: !!studentId,
  })
}

export function useWalletTransactions(studentId: number | string) {
  return useQuery({
    queryKey: ['system', 'students', studentId, 'wallet', 'transactions'],
    queryFn: () =>
      api<Paginated<WalletTransaction>>(`/students/${studentId}/wallet/transactions`),
    enabled: !!studentId,
  })
}

export function useAdjustWallet(studentId: number | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { amount_minor: number; note?: string }) =>
      api<WalletBalance>(`/students/${studentId}/wallet/adjust`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system', 'students', studentId, 'wallet'] })
    },
  })
}
