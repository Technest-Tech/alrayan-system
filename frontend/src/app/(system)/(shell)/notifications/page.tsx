'use client'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { NotificationList } from '@/components/system/notifications/NotificationList'
import { useNotifications } from '@/hooks/system/useNotifications'

export default function NotificationsPage() {
  const { data, isLoading } = useNotifications({ per_page: 50 })
  const notifications = data?.data ?? []

  return (
    <>
      <PageHeader title="Notifications" description="Your internal alert inbox." />
      <NotificationList notifications={notifications} isLoading={isLoading} />
    </>
  )
}
