'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/system/api'
import type { Expense, ExpenseCategory } from '@/types/system/expense'

interface ExpenseFilters {
  category_id?: number | string
  currency?: string
  from?: string
  to?: string
  q?: string
  page?: number
  per_page?: number
}

export function useExpenses(filters: ExpenseFilters = {}) {
  const params = new URLSearchParams()
  if (filters.category_id) params.set('filter[category_id]', String(filters.category_id))
  if (filters.currency) params.set('filter[currency]', filters.currency)
  if (filters.from) params.set('filter[from]', filters.from)
  if (filters.to) params.set('filter[to]', filters.to)
  if (filters.q) params.set('filter[q]', filters.q)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.per_page) params.set('per_page', String(filters.per_page))
  const qs = params.toString()
  return useQuery({
    queryKey: ['system', 'expenses', filters],
    queryFn: () => api<Paginated<Expense>>(`/expenses${qs ? '?' + qs : ''}`),
  })
}

export function useExpenseCategories() {
  return useQuery({
    queryKey: ['system', 'expense-categories'],
    queryFn: () => api<{ data: ExpenseCategory[] }>('/expense-categories').then(r => r.data),
    staleTime: 60_000,
  })
}

export function useCreateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api<{ data: Expense }>('/expenses', { method: 'POST', body: JSON.stringify(data) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'expenses'] }),
  })
}

export function useUpdateExpense(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api<{ data: Expense }>(`/expenses/${id}`, { method: 'PATCH', body: JSON.stringify(data) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'expenses'] }),
  })
}

export function useDeleteExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api(`/expenses/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'expenses'] }),
  })
}

export function useCreateExpenseCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string }) =>
      api<{ data: ExpenseCategory }>('/expense-categories', { method: 'POST', body: JSON.stringify(data) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'expense-categories'] }),
  })
}

export function useDeactivateExpenseCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api<{ data: ExpenseCategory }>(`/expense-categories/${id}/deactivate`, { method: 'POST' }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'expense-categories'] }),
  })
}
