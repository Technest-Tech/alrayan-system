'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  Settings2,
} from 'lucide-react'
import { formatMoney } from '@/lib/money'
import type {
  StudentAnalyticsFilters,
  StudentAnalyticsRecord,
  StudentAnalyticsResponse,
} from '@/types/system/studentAnalytics'

interface StudentAnalyticsTableProps {
  records: StudentAnalyticsResponse['records']
  teachers: StudentAnalyticsResponse['filters']['teachers']
  filters: StudentAnalyticsFilters
  search: string
  onSearchChange: (value: string) => void
  onFiltersChange: (next: Partial<StudentAnalyticsFilters>) => void
  fetching?: boolean
}

const statusStyle = {
  trial: 'border-sky-200 bg-sky-50 text-sky-700',
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  paused: 'border-amber-200 bg-amber-50 text-amber-700',
  suspended: 'border-orange-200 bg-orange-50 text-orange-700',
  cancelled: 'border-slate-200 bg-slate-50 text-slate-600',
} as const

const statusLabel = {
  trial: 'New',
  active: 'Active',
  paused: 'Inactive',
  suspended: 'Suspended',
  cancelled: 'Archived',
} as const

function SortHeader({
  label,
  sort,
  filters,
  onChange,
}: {
  label: string
  sort: string
  filters: StudentAnalyticsFilters
  onChange: (next: Partial<StudentAnalyticsFilters>) => void
}) {
  const active = filters.sort === sort
  return (
    <button
      type="button"
      onClick={() => onChange({
        sort,
        direction: active && filters.direction === 'asc' ? 'desc' : 'asc',
        page: 1,
      })}
      className={`inline-flex items-center gap-1 whitespace-nowrap font-semibold transition-colors ${
        active ? 'text-slate-950' : 'text-slate-600 hover:text-slate-950'
      }`}
    >
      {label}
      <ArrowDownUp size={11} className={active ? 'opacity-80' : 'opacity-35'} />
    </button>
  )
}

function exportRecords(records: StudentAnalyticsRecord[]) {
  const rows = records.map(row => [
    row.name,
    row.teacher?.name ?? '',
    row.course ?? '',
    row.phone ?? '',
    row.package_hours,
    row.currency,
    row.package_price_minor / 100,
    row.price_per_hour_minor / 100,
    row.teacher_rate,
    row.hours_left,
    row.remaining_balance_minor / 100,
    row.lessons,
    row.last_activity ?? '',
    statusLabel[row.status],
  ])
  const header = [
    'Student Name', 'Teacher', 'Course', 'Phone', 'Package Hours', 'Currency',
    'Package Price', 'Price / Hour', 'Teacher Rate', 'Hours Left', 'Remaining Balance',
    'Lessons', 'Last Activity', 'Status',
  ]
  const csv = [header, ...rows]
    .map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `student-analytics-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function StudentAnalyticsTable({
  records,
  teachers,
  filters,
  search,
  onSearchChange,
  onFiltersChange,
  fetching,
}: StudentAnalyticsTableProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [columns, setColumns] = useState({
    course: true,
    phone: true,
    package: true,
    rate: true,
    balance: true,
    activity: true,
  })
  const shownColumns = useMemo(() => Object.values(columns).filter(Boolean).length, [columns])

  return (
    <section aria-labelledby="student-records-title">
      <div className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_170px_210px]">
        <label className="relative block">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={event => onSearchChange(event.target.value)}
            placeholder="Search by student name, email, or phone..."
            className="h-11 w-full rounded-xl border bg-white pl-9 pr-3 text-sm outline-none transition-shadow placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-500/10"
            style={{ borderColor: 'rgb(var(--border-default))' }}
          />
        </label>
        <select
          value={filters.status}
          onChange={event => onFiltersChange({ status: event.target.value, page: 1 })}
          aria-label="Student status"
          className="h-11 rounded-xl border bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10"
          style={{ borderColor: 'rgb(var(--border-default))' }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="new">New</option>
          <option value="suspended">Suspended</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={filters.teacher_id}
          onChange={event => onFiltersChange({ teacher_id: event.target.value, page: 1 })}
          aria-label="Assigned teacher"
          className="h-11 rounded-xl border bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10"
          style={{ borderColor: 'rgb(var(--border-default))' }}
        >
          <option value="">All teachers</option>
          {teachers.map(teacher => (
            <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
          ))}
        </select>
      </div>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="student-records-title" className="text-xl font-bold tracking-tight text-slate-950">Student Records</h2>
          <p className="mt-1 text-xs text-slate-400">
            {records.meta.total === 0
              ? 'No students found'
              : `Showing ${records.meta.from}–${records.meta.to} of ${records.meta.total.toLocaleString()}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportRecords(records.data)}
            disabled={records.data.length === 0}
            className="inline-flex h-9 items-center gap-2 rounded-lg border bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
            style={{ borderColor: 'rgb(var(--border-default))' }}
          >
            <Download size={14} />
            Export data
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setSettingsOpen(open => !open)}
              className="inline-flex h-9 items-center gap-2 rounded-lg border bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              style={{ borderColor: 'rgb(var(--border-default))' }}
              aria-expanded={settingsOpen}
            >
              <Settings2 size={14} />
              Columns ({shownColumns})
            </button>
            {settingsOpen && (
              <div
                className="absolute right-0 top-11 z-20 w-56 rounded-xl border bg-white p-3 shadow-xl"
                style={{ borderColor: 'rgb(var(--border-default))' }}
              >
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Visible columns</p>
                {Object.entries(columns).map(([key, visible]) => (
                  <label key={key} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs capitalize text-slate-700 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={visible}
                      onChange={() => setColumns(current => ({ ...current, [key]: !current[key as keyof typeof current] }))}
                      className="accent-emerald-600"
                    />
                    {key}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className={`relative mt-4 overflow-hidden rounded-2xl border bg-white transition-opacity ${fetching ? 'opacity-70' : ''}`}
        style={{ borderColor: 'rgb(var(--border-default))' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1280px] border-collapse text-left">
            <thead>
              <tr className="border-b bg-slate-50/70 text-[11px]" style={{ borderColor: 'rgb(var(--border-default))' }}>
                <th className="px-4 py-3"><SortHeader label="Student Name" sort="name" filters={filters} onChange={onFiltersChange} /></th>
                <th className="px-4 py-3 font-semibold text-slate-600">Teacher</th>
                {columns.course && <th className="px-4 py-3 font-semibold text-slate-600">Course</th>}
                {columns.phone && <th className="px-4 py-3 font-semibold text-slate-600">Phone</th>}
                {columns.package && (
                  <>
                    <th className="px-4 py-3 font-semibold text-slate-600">Package</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Package price</th>
                  </>
                )}
                {columns.rate && (
                  <>
                    <th className="px-4 py-3 font-semibold text-slate-600">Price / hour</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Teacher rate</th>
                  </>
                )}
                {columns.balance && (
                  <>
                    <th className="px-4 py-3 font-semibold text-slate-600">Hours left</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Balance</th>
                  </>
                )}
                <th className="px-4 py-3"><SortHeader label="Lessons" sort="lessons" filters={filters} onChange={onFiltersChange} /></th>
                {columns.activity && <th className="px-4 py-3"><SortHeader label="Last activity" sort="last_activity" filters={filters} onChange={onFiltersChange} /></th>}
                <th className="px-4 py-3"><SortHeader label="Status" sort="status" filters={filters} onChange={onFiltersChange} /></th>
              </tr>
            </thead>
            <tbody>
              {records.data.map(row => (
                <tr key={row.id} className="border-b text-xs text-slate-700 transition-colors last:border-b-0 hover:bg-slate-50/70" style={{ borderColor: 'rgb(var(--border-default))' }}>
                  <td className="px-4 py-3.5">
                    <Link href={`/students/${row.id}`} className="font-semibold text-slate-950 hover:text-emerald-700 hover:underline">
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">{row.teacher?.name || <span className="text-slate-400">Unassigned</span>}</td>
                  {columns.course && <td className="px-4 py-3.5">{row.course || <span className="text-slate-400">No course</span>}</td>}
                  {columns.phone && <td className="px-4 py-3.5 tabular-nums">{row.phone || '—'}</td>}
                  {columns.package && (
                    <>
                      <td className="px-4 py-3.5 font-medium tabular-nums">{row.package_hours.toLocaleString()}h</td>
                      <td className="px-4 py-3.5 font-medium tabular-nums">{formatMoney(row.package_price_minor, row.currency)}</td>
                    </>
                  )}
                  {columns.rate && (
                    <>
                      <td className="px-4 py-3.5 tabular-nums">{formatMoney(row.price_per_hour_minor, row.currency)}/h</td>
                      <td className="px-4 py-3.5 tabular-nums">
                        {row.teacher_rate > 0 ? `${row.teacher_currency || ''} ${row.teacher_rate.toLocaleString()}/h`.trim() : 'General rate'}
                      </td>
                    </>
                  )}
                  {columns.balance && (
                    <>
                      <td className={`px-4 py-3.5 font-semibold tabular-nums ${row.hours_left <= 0 ? 'text-orange-600' : 'text-slate-700'}`}>
                        {row.hours_left.toLocaleString()}h
                      </td>
                      <td className={`px-4 py-3.5 font-medium tabular-nums ${row.remaining_balance_minor < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {formatMoney(row.remaining_balance_minor, row.currency)}
                      </td>
                    </>
                  )}
                  <td className="px-4 py-3.5 text-center font-semibold tabular-nums">{row.lessons.toLocaleString()}</td>
                  {columns.activity && (
                    <td className="px-4 py-3.5 text-slate-500">
                      {row.last_activity
                        ? formatDistanceToNow(new Date(row.last_activity), { addSuffix: true })
                        : '—'}
                    </td>
                  )}
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusStyle[row.status]}`}>
                      {statusLabel[row.status]}
                    </span>
                  </td>
                </tr>
              ))}
              {records.data.length === 0 && (
                <tr>
                  <td colSpan={16} className="px-4 py-16 text-center text-sm text-slate-400">
                    No students match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t bg-slate-50/40 px-4 py-3" style={{ borderColor: 'rgb(var(--border-default))' }}>
          <label className="flex items-center gap-2 text-xs text-slate-500">
            Rows per page
            <select
              value={filters.per_page}
              onChange={event => onFiltersChange({ per_page: Number(event.target.value), page: 1 })}
              className="h-8 rounded-lg border bg-white px-2 text-xs font-semibold text-slate-700"
              style={{ borderColor: 'rgb(var(--border-default))' }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
          <div className="flex items-center gap-2">
            <span className="mr-1 text-xs text-slate-500">
              Page {records.meta.current_page} of {Math.max(1, records.meta.last_page)}
            </span>
            <button
              type="button"
              onClick={() => onFiltersChange({ page: filters.page - 1 })}
              disabled={filters.page <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-35"
              style={{ borderColor: 'rgb(var(--border-default))' }}
              aria-label="Previous page"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              onClick={() => onFiltersChange({ page: filters.page + 1 })}
              disabled={filters.page >= records.meta.last_page}
              className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-35"
              style={{ borderColor: 'rgb(var(--border-default))' }}
              aria-label="Next page"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </footer>
      </div>
    </section>
  )
}
