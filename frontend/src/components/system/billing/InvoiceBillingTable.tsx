'use client'
import { useMemo, useState } from 'react'
import {
  Search, X, Loader2, CheckCircle2, RefreshCw, MessageCircle,
  DollarSign, FileText, ExternalLink, User as UserIcon, AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { formatMinor } from '@/lib/money'
import { useInvoices, type InvoiceFilters } from '@/hooks/system/useInvoices'
import { useSendInvoiceWhatsApp, useMarkInvoicePaid } from '@/hooks/system/useInvoice'
import type { Invoice, InvoiceStatus } from '@/types/system/invoice'

/* ─── stat card (matches AutoBillingTable) ───────────── */
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

const STATUS_STYLES: Record<InvoiceStatus, { label: string; bg: string; fg: string }> = {
  draft:   { label: 'Draft',   bg: 'rgb(243 244 246)', fg: 'rgb(75 85 99)'  },
  sent:    { label: 'Sent',    bg: 'rgb(219 234 254)', fg: 'rgb(30 64 175)' },
  paid:    { label: 'Paid',    bg: 'rgb(220 252 231)', fg: 'rgb(21 128 61)' },
  overdue: { label: 'Overdue', bg: 'rgb(254 226 226)', fg: 'rgb(153 27 27)' },
  void:    { label: 'Void',    bg: 'rgb(243 244 246)', fg: 'rgb(107 114 128)' },
}

/* ─── row actions ───────────────────────────────────── */
function RowActions({ inv, onRefetch }: { inv: Invoice; onRefetch: () => void }) {
  const sendWA  = useSendInvoiceWhatsApp(inv.id)
  const markPay = useMarkInvoicePaid(inv.id)

  async function doSend() {
    try {
      const res = await sendWA.mutateAsync()
      toast.success(`Bill sent to ${res.recipient} ✓`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to send bill.')
    }
  }
  async function doMarkPaid() {
    try {
      await markPay.mutateAsync()
      toast.success(`Invoice ${inv.invoice_number} marked paid.`)
      onRefetch()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to mark paid.')
    }
  }

  const isVoid = inv.status === 'void'
  const isPaid = inv.status === 'paid'

  return (
    <div className="flex items-center justify-end gap-1.5 flex-wrap">
      {!isPaid && !isVoid && (
        <button onClick={doSend} disabled={sendWA.isPending || !inv.student?.whatsapp}
          title={inv.student?.whatsapp ? 'Send bill with payment link' : 'No WhatsApp on file'}
          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-semibold disabled:opacity-50 transition-colors"
          style={{ background: '#25D366', color: '#fff' }}>
          {sendWA.isPending ? <Loader2 size={11} className="animate-spin" /> : <MessageCircle size={11} />}
          Send bill
        </button>
      )}
      {!isPaid && !isVoid && (
        <button onClick={doMarkPaid} disabled={markPay.isPending}
          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-semibold border bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 disabled:opacity-50 transition-colors">
          {markPay.isPending ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
          Mark paid
        </button>
      )}
      {inv.student?.id && (
        <Link href={`/students/${inv.student.id}`} title="Open student profile"
          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-semibold border bg-white text-gray-600 hover:bg-gray-50 border-gray-200 transition-colors">
          <UserIcon size={11} />Student
        </Link>
      )}
      <Link href={`/billing/invoices/${inv.id}`} title="Open invoice"
        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-semibold border bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 transition-colors">
        <ExternalLink size={11} />Invoice
      </Link>
    </div>
  )
}

/* ─── main table ────────────────────────────────────── */
interface Props {
  /** Invoice types this table should list. Pro=advance+reactivation, Manual=manual. */
  types: string | string[]
  /** Single-student filter (used inside student detail). */
  studentIdFilter?: number
  /** Heading label inside the empty-state. */
  emptyHint?: string
}

export function InvoiceBillingTable({ types, studentIdFilter, emptyHint }: Props) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<InvoiceStatus | undefined>()

  const filters: InvoiceFilters = {
    'filter[type]':   types,
    ...(status ? { 'filter[status]': status } : {}),
    ...(studentIdFilter ? { 'filter[student_id]': studentIdFilter } : {}),
  }

  const { data, isLoading, isFetching, refetch } = useInvoices(filters)

  const rows = useMemo(() => {
    let r: Invoice[] = data?.data ?? []
    if (search.trim()) {
      const q = search.toLowerCase()
      r = r.filter(inv =>
        inv.invoice_number.toLowerCase().includes(q) ||
        inv.student?.name?.toLowerCase().includes(q) ||
        inv.student?.whatsapp?.toLowerCase().includes(q) ||
        inv.student?.email?.toLowerCase().includes(q),
      )
    }
    return r
  }, [data, search])

  const stats = useMemo(() => {
    const paid    = rows.filter(r => r.status === 'paid').length
    const overdue = rows.filter(r => r.status === 'overdue').length
    const unpaid  = rows.filter(r => r.status !== 'paid' && r.status !== 'void').length
    const totalDue = rows
      .filter(r => r.status !== 'paid' && r.status !== 'void')
      .reduce((s, r) => s + r.total_minor, 0)
    return { total: rows.length, paid, unpaid, overdue, totalDue }
  }, [rows])

  const currencyOfFirst = rows[0]?.currency ?? 'USD'

  return (
    <div className="space-y-4">
      {/* ── Refresh row ── */}
      <div className="flex items-center justify-end">
        <button onClick={() => refetch()} disabled={isFetching}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-white hover:bg-gray-50 disabled:opacity-50"
          style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
          <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />Refresh
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<FileText size={16} />}     label="Invoices" value={stats.total}    accent="rgb(30 90 171)" />
        <StatCard icon={<CheckCircle2 size={16} />} label="Paid"     value={stats.paid}     accent="rgb(14 124 90)" />
        <StatCard icon={<AlertTriangle size={16} />}label="Overdue"  value={stats.overdue}  accent="rgb(220 38 38)" />
        <StatCard icon={<DollarSign size={16} />}   label="Due"      value={formatMinor(stats.totalDue, currencyOfFirst)} accent="rgb(180 83 9)" />
      </div>

      {/* ── Filters ── */}
      <div className="rounded-xl border bg-white p-3 flex items-center gap-2 flex-wrap"
        style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search invoice #, student, WhatsApp…"
            className="w-full rounded-lg border bg-white pl-9 pr-9 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }} />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <FilterPill label="All"     active={!status}               onClick={() => setStatus(undefined)} />
          <FilterPill label="Draft"   active={status === 'draft'}    onClick={() => setStatus('draft')} />
          <FilterPill label="Sent"    active={status === 'sent'}     onClick={() => setStatus('sent')} />
          <FilterPill label="Paid"    active={status === 'paid'}     onClick={() => setStatus('paid')} />
          <FilterPill label="Overdue" active={status === 'overdue'}  onClick={() => setStatus('overdue')} />
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
              <FileText size={20} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium" style={{ color: 'rgb(11 31 58)' }}>No invoices yet</p>
            {emptyHint && (
              <p className="text-xs" style={{ color: 'rgb(120 130 140)' }}>{emptyHint}</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'rgb(248 250 252)', borderBottom: '1px solid rgb(var(--border-default,229 233 240))' }}>
                  <th className="text-left text-[10px] font-bold uppercase tracking-wider px-4 py-2.5 text-gray-500">Invoice</th>
                  <th className="text-left text-[10px] font-bold uppercase tracking-wider px-3 py-2.5 text-gray-500">Student</th>
                  <th className="text-left text-[10px] font-bold uppercase tracking-wider px-3 py-2.5 text-gray-500 hidden md:table-cell">WhatsApp</th>
                  <th className="text-center text-[10px] font-bold uppercase tracking-wider px-3 py-2.5 text-gray-500">Status</th>
                  <th className="text-right text-[10px] font-bold uppercase tracking-wider px-3 py-2.5 text-gray-500">Total</th>
                  <th className="text-right text-[10px] font-bold uppercase tracking-wider px-4 py-2.5 text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((inv, i) => {
                  const s = STATUS_STYLES[inv.status]
                  return (
                    <tr key={inv.id}
                      className="transition-colors hover:bg-gray-50/70"
                      style={{ borderBottom: i < rows.length - 1 ? '1px solid rgb(var(--border-default,229 233 240))' : 'none' }}>
                      <td className="px-4 py-3">
                        <Link href={`/billing/invoices/${inv.id}`}
                          className="font-semibold hover:underline text-xs tabular-nums" style={{ color: 'rgb(11 31 58)' }}>
                          {inv.invoice_number}
                        </Link>
                        <p className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: 'rgb(120 130 140)' }}>
                          {inv.type}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        {inv.student?.id ? (
                          <Link href={`/students/${inv.student.id}`}
                            className="font-semibold hover:underline" style={{ color: 'rgb(11 31 58)' }}>
                            {inv.student.name}
                          </Link>
                        ) : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-3 py-3 hidden md:table-cell">
                        {inv.student?.whatsapp ? (
                          <a href={`https://wa.me/${inv.student.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs hover:underline" style={{ color: 'rgb(14 124 90)' }}>
                            {inv.student.whatsapp}
                          </a>
                        ) : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ background: s.bg, color: s.fg }}>
                          {s.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums font-semibold" style={{ color: 'rgb(11 31 58)' }}>
                        {formatMinor(inv.total_minor, inv.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <RowActions inv={inv} onRefetch={refetch} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {rows.length > 0 && (
          <div className="px-4 py-2.5 border-t flex items-center justify-between text-xs"
            style={{ background: 'rgb(248 250 252)', borderColor: 'rgb(var(--border-default,229 233 240))', color: 'rgb(120 130 140)' }}>
            <span>{rows.length} invoice{rows.length !== 1 ? 's' : ''}</span>
            <span>Total due: <strong style={{ color: 'rgb(11 31 58)' }}>{formatMinor(stats.totalDue, currencyOfFirst)}</strong></span>
          </div>
        )}
      </div>
    </div>
  )
}
