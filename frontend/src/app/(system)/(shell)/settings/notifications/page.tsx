'use client'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { EmptyState } from '@/components/system/primitives/EmptyState'
import { useI18n } from '@/lib/system/i18n'

export default function NotificationSettingsPage() {
  const { t } = useI18n()
  return (
    <>
      <PageHeader title={t('settings.notifications.title')} description={t('settings.notifications.subtitle')} />
      <EmptyState
        icon="Bell"
        title={t('settings.notifications.emptyTitle')}
        description={t('settings.notifications.emptyDescription')}
      />
    </>
  )
}
