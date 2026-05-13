'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { TeacherTable } from '@/components/system/teachers/TeacherTable'
import { TeacherForm, type TeacherFormValues } from '@/components/system/teachers/TeacherForm'
import { useTeachers, useUpdateTeacher } from '@/hooks/system/useTeachers'
import { useUrlFilters } from '@/lib/system/filters'
import { ApiError } from '@/lib/system/api'
import { X } from 'lucide-react'
import type { Teacher } from '@/types/system/teacher'

function AddTeacherSheet({ onClose }: { onClose: () => void }) {
  const update = useUpdateTeacher('new')
  const router = useRouter()

  async function handleSubmit(data: TeacherFormValues) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_SYSTEM_API_PREFIX ?? '/api/system'}/teachers`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(data),
        }
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new ApiError(res.status, body.message ?? 'Failed')
      }
      const created = await res.json()
      toast.success('Teacher created.')
      onClose()
      router.push(`/teachers/${created.data?.id ?? ''}`)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create teacher.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div
        className="relative ml-auto h-full w-full max-w-lg flex flex-col shadow-xl overflow-y-auto"
        style={{ background: 'rgb(var(--surface-bg, 244 246 250))' }}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ background: 'rgb(var(--surface-card, 255 255 255))', borderColor: 'rgb(var(--border-default, 229 233 240))' }}
        >
          <h2 className="font-semibold">Add teacher</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/5 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 p-6">
          <TeacherForm onSubmit={handleSubmit} isLoading={update.isPending} />
        </div>
      </div>
    </div>
  )
}

export default function TeachersPage() {
  const router = useRouter()
  const [showAdd, setShowAdd] = useState(false)
  const { filters, setFilter } = useUrlFilters(['q', 'is_active'])

  const { data, isLoading } = useTeachers({
    q:         filters.q || undefined,
    is_active: filters.is_active || undefined,
  })

  const teachers: Teacher[] = data?.data ?? []

  return (
    <>
      <PageHeader
        title="Teachers"
        description="Manage your teaching staff."
        actions={
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'rgb(14 124 90)' }}
          >
            <Plus size={16} />
            Add teacher
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
          <input
            value={filters.q}
            onChange={(e) => setFilter('q', e.target.value)}
            placeholder="Search teachers…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)]"
            style={{ borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }}
          />
        </div>

        <div className="flex rounded-xl overflow-hidden border text-sm" style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}>
          {(['', '1'] as const).map((val) => {
            const active = filters.is_active === val
            return (
              <button
                key={val}
                onClick={() => setFilter('is_active', val)}
                className="px-3 py-2 transition-colors"
                style={{
                  background: active ? 'rgb(14 124 90)' : 'rgb(var(--surface-card, 255 255 255))',
                  color: active ? 'white' : undefined,
                }}
              >
                {val === '' ? 'All' : 'Active'}
              </button>
            )
          })}
        </div>
      </div>

      <TeacherTable
        data={teachers}
        isLoading={isLoading}
        onRowClick={(t) => router.push(`/teachers/${t.id}`)}
      />

      {showAdd && <AddTeacherSheet onClose={() => setShowAdd(false)} />}
    </>
  )
}
