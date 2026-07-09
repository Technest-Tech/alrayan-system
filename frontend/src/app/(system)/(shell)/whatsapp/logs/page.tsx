'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { ConnectionStatusBadge } from '@/components/system/whatsapp/ConnectionStatusBadge'
import { SendLogTable } from '@/components/system/whatsapp/SendLogTable'
import { useWhatsAppSendLogs } from '@/hooks/system/useWhatsAppSendLogs'
import { useI18n } from '@/lib/system/i18n'
import type { WhatsAppLogFilters } from '@/types/system/whatsappSendLog'

export default function WhatsAppLogsPage() {
  const { t } = useI18n()
  const [filters, setFilters] = useState<WhatsAppLogFilters>({})
  const { data, isLoading } = useWhatsAppSendLogs(filters)

  const logs = data?.data ?? []
  const total = data?.meta.total ?? 0

  return (
    <>
      <PageHeader
        title={t('whatsappLogs.title')}
        description={t('whatsappLogs.subtitle', { count: String(total) })}
        actions={<ConnectionStatusBadge />}
      />
      <SendLogTable
        logs={logs}
        isLoading={isLoading}
        filters={filters}
        onFiltersChange={setFilters}
        page={data?.meta.current_page ?? 1}
        lastPage={data?.meta.last_page ?? 1}
      />
    </>
  )
}
