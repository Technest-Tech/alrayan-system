'use client'
import type { Lead } from '@/types/system/lead'
import { LeadCard } from './LeadCard'
import { useUpdateLead } from '@/hooks/system/useLeads'
import { Skeleton } from '@/components/ui/skeleton'

const COLUMNS: { key: Lead['status']; label: string }[] = [
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'trial_booked', label: 'Trial Booked' },
  { key: 'trial_completed', label: 'Trial Completed' },
  { key: 'enrolled', label: 'Enrolled' },
  { key: 'lost', label: 'Lost' },
]

interface Props {
  leads: Lead[]
  isLoading: boolean
  filters: Record<string, string>
  onFiltersChange: (f: Record<string, string>) => void
}

export function LeadKanban({ leads, isLoading, filters, onFiltersChange }: Props) {
  const update = useUpdateLead(0) // id set per card

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-4">
        {COLUMNS.map(c => (
          <div key={c.key} className="w-56 shrink-0">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{c.label}</div>
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        ))}
      </div>
    )
  }

  const grouped: Record<string, Lead[]> = Object.fromEntries(COLUMNS.map(c => [c.key, []]))
  leads.forEach(l => { grouped[l.status]?.push(l) })

  return (
    <div>
      {/* Quick filters */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Search…"
          className="h-8 text-sm border rounded px-2 w-48"
          value={filters.q ?? ''}
          onChange={e => onFiltersChange({ ...filters, q: e.target.value })}
        />
      </div>

      {/* Board */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {COLUMNS.map(col => (
          <div key={col.key} className="w-56 shrink-0">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex justify-between">
              <span>{col.label}</span>
              <span className="bg-secondary rounded-full px-1.5">{grouped[col.key].length}</span>
            </div>
            <div className="space-y-2">
              {grouped[col.key].map(lead => (
                <LeadCard key={lead.id} lead={lead} />
              ))}
              {grouped[col.key].length === 0 && (
                <div className="h-16 border border-dashed rounded-lg flex items-center justify-center text-muted-foreground text-xs">
                  Empty
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
