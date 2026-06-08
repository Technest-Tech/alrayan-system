'use client'
import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/system/api'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import type { XPaySettings } from '@/types/system/xpay'

interface XPayFormState {
  api_key: string
  community_id: string
  variable_amount_id: string
  redirect_url: string
}

export default function XPaySettingsPage() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['system', 'integrations', 'xpay'],
    queryFn: () => api<XPaySettings>('/integrations/xpay'),
  })

  const { mutateAsync: save, isPending: saving } = useMutation({
    mutationFn: (data: Partial<XPayFormState>) =>
      api<XPaySettings>('/integrations/xpay', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  })

  const { mutateAsync: testConnection, isPending: testing } = useMutation({
    mutationFn: () => api<{ ok: boolean; message: string }>('/integrations/xpay/test', { method: 'POST' }),
  })

  const [form, setForm] = useState<XPayFormState>({
    api_key: '',
    community_id: '',
    variable_amount_id: '',
    redirect_url: '',
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  useEffect(() => {
    if (settings) {
      setForm(f => ({
        ...f,
        community_id:       settings.community_id ?? '',
        variable_amount_id: settings.variable_amount_id ?? '',
        redirect_url:       settings.redirect_url ?? '',
      }))
    }
  }, [settings])

  const handleSave = async () => {
    setMessage(null)
    try {
      const payload: Partial<XPayFormState> = {
        community_id:       form.community_id,
        variable_amount_id: form.variable_amount_id,
        redirect_url:       form.redirect_url || undefined,
      }
      if (form.api_key) payload.api_key = form.api_key
      await save(payload)
      setMessage({ type: 'success', text: 'XPay settings saved.' })
      setForm(f => ({ ...f, api_key: '' }))
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save.' })
    }
  }

  const handleTest = async () => {
    setTestResult(null)
    try {
      const result = await testConnection()
      setTestResult(result)
    } catch {
      setTestResult({ ok: false, message: 'Connection test failed.' })
    }
  }

  if (isLoading) {
    return <div className="py-20 text-center text-sm opacity-40">Loading…</div>
  }

  return (
    <>
      <PageHeader
        title="XPay"
        description="Online card payment gateway. Students pay from their invoice link — no HMAC secret required."
      />
      <div className="max-w-lg space-y-6">
        {message && (
          <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {message.text}
          </p>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API key
            <span className="ml-1 text-xs font-normal text-gray-400">(leave blank to keep current)</span>
          </label>
          <input
            type="password"
            value={form.api_key}
            onChange={e => setForm(f => ({ ...f, api_key: e.target.value }))}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
            placeholder="Paste new API key to update"
            autoComplete="off"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Community ID</label>
          <input
            value={form.community_id}
            onChange={e => setForm(f => ({ ...f, community_id: e.target.value }))}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
            placeholder="e.g. 52XDO2m"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Variable Amount ID</label>
          <input
            value={form.variable_amount_id}
            onChange={e => setForm(f => ({ ...f, variable_amount_id: e.target.value }))}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
            placeholder="e.g. 2674"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Redirect URL
            <span className="ml-1 text-xs font-normal text-gray-400">(optional override)</span>
          </label>
          <input
            value={form.redirect_url}
            onChange={e => setForm(f => ({ ...f, redirect_url: e.target.value }))}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
            placeholder="https://alrayan-academy.com/xpay-return"
          />
          <p className="mt-1 text-xs text-gray-400">
            Configure this same URL in your XPay dashboard under the API Payment template.
          </p>
        </div>

        {settings?.webhook_url && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-gray-50 rounded-xl px-3 py-2 text-gray-700 break-all border border-gray-200">
                {settings.webhook_url}
              </code>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(settings.webhook_url)}
                className="text-xs text-blue-600 hover:underline shrink-0"
              >
                Copy
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Configure this URL in your XPay dashboard under the API Payment template → Callback URL.
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
            {saving ? 'Saving…' : 'Save settings'}
          </button>
          <button
            type="button"
            onClick={handleTest}
            disabled={testing}
            className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {testing ? 'Testing…' : 'Test connection'}
          </button>
        </div>
      </div>
    </>
  )
}
