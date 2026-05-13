'use client'
import type { Lead } from '@/types/system/lead'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Badge } from '@/components/ui/badge'

interface Props {
  leads: Lead[]
  isLoading: boolean
  filters: Record<string, string>
  onFiltersChange: (f: Record<string, string>) => void
}

export function LeadTable({ leads, isLoading, filters, onFiltersChange }: Props) {
  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Search…"
          className="h-8 text-sm border rounded px-2 w-48"
          value={filters.q ?? ''}
          onChange={e => onFiltersChange({ ...filters, q: e.target.value })}
        />
        <select
          className="h-8 text-sm border rounded px-2"
          value={filters.status ?? ''}
          onChange={e => onFiltersChange({ ...filters, status: e.target.value || undefined! })}
        >
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="trial_booked">Trial Booked</option>
          <option value="trial_completed">Trial Completed</option>
          <option value="enrolled">Enrolled</option>
          <option value="lost">Lost</option>
        </select>
      </div>
      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2">Name</th>
              <th className="text-left px-4 py-2">Source</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Supervisor</th>
              <th className="text-left px-4 py-2">Last activity</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {!isLoading && leads.map(lead => (
              <tr key={lead.id} className="hover:bg-secondary/30">
                <td className="px-4 py-2">
                  <Link href={`/leads/${lead.id}`} className="font-medium hover:underline">{lead.name}</Link>
                  {lead.email && <div className="text-xs text-muted-foreground">{lead.email}</div>}
                </td>
                <td className="px-4 py-2 text-muted-foreground capitalize">{lead.source.replace(/_/g, ' ')}</td>
                <td className="px-4 py-2"><Badge variant="secondary">{lead.status.replace(/_/g, ' ')}</Badge></td>
                <td className="px-4 py-2 text-muted-foreground">{lead.supervisor_name ?? '—'}</td>
                <td className="px-4 py-2 text-muted-foreground">{formatDistanceToNow(new Date(lead.updated_at), { addSuffix: true })}</td>
              </tr>
            ))}
            {!isLoading && leads.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No leads found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
