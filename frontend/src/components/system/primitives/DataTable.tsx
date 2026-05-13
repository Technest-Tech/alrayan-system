'use client'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
  type SortingState,
  type RowSelectionState,
  type VisibilityState,
} from '@tanstack/react-table'
import { useState, type ReactNode } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react'

export type { ColumnDef }

interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  toolbar?: ReactNode
  onRowClick?: (row: T) => void
  isLoading?: boolean
  emptyState?: ReactNode
  density?: 'compact' | 'default' | 'comfortable'
}

const DENSITY_CLS = {
  compact:     'py-1.5 px-3 text-xs',
  default:     'py-2.5 px-4 text-sm',
  comfortable: 'py-4 px-4 text-sm',
}

function SkeletonRows({ cols }: { cols: number }) {
  return Array.from({ length: 5 }).map((_, i) => (
    <tr key={i}>
      {Array.from({ length: cols }).map((_, j) => (
        <td key={j} className="px-4 py-3">
          <div className="h-4 rounded animate-pulse" style={{ background: 'rgb(var(--surface-card-2, 248 250 252))' }} />
        </td>
      ))}
    </tr>
  ))
}

export function DataTable<T>({
  data,
  columns,
  toolbar,
  onRowClick,
  isLoading,
  emptyState,
  density = 'default',
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    state: { sorting, rowSelection, columnVisibility },
    initialState: { pagination: { pageSize: 20 } },
  })

  const cellCls = DENSITY_CLS[density]

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}>
      {toolbar && (
        <div
          className="px-4 py-3 border-b"
          style={{ borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }}
        >
          {toolbar}
        </div>
      )}

      <div className="overflow-x-auto" style={{ background: 'rgb(var(--surface-card, 255 255 255))' }}>
        <table className="w-full">
          <thead style={{ background: 'rgb(var(--surface-card-2, 248 250 252))' }}>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} style={{ borderBottom: '1px solid rgb(var(--border-default, 229 233 240))' }}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className={`text-left font-medium text-xs uppercase tracking-wide opacity-60 ${cellCls}`}
                    style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <span className="inline-flex items-center gap-1">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        header.column.getIsSorted() === 'asc' ? <ChevronUp size={12} /> :
                        header.column.getIsSorted() === 'desc' ? <ChevronDown size={12} /> :
                        <ChevronsUpDown size={12} className="opacity-40" />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              <SkeletonRows cols={columns.length} />
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  {emptyState ?? <div className="py-16 text-center text-sm opacity-40">No results</div>}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  style={{
                    borderBottom: '1px solid rgb(var(--border-default, 229 233 240))',
                    cursor: onRowClick ? 'pointer' : 'default',
                  }}
                  className="transition-colors hover:bg-black/[0.02]"
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className={cellCls}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div
          className="flex items-center justify-between px-4 py-3 border-t text-sm"
          style={{ borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }}
        >
          <span className="opacity-50">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded hover:bg-black/5 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded hover:bg-black/5 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
