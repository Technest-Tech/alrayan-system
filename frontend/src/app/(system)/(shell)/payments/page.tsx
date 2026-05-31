'use client'
import { useState, useMemo } from 'react'
import {
  Search, CreditCard, Users, Layers, Clock, TrendingUp,
  ChevronLeft, ChevronRight, GraduationCap,
} from 'lucide-react'
import { usePayments, usePaymentStats } from '@/hooks/system/usePayments'
import { useTeachers }                  from '@/hooks/system/useTeachers'
import { ManagePackagesModal }          from '@/components/system/payments/ManagePackagesModal'
import { SearchableSelect }             from '@/components/system/lessons/SearchableSelect'
import type { PaymentRow, PackageStatus } from '@/types/system/payment'

/* ── Design tokens ─────────────────────────────────────── */
const BORDER   = 'rgb(var(--border-default,229 233 240))'
const NAVY     = 'rgb(11 31 58)'
const MUTED    = 'rgb(90 100 112)'
const TEAL_50  = '#F0FDFA'
const TEAL_100 = '#CCFBF1'
const TEAL_400 = '#2DD4BF'
const TEAL_600 = '#0d9488'

/* ── Helpers ───────────────────────────────────────────── */
function fmtMoney(minor: number, currency: string) {
  return `${currency} ${(minor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

const STATUS_STYLE: Record<PackageStatus, { bg: string; color: string; label: string }> = {
  pending:   { bg: '#FEF2F2', color: '#B91C1C',  label: 'Pending'       },
  paid:      { bg: '#111827', color: '#ffffff',  label: 'Active (Paid)' },
  suspended: { bg: '#F3F4F6', color: '#6B7280',  label: 'Suspended'     },
}

function PayStatusBadge({ status }: { status: PackageStatus }) {
  const s = STATUS_STYLE[status]
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

/* ── Stat card ─────────────────────────────────────────── */
function StatCard({ icon, label, value, sub, iconBg, iconColor }: {
  icon: React.ReactNode; label: string; value: string | number; sub: string
  iconBg: string; iconColor: string
}) {
  return (
    <div className="rounded-2xl border p-5 flex items-start justify-between" style={{ background: '#fff', borderColor: BORDER, boxShadow: '0 1px 4px rgb(0 0 0 / 0.04)' }}>
      <div>
        <p className="text-xs font-medium mb-3" style={{ color: MUTED }}>{label}</p>
        <p className="text-2xl font-bold" style={{ color: NAVY }}>{value}</p>
        <p className="text-xs mt-1" style={{ color: MUTED }}>{sub}</p>
      </div>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: iconBg }}>
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
    </div>
  )
}

const SORT_OPTIONS = [
  { value: 'latest',     label: 'Newest first'   },
  { value: 'name_asc',   label: 'Name A → Z'     },
  { value: 'name_desc',  label: 'Name Z → A'     },
  { value: 'tariff_desc', label: 'Tariff: High → Low' },
  { value: 'tariff_asc',  label: 'Tariff: Low → High' },
]

const STATUS_FILTER_OPTIONS = [
  { value: 'pending',   label: 'Pending'       },
  { value: 'paid',      label: 'Active (Paid)' },
  { value: 'suspended', label: 'Suspended'     },
]

const PER_PAGE_OPTIONS = [
  { value: '10', label: '10 / page' },
  { value: '20', label: '20 / page' },
  { value: '50', label: '50 / page' },
]

/* ── Main page ─────────────────────────────────────────── */
export default function PaymentsPage() {
  const [search,     setSearch]     = useState('')
  const [status,     setStatus]     = useState('')
  const [teacherId,  setTeacherId]  = useState('')
  const [sortBy,     setSortBy]     = useState('latest')
  const [perPage,    setPerPage]    = useState(20)
  const [page,       setPage]       = useState(1)

  const [modalStudent, setModalStudent] = useState<{ id: number; name: string } | null>(null)

  const { data: stats }        = usePaymentStats()
  const { data: teachersData } = useTeachers()
  const teachers               = teachersData?.data ?? []

  const params = useMemo(() => ({
    search:         search || undefined,
    payment_status: status || undefined,
    teacher_id:     teacherId || undefined,
    sort_by:        sortBy,
    per_page:       perPage,
    page,
  }), [search, status, teacherId, sortBy, perPage, page])

  const { data } = usePayments(params)
  const rows     = data?.data ?? []
  const total    = data?.meta?.total ?? 0
  const lastPage = data?.meta?.last_page ?? 1

  function resetPage() { setPage(1) }

  return (
    <>
      {/* ── Page header ─────────────────────────────────── */}
      <div className="relative rounded-2xl mb-5 px-6 py-5 overflow-hidden" style={{ background: `linear-gradient(135deg, #fff 60%, ${TEAL_50})`, border: `1px solid ${TEAL_100}` }}>
        {(['top-3 left-4', 'top-3 right-4', 'bottom-3 left-4', 'bottom-3 right-4'] as const).map(pos => (
          <span key={pos} className={`absolute ${pos} select-none pointer-events-none text-sm`} style={{ color: TEAL_400 }}>◇</span>
        ))}
        <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: `linear-gradient(to right, ${TEAL_600}, ${TEAL_400}, transparent)` }} />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: TEAL_50, border: `1px solid ${TEAL_100}` }}>
            <CreditCard size={20} style={{ color: TEAL_600 }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold" style={{ color: NAVY }}>Payments</h1>
              <span style={{ color: TEAL_400, fontSize: 11, lineHeight: 1 }}>✦</span>
            </div>
            <p className="text-sm mt-0.5" style={{ color: MUTED }}>Manage student packages and payment status.</p>
          </div>
        </div>
      </div>

      {/* ── Stats row ───────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard
          icon={<Users size={18} />}
          label="Students with Pending Payments"
          value={stats?.pending_students ?? '—'}
          sub={`${stats?.pending_students ?? 0} Students`}
          iconBg="#EFF6FF" iconColor="#1D4ED8"
        />
        <StatCard
          icon={<Layers size={18} />}
          label="Multiple Unpaid Packages"
          value={stats?.multiple_unpaid ?? '—'}
          sub={`${stats?.multiple_unpaid ?? 0} Packages`}
          iconBg="#FFF7ED" iconColor="#C2410C"
        />
        <StatCard
          icon={<Clock size={18} />}
          label="Total Pending Amount"
          value={stats ? fmtMoney(stats.total_pending_minor, stats.currency) : '—'}
          sub="Total Owed"
          iconBg="#FEFCE8" iconColor="#A16207"
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          label="Received This Month"
          value={stats ? fmtMoney(stats.received_month_minor, stats.currency) : '—'}
          sub="Revenue"
          iconBg="#F0FDF4" iconColor="#15803D"
        />
      </div>

      {/* ── Filters ─────────────────────────────────────── */}
      <div className="rounded-2xl border mb-4 overflow-hidden" style={{ borderColor: BORDER, background: '#fff', boxShadow: '0 1px 4px rgb(0 0 0 / 0.04)' }}>
        <div className="h-0.5" style={{ background: `linear-gradient(to right, ${TEAL_600}, ${TEAL_400}, transparent)` }} />
        <div className="px-4 py-4 flex flex-wrap items-end gap-3">

          {/* Search */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
            <label className="text-xs font-medium" style={{ color: MUTED }}>Search</label>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: MUTED }} />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); resetPage() }}
                placeholder="Search student or phone…"
                className="w-full pl-8 pr-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#0d9488] transition-shadow"
                style={{ borderColor: BORDER }}
              />
            </div>
          </div>

          {/* Payment status */}
          <div className="flex flex-col gap-1.5 w-44">
            <label className="text-xs font-medium" style={{ color: MUTED }}>Payment Status</label>
            <SearchableSelect
              options={STATUS_FILTER_OPTIONS}
              value={status}
              onChange={v => { setStatus(v); resetPage() }}
              placeholder="All Statuses"
              clearable
            />
          </div>

          {/* Teacher */}
          <div className="flex flex-col gap-1.5 w-48">
            <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: MUTED }}>
              <GraduationCap size={12} />
              Teacher
            </label>
            <SearchableSelect
              options={teachers.map(t => ({ value: String(t.id), label: (t as any).name ?? `Teacher #${t.id}` }))}
              value={teacherId}
              onChange={v => { setTeacherId(v); resetPage() }}
              placeholder="All Teachers"
              clearable
            />
          </div>

          {/* Sort */}
          <div className="flex flex-col gap-1.5 w-48">
            <label className="text-xs font-medium" style={{ color: MUTED }}>Sort By</label>
            <SearchableSelect
              options={SORT_OPTIONS}
              value={sortBy}
              onChange={v => { setSortBy(v); resetPage() }}
            />
          </div>

          {/* Per page */}
          <div className="flex flex-col gap-1.5 w-32">
            <label className="text-xs font-medium" style={{ color: MUTED }}>Rows per page</label>
            <SearchableSelect
              options={PER_PAGE_OPTIONS}
              value={String(perPage)}
              onChange={v => { setPerPage(Number(v)); resetPage() }}
            />
          </div>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────── */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: BORDER, background: '#fff', boxShadow: '0 1px 4px rgb(0 0 0 / 0.04)' }}>

        {/* Count bar */}
        <div className="px-4 py-2.5 border-b flex items-center justify-between" style={{ borderColor: BORDER, background: '#FAFAFA' }}>
          <p className="text-xs" style={{ color: MUTED }}>
            Showing <strong style={{ color: NAVY }}>{rows.length ? (page - 1) * perPage + 1 : 0}–{Math.min(page * perPage, total)}</strong> of <strong style={{ color: NAVY }}>{total}</strong>
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: `1px solid ${BORDER}` }}>
                {['Student', 'Teacher', 'Phone', 'Payment Status', 'Current Package', 'Tariff', 'Notes', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold whitespace-nowrap" style={{ color: MUTED }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm" style={{ color: MUTED }}>
                    No students found.
                  </td>
                </tr>
              ) : rows.map((row, idx) => (
                <tr
                  key={row.package_id}
                  className="hover:bg-black/[0.015] transition-colors"
                  style={{ borderBottom: idx < rows.length - 1 ? `1px solid ${BORDER}` : undefined }}
                >
                  {/* Student */}
                  <td className="px-4 py-3">
                    <p className="font-semibold text-sm" style={{ color: NAVY }}>{row.student_name}</p>
                  </td>

                  {/* Teacher */}
                  <td className="px-4 py-3 text-sm" style={{ color: MUTED }}>
                    {row.teacher_name ?? '—'}
                  </td>

                  {/* Phone */}
                  <td className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: MUTED }}>
                    {row.phone ?? '—'}
                  </td>

                  {/* Status badge */}
                  <td className="px-4 py-3">
                    <PayStatusBadge status={row.payment_status} />
                  </td>

                  {/* Current package progress */}
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium" style={{ color: NAVY }}>
                      #{row.package_number}
                    </span>
                    <span className="text-xs ml-1.5" style={{ color: MUTED }}>
                      {row.consumed_hours.toFixed(1)}/{row.package_hours}h
                    </span>
                    {row.needs_reconfirmation && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded text-xs font-medium" style={{ background: '#FFF7ED', color: '#C2410C' }}>
                        ⚠ Re-confirm
                      </span>
                    )}
                  </td>

                  {/* Tariff */}
                  <td className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: NAVY }}>
                    {fmtMoney(row.tariff_at_time, row.currency)}
                  </td>

                  {/* Notes */}
                  <td className="px-4 py-3 max-w-[160px]">
                    <span className="text-xs truncate block" style={{ color: MUTED }}>
                      {row.notes ? `Last Pay Note: ${row.notes}` : '—'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setModalStudent({ id: row.student_id, name: row.student_name })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-85"
                      style={{ background: TEAL_600 }}
                    >
                      Manage Packages
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {lastPage > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-end gap-2" style={{ borderColor: BORDER }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border hover:bg-black/5 transition-colors disabled:opacity-40"
              style={{ borderColor: BORDER }}
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-xs px-2" style={{ color: MUTED }}>
              Page {page} of {lastPage}
            </span>
            <button
              onClick={() => setPage(p => Math.min(lastPage, p + 1))}
              disabled={page === lastPage}
              className="p-1.5 rounded-lg border hover:bg-black/5 transition-colors disabled:opacity-40"
              style={{ borderColor: BORDER }}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>

      {/* ── Manage Packages modal ────────────────────────── */}
      <ManagePackagesModal
        studentId={modalStudent?.id ?? null}
        studentName={modalStudent?.name ?? ''}
        open={!!modalStudent}
        onClose={() => setModalStudent(null)}
      />
    </>
  )
}
