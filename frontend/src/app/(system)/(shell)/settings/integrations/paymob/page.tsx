'use client'
import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/system/api'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useI18n } from '@/lib/system/i18n'
import type { PaymobSettings } from '@/types/system/paymob'

interface PaymobFormState {
  api_key: string
  integration_id: string
  public_iframe_id: string
  webhook_hmac_secret: string
}

export default function PaymobSettingsPage() {
  const { t } = useI18n()
  const { data: settings, isLoading } = useQuery({
    queryKey: ['system', 'integrations', 'paymob'],
    queryFn: () => api<PaymobSettings>('/integrations/paymob'),
  })

  const { mutateAsync: save, isPending: saving } = useMutation({
    mutationFn: (data: Partial<PaymobFormState & { integration_id: string; public_iframe_id: string }>) =>
      api<PaymobSettings>('/integrations/paymob', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  })

  const { mutateAsync: testConnection, isPending: testing } = useMutation({
    mutationFn: () => api<{ ok: boolean; message: string }>('/integrations/paymob/test', { method: 'POST' }),
  })

  const [form, setForm] = useState<PaymobFormState>({
    api_key: '',
    integration_id: '',
    public_iframe_id: '',
    webhook_hmac_secret: '',
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  useEffect(() => {
    if (settings) {
      setForm(f => ({
        ...f,
        integration_id: settings.integration_id ?? '',
        public_iframe_id: settings.public_iframe_id ?? '',
      }))
    }
  }, [settings])

  const handleSave = async () => {
    setMessage(null)
    try {
      const payload: Record<string, string> = {
        integration_id: form.integration_id,
        public_iframe_id: form.public_iframe_id,
      }
      if (form.api_key) payload.api_key = form.api_key
      if (form.webhook_hmac_secret) payload.webhook_hmac_secret = form.webhook_hmac_secret

      await save(payload)
      setMessage({ type: 'success', text: t('settings.integrations.paymob.savedMessage') })
      // Clear secret fields after save
      setForm(f => ({ ...f, api_key: '', webhook_hmac_secret: '' }))
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : t('settings.integrations.paymob.saveErrorMessage') })
    }
  }

  const handleTest = async () => {
    setTestResult(null)
    try {
      const result = await testConnection()
      setTestResult(result)
    } catch {
      setTestResult({ ok: false, message: t('settings.integrations.paymob.testFailedMessage') })
    }
  }

  if (isLoading) {
    return <div className="py-20 text-center text-sm opacity-40">{t('common.loading')}</div>
  }

  return (
    <>
      <PageHeader
        title={t('settings.integrations.paymob.title')}
        description={t('settings.integrations.paymob.subtitle')}
      />
      <div className="max-w-lg space-y-6">
        {message && (
          <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {message.text}
          </p>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('settings.integrations.apiKey')}
            <span className="ml-1 text-xs font-normal text-gray-400">{t('settings.integrations.leaveBlankToKeep')}</span>
          </label>
          <input
            type="password"
            value={form.api_key}
            onChange={e => setForm(f => ({ ...f, api_key: e.target.value }))}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
            placeholder={t('settings.integrations.paymob.apiKeyPlaceholder')}
            autoComplete="off"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.integrations.paymob.integrationId')}</label>
          <input
            value={form.integration_id}
            onChange={e => setForm(f => ({ ...f, integration_id: e.target.value }))}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
            placeholder="e.g. 1234567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.integrations.paymob.iframeId')}</label>
          <input
            value={form.public_iframe_id}
            onChange={e => setForm(f => ({ ...f, public_iframe_id: e.target.value }))}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
            placeholder="e.g. 890123"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('settings.integrations.paymob.hmacSecret')}
            <span className="ml-1 text-xs font-normal text-gray-400">{t('settings.integrations.leaveBlankToKeep')}</span>
          </label>
          <input
            type="password"
            value={form.webhook_hmac_secret}
            onChange={e => setForm(f => ({ ...f, webhook_hmac_secret: e.target.value }))}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
            placeholder={t('settings.integrations.paymob.hmacSecretPlaceholder')}
            autoComplete="off"
          />
        </div>

        {settings?.webhook_url && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.integrations.paymob.webhookUrl')}</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-gray-50 rounded-xl px-3 py-2 text-gray-700 break-all border border-gray-200">
                {settings.webhook_url}
              </code>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(settings.webhook_url)}
                className="text-xs text-blue-600 hover:underline shrink-0"
              >
                {t('settings.integrations.copy')}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              {t('settings.integrations.paymob.webhookHint')}
            </p>
          </div>
        )}

        {testResult && (
          <p className={`text-sm ${testResult.ok ? 'text-green-600' : 'text-red-600'}`}>
            {testResult.message}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
            style={{ background: 'rgb(14 124 90)' }}
          >
            {saving ? t('common.saving') : t('settings.integrations.saveSettings')}
          </button>
          <button
            type="button"
            onClick={handleTest}
            disabled={testing}
            className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {testing ? t('settings.integrations.testing') : t('settings.integrations.testConnection')}
          </button>
        </div>
      </div>
    </>
  )
}
