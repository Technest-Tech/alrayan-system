'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/system/api'
import type { Payment } from '@/types/system/invoice'

export interface RecordPaymentData {
  amount_minor: number
  currency: string
  method: string
  reference?: string
  paid_at?: string
}

export function useRecordPayment(invoiceId: number | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: RecordPaymentData) =>
      api<{ data: Payment }>(`/invoices/${invoiceId}/payments`, {
        method: 'POST',
        body: JSON.stringify(data),
      }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system', 'invoices', String(invoiceId)] })
      qc.invalidateQueries({ queryKey: ['system', 'invoices'] })
    },
  })
}
