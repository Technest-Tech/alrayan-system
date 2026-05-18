'use client'
import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Lead, LeadStatus, LeadDetail } from '@/types/system/lead'
import { LeadCard } from './LeadCard'
import { api } from '@/lib/system/api'
import { Search } from 'lucide-react'

const COLUMNS: {
  key: LeadStatus
  label: string
  dot: string
  headBg: string
  dropBg: string
}[] = [
  { key: 'new',             label: 'New',             dot: 'rgb(30 90 171)',   headBg: 'rgb(30 90 171 / 0.07)',  dropBg: 'rgb(30 90 171 / 0.05)' },
  { key: 'contacted',       label: 'Contacted',       dot: 'rgb(154 113 23)',  headBg: 'rgb(154 113 23 / 0.07)', dropBg: 'rgb(154 113 23 / 0.05)' },
  { key: 'trial_booked',    label: 'Trial Booked',    dot: 'rgb(101 56 182)', headBg: 'rgb(101 56 182 / 0.07)', dropBg: 'rgb(101 56 182 / 0.05)' },
  { key: 'trial_completed', label: 'Trial Completed', dot: 'rgb(14 124 90)',   headBg: 'rgb(14 124 90 / 0.07)',  dropBg: 'rgb(14 124 90 / 0.05)' },
  { key: 'enrolled',        label: 'Enrolled',        dot: 'rgb(14 124 90)',   headBg: 'rgb(14 124 90 / 0.1)',   dropBg: 'rgb(14 124 90 / 0.07)' },
  { key: 'lost',            label: 'Lost',            dot: 'rgb(90 100 112)',  headBg: 'rgb(90 100 112 / 0.06)', dropBg: 'rgb(90 100 112 / 0.04)' },
]

interface Props {
  leads: Lead[]
  isLoading: boolean
  filters: Record<string, string>
  onFiltersChange: (f: Record<string, string>) => void
}

function SkeletonCard() {
  return (
    <div
      className="rounded-xl border p-3 space-y-2"
      style={{ background: '#fff', borderColor: 'rgb(var(--border-default,229 233 240))' }}
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full animate-pulse" style={{ background: 'rgb(244 246 250)' }} />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-3/4 rounded animate-pulse" style={{ background: 'rgb(244 246 250)' }} />
          <div className="h-2 w-1/2 rounded animate-pulse" style={{ background: 'rgb(244 246 250)' }} />
        </div>
      </div>
      <div className="h-2.5 w-2/3 rounded animate-pulse" style={{ background: 'rgb(244 246 250)' }} />
    </div>
  )
}

export function LeadKanban({ leads, isLoading, filters, onFiltersChange }: Props) {
  const qc = useQueryClient()
  const [dragLeadId, setDragLeadId]   = useState<number | null>(null)
  const [dragOverCol, setDragOverCol] = useState<LeadStatus | null>(null)
  const fromStatusRef = useRef<LeadStatus | null>(null)

  const moveLead = useMutation({
    mutationFn: ({ id, status }: { id: number; status: LeadStatus }) =>
      api<{ data: LeadDetail }>(`/leads/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'leads'] }),
    onError: () => toast.error('Failed to move lead — check permissions or status rules.'),
  })

  function handleDragStart(lead: Lead, e: React.DragEvent) {
    setDragLeadId(lead.id)
    fromStatusRef.current = lead.status
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(lead.id))
  }

  function handleDragEnd() {
    setDragLeadId(null)
    setDragOverCol(null)
  }

  function handleDragOver(status: LeadStatus, e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverCol !== status) setDragOverCol(status)
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    // Only clear if leaving the column entirely (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverCol(null)
    }
  }

  function handleDrop(status: LeadStatus, e: React.DragEvent) {
    e.preventDefault()
    const id = dragLeadId
    setDragLeadId(null)
    setDragOverCol(null)
    if (id !== null && fromStatusRef.current !== status) {
      moveLead.mutate({ id, status })
    }
  }

  const grouped: Record<string, Lead[]> = Object.fromEntries(COLUMNS.map(c => [c.key, []]))
  leads.forEach(l => { grouped[l.status]?.push(l) })

  return (
    <div>
      {/* Search bar */}
      <div
        className="rounded-xl border mb-4 overflow-hidden"
        style={{ background: '#fff', borderColor: 'rgb(var(--border-default,229 233 240))' }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="relative flex-1 min-w-44 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
            <input
              type="text"
              placeholder="Search leads…"
              className="w-full pl-8 pr-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] transition-shadow"
              style={{ borderColor: 'rgb(var(--border-default,229 233 240))', background: '#fff' }}
              value={filters.q ?? ''}
              onChange={e => onFiltersChange({ ...filters, q: e.target.value })}
            />
          </div>
          {dragLeadId && (
            <p className="text-xs opacity-40 ml-auto select-none">
              Drop onto a column to move
            </p>
          )}
        </div>
      </div>

      {/* Board */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {COLUMNS.map(col => {
          const isOver = dragOverCol === col.key
          return (
            <div
              key={col.key}
              className="w-60 shrink-0 flex flex-col"
              onDragOver={e => handleDragOver(col.key, e)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(col.key, e)}
            >
              {/* Column header */}
              <div
                className="flex items-center justify-between px-3 py-2 rounded-xl mb-2 transition-colors"
                style={{ background: isOver ? col.dropBg : col.headBg }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: col.dot }}
                  />
                  <span className="text-xs font-semibold" style={{ color: 'rgb(11 31 58)' }}>
                    {col.label}
                  </span>
                </div>
                <span
                  className="text-xs font-bold tabular-nums px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgb(255 255 255 / 0.8)', color: col.dot }}
                >
                  {grouped[col.key].length}
                </span>
              </div>

              {/* Cards */}
              <div
                className="flex-1 space-y-2 rounded-xl transition-all min-h-16 p-1 -m-1"
                style={isOver
                  ? { background: col.dropBg, outline: `2px dashed ${col.dot}`, outlineOffset: '-2px', borderRadius: '12px' }
                  : {}}
              >
                {isLoading ? (
                  <>
                    <SkeletonCard />
                    <SkeletonCard />
                  </>
                ) : grouped[col.key].length === 0 ? (
                  <div
                    className="h-16 border border-dashed rounded-xl flex items-center justify-center text-xs transition-colors"
                    style={{
                      borderColor: isOver ? col.dot : 'rgb(var(--border-default,229 233 240))',
                      color: isOver ? col.dot : 'rgb(203 211 222)',
                      opacity: isOver ? 0.7 : 1,
                    }}
                  >
                    {isOver ? 'Release to move here' : 'Empty'}
                  </div>
                ) : (
                  grouped[col.key].map(lead => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={e => handleDragStart(lead, e)}
                      onDragEnd={handleDragEnd}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      <LeadCard lead={lead} dragging={dragLeadId === lead.id} />
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
