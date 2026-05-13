'use client'
import { useState } from 'react'
import { Rows3 } from 'lucide-react'
import type { Student } from '@/types/system/student'
import { DataTable, type ColumnDef } from '@/components/system/primitives/DataTable'
import { StudentStatusBadge } from './StudentStatusBadge'
import { EmptyState } from '@/components/system/primitives/EmptyState'
import { type RowSelectionState } from '@tanstack/react-table'

type Density = 'compact' | 'default' | 'comfortable'

interface StudentTableProps {
  data: Student[]
  isLoading: boolean
  onRowClick: (s: Student) => void
}

function formatPrice(student: Student) {
  const major = student.monthly_price_minor / 100
  return `${student.currency} ${major.toFixed(0)}/mo`
}

function formatSessions(student: Student) {
  return `${student.sessions_per_month} × ${student.session_duration_min}m`
}

export function StudentTable({ data, isLoading, onRowClick }: StudentTableProps) {
  const [density, setDensity] = useState<Density>('default')
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const selectedIds = Object.keys(rowSelection).filter((k) => rowSelection[k])

  const columns: ColumnDef<Student>[] = [
    {
      id:     'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="accent-[rgb(14,124,90)]"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          onClick={(e) => e.stopPropagation()}
          className="accent-[rgb(14,124,90)]"
        />
      ),
      enableSorting: false,
    },
    {
      id:     'name',
      header: 'Student',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-xs opacity-50">{row.original.country}</p>
        </div>
      ),
    },
    {
      id:     'course',
      header: 'Course',
      cell: ({ row }) => row.original.course?.name ?? <span className="opacity-40">—</span>,
    },
    {
      id:     'teacher',
      header: 'Teacher',
      cell: ({ row }) => row.original.assigned_teacher?.name ?? <span className="opacity-40">—</span>,
    },
    {
      id:     'sessions',
      header: 'Sessions',
      cell: ({ row }) => <span className="tabular-nums">{formatSessions(row.original)}</span>,
    },
    {
      id:     'price',
      header: 'Price',
      cell: ({ row }) => <span className="tabular-nums text-sm">{formatPrice(row.original)}</span>,
    },
    {
      id:     'status',
      header: 'Status',
      cell: ({ row }) => <StudentStatusBadge status={row.original.status} />,
    },
  ]

  const toolbar = (
    <div className="flex items-center justify-between">
      {selectedIds.length > 0 ? (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{selectedIds.length} selected</span>
          <button className="text-sm px-3 py-1.5 rounded-lg border hover:bg-black/5 transition-colors" style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}>
            Export
          </button>
        </div>
      ) : (
        <span className="text-sm opacity-50">{data.length} students</span>
      )}

      <div className="flex items-center gap-1">
        {(['compact', 'default', 'comfortable'] as Density[]).map((d) => (
          <button
            key={d}
            title={d}
            onClick={() => setDensity(d)}
            className="p-1.5 rounded-lg transition-colors capitalize text-xs"
            style={{
              background: density === d ? 'rgb(14 124 90 / 0.1)' : undefined,
              color: density === d ? 'rgb(14 124 90)' : undefined,
            }}
          >
            {d === 'compact' ? <Rows3 size={14} /> : d === 'default' ? <Rows3 size={16} /> : <Rows3 size={18} />}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <DataTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      onRowClick={onRowClick}
      density={density}
      toolbar={toolbar}
      emptyState={
        <EmptyState
          icon="Users"
          title="No students found"
          description="Try adjusting your filters."
        />
      }
    />
  )
}
