'use client'
import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/system/api'
import type {
  MovementFilters,
  StatementSummary,
  TreasuryAccount,
  TreasuryMovement,
  TreasuryOverview,
  TreasuryRouting,
} from '@/types/system/treasury'

/**
 * Accounts, expenses and expense items all feed each other's figures: recording an
 * expense moves a balance and ticks off an item. Anything that writes refreshes all three.
 */
export function invalidateMoney(qc: QueryClient): void {
  qc.invalidateQueries({ queryKey: ['system', 'treasury'] })
  qc.invalidateQueries({ queryKey: ['system', 'expenses'] })
  qc.invalidateQueries({ queryKey: ['system', 'expense-items'] })
}

function filterQuery(filters: MovementFilters): string {
  const params = new URLSearchParams()
  for (const key of ['account_id', 'direction', 'kind', 'from', 'to', 'q'] as const) {
    const value = filters[key]
    if (value) params.set(`filter[${key}]`, String(value))
  }
  if (filters.page) params.set('page', String(filters.page))
  if (filters.per_page) params.set('per_page', String(filters.per_page))
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export function useTreasuryAccounts(enabled = true) {
  return useQuery({
    queryKey: ['system', 'treasury', 'accounts'],
    queryFn:  () => api<TreasuryOverview>('/treasury/accounts'),
    enabled,
  })
}

export function useTreasuryAccount(id: number) {
  return useQuery({
    queryKey: ['system', 'treasury', 'account', id],
    queryFn:  () => api<{ data: TreasuryAccount }>(`/treasury/accounts/${id}`).then(r => r.data),
  })
}

export function useAccountStatement(id: number, filters: MovementFilters) {
  return useQuery({
    queryKey: ['system', 'treasury', 'statement', id, filters],
    queryFn:  () => api<Paginated<TreasuryMovement> & { summary: StatementSummary }>(
      `/treasury/accounts/${id}/transactions${filterQuery(filters)}`,
    ),
    placeholderData: keepPreviousData,
  })
}

export function useTreasuryMovements(filters: MovementFilters) {
  return useQuery({
    queryKey: ['system', 'treasury', 'movements', filters],
    queryFn:  () => api<Paginated<TreasuryMovement>>(`/treasury/transactions${filterQuery(filters)}`),
    placeholderData: keepPreviousData,
  })
}

export function useTreasuryRouting(enabled = true) {
  return useQuery({
    queryKey: ['system', 'treasury', 'routing'],
    queryFn:  () => api<TreasuryRouting>('/treasury/auto-posting'),
    enabled,
  })
}

export function useSaveTreasuryRouting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: TreasuryRouting['data'] | Record<string, Record<string, number | null>>) =>
      api<TreasuryRouting>('/treasury/auto-posting', { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'treasury', 'routing'] }),
  })
}

export function useSaveTreasuryAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Record<string, unknown> }) =>
      api<{ data: TreasuryAccount }>(id ? `/treasury/accounts/${id}` : '/treasury/accounts', {
        method: id ? 'PATCH' : 'POST',
        body:   JSON.stringify(data),
      }).then(r => r.data),
    onSuccess: () => invalidateMoney(qc),
  })
}

export function useDeleteTreasuryAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api(`/treasury/accounts/${id}`, { method: 'DELETE' }),
    onSuccess:  () => invalidateMoney(qc),
  })
}

export function useSaveMovement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Record<string, unknown> }) =>
      api<{ data: TreasuryMovement }>(id ? `/treasury/transactions/${id}` : '/treasury/transactions', {
        method: id ? 'PATCH' : 'POST',
        body:   JSON.stringify(data),
      }),
    onSuccess: () => invalidateMoney(qc),
  })
}

export function useDeleteMovement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api(`/treasury/transactions/${id}`, { method: 'DELETE' }),
    onSuccess:  () => invalidateMoney(qc),
  })
}

export function useCreateTransfer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api('/treasury/transfers', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => invalidateMoney(qc),
  })
}
