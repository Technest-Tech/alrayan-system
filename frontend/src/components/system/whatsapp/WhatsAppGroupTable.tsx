'use client'
import type { WhatsAppGroup } from '@/types/system/whatsappGroup'
import { useStopWhatsAppGroup, useReactivateWhatsAppGroup } from '@/hooks/system/useWhatsAppGroups'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, Power, PowerOff } from 'lucide-react'
import Link from 'next/link'

interface Props {
  groups: WhatsAppGroup[]
  isLoading: boolean
  filters: { type?: string; status?: string }
  onFiltersChange: (f: { type?: string; status?: string }) => void
}

export function WhatsAppGroupTable({ groups, isLoading, filters, onFiltersChange }: Props) {
  return (
    <div>
      <div className="flex gap-2 mb-4">
        <select className="h-8 text-sm border rounded px-2" value={filters.type ?? ''} onChange={e => onFiltersChange({ ...filters, type: e.target.value || undefined })}>
          <option value="">All types</option>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
        </select>
        <select className="h-8 text-sm border rounded px-2" value={filters.status ?? ''} onChange={e => onFiltersChange({ ...filters, status: e.target.value || undefined })}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="stopped">Stopped</option>
        </select>
      </div>
      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2">Type</th>
              <th className="text-left px-4 py-2">Linked to</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Link</th>
              <th className="text-left px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>}
            {groups.map(g => <GroupRow key={g.id} group={g} />)}
            {!isLoading && groups.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No groups found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function GroupRow({ group }: { group: WhatsAppGroup }) {
  const stop = useStopWhatsAppGroup(group.id)
  const reactivate = useReactivateWhatsAppGroup(group.id)
  const linked = group.type === 'student' ? group.linked_student?.name : group.linked_teacher?.name

  return (
    <tr className="hover:bg-secondary/30">
      <td className="px-4 py-2 capitalize">{group.type}</td>
      <td className="px-4 py-2">
        {linked ? (
          <Link href={group.type === 'student' ? `/students/${group.linked_student_id}` : `/teachers/${group.linked_teacher_id}`} className="hover:underline">
            {linked}
          </Link>
        ) : <span className="text-muted-foreground">—</span>}
      </td>
      <td className="px-4 py-2">
        <Badge variant={group.status === 'active' ? 'default' : 'secondary'}>
          {group.status}
        </Badge>
      </td>
      <td className="px-4 py-2">
        <a href={group.invite_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-xs">
          Open <ExternalLink className="h-3 w-3" />
        </a>
      </td>
      <td className="px-4 py-2">
        {group.status === 'active' ? (
          <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => stop.mutate()} disabled={stop.isPending}>
            <PowerOff className="h-3.5 w-3.5 mr-1" /> Stop
          </Button>
        ) : (
          <Button size="sm" variant="ghost" className="h-7" onClick={() => reactivate.mutate()} disabled={reactivate.isPending}>
            <Power className="h-3.5 w-3.5 mr-1" /> Reactivate
          </Button>
        )}
      </td>
    </tr>
  )
}
