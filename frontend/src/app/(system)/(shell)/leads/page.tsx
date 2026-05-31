'use client'
import { useState } from 'react'
import { Plus, RefreshCw, BarChart2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { LeadKanban } from '@/components/system/leads/LeadKanban'
import { AddLeadDialog } from '@/components/system/leads/AddLeadDialog'
import { useLeads } from '@/hooks/system/useLeads'
import { useQueryClient } from '@tanstack/react-query'

/* ── Islamic 8-point star ──────────────────────── */
const STAR_PATH = 'M50,5 L57.65,31.52 L81.82,18.18 L68.48,42.35 L95,50 L68.48,57.65 L81.82,81.82 L57.65,68.48 L50,95 L42.35,68.48 L18.18,81.82 L31.52,57.65 L5,50 L31.52,42.35 L18.18,18.18 L42.35,31.52 Z'

function KhatamStar({ size = 18, color = '#C9A24B', opacity = 1 }: { size?: number; color?: string; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ opacity }}>
      <path d={STAR_PATH} fill={color} />
    </svg>
  )
}

function GoldDivider() {
  return (
    <div className="flex items-center gap-0" style={{ height: 2 }}>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, #C9A24B88)' }} />
      <div style={{ width: 6, height: 6, background: '#C9A24B', transform: 'rotate(45deg)', margin: '0 4px', opacity: 0.7 }} />
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #C9A24B88, transparent)' }} />
    </div>
  )
}

export default function CrmPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filters,    setFilters]    = useState<Record<string, string>>({})
  const qc     = useQueryClient()
  const router = useRouter()

  const { data, isLoading, isFetching } = useLeads({ ...filters, per_page: 500 })
  const leads = data?.data ?? []

  return (
    <div className="min-w-0">
      {/* ── Header card ── */}
      <div
        className="rounded-2xl mb-5 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0d2548 0%, #0B1F3A 60%, #071528 100%)',
          boxShadow: '0 4px 24px rgb(11 31 58 / 0.18)',
        }}
      >
        {/* Top gold accent */}
        <div style={{ height: 2, background: 'linear-gradient(90deg, transparent 0%, #C9A24B 30%, #C9A24B 70%, transparent 100%)' }} />

        {/* Background star watermarks */}
        <div className="relative px-5 py-4" style={{ overflow: 'hidden' }}>
          <svg className="absolute right-0 top-0 pointer-events-none select-none" width="220" height="90" aria-hidden>
            <g transform="translate(140, -20) scale(1.8)" opacity="0.04">
              <path d={STAR_PATH} fill="#C9A24B" />
            </g>
            <g transform="translate(60, 30) scale(1.1)" opacity="0.03">
              <path d={STAR_PATH} fill="#C9A24B" />
            </g>
          </svg>
          {/* Dot grid */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
            <pattern id="crm-dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill="#C9A24B" opacity="0.08" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#crm-dots)" />
          </svg>

          <div className="relative z-10 flex items-center justify-between gap-4">
            {/* Left: title */}
            <div className="flex items-center gap-3 min-w-0">
              <KhatamStar size={22} color="#C9A24B" opacity={0.9} />
              <div>
                <h1
                  className="text-2xl font-bold text-white leading-none"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: '-0.01em' }}
                >
                  CRM
                </h1>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(201,162,75,0.7)' }}>
                  Lead Management Pipeline
                </p>
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => qc.invalidateQueries({ queryKey: ['system', 'leads'] })}
                disabled={isFetching}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.75)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
                Refresh
              </button>

              <button
                onClick={() => router.push('/leads/analytics')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90"
                style={{
                  background: 'rgba(201,162,75,0.15)',
                  color: 'rgba(201,162,75,0.9)',
                  border: '1px solid rgba(201,162,75,0.3)',
                }}
              >
                <BarChart2 size={12} />
                Statistics
              </button>

              <button
                onClick={() => setDialogOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 shadow-sm"
                style={{
                  background: 'rgb(14 124 90)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                <Plus size={13} />
                Add Lead
              </button>
            </div>
          </div>
        </div>

        {/* Bottom gold divider */}
        <GoldDivider />
      </div>

      {/* Kanban */}
      <LeadKanban
        leads={leads}
        isLoading={isLoading}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <AddLeadDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
