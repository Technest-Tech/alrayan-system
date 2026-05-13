'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { LeadKanban } from '@/components/system/leads/LeadKanban'
import { LeadTable } from '@/components/system/leads/LeadTable'
import { useLeads } from '@/hooks/system/useLeads'
import { Button } from '@/components/ui/button'
import { LayoutGrid, List, Plus } from 'lucide-react'
import Link from 'next/link'

export default function LeadsPage() {
  const [view, setView] = useState<'kanban' | 'table'>('kanban')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const { data, isLoading } = useLeads({ ...filters, per_page: 200 })
  const leads = data?.data ?? []

  return (
    <>
      <PageHeader
        title="Leads"
        description="Track prospective students through the enrollment pipeline."
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('kanban')}
            className={`p-1.5 rounded ${view === 'kanban' ? 'bg-secondary' : 'hover:bg-secondary/50'}`}
            title="Kanban view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView('table')}
            className={`p-1.5 rounded ${view === 'table' ? 'bg-secondary' : 'hover:bg-secondary/50'}`}
            title="Table view"
          >
            <List className="h-4 w-4" />
          </button>
          <Button asChild size="sm">
            <Link href="/leads/new">
              <Plus className="h-4 w-4 mr-1" /> New lead
            </Link>
          </Button>
        </div>
      </PageHeader>

      {view === 'kanban' ? (
        <LeadKanban leads={leads} isLoading={isLoading} filters={filters} onFiltersChange={setFilters} />
      ) : (
        <LeadTable leads={leads} isLoading={isLoading} filters={filters} onFiltersChange={setFilters} />
      )}
    </>
  )
}
