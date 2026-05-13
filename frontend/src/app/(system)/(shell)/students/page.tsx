'use client'
import { useRouter } from 'next/navigation'
import { Plus, Search, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { StudentTable } from '@/components/system/students/StudentTable'
import { SavedViewsDropdown } from '@/components/system/primitives/SavedViewsDropdown'
import { useStudents } from '@/hooks/system/useStudents'
import { useCourses } from '@/hooks/system/useCourses'
import { useTeachers } from '@/hooks/system/useTeachers'
import { useUrlFilters } from '@/lib/system/filters'
import type { Student } from '@/types/system/student'

const STATUS_OPTIONS = [
  { value: '',          label: 'All' },
  { value: 'trial',     label: 'Trial' },
  { value: 'active',    label: 'Active' },
  { value: 'paused',    label: 'Paused' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'cancelled', label: 'Cancelled' },
]

const AGE_OPTIONS = [
  { value: '',      label: 'All ages' },
  { value: 'child', label: 'Child' },
  { value: 'adult', label: 'Adult' },
]

const selectCls   = 'px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] appearance-none pr-7'
const selectStyle = { borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }

export default function StudentsPage() {
  const router = useRouter()
  const { filters, setFilter, resetFilters } = useUrlFilters(['q', 'status', 'course_id', 'assigned_teacher_id', 'country', 'age_category'])

  const { data, isLoading } = useStudents({
    q:                    filters.q || undefined,
    status:               filters.status || undefined,
    course_id:            filters.course_id || undefined,
    assigned_teacher_id:  filters.assigned_teacher_id || undefined,
    country:              filters.country || undefined,
    age_category:         filters.age_category || undefined,
  })

  const { data: courses = [] } = useCourses()
  const { data: teachersData }  = useTeachers()
  const teachers = teachersData?.data ?? []

  const students: Student[] = data?.data ?? []
  const hasFilters = Object.values(filters).some(Boolean)

  function handleApplySavedView(params: string) {
    router.push('?' + params, { scroll: false })
  }

  return (
    <>
      <PageHeader
        title="Students"
        description="Manage your student roster and enrolments."
        actions={
          <Link
            href="/students/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'rgb(14 124 90)' }}
          >
            <Plus size={16} />
            New student
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
          <input
            value={filters.q}
            onChange={(e) => setFilter('q', e.target.value)}
            placeholder="Search students…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)]"
            style={selectStyle}
          />
        </div>

        <select
          value={filters.status}
          onChange={(e) => setFilter('status', e.target.value)}
          className={selectCls}
          style={selectStyle}
        >
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <select
          value={filters.course_id}
          onChange={(e) => setFilter('course_id', e.target.value)}
          className={selectCls}
          style={selectStyle}
        >
          <option value="">All courses</option>
          {courses.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
        </select>

        <select
          value={filters.assigned_teacher_id}
          onChange={(e) => setFilter('assigned_teacher_id', e.target.value)}
          className={selectCls}
          style={selectStyle}
        >
          <option value="">All teachers</option>
          {teachers.map((t) => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
        </select>

        <select
          value={filters.age_category}
          onChange={(e) => setFilter('age_category', e.target.value)}
          className={selectCls}
          style={selectStyle}
        >
          {AGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <SavedViewsDropdown context="students" onApply={handleApplySavedView} />

        {hasFilters && (
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border hover:bg-black/5 transition-colors opacity-60 hover:opacity-100"
            style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}
          >
            <RotateCcw size={13} />
            Reset
          </button>
        )}
      </div>

      <StudentTable
        data={students}
        isLoading={isLoading}
        onRowClick={(s) => router.push(`/students/${s.id}`)}
      />
    </>
  )
}
