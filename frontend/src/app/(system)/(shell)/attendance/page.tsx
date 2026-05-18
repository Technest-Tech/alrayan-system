'use client'
import { useState, useMemo } from 'react'
import {
  ChevronLeft, ChevronRight, Calendar, CheckCircle2, XCircle,
  Clock, RefreshCw, Ban, FileText, Video, Users, MoreHorizontal,
} from 'lucide-react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useSessions, useBulkAttendance, useMarkAttendance } from '@/hooks/system/useSessions'
import { RescheduleSheet } from '@/components/system/schedule/RescheduleSheet'
import { CancelSessionDialog } from '@/components/system/schedule/CancelSessionDialog'
import { SessionDrawer } from '@/components/system/schedule/SessionDrawer'
import type { Session, SessionStatus } from '@/types/system/session'

// ─── constants ────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; strip: string }> = {
  scheduled:          { label: 'Scheduled',   color: '#0E7C5A', bg: 'rgba(14,124,90,.08)',    border: 'rgba(14,124,90,.25)',    strip: '#0E7C5A' },
  attended:           { label: 'Attended',     color: '#1E5AAB', bg: 'rgba(30,90,171,.08)',   border: 'rgba(30,90,171,.25)',   strip: '#1E5AAB' },
  absent:             { label: 'Absent',       color: '#DC2626', bg: 'rgba(220,38,38,.08)',   border: 'rgba(220,38,38,.25)',   strip: '#DC2626' },
  cancelled:          { label: 'Cancelled',    color: '#6B7280', bg: 'rgba(107,114,128,.07)', border: 'rgba(107,114,128,.25)', strip: '#9CA3AF' },
  rescheduled:        { label: 'Rescheduled',  color: '#B45309', bg: 'rgba(217,119,6,.08)',   border: 'rgba(217,119,6,.25)',   strip: '#D97706' },
  pending_substitute: { label: 'Needs Sub',    color: '#C2410C', bg: 'rgba(234,88,12,.08)',   border: 'rgba(234,88,12,.25)',   strip: '#EA580C' },
}

const FILTER_TABS: Array<{ key: string; label: string; statuses: SessionStatus[] | null }> = [
  { key: 'all',      label: 'All',      statuses: null },
  { key: 'pending',  label: 'Pending',  statuses: ['scheduled', 'pending_substitute'] },
  { key: 'attended', label: 'Attended', statuses: ['attended'] },
  { key: 'absent',   label: 'Absent',   statuses: ['absent'] },
  { key: 'closed',   label: 'Closed',   statuses: ['cancelled', 'rescheduled'] },
]

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',    'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700','bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',    'bg-cyan-100 text-cyan-700',
]

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}
function fmtDate(d: Date) {
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
function initials(name?: string | null) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}
function avatarColor(name?: string | null) {
  return AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length]
}
function shiftDate(d: Date, days: number) {
  const r = new Date(d); r.setDate(r.getDate() + days); return r
}

// ─── small presentational pieces ──────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: React.ElementType; color: string
}) {
  return (
    <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
           style={{ background: `${color}18` }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div>
        <div className="text-xl font-bold leading-none" style={{ color: '#0B1F3A' }}>{value}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      </div>
    </div>
  )
}

function Avatar({ name }: { name?: string | null }) {
  return (
    <span className={`inline-flex w-7 h-7 rounded-full items-center justify-center text-[11px] font-bold shrink-0 ${avatarColor(name)}`}>
      {initials(name)}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.cancelled
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap"
          style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
      {cfg.label}
    </span>
  )
}

// ─── table row ────────────────────────────────────────────────────────────────

function SessionRow({
  session, selected, markingId,
  onToggle, onAttended, onAbsent, onReschedule, onCancel, onView,
}: {
  session: Session
  selected: boolean
  markingId: number | null
  onToggle: () => void
  onAttended: () => void
  onAbsent: () => void
  onReschedule: () => void
  onCancel: () => void
  onView: () => void
}) {
  const cfg        = STATUS_CFG[session.status] ?? STATUS_CFG.cancelled
  const canMark    = session.status === 'scheduled' || session.status === 'pending_substitute'
  const canResched = session.status === 'scheduled' || session.status === 'absent'
  const canCancel  = session.status === 'scheduled'
  const isAttended = session.status === 'attended'
  const isPending  = markingId === session.id

  return (
    <tr
      className={`border-b border-gray-100 transition-colors ${
        selected ? 'bg-primary/[0.03]' : 'hover:bg-gray-50/70'
      }`}
    >
      {/* Color strip */}
      <td className="w-1 p-0">
        <div className="w-1 h-full min-h-[52px]" style={{ background: cfg.strip }} />
      </td>

      {/* Checkbox */}
      <td className="pl-4 pr-2 py-3 w-8">
        {canMark && (
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            className="w-4 h-4 rounded cursor-pointer accent-secondary"
          />
        )}
      </td>

      {/* Time */}
      <td className="px-3 py-3 w-32 whitespace-nowrap">
        <span className="text-sm font-semibold" style={{ color: '#0B1F3A' }}>
          {fmtTime(session.scheduled_start)}
        </span>
        <span className="mx-1 text-gray-300">–</span>
        <span className="text-sm text-muted-foreground">{fmtTime(session.scheduled_end)}</span>
        <div className="mt-0.5">
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium"
                style={{ background: 'rgba(11,31,58,.06)', color: '#5A6470' }}>
            <Clock size={9} />{session.duration_min}m
          </span>
        </div>
      </td>

      {/* Student */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar name={session.student?.name} />
          <span className="text-sm font-medium truncate max-w-[160px]" style={{ color: '#0B1F3A' }}>
            {session.student?.name ?? '—'}
          </span>
        </div>
      </td>

      {/* Teacher */}
      <td className="px-3 py-3 hidden sm:table-cell">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar name={session.teacher?.name} />
          <span className="text-sm truncate max-w-[160px] text-muted-foreground">
            {session.teacher?.name ?? '—'}
          </span>
        </div>
      </td>

      {/* Status */}
      <td className="px-3 py-3 w-36">
        <StatusBadge status={session.status} />
      </td>

      {/* Report indicator */}
      <td className="px-3 py-3 w-28 hidden md:table-cell">
        {isAttended ? (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
            session.has_report
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            <FileText size={10} />
            {session.has_report ? 'Report ✓' : 'No report'}
          </span>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}
      </td>

      {/* Zoom */}
      <td className="px-2 py-3 w-10 hidden lg:table-cell">
        {session.zoom_join_url ? (
          <a href={session.zoom_join_url} target="_blank" rel="noopener noreferrer"
             title="Join Zoom"
             className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-blue-50 text-blue-400 transition-colors">
            <Video size={13} />
          </a>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}
      </td>

      {/* Actions */}
      <td className="pl-2 pr-4 py-3 w-auto">
        <div className="flex items-center justify-end gap-1.5">
          {canMark && (
            <>
              <button onClick={onAttended} disabled={isPending}
                className="h-7 px-2.5 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 disabled:opacity-40 transition-colors whitespace-nowrap">
                ✓ Attended
              </button>
              <button onClick={onAbsent} disabled={isPending}
                className="h-7 px-2.5 rounded-lg text-[11px] font-semibold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 disabled:opacity-40 transition-colors whitespace-nowrap">
                ✗ Absent
              </button>
            </>
          )}
          {isAttended && (
            <button onClick={onView}
              className="h-7 px-2.5 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors whitespace-nowrap">
              Report
            </button>
          )}
          {canResched && (
            <button onClick={onReschedule} title="Reschedule"
              className="h-7 w-7 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 transition-colors">
              <RefreshCw size={12} />
            </button>
          )}
          {canCancel && (
            <button onClick={onCancel} title="Cancel"
              className="h-7 w-7 rounded-lg flex items-center justify-center bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 border border-gray-200 transition-colors">
              <Ban size={12} />
            </button>
          )}
          <button onClick={onView} title="Details"
            className="h-7 w-7 rounded-lg flex items-center justify-center bg-gray-50 text-gray-400 hover:bg-gray-100 border border-gray-200 transition-colors">
            <MoreHorizontal size={13} />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const [currentDate,      setCurrentDate]      = useState(() => new Date())
  const [activeTab,        setActiveTab]        = useState('all')
  const [selected,         setSelected]         = useState<number[]>([])
  const [rescheduleTarget, setRescheduleTarget] = useState<Session | null>(null)
  const [cancelTarget,     setCancelTarget]     = useState<Session | null>(null)
  const [drawerSession,    setDrawerSession]    = useState<Session | null>(null)

  const dateStr = currentDate.toISOString().split('T')[0]
  const isToday = dateStr === new Date().toISOString().split('T')[0]

  const { data: result, isLoading, refetch } = useSessions({
    from: `${dateStr}T00:00:00Z`,
    to:   `${dateStr}T23:59:59Z`,
    per_page: 200,
  })

  const sessions: Session[] = (result as any)?.data ?? []
  const bulkMark   = useBulkAttendance()
  const markSingle = useMarkAttendance()

  const stats = useMemo(() => ({
    total:    sessions.length,
    pending:  sessions.filter(s => s.status === 'scheduled' || s.status === 'pending_substitute').length,
    attended: sessions.filter(s => s.status === 'attended').length,
    absent:   sessions.filter(s => s.status === 'absent').length,
    closed:   sessions.filter(s => s.status === 'cancelled' || s.status === 'rescheduled').length,
  }), [sessions])

  const filtered = useMemo(() => {
    const tab = FILTER_TABS.find(t => t.key === activeTab)
    const list = tab?.statuses ? sessions.filter(s => tab.statuses!.includes(s.status)) : sessions
    return [...list].sort((a, b) =>
      new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime()
    )
  }, [sessions, activeTab])

  const pendingIds = useMemo(
    () => sessions.filter(s => s.status === 'scheduled' || s.status === 'pending_substitute').map(s => s.id),
    [sessions]
  )
  const selectableInView = filtered.filter(s => s.status === 'scheduled' || s.status === 'pending_substitute').map(s => s.id)
  const allInViewSelected = selectableInView.length > 0 && selectableInView.every(id => selected.includes(id))

  const completionPct = stats.total > 0
    ? Math.round(((stats.attended + stats.absent + stats.closed) / stats.total) * 100)
    : 0

  function toggle(id: number) {
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }
  function toggleAllInView() {
    if (allInViewSelected) {
      setSelected(p => p.filter(id => !selectableInView.includes(id)))
    } else {
      setSelected(p => [...new Set([...p, ...selectableInView])])
    }
  }
  function bulkAction(status: 'attended' | 'absent') {
    bulkMark.mutate(
      selected.map(id => ({ session_id: id, status })),
      { onSuccess: () => { setSelected([]); refetch() } }
    )
  }
  function markOne(session: Session, status: 'attended' | 'absent') {
    markSingle.mutate({ id: session.id, status }, { onSuccess: () => refetch() })
  }
  function navigateDate(days: number) {
    setCurrentDate(d => shiftDate(d, days))
    setSelected([])
  }

  const markingId = markSingle.isPending ? ((markSingle.variables as any)?.id ?? null) : null

  return (
    <>
      <div className="space-y-5 pb-10">

        {/* ── Header ── */}
        <PageHeader
          title="Attendance"
          description={
            <>
              <span>{fmtDate(currentDate)}</span>
              {isToday && (
                <span className="ml-2 px-1.5 py-0.5 rounded text-[11px] font-semibold"
                      style={{ background: 'rgba(14,124,90,.1)', color: '#0E7C5A' }}>
                  Today
                </span>
              )}
            </>
          }
          actions={
            <div className="flex items-center gap-1.5">
              <button onClick={() => navigateDate(-1)}
                className="h-9 w-9 rounded-lg border bg-white flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-600">
                <ChevronLeft size={16} />
              </button>
              {!isToday && (
                <button onClick={() => { setCurrentDate(new Date()); setSelected([]) }}
                  className="h-9 px-3 rounded-lg border bg-white text-sm font-medium hover:bg-gray-50 transition-colors"
                  style={{ color: '#0B1F3A' }}>
                  Today
                </button>
              )}
              <input
                type="date"
                value={dateStr}
                onChange={e => { setCurrentDate(new Date(e.target.value + 'T12:00:00')); setSelected([]) }}
                className="h-9 px-3 rounded-lg border bg-white text-sm cursor-pointer hover:bg-gray-50 transition-colors"
              />
              <button onClick={() => navigateDate(1)}
                className="h-9 w-9 rounded-lg border bg-white flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-600">
                <ChevronRight size={16} />
              </button>
            </div>
          }
        />

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatCard label="Total"     value={stats.total}    icon={Users}        color="#0B1F3A" />
          <StatCard label="Pending"   value={stats.pending}  icon={Clock}        color="#0E7C5A" />
          <StatCard label="Attended"  value={stats.attended} icon={CheckCircle2} color="#1E5AAB" />
          <StatCard label="Absent"    value={stats.absent}   icon={XCircle}      color="#DC2626" />
          <StatCard label="Cancelled" value={stats.closed}   icon={Ban}          color="#6B7280" />
        </div>

        {/* ── Progress bar ── */}
        {stats.total > 0 && (
          <div className="bg-white rounded-xl border px-4 py-3 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium" style={{ color: '#0B1F3A' }}>Completion</span>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {stats.attended + stats.absent + stats.closed} of {stats.total} marked
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                     style={{
                       width: `${completionPct}%`,
                       background: completionPct === 100 ? '#0E7C5A' : '#1E5AAB',
                     }} />
              </div>
            </div>
            <div className="text-xl font-bold shrink-0 tabular-nums w-12 text-right"
                 style={{ color: completionPct === 100 ? '#0E7C5A' : '#1E5AAB' }}>
              {completionPct}%
            </div>
          </div>
        )}

        {/* ── Filter tabs + bulk bar ── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
            {FILTER_TABS.map(tab => {
              const count = tab.statuses
                ? sessions.filter(s => tab.statuses!.includes(s.status)).length
                : sessions.length
              const active = activeTab === tab.key
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    active ? 'bg-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  style={active ? { color: '#0B1F3A' } : {}}>
                  {tab.label}
                  {count > 0 && (
                    <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                      active ? 'bg-secondary/10 text-secondary' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Bulk actions — only visible when rows selected */}
          {selected.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{selected.length} selected</span>
              <button onClick={() => bulkAction('attended')} disabled={bulkMark.isPending}
                className="h-8 px-3 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                {bulkMark.isPending ? 'Saving…' : '✓ Attended'}
              </button>
              <button onClick={() => bulkAction('absent')} disabled={bulkMark.isPending}
                className="h-8 px-3 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 disabled:opacity-50 transition-colors">
                ✗ Absent
              </button>
              <button onClick={() => setSelected([])}
                className="h-8 px-3 rounded-lg text-xs text-muted-foreground hover:bg-gray-100 border border-gray-200 transition-colors">
                Clear
              </button>
            </div>
          )}
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-xl border overflow-hidden">
          {isLoading ? (
            <div className="divide-y">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-4 h-4 rounded bg-gray-100 animate-pulse" />
                  <div className="w-20 h-4 rounded bg-gray-100 animate-pulse" />
                  <div className="w-32 h-4 rounded bg-gray-100 animate-pulse" />
                  <div className="w-32 h-4 rounded bg-gray-100 animate-pulse" />
                  <div className="w-20 h-5 rounded-full bg-gray-100 animate-pulse ml-auto" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Calendar size={18} className="text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium" style={{ color: '#0B1F3A' }}>
                  {sessions.length === 0 ? 'No sessions on this day' : 'No sessions match this filter'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {sessions.length === 0 ? fmtDate(currentDate) : 'Try a different tab'}
                </p>
              </div>
            </div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-100" style={{ background: '#F8F9FB' }}>
                  {/* strip */}
                  <th className="w-1 p-0" />
                  {/* checkbox */}
                  <th className="pl-4 pr-2 py-2.5 w-8">
                    {selectableInView.length > 0 && (
                      <input
                        type="checkbox"
                        checked={allInViewSelected}
                        onChange={toggleAllInView}
                        className="w-4 h-4 rounded cursor-pointer accent-secondary"
                        title="Select all pending"
                      />
                    )}
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-36">
                    Time
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Student
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                    Teacher
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-36">
                    Status
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-28 hidden md:table-cell">
                    Report
                  </th>
                  <th className="px-2 py-2.5 w-10 hidden lg:table-cell" />
                  <th className="pl-2 pr-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(session => (
                  <SessionRow
                    key={session.id}
                    session={session}
                    selected={selected.includes(session.id)}
                    markingId={markingId}
                    onToggle={() => toggle(session.id)}
                    onAttended={() => markOne(session, 'attended')}
                    onAbsent={() => markOne(session, 'absent')}
                    onReschedule={() => setRescheduleTarget(session)}
                    onCancel={() => setCancelTarget(session)}
                    onView={() => setDrawerSession(session)}
                  />
                ))}
              </tbody>
            </table>
          )}

          {/* Table footer */}
          {!isLoading && filtered.length > 0 && (
            <div className="px-5 py-2.5 border-t border-gray-100 flex items-center justify-between"
                 style={{ background: '#F8F9FB' }}>
              <span className="text-xs text-muted-foreground">
                {filtered.length} session{filtered.length !== 1 ? 's' : ''}
                {pendingIds.length > 0 && (
                  <> · <span className="font-medium text-amber-600">{pendingIds.length} pending</span></>
                )}
              </span>
              {selected.length > 0 && (
                <span className="text-xs font-medium" style={{ color: '#0B1F3A' }}>
                  {selected.length} selected
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Panels ── */}
      {rescheduleTarget && (
        <RescheduleSheet
          session={rescheduleTarget}
          open
          onClose={() => setRescheduleTarget(null)}
          onSuccess={() => { setRescheduleTarget(null); refetch() }}
        />
      )}
      {cancelTarget && (
        <CancelSessionDialog
          session={cancelTarget}
          open
          onClose={() => setCancelTarget(null)}
          onSuccess={() => { setCancelTarget(null); refetch() }}
        />
      )}
      <SessionDrawer
        session={drawerSession}
        open={drawerSession !== null}
        onClose={() => setDrawerSession(null)}
        onUpdate={refetch}
      />
    </>
  )
}
