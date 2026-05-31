'use client'
import { useState, useMemo } from 'react'
import {
  ChevronLeft, ChevronRight, Plus, Trash2, RefreshCw,
  CheckCircle, XCircle, ArrowRightLeft, Clock, BookOpen,
  TrendingUp, TrendingDown, DollarSign, Award, Minus,
} from 'lucide-react'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/system/api'
import { useTeacherSalary } from '@/hooks/system/useTeacherSalary'
import { useSessions } from '@/hooks/system/useSessions'
import { useAddAdjustment, useDeleteAdjustment } from '@/hooks/system/usePayrollAdjustments'
import { useApprovePayroll, useRejectPayroll, useMarkTransferred } from '@/hooks/system/usePayrollActions'
import { MoneyDisplay } from '@/components/system/primitives/MoneyDisplay'
import type { Teacher } from '@/types/system/teacher'
import type { Payroll, AdjustmentType, AdjustmentCategory } from '@/types/system/payroll'
import type { Session } from '@/types/system/session'

// ── Constants ─────────────────────────────────────────────────

const CURRENCY = 'EGP'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const BONUS_CATEGORIES: { value: AdjustmentCategory; label: string }[] = [
  { value: 'performance',         label: 'Performance Bonus'    },
  { value: 'retention',           label: 'Retention Bonus'      },
  { value: 'reports_consistency', label: 'Reports Consistency'  },
  { value: 'tenure',              label: 'Tenure Bonus'         },
  { value: 'other_bonus',         label: 'Other Bonus'          },
]

const DEDUCTION_CATEGORIES: { value: AdjustmentCategory; label: string }[] = [
  { value: 'unauthorized_absence', label: 'Unauthorized Absence' },
  { value: 'late_report',          label: 'Late Report'          },
  { value: 'late_arrival',         label: 'Late Arrival'         },
  { value: 'quality_issue',        label: 'Quality Issue'        },
  { value: 'other_deduction',      label: 'Other Deduction'      },
]

const CATEGORY_LABEL: Record<AdjustmentCategory, string> = {
  performance:           'Performance',
  retention:             'Retention',
  reports_consistency:   'Reports Consistency',
  tenure:                'Tenure',
  other_bonus:           'Other Bonus',
  unauthorized_absence:  'Unauthorized Absence',
  late_report:           'Late Report',
  late_arrival:          'Late Arrival',
  quality_issue:         'Quality Issue',
  other_deduction:       'Other Deduction',
}

const STATUS_CFG: Record<string, { label: string; bg: string; text: string }> = {
  pending:     { label: 'Pending',     bg: 'rgb(245 158 11 / 0.12)', text: 'rgb(180 83 9)'   },
  approved:    { label: 'Approved',    bg: 'rgb(14 124 90 / 0.12)',  text: 'rgb(14 124 90)'  },
  rejected:    { label: 'Rejected',    bg: 'rgb(239 68 68 / 0.12)',  text: 'rgb(239 68 68)'  },
  transferred: { label: 'Transferred', bg: 'rgb(99 102 241 / 0.12)', text: 'rgb(99 102 241)' },
}

// ── Helpers ───────────────────────────────────────────────────

function durationBracket(min: number): '30' | '45' | '60' {
  if (min <= 37) return '30'
  if (min <= 52) return '45'
  return '60'
}

function sessionCostMinor(session: Session, payroll: Payroll | null, teacher: Teacher): number {
  const bracket = durationBracket(session.duration_min)
  const rate =
    payroll?.snapshot?.[bracket] ??
    (bracket === '30' ? teacher.per_minute_rate_30
    : bracket === '45' ? teacher.per_minute_rate_45
    : teacher.per_minute_rate_60)
  return session.duration_min * rate
}

function monthRange(year: number, month: number) {
  const from = new Date(year, month - 1, 1)
  const to   = new Date(year, month, 0)
  return {
    from: from.toISOString().slice(0, 10),
    to:   to.toISOString().slice(0, 10),
  }
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

// ── Component ─────────────────────────────────────────────────

interface Props {
  teacherId: number | string
  teacher: Teacher
}

export function TeacherSalaryTab({ teacherId, teacher }: Props) {
  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  // ── Data ──────────────────────────────────────────────────────
  const { data: statement, isLoading: stmtLoading } = useTeacherSalary(teacherId, year, month)
  const payroll = statement?.current ?? null

  const { from, to } = monthRange(year, month)
  const { data: sessionsData, isLoading: sessionsLoading } = useSessions({
    teacher_id: teacherId,
    status: 'attended',
    from,
    to,
    per_page: 200,
  })
  const sessions: Session[] = sessionsData?.data ?? []

  // ── Computed per-session rows ─────────────────────────────────
  const sessionRows = useMemo(() =>
    sessions
      .map(s => ({
        ...s,
        bracket: durationBracket(s.duration_min) as '30' | '45' | '60',
        cost:    sessionCostMinor(s, payroll, teacher),
      }))
      .sort((a, b) => a.scheduled_start.localeCompare(b.scheduled_start)),
    [sessions, payroll, teacher],
  )

  const computedBase = sessionRows.reduce((sum, r) => sum + r.cost, 0)

  const baseMinor      = payroll?.base_salary_minor  ?? computedBase
  const bonusMinor     = payroll?.bonuses_minor       ?? 0
  const deductionMinor = payroll?.deductions_minor    ?? 0
  const netMinor       = payroll?.net_salary_minor    ?? (baseMinor + bonusMinor - deductionMinor)
  const totalSessions  = payroll?.total_sessions      ?? sessions.length
  const totalMinutes   = payroll?.total_minutes       ?? sessions.reduce((s, r) => s + r.duration_min, 0)

  // ── Form state ────────────────────────────────────────────────
  const [addOpen,       setAddOpen]       = useState<AdjustmentType | null>(null)
  const [adjCategory,   setAdjCategory]   = useState<AdjustmentCategory>('performance')
  const [adjAmount,     setAdjAmount]     = useState('')
  const [adjReason,     setAdjReason]     = useState('')
  const [rejectReason,  setRejectReason]  = useState('')
  const [showReject,    setShowReject]    = useState(false)
  const [transferRef,   setTransferRef]   = useState('')
  const [showTransfer,  setShowTransfer]  = useState(false)

  // ── Mutations ─────────────────────────────────────────────────
  const qc         = useQueryClient()
  const addAdj     = useAddAdjustment()
  const deleteAdj  = useDeleteAdjustment()
  const approveMut = useApprovePayroll()
  const rejectMut  = useRejectPayroll()
  const transferMut = useMarkTransferred()
  const recalcMut  = useMutation({
    mutationFn: (id: number | string) =>
      api(`/payrolls/${id}/recalculate`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system', 'teachers', teacherId, 'salary'] })
      qc.invalidateQueries({ queryKey: ['system', 'payrolls'] })
    },
  })

  // ── Period navigation ─────────────────────────────────────────
  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (year === now.getFullYear() && month === now.getMonth() + 1) return
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }
  const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1

  function invalidateSalary() {
    qc.invalidateQueries({ queryKey: ['system', 'teachers', teacherId, 'salary'] })
  }

  // ── Handlers ──────────────────────────────────────────────────
  async function handleApprove() {
    if (!payroll) return
    try {
      await approveMut.mutateAsync(payroll.id)
      invalidateSalary()
      toast.success('Payroll approved.')
    } catch { toast.error('Failed to approve.') }
  }

  async function handleReject() {
    if (!payroll || !rejectReason.trim()) return
    try {
      await rejectMut.mutateAsync({ id: payroll.id, reason: rejectReason })
      invalidateSalary()
      toast.success('Payroll rejected.')
      setShowReject(false); setRejectReason('')
    } catch { toast.error('Failed to reject.') }
  }

  async function handleTransfer() {
    if (!payroll || !transferRef.trim()) return
    try {
      await transferMut.mutateAsync({ id: payroll.id, transfer_reference: transferRef })
      invalidateSalary()
      toast.success('Marked as transferred.')
      setShowTransfer(false); setTransferRef('')
    } catch { toast.error('Failed to mark transferred.') }
  }

  async function handleRecalculate() {
    if (!payroll) return
    try {
      await recalcMut.mutateAsync(payroll.id)
      invalidateSalary()
      toast.success('Payroll recalculated.')
    } catch { toast.error('Failed to recalculate.') }
  }

  async function submitAdjustment() {
    if (!payroll) return
    const amountMinor = Math.round(parseFloat(adjAmount) * 100)
    if (isNaN(amountMinor) || amountMinor <= 0) { toast.error('Enter a valid amount.'); return }
    try {
      await addAdj.mutateAsync({
        payrollId: payroll.id,
        type: addOpen!,
        category: adjCategory,
        amount_minor: amountMinor,
        reason: adjReason,
      })
      invalidateSalary()
      toast.success(`${addOpen === 'bonus' ? 'Bonus' : 'Deduction'} added.`)
      setAddOpen(null); setAdjAmount(''); setAdjReason('')
    } catch { toast.error('Failed to add adjustment.') }
  }

  async function handleDeleteAdj(adjId: number) {
    try {
      await deleteAdj.mutateAsync(adjId)
      invalidateSalary()
      toast.success('Adjustment removed.')
    } catch { toast.error('Failed to remove.') }
  }

  // ── Style tokens ──────────────────────────────────────────────
  const border  = 'rgb(var(--border-default, 229 233 240))'
  const surface = 'rgb(var(--surface-card, 255 255 255))'
  const surf2   = 'rgb(var(--surface-card-2, 248 250 252))'
  const isLoading = stmtLoading || sessionsLoading
  const statusCfg = payroll ? (STATUS_CFG[payroll.status] ?? STATUS_CFG.pending) : null

  return (
    <div className="space-y-4">

      {/* ── Period nav + payroll actions ── */}
      <div className="rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4"
        style={{ background: surface, border: `1px solid ${border}` }}>

        {/* Month picker */}
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-black/5 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-base font-bold min-w-[140px] text-center select-none">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <button onClick={nextMonth} disabled={isCurrent}
            className="p-2 rounded-xl hover:bg-black/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronRight size={16} />
          </button>
          {!isCurrent && (
            <button
              onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth() + 1) }}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border hover:bg-black/5 transition-colors"
              style={{ borderColor: border }}>
              This month
            </button>
          )}
        </div>

        {/* Status + action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {payroll && statusCfg ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: statusCfg.bg, color: statusCfg.text }}>
              {statusCfg.label}
            </span>
          ) : !isLoading && (
            <span className="px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: 'rgb(148 163 184 / 0.15)', color: 'rgb(100 116 139)' }}>
              No payroll generated
            </span>
          )}

          {payroll?.status === 'pending' && (
            <>
              <button onClick={handleApprove} disabled={approveMut.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                style={{ background: 'rgb(14 124 90 / 0.10)', color: 'rgb(14 124 90)' }}>
                <CheckCircle size={13} /> Approve
              </button>
              <button onClick={() => setShowReject(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                style={{ background: 'rgb(239 68 68 / 0.10)', color: 'rgb(239 68 68)' }}>
                <XCircle size={13} /> Reject
              </button>
            </>
          )}
          {payroll?.status === 'approved' && (
            <button onClick={() => setShowTransfer(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
              style={{ background: 'rgb(99 102 241 / 0.10)', color: 'rgb(99 102 241)' }}>
              <ArrowRightLeft size={13} /> Mark Transferred
            </button>
          )}
          {payroll && (
            <button onClick={handleRecalculate} disabled={recalcMut.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors hover:bg-black/5"
              style={{ border: `1.5px solid ${border}` }}>
              <RefreshCw size={13} className={recalcMut.isPending ? 'animate-spin' : ''} /> Recalculate
            </button>
          )}
        </div>
      </div>

      {/* ── Reject form ── */}
      {showReject && payroll && (
        <div className="rounded-2xl p-4 space-y-3"
          style={{ background: 'rgb(239 68 68 / 0.05)', border: '1.5px solid rgb(239 68 68 / 0.25)' }}>
          <p className="text-sm font-semibold text-red-700">Rejection reason</p>
          <textarea rows={2} placeholder="Explain why this payroll is being rejected…"
            className="w-full rounded-xl border px-3 py-2 text-sm resize-none outline-none"
            style={{ borderColor: border }}
            value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={handleReject} disabled={!rejectReason.trim() || rejectMut.isPending}
              className="px-4 py-1.5 rounded-xl text-xs font-bold disabled:opacity-40 transition-colors"
              style={{ background: 'rgb(239 68 68)', color: '#fff' }}>
              Confirm Rejection
            </button>
            <button onClick={() => setShowReject(false)}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold hover:bg-black/5">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Transfer form ── */}
      {showTransfer && payroll && (
        <div className="rounded-2xl p-4 space-y-3"
          style={{ background: 'rgb(99 102 241 / 0.05)', border: '1.5px solid rgb(99 102 241 / 0.25)' }}>
          <p className="text-sm font-semibold" style={{ color: 'rgb(99 102 241)' }}>Transfer reference</p>
          <input type="text" placeholder="Bank reference / transaction ID…"
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
            style={{ borderColor: border }}
            value={transferRef} onChange={e => setTransferRef(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={handleTransfer} disabled={!transferRef.trim() || transferMut.isPending}
              className="px-4 py-1.5 rounded-xl text-xs font-bold disabled:opacity-40 transition-colors"
              style={{ background: 'rgb(99 102 241)', color: '#fff' }}>
              Confirm Transfer
            </button>
            <button onClick={() => setShowTransfer(false)}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold hover:bg-black/5">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Summary stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Sessions"    value={String(totalSessions)}
          icon={<BookOpen size={14} />}    color="rgb(99 102 241)" />
        <StatCard label="Total Min"   value={`${totalMinutes}m`}
          icon={<Clock size={14} />}       color="rgb(14 124 90)" />
        <StatCard label="Base Salary" valueNode={<MoneyDisplay value={baseMinor} currency={CURRENCY} />}
          icon={<DollarSign size={14} />}  color="rgb(14 124 90)" />
        <StatCard label="Bonuses"     valueNode={<MoneyDisplay value={bonusMinor} currency={CURRENCY} />}
          icon={<TrendingUp size={14} />}  color="rgb(22 163 74)" />
        <StatCard label="Deductions"  valueNode={<MoneyDisplay value={deductionMinor} currency={CURRENCY} />}
          icon={<TrendingDown size={14} />} color="rgb(239 68 68)" />
        <StatCard label="Net Salary"  valueNode={<MoneyDisplay value={netMinor} currency={CURRENCY} />}
          icon={<Award size={14} />}       color="rgb(14 124 90)" highlight />
      </div>

      {/* ── Rate snapshot ── */}
      <div className="rounded-2xl p-4 flex flex-wrap items-center gap-x-8 gap-y-3"
        style={{ background: surf2, border: `1px solid ${border}` }}>
        <span className="text-[11px] font-semibold opacity-40">Rates &amp; breakdown</span>
        {(['30', '45', '60'] as const).map(b => {
          const rate = payroll?.snapshot?.[b] ??
            (b === '30' ? teacher.per_minute_rate_30 : b === '45' ? teacher.per_minute_rate_45 : teacher.per_minute_rate_60)
          const bracketSessions = sessionRows.filter(r => r.bracket === b)
          const bracketMins = bracketSessions.reduce((s, r) => s + r.duration_min, 0)
          return (
            <div key={b} className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold"
                style={{ background: 'rgb(14 124 90 / 0.10)', color: 'rgb(14 124 90)' }}>
                {b}m
              </span>
              <div className="text-xs">
                <span className="font-semibold tabular-nums">
                  <MoneyDisplay value={rate} currency={CURRENCY} />/min
                </span>
                <span className="ml-2 opacity-45 tabular-nums">
                  {bracketSessions.length} sessions · {bracketMins}min
                </span>
              </div>
            </div>
          )
        })}
        {!payroll && (
          <span className="text-[11px] opacity-35 italic">Using current rates — no frozen snapshot yet</span>
        )}
      </div>

      {/* ── Session breakdown table ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: surface, border: `1px solid ${border}` }}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: border }}>
          <h3 className="text-sm font-bold">Session Breakdown</h3>
          <span className="text-xs opacity-40">{sessions.length} attended sessions this period</span>
        </div>

        {isLoading ? (
          <div className="py-14 text-center text-sm opacity-40 animate-pulse">Loading…</div>
        ) : sessionRows.length === 0 ? (
          <div className="py-14 text-center text-sm opacity-40">No attended sessions this month.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 580 }}>
              <thead>
                <tr className="border-b" style={{ borderColor: border, background: surf2 }}>
                  <th className="text-left px-5 py-2.5 text-[11px] font-semibold opacity-50 w-8">#</th>
                  <th className="text-left px-3 py-2.5 text-[11px] font-semibold opacity-50">Date &amp; Time</th>
                  <th className="text-left px-3 py-2.5 text-[11px] font-semibold opacity-50">Student</th>
                  <th className="text-center px-3 py-2.5 text-[11px] font-semibold opacity-50">Duration</th>
                  <th className="text-center px-3 py-2.5 text-[11px] font-semibold opacity-50">Bracket</th>
                  <th className="text-right px-3 py-2.5 text-[11px] font-semibold opacity-50">Rate / min</th>
                  <th className="text-right px-5 py-2.5 text-[11px] font-semibold opacity-50">Session Cost</th>
                </tr>
              </thead>
              <tbody>
                {sessionRows.map((row, i) => {
                  const rate =
                    payroll?.snapshot?.[row.bracket] ??
                    (row.bracket === '30' ? teacher.per_minute_rate_30
                    : row.bracket === '45' ? teacher.per_minute_rate_45
                    : teacher.per_minute_rate_60)
                  return (
                    <tr key={row.id} className="border-b hover:bg-black/[0.018] transition-colors"
                      style={{ borderColor: border }}>
                      <td className="px-5 py-3 text-[11px] opacity-25 tabular-nums">{i + 1}</td>
                      <td className="px-3 py-3">
                        <div className="text-[12px] font-medium">{fmtDate(row.scheduled_start)}</div>
                        <div className="text-[11px] opacity-40">{fmtTime(row.scheduled_start)}</div>
                      </td>
                      <td className="px-3 py-3 text-[12px] font-medium">{row.student?.name ?? '—'}</td>
                      <td className="px-3 py-3 text-center text-[12px] font-semibold tabular-nums">
                        {row.duration_min}m
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold"
                          style={{ background: 'rgb(14 124 90 / 0.10)', color: 'rgb(14 124 90)' }}>
                          {row.bracket}m
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right text-[12px] tabular-nums opacity-55">
                        <MoneyDisplay value={rate} currency={CURRENCY} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-[12px] font-semibold tabular-nums">
                          <MoneyDisplay value={row.cost} currency={CURRENCY} />
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: surf2, borderTop: `1px solid ${border}` }}>
                  <td colSpan={5} className="px-5 py-3 text-[11px] font-bold opacity-45">
                    {sessions.length} sessions · {sessions.reduce((s, r) => s + r.duration_min, 0)} min total
                  </td>
                  <td colSpan={2} className="px-5 py-3 text-right">
                    <span className="text-sm font-bold">
                      <MoneyDisplay value={computedBase} currency={CURRENCY} />
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ── Adjustments ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: surface, border: `1px solid ${border}` }}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: border }}>
          <h3 className="text-sm font-bold">Adjustments</h3>
          {payroll && (
            <div className="flex gap-2">
              <button
                onClick={() => { setAddOpen('bonus'); setAdjCategory('performance') }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-colors"
                style={{ background: 'rgb(22 163 74 / 0.10)', color: 'rgb(22 163 74)' }}>
                <Plus size={12} /> Add Bonus
              </button>
              <button
                onClick={() => { setAddOpen('deduction'); setAdjCategory('unauthorized_absence') }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-colors"
                style={{ background: 'rgb(239 68 68 / 0.10)', color: 'rgb(239 68 68)' }}>
                <Minus size={12} /> Add Deduction
              </button>
            </div>
          )}
        </div>

        {/* Inline add-adjustment form */}
        {addOpen && payroll && (
          <div className="px-5 py-4 border-b space-y-3"
            style={{
              borderColor: border,
              background: addOpen === 'bonus' ? 'rgb(22 163 74 / 0.04)' : 'rgb(239 68 68 / 0.04)',
            }}>
            <p className="text-xs font-bold"
              style={{ color: addOpen === 'bonus' ? 'rgb(22 163 74)' : 'rgb(239 68 68)' }}>
              {addOpen === 'bonus' ? '+ Add Bonus' : '− Add Deduction'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold mb-1 opacity-50">Category</label>
                <select value={adjCategory} onChange={e => setAdjCategory(e.target.value as AdjustmentCategory)}
                  className="w-full rounded-xl border px-3 py-2 text-xs outline-none"
                  style={{ borderColor: border, background: surface }}>
                  {(addOpen === 'bonus' ? BONUS_CATEGORIES : DEDUCTION_CATEGORIES).map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1 opacity-50">
                  Amount ({CURRENCY})
                </label>
                <input type="number" min="0.01" step="0.01" placeholder="0.00"
                  className="w-full rounded-xl border px-3 py-2 text-xs outline-none"
                  style={{ borderColor: border }}
                  value={adjAmount} onChange={e => setAdjAmount(e.target.value)} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1 opacity-50">Reason</label>
                <input type="text" placeholder="Brief explanation…"
                  className="w-full rounded-xl border px-3 py-2 text-xs outline-none"
                  style={{ borderColor: border }}
                  value={adjReason} onChange={e => setAdjReason(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={submitAdjustment} disabled={addAdj.isPending || !adjAmount}
                className="px-4 py-1.5 rounded-xl text-xs font-bold disabled:opacity-40 transition-colors"
                style={{ background: addOpen === 'bonus' ? 'rgb(22 163 74)' : 'rgb(239 68 68)', color: '#fff' }}>
                Save
              </button>
              <button onClick={() => { setAddOpen(null); setAdjAmount(''); setAdjReason('') }}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold hover:bg-black/5">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Adjustments list */}
        {!payroll && (
          <div className="py-10 text-center text-sm opacity-40">
            Generate a payroll first to add adjustments.
          </div>
        )}
        {payroll && (!payroll.adjustments || payroll.adjustments.length === 0) && !addOpen && (
          <div className="py-10 text-center text-sm opacity-40">No adjustments for this period.</div>
        )}
        {payroll?.adjustments && payroll.adjustments.length > 0 && (
          <div>
            {payroll.adjustments.map(adj => (
              <div key={adj.id}
                className="flex items-center gap-4 px-5 py-3.5 border-b last:border-b-0 hover:bg-black/[0.018] transition-colors"
                style={{ borderColor: border }}>
                <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                  style={adj.type === 'bonus'
                    ? { background: 'rgb(22 163 74 / 0.12)', color: 'rgb(22 163 74)' }
                    : { background: 'rgb(239 68 68 / 0.12)', color: 'rgb(239 68 68)' }}>
                  {adj.type}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">{CATEGORY_LABEL[adj.category] ?? adj.category}</p>
                  {adj.reason && (
                    <p className="text-[11px] opacity-50 truncate">{adj.reason}</p>
                  )}
                </div>
                <span className="text-sm font-bold tabular-nums shrink-0"
                  style={{ color: adj.type === 'bonus' ? 'rgb(22 163 74)' : 'rgb(239 68 68)' }}>
                  {adj.type === 'bonus' ? '+' : '−'}
                  <MoneyDisplay value={adj.amount_minor} currency={CURRENCY} />
                </span>
                {adj.added_by && (
                  <span className="text-[10px] opacity-35 shrink-0 hidden sm:inline">
                    {adj.added_by.name}
                  </span>
                )}
                <button onClick={() => handleDeleteAdj(adj.id)} disabled={deleteAdj.isPending}
                  className="shrink-0 p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors disabled:opacity-40">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}

            {/* Adjustments subtotals */}
            <div className="flex justify-end gap-8 px-5 py-3 border-t text-xs font-semibold"
              style={{ borderColor: border, background: surf2 }}>
              <span style={{ color: 'rgb(22 163 74)' }}>
                Bonuses: +<MoneyDisplay value={bonusMinor} currency={CURRENCY} />
              </span>
              <span style={{ color: 'rgb(239 68 68)' }}>
                Deductions: −<MoneyDisplay value={deductionMinor} currency={CURRENCY} />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Salary net summary ── */}
      {(payroll || computedBase > 0) && (
        <div className="rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4"
          style={{ background: 'rgb(14 124 90 / 0.06)', border: '1.5px solid rgb(14 124 90 / 0.20)' }}>
          <div>
            <p className="text-xs font-semibold opacity-50 mb-1">Net Salary — {MONTH_NAMES[month - 1]} {year}</p>
            <p className="text-2xl font-bold tabular-nums" style={{ color: 'rgb(14 124 90)' }}>
              <MoneyDisplay value={netMinor} currency={CURRENCY} />
            </p>
            <p className="text-[11px] opacity-45 mt-0.5">
              Base <MoneyDisplay value={baseMinor} currency={CURRENCY} />
              {bonusMinor > 0 && <> + <span style={{ color: 'rgb(22 163 74)' }}>
                <MoneyDisplay value={bonusMinor} currency={CURRENCY} />
              </span> bonus</>}
              {deductionMinor > 0 && <> − <span style={{ color: 'rgb(239 68 68)' }}>
                <MoneyDisplay value={deductionMinor} currency={CURRENCY} />
              </span> deduction</>}
            </p>
          </div>
          {payroll && (
            <div className="text-right text-xs opacity-50 space-y-0.5">
              {payroll.transfer_reference && (
                <p>Ref: <span className="font-mono">{payroll.transfer_reference}</span></p>
              )}
              {payroll.transferred_at && (
                <p>Transferred {fmtDate(payroll.transferred_at)}</p>
              )}
              {payroll.approved_at && !payroll.transferred_at && (
                <p>Approved {fmtDate(payroll.approved_at)}</p>
              )}
              {payroll.approver && (
                <p>by {payroll.approver.name}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── 12-month history ── */}
      {statement?.history && statement.history.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: surface, border: `1px solid ${border}` }}>
          <div className="px-5 py-3.5 border-b" style={{ borderColor: border }}>
            <h3 className="text-sm font-bold">Salary History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 560 }}>
              <thead>
                <tr className="border-b" style={{ borderColor: border, background: surf2 }}>
                  <th className="text-left px-5 py-2.5 text-[11px] font-semibold opacity-50">Period</th>
                  <th className="text-center px-3 py-2.5 text-[11px] font-semibold opacity-50">Sessions</th>
                  <th className="text-center px-3 py-2.5 text-[11px] font-semibold opacity-50">Minutes</th>
                  <th className="text-right px-3 py-2.5 text-[11px] font-semibold opacity-50">Base</th>
                  <th className="text-right px-3 py-2.5 text-[11px] font-semibold opacity-50">Adj</th>
                  <th className="text-right px-5 py-2.5 text-[11px] font-semibold opacity-50">Net</th>
                  <th className="text-center px-3 py-2.5 text-[11px] font-semibold opacity-50">Status</th>
                </tr>
              </thead>
              <tbody>
                {statement.history.map(p => {
                  const scfg = STATUS_CFG[p.status] ?? STATUS_CFG.pending
                  const isSelected = p.period_year === year && p.period_month === month
                  const adjNet = p.bonuses_minor - p.deductions_minor
                  return (
                    <tr key={p.id}
                      className="border-b hover:bg-black/[0.018] transition-colors cursor-pointer"
                      style={{ borderColor: border, background: isSelected ? 'rgb(14 124 90 / 0.04)' : undefined }}
                      onClick={() => { setYear(p.period_year); setMonth(p.period_month) }}>
                      <td className="px-5 py-3">
                        <span className="text-[12px] font-semibold">
                          {MONTH_NAMES[p.period_month - 1]} {p.period_year}
                        </span>
                        {isSelected && (
                          <span className="ml-2 text-[10px] font-bold" style={{ color: 'rgb(14 124 90)' }}>
                            ← viewing
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center text-[12px] tabular-nums">{p.total_sessions}</td>
                      <td className="px-3 py-3 text-center text-[12px] tabular-nums">{p.total_minutes}</td>
                      <td className="px-3 py-3 text-right text-[12px] tabular-nums">
                        <MoneyDisplay value={p.base_salary_minor} currency={CURRENCY} />
                      </td>
                      <td className="px-3 py-3 text-right text-[12px] tabular-nums"
                        style={{ color: adjNet > 0 ? 'rgb(22 163 74)' : adjNet < 0 ? 'rgb(239 68 68)' : undefined }}>
                        {adjNet !== 0 && (adjNet > 0 ? '+' : '−')}
                        {adjNet !== 0
                          ? <MoneyDisplay value={Math.abs(adjNet)} currency={CURRENCY} />
                          : <span className="opacity-30">—</span>
                        }
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-[12px] font-bold tabular-nums">
                          <MoneyDisplay value={p.net_salary_minor} currency={CURRENCY} />
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{ background: scfg.bg, color: scfg.text }}>
                          {scfg.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── StatCard ──────────────────────────────────────────────────

interface StatCardProps {
  label:     string
  value?:    string
  valueNode?: React.ReactNode
  icon:      React.ReactNode
  color:     string
  highlight?: boolean
}

function StatCard({ label, value, valueNode, icon, color, highlight }: StatCardProps) {
  const border = 'rgb(var(--border-default, 229 233 240))'
  return (
    <div className="rounded-2xl px-4 py-3.5 flex flex-col gap-1"
      style={{
        background: highlight ? `${color}14` : 'rgb(var(--surface-card, 255 255 255))',
        border: highlight ? `1.5px solid ${color}35` : `1px solid ${border}`,
      }}>
      <div className="flex items-center gap-1.5 text-[11px] font-medium opacity-50">
        <span style={{ color }}>{icon}</span>
        {label}
      </div>
      <div className="text-base font-bold leading-tight tabular-nums" style={{ color }}>
        {valueNode ?? value}
      </div>
    </div>
  )
}
