'use client'
import Link from 'next/link'
import type { DashboardAlert } from '@/hooks/system/useDashboard'
import { AlertTriangle } from 'lucide-react'
import { useI18n } from '@/lib/system/i18n'

interface AlertsPanelProps {
  alerts:  DashboardAlert[]
  loading: boolean
}

export function AlertsPanel({ alerts, loading }: AlertsPanelProps) {
  const { t } = useI18n()

  const alertLabel = (kind: string) => {
    const key = {
      'invoice.overdue':     'dashboard.alertInvoiceOverdue',
      'report.missing':      'dashboard.alertReportMissing',
      'student.no_whatsapp': 'dashboard.alertNoWhatsapp',
    }[kind]
    return key ? t(key) : kind
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgb(var(--surface-card, 255 255 255))', border: '1px solid rgb(var(--border-default, 229 233 240))' }}
    >
      <div
        className="flex items-center justify-between px-5 py-3 border-b"
        style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}
      >
        <span className="font-semibold text-sm">
          {t('dashboard.alerts')} {alerts.length > 0 && <span className="ml-1 opacity-60">({alerts.length})</span>}
        </span>
        {alerts.length > 0 && (
          <span className="text-xs opacity-50">{t('dashboard.viewAll')}</span>
        )}
      </div>

      {loading ? (
        <div className="p-5 space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-6 rounded-lg bg-black/5 animate-pulse" />)}
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 opacity-40 gap-2">
          <AlertTriangle size={20} />
          <p className="text-xs">{t('dashboard.noAlerts')}</p>
        </div>
      ) : (
        <ul className="divide-y" style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}>
          {alerts.map((a) => (
            <li key={a.kind}>
              <Link
                href={a.href}
                className="flex items-center justify-between px-5 py-3 hover:bg-black/5 transition-colors text-sm"
              >
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                  {alertLabel(a.kind)}
                </span>
                <span className="font-semibold tabular-nums text-orange-500">{a.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
