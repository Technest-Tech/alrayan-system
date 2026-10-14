'use client'
import type { SysNotification } from '@/types/system/notification'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { useI18n } from '@/lib/system/i18n'
import { notificationText } from '@/lib/system/notificationText'

interface Props {
  notifications: SysNotification[]
  isLoading: boolean
  /** Ids that were unread when this view opened (and were read by opening it): shown as new. */
  fresh?: ReadonlySet<number>
}

export function NotificationList({ notifications, isLoading, fresh }: Props) {
  const { t } = useI18n()

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 rounded border bg-muted/40 animate-pulse" />
        ))}
      </div>
    )
  }

  if (notifications.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-12">{t('notifications.inbox.empty')}</p>
  }

  return (
    <div className="border rounded divide-y">
      {notifications.map(n => {
        const { title, body } = notificationText(n, t)
        const isNew = !n.read_at || !!fresh?.has(n.id)
        return (
          <div
            key={n.id}
            className={`flex items-start gap-3 px-4 py-3 ${isNew ? 'bg-primary/5' : ''}`}
          >
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${isNew ? 'bg-primary' : ''}`} />

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className={`text-sm ${isNew ? 'font-medium' : 'text-muted-foreground'}`}>
                  {title}
                </p>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </span>
              </div>
              {body && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{body}</p>
              )}
              {n.link && (
                <Link href={n.link} className="text-xs text-primary hover:underline mt-0.5 inline-block">
                  {t('common.view')} →
                </Link>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
