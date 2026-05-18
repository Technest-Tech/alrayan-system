'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Users, GraduationCap, UserX } from 'lucide-react'
import { TeacherTable } from '@/components/system/teachers/TeacherTable'
import { AddTeacherDialog } from '@/components/system/teachers/AddTeacherDialog'
import { useTeachers } from '@/hooks/system/useTeachers'
import { useUrlFilters } from '@/lib/system/filters'
import type { Teacher } from '@/types/system/teacher'

const STATUS_PILLS = [
  { value: '',  label: 'All' },
  { value: '1', label: 'Active' },
  { value: '0', label: 'Inactive' },
]

const selStyle = { borderColor: 'rgb(var(--border-default,229 233 240))', background: '#fff' }

export default function TeachersPage() {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const { filters, setFilter } = useUrlFilters(['q', 'is_active'])

  const { data, isLoading } = useTeachers({
    q:         filters.q || undefined,
    is_active: filters.is_active || undefined,
  })

  const teachers: Teacher[] = data?.data ?? []

  const stats = useMemo(() => {
    const list = data?.data ?? []
    return {
      total:    list.length,
      active:   list.filter(t => t.is_active).length,
      inactive: list.filter(t => !t.is_active).length,
    }
  }, [data])

  return (
    <>
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'rgb(11 31 58)' }}>Teachers</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgb(90 100 112)' }}>Manage your teaching staff and availability.</p>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
          style={{ background: 'rgb(14 124 90)' }}
        >
          <Plus size={15} />
          Add Teacher
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard icon={<Users size={15} />}         label="Total"    value={stats.total}    accent="#0B1F3A" />
        <StatCard icon={<GraduationCap size={15} />} label="Active"   value={stats.active}   accent="rgb(14 124 90)" />
        <StatCard icon={<UserX size={15} />}         label="Inactive" value={stats.inactive} accent="rgb(90 100 112)" />
      </div>

      {/* ── Filters card ── */}
      <div
        className="rounded-xl border mb-4 overflow-hidden"
        style={{ borderColor: 'rgb(var(--border-default,229 233 240))', background: '#fff' }}
      >
        {/* Status pills */}
        <div
          className="flex items-center gap-1.5 px-4 py-3 border-b"
          style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}
        >
          {STATUS_PILLS.map(p => {
            const active = filters.is_active === p.value
            return (
              <button
                key={p.value}
                onClick={() => setFilter('is_active', p.value)}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all"
                style={active ? {
                  background: 'rgb(14 124 90)',
                  color: '#fff',
                  boxShadow: '0 1px 4px rgb(14 124 90 / 0.3)',
                } : {
                  background: 'transparent',
                  color: 'rgb(90 100 112)',
                  border: '1px solid rgb(var(--border-default,229 233 240))',
                }}
              >
                {p.label}
              </button>
            )
          })}
        </div>

        {/* Search row */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="relative flex-1 min-w-44 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
            <input
              value={filters.q}
              onChange={e => setFilter('q', e.target.value)}
              placeholder="Search teachers…"
              className="w-full pl-8 pr-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] transition-shadow"
              style={selStyle}
            />
          </div>
        </div>
      </div>

      <TeacherTable
        data={teachers}
        isLoading={isLoading}
        onRowClick={t => router.push(`/teachers/${t.id}`)}
      />

      <AddTeacherDialog open={dialogOpen} onOpenChange={setDialogOpen} />
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
