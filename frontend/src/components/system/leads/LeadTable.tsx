'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, ExternalLink, MessageCircle, XCircle, Search } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import type { Lead } from '@/types/system/lead'
import { DataTable, type ColumnDef } from '@/components/system/primitives/DataTable'
import { EmptyState } from '@/components/system/primitives/EmptyState'
import { useMarkLeadLost } from '@/hooks/system/useLeads'
import { ApiError } from '@/lib/system/api'
import { useI18n } from '@/lib/system/i18n'

/* ─── Status styling ──────────────────────────── */
const STATUS_STYLES: Record<string, { bg: string; color: string; key: string }> = {
  new_lead:            { bg: 'rgb(30 90 171 / 0.1)',   color: 'rgb(30 90 171)',   key: 'leads.statusNewLead' },
  interested:          { bg: 'rgb(14 124 90 / 0.1)',   color: 'rgb(14 124 90)',   key: 'leads.statusInterested' },
  waiting_for_trial:   { bg: 'rgb(180 120 0 / 0.1)',   color: 'rgb(140 95 0)',    key: 'leads.statusWaitingForTrial' },
  waiting_for_payment: { bg: 'rgb(220 60 40 / 0.1)',   color: 'rgb(180 40 20)',   key: 'leads.statusWaitingForPayment' },
  closed:              { bg: 'rgb(14 124 90 / 0.12)',  color: 'rgb(14 124 90)',   key: 'leads.statusClosed' },
  not_interested:      { bg: 'rgb(190 24 93 / 0.1)',   color: 'rgb(190 24 93)',   key: 'leads.statusNotInterested' },
  lost:                { bg: 'rgb(90 100 112 / 0.1)',  color: 'rgb(90 100 112)',  key: 'leads.statusLost' },
}

const SOURCE_LABELS: Record<string, string> = {
  google_ads: 'Google', facebook_ads: 'Facebook', instagram_ads: 'Instagram',
  whatsapp_direct: 'WhatsApp', student_referral: 'Referral', website_form: 'Website', manual_entry: 'Manual',
}

/* ─── Avatar helpers ──────────────────────────── */
const PALETTE = ['#0E7C5A', '#0B1F3A', '#1E5AAB', '#7C3AED', '#B45309', '#BE185D']

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() ?? '').join('')
}
function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (name.charCodeAt(i) + ((h << 5) - h)) | 0
  return PALETTE[Math.abs(h) % PALETTE.length]
}

/* ─── Row actions ─────────────────────────────── */
function LeadRowActions({ lead }: { lead: Lead }) {
  const { t } = useI18n()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pos,  setPos]  = useState({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const markLost = useMarkLeadLost(lead.id)

  function toggle(e: React.MouseEvent) {
    e.stopPropagation()
    if (open) { setOpen(false); return }
    const rect = btnRef.current!.getBoundingClientRect()
    setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    function close() { setOpen(false) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [open])

  async function handleMarkLost() {
    setOpen(false)
    try {
      await markLost.mutateAsync({ lost_reason: 'other' })
      toast.success(t('leads.toastMarkedLost'))
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('leads.toastActionFailed'))
    }
  }

  const dropdown = open ? createPortal(
    <div
      className="fixed z-[9999] min-w-[192px] rounded-xl border shadow-lg overflow-hidden py-1"
      style={{
        top: pos.top,
        right: pos.right,
        background: '#fff',
        borderColor: 'rgb(var(--border-default,229 233 240))',
        boxShadow: '0 8px 30px rgb(11 31 58 / 0.12)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <MenuItem icon={<ExternalLink size={14} />} label={t('leads.contextViewLead')}
        onClick={() => { setOpen(false); router.push(`/leads/${lead.id}`) }} />
      {lead.whatsapp && (
        <MenuItem icon={<MessageCircle size={14} />} label={t('leads.contextOpenWhatsApp')}
          onClick={() => { setOpen(false); window.open(`https://wa.me/${lead.whatsapp!.replace(/\D/g, '')}`, '_blank') }} />
      )}
      {lead.status !== 'lost' && lead.status !== 'closed' && (
        <>
          <div className="my-1 border-t" style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }} />
          <MenuItem icon={<XCircle size={14} />} label={t('leads.contextMarkLost')} onClick={handleMarkLost} danger />
        </>
      )}
    </div>,
    document.body,
  ) : null

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        className="p-1.5 rounded-lg transition-colors hover:bg-black/5 opacity-0 group-hover/row:opacity-100 focus:opacity-100"
        style={{ color: 'rgb(90 100 112)' }}
        aria-label="Row actions"
      >
        <MoreHorizontal size={15} />
      </button>
      {dropdown}
    </>
  )
}

function MenuItem({ icon, label, onClick, danger }: {
  icon?: React.ReactNode; label: string; onClick: () => void; danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-left transition-colors hover:bg-black/[0.03]"
      style={{ color: danger ? 'rgb(166 39 30)' : 'rgb(11 31 58)' }}
    >
      <span className="opacity-60">{icon}</span>
      {label}
    </button>
  )
}

/* ─── Status badge ────────────────────────────── */
function LeadStatusBadge({ status }: { status: string }) {
  const { t } = useI18n()
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.new_lead
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      {t(s.key)}
    </span>
  )
}

/* ─── Main table ──────────────────────────────── */
interface Props {
  leads: Lead[]
  isLoading: boolean
  filters: Record<string, string>
  onFiltersChange: (f: Record<string, string>) => void
}

export function LeadTable({ leads, isLoading, filters, onFiltersChange }: Props) {
  const { t } = useI18n()
  const columns: ColumnDef<Lead>[] = [
    {
      id:     'name',
      header: t('leads.columnLead'),
      cell: ({ row }) => {
        const l     = row.original
        const color = avatarColor(l.name)
        return (
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-semibold shrink-0 select-none"
              style={{ background: color }}
            >
              {initials(l.name)}
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate" style={{ color: 'rgb(11 31 58)' }}>{l.name}</p>
              <p className="text-xs truncate" style={{ color: 'rgb(90 100 112)' }}>
                {l.email ?? l.country ?? ''}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      id:     'source',
      header: t('leads.fieldSource'),
      cell: ({ row }) => (
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-md"
          style={{ background: 'rgb(244 246 250)', color: 'rgb(11 31 58)' }}
        >
          {(row.original.source ? SOURCE_LABELS[row.original.source] : null) ?? row.original.source}
        </span>
      ),
    },
    {
      id:     'status',
      header: t('common.status'),
      cell: ({ row }) => <LeadStatusBadge status={row.original.status} />,
    },
    {
      id:     'supervisor',
      header: t('leads.columnSupervisor'),
      cell: ({ row }) => row.original.supervisor_name
        ? <span style={{ color: 'rgb(11 31 58)' }}>{row.original.supervisor_name}</span>
        : <span style={{ color: 'rgb(203 211 222)' }}>—</span>,
    },
    {
      id:     'updated',
      header: t('leads.columnLastActivity'),
      cell: ({ row }) => (
        <span className="text-xs" style={{ color: 'rgb(90 100 112)' }}>
          {formatDistanceToNow(new Date(row.original.updated_at), { addSuffix: true })}
        </span>
      ),
    },
    {
      id:            'actions',
      header:        '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <LeadRowActions lead={row.original} />
        </div>
      ),
    },
  ]

  const toolbar = (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-40" />
          <input
            type="text"
            placeholder={t('common.search')}
            className="pl-7 pr-3 py-1.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] w-44 transition-shadow"
            style={{ borderColor: 'rgb(var(--border-default,229 233 240))', background: '#fff' }}
            value={filters.q ?? ''}
            onChange={e => onFiltersChange({ ...filters, q: e.target.value })}
          />
        </div>
        <select
          className="px-2.5 py-1.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] appearance-none transition-shadow"
          style={{ borderColor: 'rgb(var(--border-default,229 233 240))', background: '#fff' }}
          value={filters.status ?? ''}
          onChange={e => onFiltersChange({ ...filters, status: e.target.value || '' })}
        >
          <option value="">{t('leads.filterAllStatuses')}</option>
          {Object.entries(STATUS_STYLES).map(([v, s]) => (
            <option key={v} value={v}>{t(s.key)}</option>
          ))}
        </select>
      </div>
      <span className="text-sm font-medium" style={{ color: 'rgb(90 100 112)' }}>
        {leads.length} {leads.length === 1 ? t('leads.countSingular') : t('leads.countPlural')}
      </span>
    </div>
  )

  return (
    <DataTable
      data={leads}
      columns={columns}
      isLoading={isLoading}
      toolbar={toolbar}
      rowClassName="group/row"
      emptyState={
        <EmptyState
          icon="Users"
          title={t('leads.tableEmpty')}
          description={t('leads.tableEmptyHint')}
        />
      }
    />
  )
}
