'use client'
import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { usePricingSettings, useUpdatePricingSettings } from '@/hooks/system/usePricingSettings'
import { useI18n } from '@/lib/system/i18n'

interface BillingFormState {
  invoice_prefix: string
  invoice_due_days: number
  invoice_suspend_after_months: number
  invoice_send_on_create: boolean
}

export default function BillingSettingsPage() {
  const { t } = useI18n()
  const { data: settings, isLoading } = usePricingSettings()
  const { mutateAsync, isPending } = useUpdatePricingSettings()

  const [form, setForm] = useState<BillingFormState>({
    invoice_prefix: 'INV',
    invoice_due_days: 3,
    invoice_suspend_after_months: 2,
    invoice_send_on_create: true,
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (settings) {
      setForm({
        invoice_prefix: settings.invoice_prefix ?? 'INV',
        invoice_due_days: settings.invoice_due_days ?? 3,
        invoice_suspend_after_months: settings.invoice_suspend_after_months ?? 2,
        invoice_send_on_create: settings.invoice_send_on_create ?? true,
      })
    }
  }, [settings])

  const save = async () => {
    setMessage(null)
    try {
      await mutateAsync(form)
      setMessage({ type: 'success', text: t('settings.billing.saved') })
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : t('settings.billing.saveFailed') })
    }
  }

  if (isLoading) {
    return <div className="py-20 text-center text-sm opacity-40">{t('common.loading')}</div>
  }

  return (
    <>
      <PageHeader
        title={t('settings.billing.title')}
        description={t('settings.billing.subtitle')}
      />
      <div className="max-w-lg space-y-6">
        {message && (
          <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {message.text}
          </p>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.billing.invoicePrefix')}</label>
          <input
            value={form.invoice_prefix}
            onChange={e => setForm(f => ({ ...f, invoice_prefix: e.target.value }))}
            className="w-32 rounded-xl border border-gray-300 px-3 py-2 text-sm"
            placeholder="INV"
          />
          <p className="mt-1 text-xs text-gray-400">{t('settings.billing.invoicePrefixHint')}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.billing.dueWindow')}</label>
          <input
            type="number"
            min={1}
            value={form.invoice_due_days}
            onChange={e => setForm(f => ({ ...f, invoice_due_days: Number(e.target.value) }))}
            className="w-24 rounded-xl border border-gray-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-gray-400">{t('settings.billing.dueWindowHint')}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('settings.billing.autoSuspend')}
          </label>
          <input
            type="number"
            min={1}
            value={form.invoice_suspend_after_months}
            onChange={e => setForm(f => ({ ...f, invoice_suspend_after_months: Number(e.target.value) }))}
            className="w-24 rounded-xl border border-gray-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-gray-400">
            {t('settings.billing.autoSuspendHint')}
          </p>
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.invoice_send_on_create}
              onChange={e => setForm(f => ({ ...f, invoice_send_on_create: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm text-gray-700">{t('settings.billing.autoSend')}</span>
          </label>
          <p className="mt-1 ml-6 text-xs text-gray-400">
            {t('settings.billing.autoSendHint')}
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={save}
            disabled={isPending}
            className="px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
            style={{ background: 'rgb(14 124 90)' }}
          >
            {isPending ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </>
  )
}
