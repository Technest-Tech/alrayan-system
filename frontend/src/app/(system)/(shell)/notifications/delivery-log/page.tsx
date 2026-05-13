'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { DeliveryLogTable } from '@/components/system/notifications/DeliveryLogTable'
import { useWassenderLogs } from '@/hooks/system/useWassenderLogs'

export default function DeliveryLogPage() {
  const [filters, setFilters] = useState<{ template_key?: string; status?: string }>({})
  const { data, isLoading } = useWassenderLogs(filters)
  const logs = data?.data ?? []
  const total = data?.meta.total ?? 0

  return (
    <>
      <PageHeader title="WhatsApp delivery log" description={`${total} total messages logged.`} />
      <DeliveryLogTable logs={logs} isLoading={isLoading} filters={filters} onFiltersChange={setFilters} />
    </>
  )
}
