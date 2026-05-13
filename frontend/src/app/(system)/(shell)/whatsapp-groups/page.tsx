'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { WhatsAppGroupTable } from '@/components/system/whatsapp/WhatsAppGroupTable'
import { RegisterGroupSheet } from '@/components/system/whatsapp/RegisterGroupSheet'
import { useWhatsAppGroups } from '@/hooks/system/useWhatsAppGroups'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function WhatsAppGroupsPage() {
  const [open, setOpen] = useState(false)
  const [filters, setFilters] = useState<{ type?: string; status?: string }>({})
  const { data, isLoading } = useWhatsAppGroups(filters)
  const groups = data?.data ?? []

  return (
    <>
      <PageHeader title="WhatsApp groups" description="Manage student and teacher WhatsApp groups.">
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Register group
        </Button>
      </PageHeader>

      <WhatsAppGroupTable groups={groups} isLoading={isLoading} filters={filters} onFiltersChange={setFilters} />
      <RegisterGroupSheet open={open} onClose={() => setOpen(false)} />
    </>
  )
}
