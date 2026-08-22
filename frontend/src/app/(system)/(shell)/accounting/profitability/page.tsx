'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { KpiCard } from '@/components/system/dashboard/KpiCard'
import { MonthPicker } from '@/components/system/payroll/MonthPicker'
import { ProfitabilityTable } from '@/components/system/profitability/ProfitabilityTable'
import { useProfitability, useSaveProfitabilitySettings } from '@/hooks/system/useProfitability'
import { useSystemUser } from '@/components/system/shell/SystemShell'
import { can } from '@/lib/system/permissions'
import { formatMoney } from '@/lib/money'
import { useI18n } from '@/lib/system/i18n'

function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function ProfitabilityPage() {
  const { t } = useI18n()
  const user = useSystemUser()
  const canEditSettings = !!user && can(user, 'settings.edit')

  const [month, setMonth] = useState(currentMonth())
  const [currency, setCurrency] = useState<string | null>(null)

  const { data, isLoading, isFetching, refetch } = useProfitability(month, currency)
  const saveSettings = useSaveProfitabilitySettings()

  const totals = data?.totals
  const ccy    = data?.currency ?? 'EGP'

  async function persist(payload: Parameters<typeof saveSettings.mutateAsync>[0]) {
    try {
      await saveSettings.mutateAsync(payload)
      toast.success(t('profitability.settingsSaved'))
    } catch {
      toast.error(t('profitability.settingsError'))
    }
  }

  /** Changing one percentage rewrites the whole list — it's stored as a single setting. */
  function handlePercentChange(key: string, percent: number) {
    if (!data) return
    persist({ deductions: data.deductions.map(d => (d.key === key ? { ...d, percent } : d)) })
  }

  return (
    <>
      <PageHeader
        title={t('profitability.title')}
        description={t('profitability.description')}
        actions={
          <div className="flex items-center gap-2">
            <MonthPicker value={month} onChange={setMonth} />
            <select
              value={currency ?? ccy}
              onChange={e => setCurrency(e.target.value)}
              title={t('profitability.reportCurrency')}
              className="rounded-lg border px-3 py-1.5 text-sm"
              style={{ borderColor: 'rgb(var(--border-default))', background: 'rgb(var(--surface-card))' }}
            >
              {(data?.currencies ?? [ccy]).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button
              onClick={() => refetch()}
              title={t('profitability.refresh')}
              className="p-2 rounded-lg border hover:bg-black/5"
              style={{ borderColor: 'rgb(var(--border-default))' }}
            >
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label={t('profitability.totalIncome')} value={totals ? formatMoney(totals.income_minor, ccy) : '—'}
          sub={totals ? t('profitability.acrossTeachers', { count: String(totals.teacher_count) }) : undefined} loading={isLoading} />
        <KpiCard label={t('profitability.totalTeacherCost')} value={totals ? formatMoney(totals.cost_minor, ccy) : '—'}
          sub={totals ? `${totals.hours.toFixed(1)}h` : undefined} loading={isLoading} />
        <KpiCard label={t('profitability.grossMargin')} value={totals ? formatMoney(totals.gross_margin_minor, ccy) : '—'}
          sub={totals && totals.income_minor > 0 ? `${Math.round(totals.gross_margin_minor / totals.income_minor * 100)}%` : undefined} loading={isLoading} />
        <KpiCard label={t('profitability.netProfit')} value={totals ? formatMoney(totals.net_profit_minor, ccy) : '—'}
          sub={totals?.partner_share_minor != null
            ? `${formatMoney(totals.partner_share_minor, ccy)} ${t('profitability.perPartner', { count: String(totals.partner_count) })}`
            : undefined}
          loading={isLoading} />
      </div>

      {/* FX disclosure — a P&L has to convert, so say what rate it used. */}
      {data && (
        <p className="mt-3 text-xs opacity-50">
          {t('profitability.fxNote', { currency: ccy, source: t(`profitability.fxSource.${data.fx.source}`) })}
          {data.fx.unconvertible.length > 0 && (
            <span className="text-amber-600"> · {t('profitability.fxMissing', { currencies: data.fx.unconvertible.join(', ') })}</span>
          )}
        </p>
      )}

      <div className="mt-6">
        {isLoading || !data ? (
          <div className="h-96 rounded-2xl animate-pulse" style={{ background: 'rgb(var(--surface-card-2))' }} />
        ) : (
          <ProfitabilityTable
            report={data}
            canEditSettings={canEditSettings}
            onPercentChange={handlePercentChange}
          />
        )}
      </div>

      {canEditSettings && data && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <label className="opacity-60">{t('profitability.partnerCount')}</label>
          <input
            type="number"
            min={0}
            max={20}
            defaultValue={data.partner_count}
            onBlur={e => {
              const n = Number(e.target.value)
              if (Number.isInteger(n) && n >= 0 && n <= 20 && n !== data.partner_count) persist({ partner_count: n })
            }}
            className="w-16 rounded-lg border px-2 py-1 text-right tabular-nums"
            style={{ borderColor: 'rgb(var(--border-default))', background: 'rgb(var(--surface-card))' }}
          />
        </div>
      )}
    </>
  )
}
