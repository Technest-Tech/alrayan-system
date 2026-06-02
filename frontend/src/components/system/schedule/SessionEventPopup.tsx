'use client'
import { useState } from 'react'
import {
  X, CalendarDays, Clock, User, Video, CheckCircle2,
  XCircle, FileText, CalendarClock, Ban, ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { useMarkAttendance } from '@/hooks/system/useSessions'
import type { Session, SessionStatus, QuotaImpact } from '@/types/system/session'

/* ─── constants ─────────────────────────────────────────── */
const STATUS_META: Record<SessionStatus, { label: string; bg: string; fg: string; dot: string }> = {
  scheduled:          { label: 'Scheduled',   bg: 'rgb(219 234 254)', fg: 'rgb(30 64 175)',  dot: 'rgb(59 130 246)' },
  attended:           { label: 'Attended',    bg: 'rgb(220 252 231)', fg: 'rgb(21 128 61)',  dot: 'rgb(34 197 94)' },
  absent:             { label: 'Absent',      bg: 'rgb(254 226 226)', fg: 'rgb(153 27 27)',  dot: 'rgb(239 68 68)' },
  cancelled:          { label: 'Cancelled',   bg: 'rgb(243 244 246)', fg: 'rgb(75 85 99)',   dot: 'rgb(156 163 175)' },
  rescheduled:        { label: 'Rescheduled', bg: 'rgb(254 243 199)', fg: 'rgb(146 64 14)',  dot: 'rgb(245 158 11)' },
  pending_substitute: { label: 'Needs Sub',   bg: 'rgb(255 237 213)', fg: 'rgb(154 52 18)',  dot: 'rgb(249 115 22)' },
}

const QUOTA_META: Record<QuotaImpact, { label: string; bg: string; fg: string }> = {
  counted:         { label: 'Counted',          bg: 'rgb(220 252 231)', fg: 'rgb(21 128 61)' },
  counted_no_show: { label: 'No-show (counted)',bg: 'rgb(254 226 226)', fg: 'rgb(153 27 27)' },
  free_teacher:    { label: 'Free (teacher)',   bg: 'rgb(254 243 199)', fg: 'rgb(146 64 14)' },
  free_excused:    { label: 'Free (excused)',   bg: 'rgb(219 234 254)', fg: 'rgb(30 64 175)' },
  free:            { label: 'Free',             bg: 'rgb(243 244 246)', fg: 'rgb(75 85 99)'  },
}

/* ─── helpers ───────────────────────────────────────────── */
function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

/* ─── props ─────────────────────────────────────────────── */
interface Props {
  session:            Session | null
  onClose:            () => void
  onReschedule:       (s: Session) => void
  onCancel:           (s: Session) => void
  onAbsent:           (s: Session) => void
  onAttendWithReport: (s: Session) => void
  onViewDetails:      (s: Session) => void
}

/* ─── component ─────────────────────────────────────────── */
export function SessionEventPopup({
  session, onClose, onReschedule, onCancel, onAbsent, onAttendWithReport, onViewDetails,
}: Props) {
  const mark = useMarkAttendance()
  const [confirming, setConfirming] = useState(false)

  if (!session) return null

  const s        = session
  const status   = STATUS_META[s.status]
  const canAct   = s.status === 'scheduled' || s.status === 'pending_substitute'
  const needsRep = s.status === 'attended' && !s.has_report
  const showQuota = s.status !== 'scheduled' && s.status !== 'rescheduled' && s.status !== 'pending_substitute'

  async function doAttend() {
    setConfirming(true)
    try {
      await mark.mutateAsync({ id: s.id, status: 'attended' })
      toast.success('Marked as attended.')
      onClose()
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to update.')
    } finally {
      setConfirming(false)
    }
  }

  function action(fn: (s: Session) => void) {
    onClose()
    fn(s)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[rgb(11,31,58)]/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: '#fff', border: '1px solid rgb(var(--border-default,229 233 240))' }}>

        {/* status colour strip */}
        <div className="h-1" style={{ background: status.dot }} />

        {/* header */}
        <div className="px-5 pt-4 pb-3 flex items-start gap-3"
          style={{ borderBottom: '1px solid rgb(var(--border-default,229 233 240))' }}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="text-base font-bold truncate" style={{ color: 'rgb(11 31 58)' }}>
                {s.student?.name ?? '—'}
              </p>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                style={{ background: status.bg, color: status.fg }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.dot }} />
                {status.label}
              </span>
            </div>
            {showQuota && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ background: QUOTA_META[s.quota_impact].bg, color: QUOTA_META[s.quota_impact].fg }}>
                {QUOTA_META[s.quota_impact].label}
              </span>
            )}
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/5 transition-colors opacity-40 hover:opacity-70 shrink-0 mt-0.5">
            <X size={15} />
          </button>
        </div>

        {/* details */}
        <div className="px-5 py-4 space-y-2.5">
          <Row icon={<CalendarDays size={14} />} label={fmtDay(s.scheduled_start)} />
          <Row icon={<Clock size={14} />}
            label={`${fmtTime(s.scheduled_start)} – ${fmtTime(s.scheduled_end)} · ${s.duration_min} min`} />
          <Row icon={<User size={14} />} label={s.teacher?.name ?? 'Unassigned'} />
          {s.zoom_join_url && (
            <a href={s.zoom_join_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:underline"
              style={{ color: 'rgb(30 90 171)' }}>
              <Video size={14} className="shrink-0" />
              <span>Join Zoom</span>
              <ExternalLink size={11} className="opacity-60" />
            </a>
          )}
          {s.has_report && (
            <Row icon={<FileText size={14} />} label="Report submitted" accent="rgb(14 124 90)" />
          )}
          {needsRep && (
            <Row icon={<FileText size={14} />} label="Report pending" accent="rgb(220 38 38)" />
          )}
        </div>

        {/* actions */}
        <div className="px-5 pb-5 space-y-2">
          {canAct && (
            <div className="grid grid-cols-2 gap-2">
              <ActionBtn
                icon={<CheckCircle2 size={13} />} label="Mark Attended"
                bg="rgb(220 252 231)" fg="rgb(21 128 61)"
                loading={confirming} onClick={doAttend}
              />
              <ActionBtn
                icon={<FileText size={13} />} label="Attended + Report"
                bg="rgb(187 247 208)" fg="rgb(21 128 61)"
                onClick={() => action(onAttendWithReport)}
              />
              <ActionBtn
                icon={<XCircle size={13} />} label="Mark Absent"
                bg="rgb(254 226 226)" fg="rgb(153 27 27)"
                onClick={() => action(onAbsent)}
              />
              <ActionBtn
                icon={<CalendarClock size={13} />} label="Reschedule"
                bg="rgb(219 234 254)" fg="rgb(30 64 175)"
                onClick={() => action(onReschedule)}
              />
            </div>
          )}
          {canAct && (
            <ActionBtn
              icon={<Ban size={13} />} label="Cancel Session"
              bg="rgb(243 244 246)" fg="rgb(75 85 99)"
              full onClick={() => action(onCancel)}
            />
          )}
          {needsRep && (
            <ActionBtn
              icon={<FileText size={13} />} label="Fill Session Report"
              bg="rgb(254 243 199)" fg="rgb(146 64 14)"
              full onClick={() => action(onAttendWithReport)}
            />
          )}
          <button
            onClick={() => { onClose(); onViewDetails(s) }}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium border hover:bg-black/[0.02] transition-colors"
            style={{ borderColor: 'rgb(var(--border-default,229 233 240))', color: 'rgb(90 100 112)' }}>
            View full details
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── small helpers ─────────────────────────────────────── */
function Row({ icon, label, accent }: { icon: React.ReactNode; label: string; accent?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm" style={{ color: accent ?? 'rgb(90 100 112)' }}>
      <span className="shrink-0 opacity-60">{icon}</span>
      <span>{label}</span>
    </div>
  )
}

function ActionBtn({
  icon, label, bg, fg, onClick, loading, full,
}: {
  icon: React.ReactNode; label: string; bg: string; fg: string
  onClick: () => void; loading?: boolean; full?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`${full ? 'w-full' : ''} flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50`}
      style={{ background: bg, color: fg }}>
      {icon}
      {label}
    </button>
  )
}
