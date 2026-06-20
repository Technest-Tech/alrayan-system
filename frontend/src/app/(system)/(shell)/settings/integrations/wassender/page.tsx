'use client'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { WassenderSettings } from '@/components/system/settings/WassenderSettings'
import { useI18n } from '@/lib/system/i18n'

export default function WassenderSettingsPage() {
  const { t } = useI18n()
  return (
    <>
      <PageHeader title={t('settings.integrations.wassender.title')} description={t('settings.integrations.wassender.subtitle')} />
      <WassenderSettings />
    </>
  )
}
