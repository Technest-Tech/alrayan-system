'use client'
import { useState } from 'react'
import { RefreshCw, Coins } from 'lucide-react'
import { useFxRates } from '@/hooks/system/useAnalytics'
import { useI18n } from '@/lib/system/i18n'

function sourceLabel(source: string, t: (k: string) => string): string {
  if (source === 'live') return t('analytics.fxLive')
  if (source === 'manual') return t('analytics.fxManual')
  if (source === 'mixed') return t('analytics.fxMixed')
  return t('analytics.fxUnavailable')
}

export function FxRatesStrip() {
  const { t, locale } = useI18n()
  const { data, isLoading, refresh } = useFxRates()
  const [refreshing, setRefreshing] = useState(false)

  async function onRefresh() {
    setRefreshing(true)
    try { await refresh() } finally { setRefreshing(false) }
  }

  const asOf = data?.fetched_at
    ? new Date(data.fetched_at).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : null
  const rates = (data?.rates ?? []).filter(r => r.to_egp != null)

  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgb(var(--surface-card))', border: '1px solid rgb(var(--border-default))' }}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <span style={{ color: '#C9A24B' }}><Coins size={16} /></span>
          <h3 className="text-sm font-semibold truncate">{t('analytics.exchangeRates')}</h3>
          {data && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
              style={data.source === 'live'
                ? { background: 'rgb(var(--status-success)/0.12)', color: 'rgb(var(--status-success))' }
                : { background: 'rgb(var(--surface-card-2))', color: 'rgb(var(--status-neutral))' }}
            >
              {data.source === 'live' && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'rgb(var(--status-success))' }} />}
              {sourceLabel(data.source, t)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {asOf && <span className="text-[11px] opacity-50 hidden sm:inline">{t('analytics.fxAsOf', { time: asOf })}</span>}
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-black/5 disabled:opacity-50"
            style={{ border: '1px solid rgb(var(--border-default))' }}
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            {t('analytics.fxRefresh')}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex gap-3 overflow-hidden">
          {[0, 1, 2, 3, 4].map(i => <div key={i} className="h-16 flex-1 rounded-xl animate-pulse" style={{ background: 'rgb(var(--surface-card-2))' }} />)}
        </div>
      ) : rates.length === 0 ? (
        <p className="text-sm opacity-40 py-2">{t('analytics.fxUnavailable')}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {rates.map(r => (
            <div key={r.currency} className="rounded-xl px-3 py-2.5" style={{ background: 'rgb(var(--surface-card-2))', border: '1px solid rgb(var(--border-default))' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold opacity-70">1 {r.currency}</span>
                {r.source === 'manual' && <span className="text-[9px] uppercase tracking-wide opacity-40">{t('analytics.fxManual')}</span>}
              </div>
              <div className="mt-0.5 tabular-nums">
                <span className="text-lg font-bold">{r.to_egp!.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="text-xs opacity-50 ml-1">EGP</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
