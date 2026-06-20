'use client'
import type { SysNotification } from '@/types/system/notification'
import { useMarkRead, useMarkAllRead } from '@/hooks/system/useNotifications'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useI18n } from '@/lib/system/i18n'

interface Props {
  notifications: SysNotification[]
  isLoading: boolean
}

export function NotificationList({ notifications, isLoading }: Props) {
  const { t } = useI18n()
  const markRead = useMarkRead()
  const markAllRead = useMarkAllRead()

  const unread = notifications.filter(n => !n.read_at)

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 rounded border bg-muted/40 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {unread.length > 0 && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => markAllRead.mutate()}>
            {t('notifications.inbox.markAllRead')}
          </Button>
        </div>
      )}

      {notifications.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-12">{t('notifications.inbox.empty')}</p>
      )}

      <div className="border rounded divide-y">
        {notifications.map(n => (
          <div
            key={n.id}
            className={`flex items-start gap-3 px-4 py-3 ${!n.read_at ? 'bg-primary/5' : ''}`}
          >
            {!n.read_at && (
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
            )}
            {n.read_at && <span className="mt-1.5 h-2 w-2 shrink-0" />}

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className={`text-sm ${!n.read_at ? 'font-medium' : 'text-muted-foreground'}`}>
                  {n.title}
                </p>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </span>
              </div>
              {n.body && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
              )}
              {n.link && (
                <Link href={n.link} className="text-xs text-primary hover:underline mt-0.5 inline-block">
                  {t('common.view')} →
                </Link>
              )}
            </div>

            {!n.read_at && (
              <button
                className="text-xs text-muted-foreground hover:text-foreground shrink-0"
                onClick={() => markRead.mutate(n.id)}
              >
                {t('common.dismiss')}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
