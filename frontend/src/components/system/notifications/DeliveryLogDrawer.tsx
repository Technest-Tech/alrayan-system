'use client'
import type { WassenderLog } from '@/types/system/wassenderLog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRetryWassenderLog } from '@/hooks/system/useWassenderLogs'
import { toast } from 'sonner'
import { format } from 'date-fns'

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  queued: 'secondary',
  sending: 'secondary',
  sent: 'default',
  failed: 'destructive',
  dead: 'destructive',
}

interface Props {
  log: WassenderLog | null
  onClose: () => void
}

export function DeliveryLogDrawer({ log, onClose }: Props) {
  const retry = useRetryWassenderLog(log?.id ?? 0)

  const handleRetry = async () => {
    await retry.mutateAsync()
    toast.success('Message re-queued.')
    onClose()
  }

  return (
    <Sheet open={!!log} onOpenChange={onClose}>
      <SheetContent className="w-[480px] overflow-y-auto">
        {log && (
          <>
            <SheetHeader>
              <SheetTitle>Delivery log #{log.id}</SheetTitle>
            </SheetHeader>

            <div className="mt-6 space-y-4 text-sm">
              <Row label="Status">
                <Badge variant={STATUS_VARIANT[log.status] ?? 'secondary'}>{log.status}</Badge>
              </Row>
              <Row label="Template">{log.template_key ?? '—'}</Row>
              <Row label="Recipient">
                {log.whatsapp_group
                  ? `Group #${log.whatsapp_group.id} (${log.whatsapp_group.linked_name ?? log.whatsapp_group.type})`
                  : log.recipient_phone ?? '—'}
              </Row>
              <Row label="Attempts">{log.attempt_count}</Row>
              {log.external_message_id && (
                <Row label="External ID">{log.external_message_id}</Row>
              )}
              {log.sent_at && (
                <Row label="Sent at">{format(new Date(log.sent_at), 'PPpp')}</Row>
              )}
              <Row label="Created">{format(new Date(log.created_at), 'PPpp')}</Row>

              {log.error && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Error</p>
                  <pre className="text-xs bg-destructive/10 text-destructive rounded p-3 whitespace-pre-wrap break-all">
                    {log.error}
                  </pre>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground mb-1">Rendered message</p>
                <pre className="text-xs bg-muted rounded p-3 whitespace-pre-wrap break-all font-mono">
                  {log.rendered_message}
                </pre>
              </div>

              {(log.status === 'failed' || log.status === 'dead') && (
                <div className="pt-2">
                  <Button onClick={handleRetry} disabled={retry.isPending} size="sm">
                    {retry.isPending ? 'Re-queuing…' : 'Retry delivery'}
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
