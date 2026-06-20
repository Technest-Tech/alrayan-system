'use client'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { EmptyState } from '@/components/system/primitives/EmptyState'
import { useI18n } from '@/lib/system/i18n'

export default function IntegrationsPage() {
  const { t } = useI18n()
  return (
    <>
      <PageHeader title={t('settings.integrations.title')} description={t('settings.integrations.subtitle')} />
      <EmptyState
        icon="Plug"
        title={t('settings.integrations.emptyTitle')}
        description={t('settings.integrations.emptyDescription')}
      />
    </>
  )
}
