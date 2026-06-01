'use client'
import { useState } from 'react'
import { CheckCircle2, XCircle, Clock, RefreshCw, MessageCircle, Search, AlertTriangle, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useWassenderLogs, useWassenderStats, useRetryWassenderLog, type LogFilters } from '@/hooks/system/useWassenderLogs'
import type { WassenderLog, WassenderLogStatus } from '@/types/system/wassenderLog'
import { toast } from 'sonner'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000)      return 'just now'
  if (diff < 3_600_000)   return `${Math.round(diff / 60_000)}m ago`
  if (diff < 86_400_000)  return `${Math.round(diff / 3_600_000)}h ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTemplateKey(key: string | null) {
  if (!key) return '—'
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace('2H', '2h')
    .replace('5Min', '5min')
}

const STATUS_CONFIG: Record<WassenderLogStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  sent:    { label: 'Sent',    color: 'rgb(14 124 90)',   bg: 'rgb(14 124 90 / 0.08)',   icon: CheckCircle2 },
  failed:  { label: 'Failed',  color: 'rgb(220 38 38)',   bg: 'rgb(220 38 38 / 0.08)',   icon: XCircle },
  dead:    { label: 'Dead',    color: 'rgb(120 53 15)',   bg: 'rgb(251 191 36 / 0.12)',  icon: AlertTriangle },
  queued:  { label: 'Queued',  color: 'rgb(90 100 112)',  bg: 'rgb(90 100 112 / 0.08)',  icon: Clock },
  sending: { label: 'Sending', color: 'rgb(30 90 171)',   bg: 'rgb(30 90 171 / 0.08)',   icon: RefreshCw },
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color, bg, icon: Icon, onClick, active }: {
  label: string; value: number; color: string; bg: string; icon: React.ElementType
  onClick?: () => void; active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3.5 rounded-2xl px-5 py-4 text-left transition-all w-full"
      style={{
        background: active ? bg : '#fff',
        border: `1.5px solid ${active ? color : 'rgb(var(--border-default,229 233 240))'}`,
        boxShadow: active ? `0 0 0 2px ${color}22` : undefined,
      }}
    >
      <div className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0" style={{ background: bg }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold leading-none" style={{ color: 'rgb(11 31 58)' }}>{value.toLocaleString()}</p>
        <p className="text-xs mt-1 font-medium" style={{ color: 'rgb(90 100 112)' }}>{label}</p>
      </div>
    </button>
  )
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: WassenderLogStatus }) {
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}>
      <Icon size={11} />
      {cfg.label}
    </span>
  )
}

// ── Row ───────────────────────────────────────────────────────────────────────

function LogRow({ log, onRetry, retrying }: {
  log: WassenderLog
  onRetry: (id: number) => void
  retrying: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const recipient = log.recipient_phone ?? log.whatsapp_group?.linked_name ?? '—'
  const canRetry  = log.status === 'failed' || log.status === 'dead'

  return (
    <>
      <tr
        className="border-b cursor-pointer hover:bg-gray-50/70 transition-colors"
        style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}
        onClick={() => setExpanded(e => !e)}
      >
        <td className="px-4 py-3 text-xs" style={{ color: 'rgb(90 100 112)', whiteSpace: 'nowrap' }}>
          {formatRelative(log.created_at)}
        </td>
        <td className="px-4 py-3">
          <span className="text-xs font-medium" style={{ color: 'rgb(11 31 58)' }}>
            {formatTemplateKey(log.template_key)}
          </span>
        </td>
        <td className="px-4 py-3 text-xs font-mono" style={{ color: 'rgb(90 100 112)' }}>
          {recipient}
        </td>
        <td className="px-4 py-3">
          <StatusBadge status={log.status} />
        </td>
        <td className="px-4 py-3 max-w-xs">
          <p className="text-xs truncate" style={{ color: 'rgb(90 100 112)' }}>
            {log.rendered_message}
          </p>
        </td>
        <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
          {canRetry && (
            <button
              onClick={() => onRetry(log.id)}
              disabled={retrying}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all hover:bg-red-50 disabled:opacity-40"
              style={{ borderColor: 'rgb(220 38 38 / 0.3)', color: 'rgb(220 38 38)' }}
            >
              <RotateCcw size={11} className={retrying ? 'animate-spin' : ''} />
              Retry
            </button>
          )}
        </td>
      </tr>
      {expanded && (
        <tr style={{ background: 'rgb(248 250 252)' }}>
          <td colSpan={6} className="px-4 py-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <p className="font-semibold mb-1 opacity-50 uppercase tracking-wide text-[10px]">Message</p>
                <pre className="whitespace-pre-wrap leading-relaxed" style={{ color: 'rgb(11 31 58)', fontFamily: 'inherit' }}>
                  {log.rendered_message}
                </pre>
              </div>
              <div className="space-y-2">
                {log.error && (
                  <div>
                    <p className="font-semibold mb-1 text-red-500 uppercase tracking-wide text-[10px]">Error</p>
                    <p className="text-red-700">{log.error}</p>
                  </div>
                )}
                <div>
                  <p className="font-semibold mb-1 opacity-50 uppercase tracking-wide text-[10px]">Details</p>
                  <dl className="space-y-1">
                    <div className="flex gap-2"><dt className="opacity-50 w-24 shrink-0">Attempts</dt><dd>{log.attempt_count}</dd></div>
                    {log.sent_at && <div className="flex gap-2"><dt className="opacity-50 w-24 shrink-0">Sent at</dt><dd>{new Date(log.sent_at).toLocaleString('en-GB')}</dd></div>}
                    {log.external_message_id && <div className="flex gap-2"><dt className="opacity-50 w-24 shrink-0">Ext. ID</dt><dd className="font-mono truncate">{log.external_message_id}</dd></div>}
                  </dl>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WhatsAppRemindersPage() {
  const [filters, setFilters] = useState<LogFilters>({
    status: '', search: '', from: '', to: '', page: 1,
  })
  const [retryingId, setRetryingId] = useState<number | null>(null)

  const { data,      isLoading } = useWassenderLogs({ ...filters, per_page: 30 })
  const { data: stats }          = useWassenderStats({ from: filters.from, to: filters.to })
  const retry                    = useRetryWassenderLog()

  const logs  = data?.data ?? []
  const meta  = (data as { meta?: { current_page: number; last_page: number; total: number } } | undefined)?.meta
  const total = stats?.total ?? 0

  function setFilter(key: keyof LogFilters, value: string) {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  async function handleRetry(id: number) {
    setRetryingId(id)
    try {
      await retry.mutateAsync(id)
      toast.success('Message re-queued for delivery.')
    } catch {
      toast.error('Failed to retry — check logs.')
    } finally {
      setRetryingId(null)
    }
  }

  const statCards: Array<{ key: WassenderLogStatus | 'all'; label: string; value: number; color: string; bg: string; icon: React.ElementType }> = [
    { key: 'all',    label: 'Total',  value: total,               color: 'rgb(30 90 171)', bg: 'rgb(30 90 171 / 0.08)', icon: MessageCircle },
    { key: 'sent',   value: stats?.sent    ?? 0, ...STATUS_CONFIG.sent },
    { key: 'failed', value: stats?.failed  ?? 0, ...STATUS_CONFIG.failed },
    { key: 'dead',   value: stats?.dead    ?? 0, ...STATUS_CONFIG.dead },
    { key: 'queued', value: stats?.queued  ?? 0, ...STATUS_CONFIG.queued },
  ]

  return (
    <>
      <PageHeader
        title="Reminders Log"
        description="All WhatsApp confirmations and reminders sent by the system."
      />

      {/* ── Stat cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {statCards.map(card => (
          <StatCard
            key={card.key}
            label={card.label}
            value={card.value}
            color={card.color}
            bg={card.bg}
            icon={card.icon}
            active={filters.status === (card.key === 'all' ? '' : card.key)}
            onClick={() => setFilter('status', card.key === 'all' ? '' : card.key)}
          />
        ))}
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
          <input
            type="text"
            placeholder="Phone or template…"
            value={filters.search ?? ''}
            onChange={e => setFilter('search', e.target.value)}
            className="pl-8 pr-3 py-2 text-sm rounded-xl border outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] transition-shadow w-52"
            style={{ borderColor: 'rgb(var(--border-default,229 233 240))', background: '#fff' }}
          />
        </div>
        <input
          type="date"
          value={filters.from ?? ''}
          onChange={e => setFilter('from', e.target.value)}
          className="px-3 py-2 text-sm rounded-xl border outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] transition-shadow"
          style={{ borderColor: 'rgb(var(--border-default,229 233 240))', background: '#fff', color: 'rgb(11 31 58)' }}
        />
        <input
          type="date"
          value={filters.to ?? ''}
          onChange={e => setFilter('to', e.target.value)}
          className="px-3 py-2 text-sm rounded-xl border outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] transition-shadow"
          style={{ borderColor: 'rgb(var(--border-default,229 233 240))', background: '#fff', color: 'rgb(11 31 58)' }}
        />
        {(filters.search || filters.from || filters.to || filters.status) && (
          <button
            onClick={() => setFilters({ status: '', search: '', from: '', to: '', page: 1 })}
            className="px-3 py-2 text-sm rounded-xl border hover:bg-gray-50 transition-colors"
            style={{ borderColor: 'rgb(var(--border-default,229 233 240))', color: 'rgb(90 100 112)' }}
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Table ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgb(var(--border-default,229 233 240))', background: '#fff' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'rgb(var(--surface-card-2,248 250 252))' }}>
              {['Time', 'Template', 'Recipient', 'Status', 'Message preview', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: 'rgb(90 100 112)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-sm opacity-40">Loading…</td></tr>
            )}
            {!isLoading && logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 opacity-40">
                    <MessageCircle size={28} />
                    <p className="text-sm">No messages found</p>
                  </div>
                </td>
              </tr>
            )}
            {logs.map(log => (
              <LogRow
                key={log.id}
                log={log}
                onRetry={handleRetry}
                retrying={retryingId === log.id}
              />
            ))}
          </tbody>
        </table>

        {/* ── Pagination ─────────────────────────────────────────── */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t"
            style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
            <p className="text-xs" style={{ color: 'rgb(90 100 112)' }}>
              Page {meta.current_page} of {meta.last_page}
            </p>
            <div className="flex gap-1.5">
              <button
                onClick={() => setFilters(f => ({ ...f, page: Math.max(1, (f.page ?? 1) - 1) }))}
                disabled={(filters.page ?? 1) <= 1}
                className="p-1.5 rounded-lg border disabled:opacity-30 hover:bg-gray-50 transition-colors"
                style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setFilters(f => ({ ...f, page: Math.min(meta.last_page, (f.page ?? 1) + 1) }))}
                disabled={(filters.page ?? 1) >= meta.last_page}
                className="p-1.5 rounded-lg border disabled:opacity-30 hover:bg-gray-50 transition-colors"
                style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
