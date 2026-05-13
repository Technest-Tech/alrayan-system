'use client'
import { useState } from 'react'
import type { WassenderLog } from '@/types/system/wassenderLog'
import { Badge } from '@/components/ui/badge'
import { DeliveryLogDrawer } from './DeliveryLogDrawer'
import { formatDistanceToNow } from 'date-fns'

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  queued: 'secondary',
  sending: 'secondary',
  sent: 'default',
  failed: 'destructive',
  dead: 'destructive',
}

interface Props {
  logs: WassenderLog[]
  isLoading: boolean
  filters: { template_key?: string; status?: string }
  onFiltersChange: (f: { template_key?: string; status?: string }) => void
}

export function DeliveryLogTable({ logs, isLoading, filters, onFiltersChange }: Props) {
  const [selected, setSelected] = useState<WassenderLog | null>(null)

  return (
    <>
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Template key…"
            className="h-8 text-sm border rounded px-2 w-44"
            value={filters.template_key ?? ''}
            onChange={e => onFiltersChange({ ...filters, template_key: e.target.value || undefined })}
          />
          <select
            className="h-8 text-sm border rounded px-2"
            value={filters.status ?? ''}
            onChange={e => onFiltersChange({ ...filters, status: e.target.value || undefined })}
          >
            <option value="">All statuses</option>
            <option value="queued">Queued</option>
            <option value="sending">Sending</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="dead">Dead</option>
          </select>
        </div>

        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2">ID</th>
                <th className="text-left px-4 py-2">Template</th>
                <th className="text-left px-4 py-2">Recipient</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Attempts</th>
                <th className="text-left px-4 py-2">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              )}
              {!isLoading && logs.map(log => (
                <tr
                  key={log.id}
                  className="hover:bg-secondary/30 cursor-pointer"
                  onClick={() => setSelected(log)}
                >
                  <td className="px-4 py-2 text-muted-foreground">#{log.id}</td>
                  <td className="px-4 py-2 font-mono text-xs">{log.template_key ?? '—'}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {log.whatsapp_group
                      ? log.whatsapp_group.linked_name ?? `Group #${log.whatsapp_group.id}`
                      : log.recipient_phone ?? '—'}
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant={STATUS_VARIANT[log.status] ?? 'secondary'}>{log.status}</Badge>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{log.attempt_count}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </td>
                </tr>
              ))}
              {!isLoading && logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                    No delivery logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DeliveryLogDrawer log={selected} onClose={() => setSelected(null)} />
    </>
  )
}
