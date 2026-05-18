'use client'
import { useState, useMemo } from 'react'
import { Plus, LayoutGrid, List, Users, CalendarCheck, GraduationCap } from 'lucide-react'
import { LeadKanban } from '@/components/system/leads/LeadKanban'
import { LeadTable } from '@/components/system/leads/LeadTable'
import { AddLeadDialog } from '@/components/system/leads/AddLeadDialog'
import { useLeads } from '@/hooks/system/useLeads'

export default function LeadsPage() {
  const [view,       setView]       = useState<'kanban' | 'table'>('kanban')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filters,    setFilters]    = useState<Record<string, string>>({})

  const { data, isLoading } = useLeads({ ...filters, per_page: 200 })
  const leads = data?.data ?? []

  const stats = useMemo(() => {
    const list = data?.data ?? []
    return {
      total:        list.length,
      newCount:     list.filter(l => l.status === 'new').length,
      trialBooked:  list.filter(l => l.status === 'trial_booked' || l.status === 'trial_completed').length,
      enrolled:     list.filter(l => l.status === 'enrolled').length,
      lost:         list.filter(l => l.status === 'lost').length,
    }
  }, [data])

  return (
    <>
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'rgb(11 31 58)' }}>Leads</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgb(90 100 112)' }}>
            Track prospective students through the enrollment pipeline.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div
            className="flex items-center gap-0.5 rounded-lg p-0.5 border"
            style={{ background: 'rgb(244 246 250)', borderColor: 'rgb(var(--border-default,229 233 240))' }}
          >
            {(['kanban', 'table'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="p-1.5 rounded-md transition-all"
                title={v === 'kanban' ? 'Kanban view' : 'Table view'}
                style={view === v ? {
                  background: '#fff',
                  color: 'rgb(14 124 90)',
                  boxShadow: '0 1px 3px rgb(11 31 58 / 0.08)',
                } : { color: 'rgb(90 100 112)' }}
              >
                {v === 'kanban' ? <LayoutGrid size={15} /> : <List size={15} />}
              </button>
            ))}
          </div>

          <button
            onClick={() => setDialogOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
            style={{ background: 'rgb(30 90 171)' }}
          >
            <Plus size={15} />
            New Lead
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard icon={<Users size={15} />}        label="Total"      value={stats.total}       accent="#0B1F3A" />
        <StatCard icon={<List size={15} />}         label="New"        value={stats.newCount}    accent="rgb(30 90 171)" />
        <StatCard icon={<CalendarCheck size={15} />} label="In Trial"  value={stats.trialBooked} accent="rgb(101 56 182)" />
        <StatCard icon={<GraduationCap size={15} />} label="Enrolled"  value={stats.enrolled}    accent="rgb(14 124 90)" />
      </div>

      {view === 'kanban' ? (
        <LeadKanban leads={leads} isLoading={isLoading} filters={filters} onFiltersChange={setFilters} />
      ) : (
        <LeadTable leads={leads} isLoading={isLoading} filters={filters} onFiltersChange={setFilters} />
      )}

      <AddLeadDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: string }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 rounded-xl border"
      style={{ background: '#fff', borderColor: 'rgb(var(--border-default,229 233 240))' }}
    >
      <div
        className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
        style={{ background: `color-mix(in srgb, ${accent} 10%, transparent)`, color: accent }}
      >
        {icon}
      </div>
      <div>
        <p className="text-xl font-semibold leading-none" style={{ color: 'rgb(11 31 58)' }}>{value}</p>
        <p className="text-xs mt-0.5" style={{ color: 'rgb(90 100 112)' }}>{label}</p>
      </div>
    </div>
  )
}
