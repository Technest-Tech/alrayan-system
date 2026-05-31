import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/system/api'
import type { PaymentRow, PaymentStats, PackageRow } from '@/types/system/payment'

interface PaymentsParams {
  search?:         string
  payment_status?: string
  teacher_id?:     string
  sort_by?:        string
  per_page?:       number
  page?:           number
}

function buildQS(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== null) qs.set(k, String(v))
  })
  const s = qs.toString()
  return s ? `?${s}` : ''
}

export function usePayments(params: PaymentsParams = {}) {
  return useQuery<Paginated<PaymentRow>>({
    queryKey: ['payments', params],
    queryFn:  () => api<Paginated<PaymentRow>>(`/payments${buildQS(params as any)}`),
  })
}

export function usePaymentStats() {
  return useQuery<PaymentStats>({
    queryKey: ['payment-stats'],
    queryFn:  () => api<PaymentStats>('/payments/stats'),
    staleTime: 30_000,
  })
}

export function useStudentPackagesList(studentId: number | null) {
  return useQuery<PackageRow[]>({
    queryKey: ['student-packages', studentId],
    queryFn:  () =>
      api<{ data: PackageRow[] }>(`/student-packages?student_id=${studentId}`)
        .then(r => r.data),
    enabled: !!studentId,
  })
}

export function useUpdatePackage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<PackageRow> & { id: number }) =>
      api<PackageRow>(`/student-packages/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student-packages'] })
      qc.invalidateQueries({ queryKey: ['payments'] })
      qc.invalidateQueries({ queryKey: ['payment-stats'] })
    },
  })
}

export function useConfirmPackage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api<PackageRow>(`/student-packages/${id}/confirm`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student-packages'] })
      qc.invalidateQueries({ queryKey: ['payments'] })
      qc.invalidateQueries({ queryKey: ['payment-stats'] })
    },
  })
}

export function useDeletePackage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api(`/student-packages/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student-packages'] })
      qc.invalidateQueries({ queryKey: ['payments'] })
      qc.invalidateQueries({ queryKey: ['payment-stats'] })
    },
  })
}
