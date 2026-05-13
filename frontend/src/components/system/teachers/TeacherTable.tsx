'use client'
import type { Teacher } from '@/types/system/teacher'
import type { SystemCourse } from '@/types/system/course'
import { DataTable, type ColumnDef } from '@/components/system/primitives/DataTable'
import { StatusBadge } from '@/components/system/primitives/StatusBadge'
import { EmptyState } from '@/components/system/primitives/EmptyState'
import { useCourses } from '@/hooks/system/useCourses'

interface TeacherTableProps {
  data: Teacher[]
  isLoading: boolean
  onRowClick?: (t: Teacher) => void
}

function formatEGP(perMinute: number) {
  const perHour = perMinute * 60
  return `EGP ${perHour.toFixed(0)}/hr`
}

export function TeacherTable({ data, isLoading, onRowClick }: TeacherTableProps) {
  const { data: courses = [] } = useCourses()
  const courseMap = Object.fromEntries(courses.map((c: SystemCourse) => [c.id, c.name]))

  const columns: ColumnDef<Teacher>[] = [
    {
      id: 'name',
      header: 'Teacher',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name ?? '—'}</p>
          <p className="text-xs opacity-50">{row.original.email ?? ''}</p>
        </div>
      ),
    },
    {
      id: 'courses',
      header: 'Courses',
      cell: ({ row }) => {
        const names = row.original.teachable_course_ids.map((id) => courseMap[id]).filter(Boolean)
        if (!names.length) return <span className="opacity-40">—</span>
        return (
          <div className="flex flex-wrap gap-1">
            {names.map((n) => (
              <span
                key={n}
                className="text-xs px-1.5 py-0.5 rounded-md"
                style={{ background: 'rgb(var(--surface-card-2, 248 250 252))', border: '1px solid rgb(var(--border-default, 229 233 240))' }}
              >
                {n}
              </span>
            ))}
          </div>
        )
      },
    },
    {
      id: 'student_count',
      header: 'Students',
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.student_count ?? 0}</span>
      ),
    },
    {
      id: 'rate',
      header: 'Rate (60-min)',
      cell: ({ row }) => (
        <span className="tabular-nums text-sm">{formatEGP(row.original.per_minute_rate_60)}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge value={row.original.is_active ? 'active' : 'inactive'} />
      ),
    },
  ]

  return (
    <DataTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      onRowClick={onRowClick}
      emptyState={
        <EmptyState
          icon="GraduationCap"
          title="No teachers found"
          description="Try adjusting your filters."
        />
      }
    />
  )
}
