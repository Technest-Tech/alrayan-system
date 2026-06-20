'use client'
import { useState } from 'react'
import type { WassenderLog } from '@/types/system/wassenderLog'
import { Badge } from '@/components/ui/badge'
import { DeliveryLogDrawer } from './DeliveryLogDrawer'
import { formatDistanceToNow } from 'date-fns'
import { useI18n } from '@/lib/system/i18n'

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  queued: 'secondary',
  sending: 'secondary',
  sent: 'default',
  failed: 'destructive',
  dead: 'destructive',
}

const STATUS_KEYS: Record<string, string> = {
  queued: 'notifications.deliveryLog.status.queued',
  sending: 'notifications.deliveryLog.status.sending',
  sent: 'notifications.deliveryLog.status.sent',
  failed: 'notifications.deliveryLog.status.failed',
  dead: 'notifications.deliveryLog.status.dead',
}

interface Props {
  logs: WassenderLog[]
  isLoading: boolean
  filters: { template_key?: string; status?: string }
  onFiltersChange: (f: { template_key?: string; status?: string }) => void
}

export function DeliveryLogTable({ logs, isLoading, filters, onFiltersChange }: Props) {
  const { t } = useI18n()
  const [selected, setSelected] = useState<WassenderLog | null>(null)

  return (
    <>
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={t('notifications.deliveryLog.templateKeyPlaceholder')}
            className="h-8 text-sm border rounded px-2 w-44"
            value={filters.template_key ?? ''}
            onChange={e => onFiltersChange({ ...filters, template_key: e.target.value || undefined })}
          />
          <select
            className="h-8 text-sm border rounded px-2"
            value={filters.status ?? ''}
            onChange={e => onFiltersChange({ ...filters, status: e.target.value || undefined })}
          >
            <option value="">{t('notifications.deliveryLog.allStatuses')}</option>
            <option value="queued">{t('notifications.deliveryLog.status.queued')}</option>
            <option value="sending">{t('notifications.deliveryLog.status.sending')}</option>
            <option value="sent">{t('notifications.deliveryLog.status.sent')}</option>
            <option value="failed">{t('notifications.deliveryLog.status.failed')}</option>
            <option value="dead">{t('notifications.deliveryLog.status.dead')}</option>
          </select>
        </div>

        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2">{t('notifications.deliveryLog.colId')}</th>
                <th className="text-left px-4 py-2">{t('notifications.deliveryLog.colTemplate')}</th>
                <th className="text-left px-4 py-2">{t('notifications.deliveryLog.colRecipient')}</th>
                <th className="text-left px-4 py-2">{t('common.status')}</th>
                <th className="text-left px-4 py-2">{t('notifications.deliveryLog.colAttempts')}</th>
                <th className="text-left px-4 py-2">{t('notifications.deliveryLog.colCreated')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                    {t('common.loading')}
                  </td>
                </tr>
              )}
              {!isLoading && logs.map(log => (
                <tr
                  key={log.id}
                  className="hover:bg-secondary/30 cursor-pointer"
                  onClick={() => setSelected(log)}
                >
                  <td className="px-4 py-2 text-muted-foreground">#{log.id}</td>
                  <td className="px-4 py-2 font-mono text-xs">{log.template_key ?? '—'}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {log.whatsapp_group
                      ? log.whatsapp_group.linked_name ?? t('notifications.deliveryLog.group', { id: String(log.whatsapp_group.id) })
                      : log.recipient_phone ?? '—'}
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant={STATUS_VARIANT[log.status] ?? 'secondary'}>
                      {STATUS_KEYS[log.status] ? t(STATUS_KEYS[log.status]) : log.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{log.attempt_count}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </td>
                </tr>
              ))}
              {!isLoading && logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                    {t('notifications.deliveryLog.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DeliveryLogDrawer log={selected} onClose={() => setSelected(null)} />
    </>
  )
}
