'use client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useResendWhatsAppLog } from '@/hooks/system/useWhatsAppSendLogs'
import { useI18n } from '@/lib/system/i18n'
import type {
  WhatsAppLogFilters,
  WhatsAppSendLog,
  WhatsAppSendStatus,
} from '@/types/system/whatsappSendLog'

const STATUS_VARIANT: Record<WhatsAppSendStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  QUEUED: 'secondary',
  ACCEPTED: 'default',
  DUPLICATE: 'outline',
  FAILED: 'destructive',
}

const STATUSES: WhatsAppSendStatus[] = ['QUEUED', 'ACCEPTED', 'DUPLICATE', 'FAILED']
const KINDS = ['TEXT', 'IMAGE', 'REPORT'] as const

interface Props {
  logs: WhatsAppSendLog[]
  isLoading: boolean
  filters: WhatsAppLogFilters
  onFiltersChange: (f: WhatsAppLogFilters) => void
  page: number
  lastPage: number
}

export function SendLogTable({ logs, isLoading, filters, onFiltersChange, page, lastPage }: Props) {
  const { t } = useI18n()
  const resend = useResendWhatsAppLog()

  // Any filter change invalidates the current page number.
  const setFilter = (patch: Partial<WhatsAppLogFilters>) =>
    onFiltersChange({ ...filters, ...patch, page: 1 })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          placeholder={t('whatsappLogs.recipientPlaceholder')}
          className="h-8 text-sm border rounded px-2 w-48"
          value={filters.recipient_phone ?? ''}
          onChange={e => setFilter({ recipient_phone: e.target.value || undefined })}
        />
        <select
          className="h-8 text-sm border rounded px-2"
          value={filters.status ?? ''}
          onChange={e => setFilter({ status: (e.target.value || undefined) as WhatsAppSendStatus | undefined })}
        >
          <option value="">{t('whatsappLogs.allStatuses')}</option>
          {STATUSES.map(s => (
            <option key={s} value={s}>{t(`whatsappLogs.status.${s}`)}</option>
          ))}
        </select>
        <select
          className="h-8 text-sm border rounded px-2"
          value={filters.kind ?? ''}
          onChange={e => setFilter({ kind: (e.target.value || undefined) as WhatsAppSendLog['kind'] | undefined })}
        >
          <option value="">{t('whatsappLogs.allKinds')}</option>
          {KINDS.map(k => (
            <option key={k} value={k}>{t(`whatsappLogs.kind.${k}`)}</option>
          ))}
        </select>
        <input
          type="date"
          aria-label={t('whatsappLogs.dateFrom')}
          className="h-8 text-sm border rounded px-2"
          value={filters.date_from ?? ''}
          onChange={e => setFilter({ date_from: e.target.value || undefined })}
        />
        <input
          type="date"
          aria-label={t('whatsappLogs.dateTo')}
          className="h-8 text-sm border rounded px-2"
          value={filters.date_to ?? ''}
          onChange={e => setFilter({ date_to: e.target.value || undefined })}
        />
      </div>

      <div className="border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2">{t('whatsappLogs.colSentAt')}</th>
              <th className="text-left px-4 py-2">{t('whatsappLogs.colRecipient')}</th>
              <th className="text-left px-4 py-2">{t('whatsappLogs.colKind')}</th>
              <th className="text-left px-4 py-2">{t('whatsappLogs.colPreview')}</th>
              <th className="text-left px-4 py-2">{t('common.status')}</th>
              <th className="text-left px-4 py-2">{t('whatsappLogs.colMessageId')}</th>
              <th className="text-left px-4 py-2">{t('whatsappLogs.colError')}</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">
                  {t('common.loading')}
                </td>
              </tr>
            )}

            {!isLoading && logs.map(log => (
              <tr key={log.id} className="hover:bg-secondary/30 align-top">
                <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-2 font-mono text-xs whitespace-nowrap">{log.recipient_phone}</td>
                <td className="px-4 py-2">
                  <Badge variant="outline">{t(`whatsappLogs.kind.${log.kind}`)}</Badge>
                </td>
                <td className="px-4 py-2 max-w-xs truncate text-muted-foreground">
                  {log.caption ?? log.body_preview ?? '—'}
                </td>
                <td className="px-4 py-2">
                  <Badge variant={STATUS_VARIANT[log.status]}>{t(`whatsappLogs.status.${log.status}`)}</Badge>
                </td>
                <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                  {log.provider_message_id ?? '—'}
                </td>
                <td className="px-4 py-2 max-w-xs truncate text-destructive" title={log.error ?? undefined}>
                  {log.error ?? '—'}
                </td>
                <td className="px-4 py-2 text-right">
                  {log.status === 'FAILED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={resend.isPending && resend.variables === log.id}
                      onClick={() => resend.mutate(log.id)}
                    >
                      {t('whatsappLogs.resend')}
                    </Button>
                  )}
                </td>
              </tr>
            ))}

            {!isLoading && logs.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">
                  {t('whatsappLogs.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {lastPage > 1 && (
        <div className="flex items-center justify-end gap-2">
          <span className="text-sm text-muted-foreground">
            {t('whatsappLogs.pageOf', { page: String(page), last: String(lastPage) })}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => onFiltersChange({ ...filters, page: page - 1 })}
          >
            {t('common.prev')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= lastPage}
            onClick={() => onFiltersChange({ ...filters, page: page + 1 })}
          >
            {t('common.next')}
          </Button>
        </div>
      )}
    </div>
  )
}
