'use client'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { NotificationList } from '@/components/system/notifications/NotificationList'
import { useNotifications } from '@/hooks/system/useNotifications'
import { useI18n } from '@/lib/system/i18n'

export default function NotificationsPage() {
  const { t } = useI18n()
  const { data, isLoading } = useNotifications({ per_page: 50 })
  const notifications = data?.data ?? []

  return (
    <>
      <PageHeader title={t('notifications.inbox.title')} description={t('notifications.inbox.subtitle')} />
      <NotificationList notifications={notifications} isLoading={isLoading} />
    </>
  )
}
