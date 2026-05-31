'use client'
import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Lead, LeadStatus } from '@/types/system/lead'
import { LeadCard } from './LeadCard'
import { LeadDetailPanel } from './LeadDetailPanel'
import { AddLeadDialog } from './AddLeadDialog'
import { useDeleteLead } from '@/hooks/system/useLeads'
import { api } from '@/lib/system/api'
import { Search, X, ChevronDown } from 'lucide-react'

/* ── Islamic star path ─────────────────────────── */
const STAR = 'M50,5 L57.65,31.52 L81.82,18.18 L68.48,42.35 L95,50 L68.48,57.65 L81.82,81.82 L57.65,68.48 L50,95 L42.35,68.48 L18.18,81.82 L31.52,57.65 L5,50 L31.52,42.35 L18.18,18.18 L42.35,31.52 Z'

/* ── Ornamental divider ─────────────────────────── */
function OrnaDivider({ title }: { title: string }) {
  const diamonds = [4, 12, 20, 28, 36, 44, 52]
  return (
    <div className="flex items-center gap-2 shrink-0">
      <svg width="60" height="14" viewBox="0 0 60 14" aria-hidden>
        <line x1="0" y1="7" x2="56" y2="7" stroke="#C9A24B" strokeWidth="0.7" opacity="0.45" />
        {diamonds.map(x => (
          <polygon key={x} points={`${x},3 ${x+3},7 ${x},11 ${x-3},7`} fill="#C9A24B" opacity="0.35" />
        ))}
      </svg>
      <svg width="12" height="12" viewBox="0 0 100 100" aria-hidden>
        <path d={STAR} fill="#C9A24B" opacity="0.7" />
      </svg>
      <span className="text-[10px] font-semibold tracking-[0.14em] uppercase whitespace-nowrap" style={{ color: 'rgb(90 100 112)' }}>
        {title}
      </span>
      <svg width="12" height="12" viewBox="0 0 100 100" aria-hidden>
        <path d={STAR} fill="#C9A24B" opacity="0.7" />
      </svg>
      <svg width="60" height="14" viewBox="0 0 60 14" style={{ transform: 'scaleX(-1)' }} aria-hidden>
        <line x1="0" y1="7" x2="56" y2="7" stroke="#C9A24B" strokeWidth="0.7" opacity="0.45" />
        {diamonds.map(x => (
          <polygon key={x} points={`${x},3 ${x+3},7 ${x},11 ${x-3},7`} fill="#C9A24B" opacity="0.35" />
        ))}
      </svg>
    </div>
  )
}

/* ── Column definitions ─────────────────────────── */
const COLUMNS: {
  key: LeadStatus
  label: string
  dot: string
  accent: string
  headBg: string
  dropBg: string
  count?: number
}[] = [
  { key: 'new_lead',            label: 'New Lead',            dot: '#1E5AAB', accent: '#1E5AAB', headBg: 'rgba(30,90,171,0.07)',  dropBg: 'rgba(30,90,171,0.04)'  },
  { key: 'waiting_for_trial',   label: 'Waiting for Trial',   dot: '#B47800', accent: '#B47800', headBg: 'rgba(180,120,0,0.07)',   dropBg: 'rgba(180,120,0,0.04)'  },
  { key: 'waiting_for_payment', label: 'Waiting for Payment', dot: '#C0392B', accent: '#C0392B', headBg: 'rgba(192,57,43,0.07)',   dropBg: 'rgba(192,57,43,0.04)'  },
  { key: 'closed',              label: 'Closed',              dot: '#0E7C5A', accent: '#0E7C5A', headBg: 'rgba(14,124,90,0.07)',   dropBg: 'rgba(14,124,90,0.04)'  },
  { key: 'not_interested',      label: 'Not Interested',      dot: '#BE185D', accent: '#BE185D', headBg: 'rgba(190,24,93,0.07)',   dropBg: 'rgba(190,24,93,0.04)'  },
  { key: 'interested',          label: 'Interested',          dot: '#0E7C5A', accent: '#0E7C5A', headBg: 'rgba(14,124,90,0.05)',   dropBg: 'rgba(14,124,90,0.03)'  },
  { key: 'lost',                label: 'Lost',                dot: '#64748b', accent: '#64748b', headBg: 'rgba(100,116,139,0.07)', dropBg: 'rgba(100,116,139,0.04)' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'new_lead',            label: 'New Lead' },
  { value: 'interested',          label: 'Interested' },
  { value: 'waiting_for_trial',   label: 'Waiting for Trial' },
  { value: 'waiting_for_payment', label: 'Waiting for Payment' },
  { value: 'closed',              label: 'Closed' },
  { value: 'not_interested',      label: 'Not Interested' },
  { value: 'lost',                label: 'Lost' },
]

const PLATFORM_OPTIONS = [
  { value: '', label: 'All Platforms' },
  { value: 'website',   label: 'Website' },
  { value: 'facebook',  label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube',   label: 'YouTube' },
  { value: 'whatsapp',  label: 'WhatsApp' },
  { value: 'tiktok',    label: 'TikTok' },
  { value: 'other',     label: 'Other' },
]

const SOURCE_OPTIONS = [
  { value: '', label: 'All Sources' },
  { value: 'google_ads',       label: 'Google Ads' },
  { value: 'facebook_ads',     label: 'Facebook Ads' },
  { value: 'instagram_ads',    label: 'Instagram' },
  { value: 'whatsapp_direct',  label: 'WhatsApp Direct' },
  { value: 'student_referral', label: 'Referral' },
  { value: 'website_form',     label: 'Website Form' },
  { value: 'manual_entry',     label: 'Manual' },
]

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'high',   label: 'High Priority' },
  { value: 'medium', label: 'Medium Priority' },
  { value: 'low',    label: 'Low Priority' },
]

/* ── Filter select ──────────────────────────────── */
function FilterSelect({ value, options, onChange }: {
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div className="relative min-w-0">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none w-full pl-3 pr-7 py-2 rounded-lg border text-xs outline-none transition-all cursor-pointer focus:ring-2"
        style={{
          borderColor: value ? '#C9A24B66' : 'rgb(229 233 240)',
          background: value ? 'rgba(201,162,75,0.04)' : '#fff',
          color: value ? 'rgb(11 31 58)' : 'rgb(90 100 112)',
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" />
    </div>
  )
}

/* ── Skeleton ───────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="rounded-xl border p-3 space-y-2.5" style={{ background: '#fff', borderColor: 'rgb(229 233 240)' }}>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full animate-pulse" style={{ background: 'rgb(244 246 250)' }} />
        <div className="h-3 flex-1 rounded animate-pulse" style={{ background: 'rgb(244 246 250)' }} />
      </div>
      <div className="h-2.5 w-3/4 rounded animate-pulse" style={{ background: 'rgb(244 246 250)' }} />
      <div className="h-4 w-1/2 rounded-md animate-pulse" style={{ background: 'rgb(244 246 250)' }} />
    </div>
  )
}

/* ── Main ───────────────────────────────────────── */
interface Props {
  leads: Lead[]
  isLoading: boolean
  filters: Record<string, string>
  onFiltersChange: (f: Record<string, string>) => void
}

export function LeadKanban({ leads, isLoading, filters, onFiltersChange }: Props) {
  const qc = useQueryClient()
  const [dragLeadId,     setDragLeadId]     = useState<number | null>(null)
  const [dragOverCol,    setDragOverCol]     = useState<LeadStatus | null>(null)
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null)
  const [editLead,       setEditLead]        = useState<Lead | null>(null)
  const fromStatusRef = useRef<LeadStatus | null>(null)

  const deleteLead = useDeleteLead()

  const moveLead = useMutation({
    mutationFn: ({ id, status }: { id: number; status: LeadStatus }) =>
      api<{ data: unknown }>(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'leads'] }),
    onError:   () => toast.error('Could not move lead — check status rules or permissions.'),
  })

  function handleEditLead(lead: Lead) {
    setSelectedLeadId(null)
    setEditLead(lead)
  }

  function handleDeleteLead(lead: Lead) {
    if (!window.confirm(`Delete "${lead.name}"? This cannot be undone.`)) return
    deleteLead.mutate(lead.id, {
      onSuccess: () => {
        toast.success('Lead deleted.')
        if (selectedLeadId === lead.id) setSelectedLeadId(null)
      },
      onError: () => toast.error('Could not delete lead.'),
    })
  }

  function handleDragStart(lead: Lead, e: React.DragEvent) {
    setDragLeadId(lead.id)
    fromStatusRef.current = lead.status
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(lead.id))
  }
  function handleDragEnd() { setDragLeadId(null); setDragOverCol(null) }
  function handleDragOver(status: LeadStatus, e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverCol !== status) setDragOverCol(status)
  }
  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCol(null)
  }
  function handleDrop(status: LeadStatus, e: React.DragEvent) {
    e.preventDefault()
    const id = dragLeadId
    setDragLeadId(null); setDragOverCol(null)
    if (id !== null && fromStatusRef.current !== status) moveLead.mutate({ id, status })
  }

  const grouped: Record<string, Lead[]> = Object.fromEntries(COLUMNS.map(c => [c.key, []]))
  leads.forEach(l => { grouped[l.status]?.push(l) })
  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <div className="min-w-0">
      {/* ── Filter bar ── */}
      <div
        className="rounded-2xl border mb-4 overflow-hidden"
        style={{ background: '#fff', borderColor: 'rgb(229 233 240)', boxShadow: '0 1px 4px rgb(11 31 58 / 0.04)' }}
      >
        {/* Gold top accent */}
        <div style={{ height: 2, background: 'linear-gradient(90deg, transparent 0%, #C9A24B66 40%, #C9A24B66 60%, transparent 100%)' }} />

        <div className="px-4 py-3">
          {/* Title row with ornament */}
          <div className="flex items-center justify-between mb-3">
            <OrnaDivider title="Filters" />
            {hasFilters && (
              <button
                onClick={() => onFiltersChange({})}
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-colors hover:bg-red-50"
                style={{ borderColor: 'rgba(192,57,43,0.3)', color: 'rgb(192 57 43)' }}
              >
                <X size={10} />
                Clear all
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" />
              <input
                type="text"
                placeholder="Search by name, email, phone…"
                className="w-full pl-8 pr-3 py-2 rounded-lg border text-xs outline-none focus:ring-2 transition-all"
                style={{
                  borderColor: filters.q ? '#C9A24B66' : 'rgb(229 233 240)',
                  background: filters.q ? 'rgba(201,162,75,0.04)' : '#fff',
                }}
                value={filters.q ?? ''}
                onChange={e => onFiltersChange({ ...filters, q: e.target.value })}
              />
            </div>

            <FilterSelect value={filters.status   ?? ''} options={STATUS_OPTIONS}   onChange={v => onFiltersChange({ ...filters, status: v })} />
            <FilterSelect value={filters.platform  ?? ''} options={PLATFORM_OPTIONS}  onChange={v => onFiltersChange({ ...filters, platform: v })} />
            <FilterSelect value={filters.source    ?? ''} options={SOURCE_OPTIONS}    onChange={v => onFiltersChange({ ...filters, source: v })} />
            <FilterSelect value={filters.priority  ?? ''} options={PRIORITY_OPTIONS}  onChange={v => onFiltersChange({ ...filters, priority: v })} />

            {dragLeadId && (
              <p className="text-[10px] opacity-40 ml-auto select-none italic">
                Drop onto a column to move
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Board ── */}
      <div className="overflow-x-auto pb-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#C9A24B33 transparent' }}>
        <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
          {COLUMNS.map(col => {
            const isOver     = dragOverCol === col.key
            const colLeads   = grouped[col.key] ?? []
            const colCount   = colLeads.length

            return (
              <div
                key={col.key}
                className="flex flex-col"
                style={{ width: 230 }}
                onDragOver={e => handleDragOver(col.key, e)}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(col.key, e)}
              >
                {/* Column header */}
                <div
                  className="rounded-xl mb-2.5 overflow-hidden transition-all"
                  style={{
                    background: isOver ? col.dropBg : col.headBg,
                    border: `1.5px solid ${isOver ? col.accent + '55' : 'transparent'}`,
                    boxShadow: isOver ? `0 0 0 2px ${col.accent}22` : 'none',
                  }}
                >
                  {/* Mini gold top line */}
                  <div style={{ height: 1.5, background: `linear-gradient(90deg, transparent, ${col.accent}66, transparent)` }} />
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: col.dot }} />
                      <span className="text-xs font-semibold" style={{ color: '#0B1F3A' }}>
                        {col.label}
                      </span>
                    </div>
                    <span
                      className="text-xs font-bold tabular-nums px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.85)', color: col.accent }}
                    >
                      {colCount}
                    </span>
                  </div>
                </div>

                {/* Cards drop zone */}
                <div
                  className="flex-1 space-y-2 rounded-xl transition-all"
                  style={{
                    minHeight: 64,
                    padding: isOver ? '6px' : '2px',
                    margin: isOver ? '-2px' : '0',
                    background: isOver ? col.dropBg : 'transparent',
                    outline: isOver ? `2px dashed ${col.accent}55` : 'none',
                    outlineOffset: isOver ? -2 : 0,
                    borderRadius: 12,
                  }}
                >
                  {isLoading ? (
                    <><SkeletonCard /><SkeletonCard /></>
                  ) : colCount === 0 ? (
                    <div
                      className="h-16 rounded-xl flex items-center justify-center text-[11px] transition-all"
                      style={{
                        border: `1.5px dashed ${isOver ? col.accent + '88' : 'rgb(229 233 240)'}`,
                        color: isOver ? col.accent : 'rgb(203 211 222)',
                        background: isOver ? col.dropBg : 'transparent',
                      }}
                    >
                      {isOver ? 'Release to move' : 'Empty'}
                    </div>
                  ) : (
                    colLeads.map(lead => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={e => handleDragStart(lead, e)}
                        onDragEnd={handleDragEnd}
                        className="cursor-grab active:cursor-grabbing"
                      >
                        <LeadCard
                          lead={lead}
                          dragging={dragLeadId === lead.id}
                          onClick={() => setSelectedLeadId(lead.id)}
                          onEdit={() => handleEditLead(lead)}
                          onDelete={() => handleDeleteLead(lead)}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <LeadDetailPanel
        leadId={selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
      />

      <AddLeadDialog
        open={!!editLead}
        onOpenChange={v => { if (!v) setEditLead(null) }}
        lead={editLead ?? undefined}
      />
    </div>
  )
}
