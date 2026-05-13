'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/system/api'

export interface PricingSettings {
  base_30: number
  base_45: number
  base_60: number
  sibling_default_discount_pct: number
  supported_currencies: string[]
  public_site_currency: string
  public_site_visible: boolean
  invoice_prefix: string
  invoice_due_days: number
  invoice_suspend_after_months: number
  invoice_send_on_create: boolean
}

export function usePricingSettings() {
  return useQuery({
    queryKey: ['system', 'settings', 'pricing'],
    queryFn: () => api<PricingSettings>('/settings/pricing'),
  })
}

export function useUpdatePricingSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<PricingSettings>) =>
      api<PricingSettings>('/settings/pricing', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system', 'settings', 'pricing'] })
    },
  })
}
