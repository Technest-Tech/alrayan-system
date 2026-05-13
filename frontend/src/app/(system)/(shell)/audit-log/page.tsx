'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useAuditLog, useExportAuditLog } from '@/hooks/system/useAuditLog'
import type { AuditLogEntry } from '@/types/system/auditLog'

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`
  return new Date(iso).toLocaleDateString()
}

export default function AuditLogPage() {
  const [filters, setFilters] = useState({ actor: '', action: '', from: '', to: '', page: 1 })
  const [selected, setSelected] = useState<AuditLogEntry | null>(null)
  const { data, isLoading } = useAuditLog(filters)
  const { mutate: exportLog } = useExportAuditLog()

  const entries = data?.data ?? []

  return (
    <>
      <PageHeader title="Audit Log" description="Every action recorded.">
        <button onClick={() => exportLog(filters)}
          className="px-4 py-2 rounded-xl text-sm border" style={{ borderColor: 'rgb(var(--border-default))' }}>
          Export
        </button>
      </PageHeader>

      <div className="flex flex-wrap gap-3 mt-6">
        {[
          { key: 'actor',  placeholder: 'Actor…' },
          { key: 'action', placeholder: 'Action…' },
          { key: 'from',   placeholder: 'From date', type: 'date' },
          { key: 'to',     placeholder: 'To date',   type: 'date' },
        ].map(f => (
          <input key={f.key} type={f.type ?? 'text'}
            placeholder={f.placeholder}
            value={(filters as Record<string, string>)[f.key]}
            onChange={e => setFilters(prev => ({ ...prev, [f.key]: e.target.value, page: 1 }))}
            className="rounded-xl border px-3 py-2 text-sm w-40"
            style={{ borderColor: 'rgb(var(--border-default))' }} />
        ))}
      </div>

      <div className="mt-4 rounded-2xl overflow-hidden" style={{ border: '1px solid rgb(var(--border-default))' }}>
        <table className="w-full text-sm">
          <thead style={{ background: 'rgb(var(--surface-card-2))' }}>
            <tr>
              <th className="px-4 py-3 text-left font-medium">When</th>
              <th className="px-4 py-3 text-left font-medium">Actor</th>
              <th className="px-4 py-3 text-left font-medium">Action</th>
              <th className="px-4 py-3 text-left font-medium">Target</th>
              <th className="px-4 py-3 text-left font-medium">Source</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} style={{ borderTop: '1px solid rgb(var(--border-default))' }}>
                {[1,2,3,4,5].map(j => <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded" style={{ background: 'rgb(var(--surface-card-2))' }} /></td>)}
              </tr>
            ))}
            {entries.map((e, i) => (
              <tr key={i} onClick={() => setSelected(e)}
                className="cursor-pointer hover:bg-black/[0.02]"
                style={{ borderTop: '1px solid rgb(var(--border-default))' }}>
                <td className="px-4 py-3 whitespace-nowrap opacity-60">{formatRelative(e.at)}</td>
                <td className="px-4 py-3">{e.actor}</td>
                <td className="px-4 py-3 font-mono text-xs">{e.action}</td>
                <td className="px-4 py-3 opacity-60">
                  {e.target_type && `${e.target_type}#${e.target_id}`}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${e.source === 'audit' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    {e.source}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data?.meta && data.meta.last_page > 1 && (
        <div className="flex gap-2 mt-4">
          <button disabled={filters.page <= 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
            className="px-3 py-1.5 rounded-lg text-sm border disabled:opacity-40" style={{ borderColor: 'rgb(var(--border-default))' }}>
            ← Prev
          </button>
          <span className="px-3 py-1.5 text-sm opacity-60">{filters.page} / {data.meta.last_page}</span>
          <button disabled={filters.page >= data.meta.last_page} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
            className="px-3 py-1.5 rounded-lg text-sm border disabled:opacity-40" style={{ borderColor: 'rgb(var(--border-default))' }}>
            Next →
          </button>
        </div>
      )}

      {/* Diff drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.3)' }}
          onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-auto"
            style={{ background: 'rgb(var(--surface-card))', border: '1px solid rgb(var(--border-default))' }}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="font-mono text-sm">{selected.action}</div>
                <div className="text-xs opacity-50 mt-0.5">{selected.actor} · {selected.at}</div>
              </div>
              <button onClick={() => setSelected(null)} className="text-2xl opacity-40 hover:opacity-70">&times;</button>
            </div>
            <pre className="text-xs rounded-xl p-4 overflow-auto" style={{ background: 'rgb(var(--surface-card-2))' }}>
              {JSON.stringify(selected.diff, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </>
  )
}
