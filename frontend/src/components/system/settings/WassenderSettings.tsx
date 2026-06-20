'use client'
import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/system/api'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useI18n } from '@/lib/system/i18n'

interface WassenderConfig {
  api_key: string
  instance_id: string
  enabled: boolean
}

export function WassenderSettings() {
  const { t } = useI18n()
  const { data, isLoading } = useQuery({
    queryKey: ['system', 'wassender-config'],
    queryFn: () => api<{ data: WassenderConfig }>('/wassender/integration').then(r => r.data),
  })

  const [form, setForm] = useState<WassenderConfig>({ api_key: '', instance_id: '', enabled: false })
  const [testResult, setTestResult] = useState<'ok' | 'fail' | null>(null)

  useEffect(() => { if (data) setForm(data) }, [data])

  const update = useMutation({
    mutationFn: (payload: WassenderConfig) =>
      api<{ message: string }>('/wassender/integration', { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: () => toast.success(t('settings.integrations.wassender.savedToast')),
    onError: () => toast.error(t('settings.integrations.wassender.saveErrorToast')),
  })

  const test = useMutation({
    mutationFn: () => api<{ ok: boolean; message: string }>('/wassender/integration/test', { method: 'POST' }),
    onSuccess: res => {
      setTestResult(res.ok ? 'ok' : 'fail')
      toast[res.ok ? 'success' : 'error'](res.message)
    },
    onError: () => {
      setTestResult('fail')
      toast.error(t('settings.integrations.wassender.testFailedToast'))
    },
  })

  if (isLoading) return <p className="text-sm text-muted-foreground p-4">{t('common.loading')}</p>

  return (
    <div className="max-w-lg space-y-5">
      <div className="space-y-1">
        <Label>{t('settings.integrations.apiKey')}</Label>
        <Input
          type="password"
          placeholder={form.api_key === '***' ? t('settings.integrations.savedHidden') : ''}
          value={form.api_key === '***' ? '' : form.api_key}
          onChange={e => setForm(p => ({ ...p, api_key: e.target.value }))}
          autoComplete="off"
        />
        {form.api_key === '***' && (
          <p className="text-xs text-muted-foreground">{t('settings.integrations.wassender.keepExistingKey')}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label>{t('settings.integrations.wassender.instanceId')}</Label>
        <Input
          value={form.instance_id}
          onChange={e => setForm(p => ({ ...p, instance_id: e.target.value }))}
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="wassender-enabled"
          checked={form.enabled}
          onChange={e => setForm(p => ({ ...p, enabled: e.target.checked }))}
          className="h-4 w-4"
        />
        <label htmlFor="wassender-enabled" className="text-sm cursor-pointer">
          {t('settings.integrations.wassender.enableLabel')}
        </label>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button
          onClick={() => update.mutate(form)}
          disabled={update.isPending}
        >
          {update.isPending ? t('common.saving') : t('common.save')}
        </Button>
        <Button
          variant="outline"
          onClick={() => { setTestResult(null); test.mutate() }}
          disabled={test.isPending}
        >
          {test.isPending ? t('settings.integrations.testing') : t('settings.integrations.testConnection')}
        </Button>
        {testResult === 'ok' && <Badge className="bg-green-600 text-white">{t('settings.integrations.connected')}</Badge>}
        {testResult === 'fail' && <Badge variant="destructive">{t('settings.integrations.failed')}</Badge>}
      </div>
    </div>
  )
}
