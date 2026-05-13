'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/system/api'
import type { Invoice } from '@/types/system/invoice'

export function useInvoice(id: number | string) {
  return useQuery({
    queryKey: ['system', 'invoices', id],
    queryFn: () =>
      api<{ data: Invoice }>(`/invoices/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

export function useVoidInvoice(id: number | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reason: string) =>
      api<{ data: Invoice }>(`/invoices/${id}/void`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system', 'invoices', id] })
      qc.invalidateQueries({ queryKey: ['system', 'invoices'] })
    },
  })
}

export function useSendInvoice(id: number | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      api<{ data: Invoice }>(`/invoices/${id}/send`, { method: 'POST' }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system', 'invoices', id] })
    },
  })
}
