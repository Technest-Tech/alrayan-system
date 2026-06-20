'use client'
import type { WassenderLog } from '@/types/system/wassenderLog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRetryWassenderLog } from '@/hooks/system/useWassenderLogs'
import { toast } from 'sonner'
import { format } from 'date-fns'
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
  log: WassenderLog | null
  onClose: () => void
}

export function DeliveryLogDrawer({ log, onClose }: Props) {
  const { t } = useI18n()
  const retry = useRetryWassenderLog(log?.id ?? 0)

  const handleRetry = async () => {
    await retry.mutateAsync()
    toast.success(t('notifications.deliveryLog.requeued'))
    onClose()
  }

  return (
    <Sheet open={!!log} onOpenChange={onClose}>
      <SheetContent className="w-[480px] overflow-y-auto">
        {log && (
          <>
            <SheetHeader>
              <SheetTitle>{t('notifications.deliveryLog.drawerTitle', { id: String(log.id) })}</SheetTitle>
            </SheetHeader>

            <div className="mt-6 space-y-4 text-sm">
              <Row label={t('common.status')}>
                <Badge variant={STATUS_VARIANT[log.status] ?? 'secondary'}>
                  {STATUS_KEYS[log.status] ? t(STATUS_KEYS[log.status]) : log.status}
                </Badge>
              </Row>
              <Row label={t('notifications.deliveryLog.colTemplate')}>{log.template_key ?? '—'}</Row>
              <Row label={t('notifications.deliveryLog.colRecipient')}>
                {log.whatsapp_group
                  ? `${t('notifications.deliveryLog.group', { id: String(log.whatsapp_group.id) })} (${log.whatsapp_group.linked_name ?? log.whatsapp_group.type})`
                  : log.recipient_phone ?? '—'}
              </Row>
              <Row label={t('notifications.deliveryLog.colAttempts')}>{log.attempt_count}</Row>
              {log.external_message_id && (
                <Row label={t('notifications.deliveryLog.externalId')}>{log.external_message_id}</Row>
              )}
              {log.sent_at && (
                <Row label={t('notifications.deliveryLog.sentAt')}>{format(new Date(log.sent_at), 'PPpp')}</Row>
              )}
              <Row label={t('notifications.deliveryLog.colCreated')}>{format(new Date(log.created_at), 'PPpp')}</Row>

              {log.error && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('notifications.deliveryLog.error')}</p>
                  <pre className="text-xs bg-destructive/10 text-destructive rounded p-3 whitespace-pre-wrap break-all">
                    {log.error}
                  </pre>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground mb-1">{t('notifications.deliveryLog.renderedMessage')}</p>
                <pre className="text-xs bg-muted rounded p-3 whitespace-pre-wrap break-all font-mono">
                  {log.rendered_message}
                </pre>
              </div>

              {(log.status === 'failed' || log.status === 'dead') && (
                <div className="pt-2">
                  <Button onClick={handleRetry} disabled={retry.isPending} size="sm">
                    {retry.isPending ? t('notifications.deliveryLog.requeuing') : t('notifications.deliveryLog.retry')}
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <span>{children}</span>
    </div>
  )
}
