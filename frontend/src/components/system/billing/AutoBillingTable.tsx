'use client'
import { Fragment, useMemo, useState } from 'react'
import {
  Search, X, Loader2, CheckCircle2, RefreshCw,
  ChevronLeft, ChevronRight, MessageCircle, DollarSign, Users, FileText,
  ExternalLink, User as UserIcon, ChevronDown, CalendarDays,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { formatMinor } from '@/lib/money'
import {
  useAutoBilling, useMarkBillPaid, useSendBillWhatsApp,
  type AutoBillingRow, type AutoBillingFilters, type AutoBillingSessionRow,
} from '@/hooks/system/useAutoBilling'

/* ─── period helpers ─────────────────────────────────────── */
function currentPeriod(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function shiftPeriod(period: string, dir: number): string {
  const [y, m] = period.split('-').map(Number)
  const d = new Date(y, m - 1 + dir, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function formatPeriod(period: string): string {
  const [y, m] = period.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/* ─── stat card ──────────────────────────────────────────── */
function StatCard({ icon, label, value, accent }: {
  icon: React.ReactNode; label: string; value: string | number; accent: string
}) {
  return (
    <div className="rounded-xl border bg-white p-4 flex items-center gap-3"
      style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `color-mix(in srgb, ${accent} 10%, transparent)`, color: accent }}>
        {icon}
      </div>
      <div>
        <p className="text-xl font-semibold leading-none" style={{ color: 'rgb(11 31 58)' }}>{value}</p>
        <p className="text-xs mt-0.5" style={{ color: 'rgb(90 100 112)' }}>{label}</p>
      </div>
    </div>
  )
}

/* ─── filter pill ────────────────────────────────────────── */
function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
        active ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
      }`}>
      {label}
    </button>
  )
}

/* ─── row actions ────────────────────────────────────────── */
function RowActions({ row, period, onRefetch }: {
  row: AutoBillingRow; period: string; onRefetch: () => void
}) {
  const markPaid = useMarkBillPaid()
  const sendBill = useSendBillWhatsApp()

  async function doMarkPaid() {
    try {
      await markPaid.mutateAsync({ studentId: row.student_id, period })
      toast.success(`${row.student_name} marked as paid.`)
      onRefetch()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to mark paid.')
    }
  }

  async function doSendBill() {
    try {
      const res = await sendBill.mutateAsync({ studentId: row.student_id, period })
      toast.success(`Bill sent to ${res.recipient} ✓`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to send bill.')
    }
  }

  const isMarking = markPaid.isPending
  const isSending = sendBill.isPending

  return (
    <div className="flex items-center justify-end gap-1.5 flex-wrap">
      {/* Send bill — visible until paid */}
      {!row.paid && (
        <button onClick={doSendBill} disabled={isSending || !row.whatsapp}
          title={row.whatsapp ? 'Send bill to student WhatsApp' : 'No WhatsApp on file'}
          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-semibold disabled:opacity-50 transition-colors"
          style={{ background: '#25D366', color: '#fff' }}>
          {isSending ? <Loader2 size={11} className="animate-spin" /> : <MessageCircle size={11} />}
          Send bill
        </button>
      )}

      {/* Mark paid — visible until paid */}
      {!row.paid && (
        <button onClick={doMarkPaid} disabled={isMarking}
          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-semibold border bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 disabled:opacity-50 transition-colors">
          {isMarking ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
          Mark paid
        </button>
      )}

      {/* Paid badge */}
      {row.paid && (
        <span className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={11} />Paid
        </span>
      )}

      {/* Open student */}
      <Link href={`/students/${row.student_id}`}
        title="Open student profile"
        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-semibold border bg-white text-gray-600 hover:bg-gray-50 border-gray-200 transition-colors">
        <UserIcon size={11} />Student
      </Link>

      {/* View invoice — only when one exists */}
      {row.invoice_id && (
        <Link href={`/billing/invoices/${row.invoice_id}`}
          title="View linked invoice"
          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-semibold border bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 transition-colors">
          <ExternalLink size={11} />Invoice
        </Link>
      )}
    </div>
  )
}

/* ─── main table ─────────────────────────────────────────── */
interface Props {
  /** When supplied, restricts the table to a single student (used inside student detail). */
  studentIdFilter?: number
}

/* Compact quota-impact pill for the per-session detail rows */
function MiniQuotaPill({ impact }: { impact: AutoBillingSessionRow['quota_impact'] }) {
  const cfg = (() => {
    switch (impact) {
      case 'counted':         return { label: 'Counted',        bg: 'rgb(220 252 231)', fg: 'rgb(21 128 61)'  }
      case 'counted_no_show': return { label: 'No-show',        bg: 'rgb(254 226 226)', fg: 'rgb(153 27 27)'  }
      case 'free_teacher':    return { label: 'Free (teacher)', bg: 'rgb(254 243 199)', fg: 'rgb(146 64 14)'  }
      case 'free_excused':    return { label: 'Free (excused)', bg: 'rgb(219 234 254)', fg: 'rgb(30 64 175)'  }
      default:                return { label: 'Free',           bg: 'rgb(243 244 246)', fg: 'rgb(75 85 99)'   }
    }
  })()
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: cfg.bg, color: cfg.fg }}>{cfg.label}</span>
  )
}

function formatSessionDate(iso: string | null): { day: string; time: string } {
  if (!iso) return { day: '—', time: '' }
  const d = new Date(iso)
  return {
    day:  d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
  }
}

export function AutoBillingTable({ studentIdFilter }: Props = {}) {
  const [period, setPeriod]   = useState(currentPeriod())
  const [search, setSearch]   = useState('')
  const [status, setStatus]   = useState<'paid' | 'unpaid' | undefined>()
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  function toggleExpand(id: number) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const filters: AutoBillingFilters = { period, search: search || undefined, status }
  const { data, isLoading, refetch, isFetching } = useAutoBilling(filters)

  const rows = useMemo(() => {
    let r = data?.data ?? []
    if (studentIdFilter) r = r.filter(x => x.student_id === studentIdFilter)
    return r
  }, [data, studentIdFilter])

  const meta = data?.meta
  const isCurrent = period === currentPeriod()

  // Aggregate stats for the strip
  const stats = useMemo(() => {
    const paid = rows.filter(r => r.paid).length
    const totalDue = rows
      .filter(r => !r.paid)
      .reduce((sum, r) => sum + r.total_cost_minor, 0)
    return { students: rows.length, paid, unpaid: rows.length - paid, totalDue }
  }, [rows])

  const currencyOfFirstUnpaid = rows.find(r => !r.paid)?.currency ?? 'USD'

  return (
    <div className="space-y-4">

      {/* ── Period nav + refresh ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={() => setPeriod(shiftPeriod(period, -1))}
            className="p-1.5 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
            style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
            <ChevronLeft size={14} />
          </button>
          <input type="month" value={period}
            onChange={e => setPeriod(e.target.value || currentPeriod())}
            className="px-3 py-1.5 rounded-lg border bg-white text-sm cursor-pointer"
            style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }} />
          <button onClick={() => setPeriod(shiftPeriod(period, 1))}
            className="p-1.5 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
            style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
            <ChevronRight size={14} />
          </button>
          {!isCurrent && (
            <button onClick={() => setPeriod(currentPeriod())}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border bg-white hover:bg-gray-50"
              style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
              This month
            </button>
          )}
          <p className="text-sm font-medium ml-2 hidden sm:block" style={{ color: 'rgb(90 100 112)' }}>
            {formatPeriod(period)}
          </p>
        </div>
        <button onClick={() => refetch()} disabled={isFetching}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-white hover:bg-gray-50 disabled:opacity-50"
          style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
          <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />Refresh
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<Users size={16} />}        label="Students" value={stats.students} accent="rgb(30 90 171)" />
        <StatCard icon={<CheckCircle2 size={16} />} label="Paid"     value={stats.paid}     accent="rgb(14 124 90)" />
        <StatCard icon={<FileText size={16} />}     label="Unpaid"   value={stats.unpaid}   accent="rgb(180 83 9)" />
        <StatCard icon={<DollarSign size={16} />}   label="Due"      value={formatMinor(stats.totalDue, currencyOfFirstUnpaid)} accent="rgb(220 38 38)" />
      </div>

      {/* ── Filters ── */}
      <div className="rounded-xl border bg-white p-3 flex items-center gap-2 flex-wrap"
        style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search student name, WhatsApp, email…"
            className="w-full rounded-lg border bg-white pl-9 pr-9 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }} />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <FilterPill label="All"    active={!status}            onClick={() => setStatus(undefined)} />
          <FilterPill label="Unpaid" active={status === 'unpaid'} onClick={() => setStatus('unpaid')} />
          <FilterPill label="Paid"   active={status === 'paid'}   onClick={() => setStatus('paid')} />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border bg-white overflow-hidden"
        style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
        {isLoading ? (
          <div className="py-12 flex flex-col items-center gap-2 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
            <p className="text-sm">Loading…</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-2 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <DollarSign size={20} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium" style={{ color: 'rgb(11 31 58)' }}>No billable sessions yet</p>
            <p className="text-xs" style={{ color: 'rgb(120 130 140)' }}>
              Mark sessions attended (or no-show) and they will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'rgb(248 250 252)', borderBottom: '1px solid rgb(var(--border-default,229 233 240))' }}>
                  <th className="w-8 px-2 py-2.5" />
                  <th className="text-left text-[10px] font-bold uppercase tracking-wider px-4 py-2.5 text-gray-500">Student</th>
                  <th className="text-left text-[10px] font-bold uppercase tracking-wider px-3 py-2.5 text-gray-500 hidden md:table-cell">WhatsApp</th>
                  <th className="text-center text-[10px] font-bold uppercase tracking-wider px-3 py-2.5 text-gray-500">Sessions</th>
                  <th className="text-right text-[10px] font-bold uppercase tracking-wider px-3 py-2.5 text-gray-500 hidden lg:table-cell">Per session</th>
                  <th className="text-right text-[10px] font-bold uppercase tracking-wider px-3 py-2.5 text-gray-500">Total</th>
                  <th className="text-right text-[10px] font-bold uppercase tracking-wider px-4 py-2.5 text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const isOpen = expanded.has(r.student_id)
                  const last   = formatSessionDate(r.last_session_at)
                  const isLastRow = i === rows.length - 1
                  return (
                  <Fragment key={r.student_id}>
                  <tr
                    className="transition-colors hover:bg-gray-50/70"
                    style={{ borderBottom: !isOpen && !isLastRow ? '1px solid rgb(var(--border-default,229 233 240))' : 'none' }}>
                    <td className="px-2 py-3 text-center">
                      <button
                        onClick={() => toggleExpand(r.student_id)}
                        disabled={r.sessions.length === 0}
                        title={r.sessions.length === 0 ? 'No sessions' : (isOpen ? 'Hide sessions' : 'Show sessions')}
                        className="w-6 h-6 inline-flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors disabled:opacity-30">
                        <ChevronDown size={14} className="transition-transform"
                          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', color: 'rgb(90 100 112)' }} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/students/${r.student_id}`}
                        className="font-semibold hover:underline" style={{ color: 'rgb(11 31 58)' }}>
                        {r.student_name}
                      </Link>
                      <p className="text-[11px] mt-0.5 flex items-center gap-1 flex-wrap" style={{ color: 'rgb(120 130 140)' }}>
                        <span>{r.course_name ?? `${r.sessions_per_month}/mo · ${r.session_duration_min}m`}</span>
                        {r.last_session_at && (
                          <>
                            <span className="opacity-50">·</span>
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays size={10} className="opacity-60" />
                              last: {last.day}{last.time && <> · {last.time}</>}
                            </span>
                          </>
                        )}
                      </p>
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      {r.whatsapp ? (
                        <a href={`https://wa.me/${r.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs hover:underline" style={{ color: 'rgb(14 124 90)' }}>
                          {r.whatsapp}
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <p className="text-sm font-semibold" style={{ color: 'rgb(11 31 58)' }}>
                        {r.counted_sessions}
                        <span className="text-xs font-normal text-gray-400"> / {r.sessions_per_month}</span>
                      </p>
                      {r.free_sessions > 0 && (
                        <p className="text-[10px]" style={{ color: 'rgb(146 64 14)' }}>+{r.free_sessions} free</p>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums hidden lg:table-cell text-xs" style={{ color: 'rgb(90 100 112)' }}>
                      {formatMinor(r.per_session_price_minor, r.currency)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums font-semibold" style={{ color: 'rgb(11 31 58)' }}>
                      {formatMinor(r.total_cost_minor, r.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <RowActions row={r} period={period} onRefetch={refetch} />
                    </td>
                  </tr>
                  {isOpen && (
                    <tr style={{ borderBottom: !isLastRow ? '1px solid rgb(var(--border-default,229 233 240))' : 'none' }}>
                      <td></td>
                      <td colSpan={6} className="px-4 pt-1 pb-4">
                        <div className="rounded-lg overflow-hidden" style={{ background: 'rgb(248 250 252)', border: '1px solid rgb(var(--border-default,229 233 240))' }}>
                          <table className="w-full text-xs">
                            <thead>
                              <tr style={{ background: '#fff' }}>
                                <th className="text-left text-[10px] uppercase tracking-wider px-3 py-2 text-gray-500">Date</th>
                                <th className="text-left text-[10px] uppercase tracking-wider px-3 py-2 text-gray-500">Duration</th>
                                <th className="text-left text-[10px] uppercase tracking-wider px-3 py-2 text-gray-500 hidden sm:table-cell">Teacher</th>
                                <th className="text-center text-[10px] uppercase tracking-wider px-3 py-2 text-gray-500">Status</th>
                                <th className="text-center text-[10px] uppercase tracking-wider px-3 py-2 text-gray-500">Quota</th>
                                <th className="text-right text-[10px] uppercase tracking-wider px-3 py-2 text-gray-500">Cost</th>
                              </tr>
                            </thead>
                            <tbody>
                              {r.sessions.map((s: AutoBillingSessionRow) => {
                                const d = formatSessionDate(s.scheduled_start)
                                return (
                                <tr key={s.id} className="border-t" style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
                                  <td className="px-3 py-2">
                                    <p className="font-semibold" style={{ color: 'rgb(11 31 58)' }}>{d.day}</p>
                                    <p className="text-[10px]" style={{ color: 'rgb(120 130 140)' }}>{d.time}</p>
                                  </td>
                                  <td className="px-3 py-2 text-gray-700">{s.duration_min}m</td>
                                  <td className="px-3 py-2 text-gray-700 hidden sm:table-cell">{s.teacher_name ?? '—'}</td>
                                  <td className="px-3 py-2 text-center capitalize text-gray-700">{s.status.replace('_', ' ')}</td>
                                  <td className="px-3 py-2 text-center">
                                    <MiniQuotaPill impact={s.quota_impact} />
                                  </td>
                                  <td className="px-3 py-2 text-right tabular-nums font-semibold"
                                    style={{ color: s.counts_against_quota ? 'rgb(11 31 58)' : 'rgb(156 163 175)' }}>
                                    {s.counts_against_quota ? formatMinor(s.cost_minor, r.currency) : '—'}
                                  </td>
                                </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {meta && rows.length > 0 && (
          <div className="px-4 py-2.5 border-t flex items-center justify-between text-xs"
            style={{ background: 'rgb(248 250 252)', borderColor: 'rgb(var(--border-default,229 233 240))', color: 'rgb(120 130 140)' }}>
            <span>{rows.length} student{rows.length !== 1 ? 's' : ''} · {formatPeriod(period)}</span>
            <span>Total billed: <strong style={{ color: 'rgb(11 31 58)' }}>{formatMinor(meta.total_cost_minor, currencyOfFirstUnpaid)}</strong></span>
          </div>
        )}
      </div>
    </div>
  )
}
