'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { DeliveryLogTable } from '@/components/system/notifications/DeliveryLogTable'
import { useWassenderLogs } from '@/hooks/system/useWassenderLogs'
import { useI18n } from '@/lib/system/i18n'

export default function DeliveryLogPage() {
  const { t } = useI18n()
  const [filters, setFilters] = useState<{ template_key?: string; status?: string }>({})
  const { data, isLoading } = useWassenderLogs(filters)
  const logs = data?.data ?? []
  const total = data?.meta.total ?? 0

  return (
    <>
      <PageHeader
        title={t('notifications.deliveryLog.title')}
        description={t('notifications.deliveryLog.subtitle', { count: String(total) })}
      />
      <DeliveryLogTable logs={logs} isLoading={isLoading} filters={filters} onFiltersChange={setFilters} />
    </>
  )
}
