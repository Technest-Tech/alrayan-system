'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/system/api'
import type { Invoice } from '@/types/system/invoice'

export interface CreateInvoiceData {
  student_id: number
  type: 'advance' | 'reactivation' | 'manual'
  effective_from?: string
  due_at?: string
  lines?: Array<{
    description: string
    kind: string
    quantity: number
    unit_price_minor: number
    line_total_minor: number
  }>
}

export function useCreateInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateInvoiceData) =>
      api<{ data: Invoice }>('/invoices', {
        method: 'POST',
        body: JSON.stringify(data),
      }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system', 'invoices'] })
    },
  })
}
