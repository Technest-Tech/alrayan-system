'use client'
import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useFxRates, useUpdateFxRates } from '@/hooks/system/useFxRates'
import { useI18n } from '@/lib/system/i18n'

export default function FxRatesPage() {
  const { t } = useI18n()
  const { data: rates, isLoading } = useFxRates()
  const { mutateAsync, isPending } = useUpdateFxRates()
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (rates) {
      const init: Record<string, string> = {}
      rates.forEach(r => { init[r.pair] = r.rate != null ? String(r.rate) : '' })
      setEdits(init)
    }
  }, [rates])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const payload = Object.entries(edits)
      .filter(([, v]) => v !== '')
      .map(([pair, v]) => ({ pair, rate: Number(v) }))
    await mutateAsync(payload)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <>
      <PageHeader title={t('settings.fxRates.title')} description={t('settings.fxRates.subtitle')} />

      <form onSubmit={save} className="mt-6 max-w-md space-y-3">
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgb(var(--border-default))' }}>
          <table className="w-full text-sm">
            <thead style={{ background: 'rgb(var(--surface-card-2))' }}>
              <tr>
                <th className="px-4 py-3 text-left font-medium">{t('settings.fxRates.pair')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('settings.fxRates.rate')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('settings.fxRates.updated')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} style={{ borderTop: '1px solid rgb(var(--border-default))' }}>
                  {[1, 2, 3].map(j => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded" style={{ background: 'rgb(var(--surface-card-2))' }} />
                    </td>
                  ))}
                </tr>
              ))}
              {rates?.map(r => (
                <tr key={r.pair} style={{ borderTop: '1px solid rgb(var(--border-default))' }}>
                  <td className="px-4 py-3 font-mono text-xs">{r.pair}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0.000001"
                      step="any"
                      value={edits[r.pair] ?? ''}
                      onChange={e => setEdits(prev => ({ ...prev, [r.pair]: e.target.value }))}
                      className="w-32 rounded-lg border px-2 py-1 text-sm"
                      style={{ borderColor: 'rgb(var(--border-default))' }}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs opacity-50">
                    {r.is_stale
                      ? <span className="text-amber-600 font-medium">{t('settings.fxRates.stale')}</span>
                      : r.updated_at
                        ? new Date(r.updated_at).toLocaleDateString()
                        : '—'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button type="submit" disabled={isPending || isLoading}
            className="px-5 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-40"
            style={{ background: 'rgb(var(--accent))' }}>
            {isPending ? t('common.saving') : t('settings.fxRates.saveRates')}
          </button>
          {saved && <span className="text-sm text-green-600">{t('settings.fxRates.saved')}</span>}
        </div>
      </form>
    </>
  )
}
