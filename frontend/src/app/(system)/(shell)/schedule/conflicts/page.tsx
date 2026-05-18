'use client'
import { AlertTriangle, CalendarDays, Clock, User, Users, Calendar, Ban } from 'lucide-react'
import { useSessionConflicts } from '@/hooks/system/useSessions'
import type { ConflictItem, Session } from '@/types/system/session'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
}

// ── Conflict badge config ─────────────────────────────────────────────────────

const CONFLICT_CONFIG = {
  teacher_double_booking: {
    label: 'Double-booked',
    icon:  Users,
    bg:    'rgb(220 38 38 / 0.08)',
    border:'rgb(220 38 38 / 0.25)',
    text:  'rgb(185 28 28)',
    dot:   '#dc2626',
  },
  teacher_on_leave: {
    label: 'Teacher on leave',
    icon:  Ban,
    bg:    'rgb(234 88 12 / 0.08)',
    border:'rgb(234 88 12 / 0.25)',
    text:  'rgb(154 52 18)',
    dot:   '#ea580c',
  },
  teacher_unavailable: {
    label: 'Outside availability',
    icon:  Clock,
    bg:    'rgb(124 58 237 / 0.08)',
    border:'rgb(124 58 237 / 0.25)',
    text:  'rgb(91 33 182)',
    dot:   '#7c3aed',
  },
} as const

// ── Conflict detail block ─────────────────────────────────────────────────────

function ConflictDetail({ conflict }: { conflict: ConflictItem }) {
  const cfg = CONFLICT_CONFIG[conflict.type] ?? CONFLICT_CONFIG.teacher_unavailable

  let detail: React.ReactNode = null

  if (conflict.type === 'teacher_double_booking' && conflict.related?.scheduled_start) {
    const r = conflict.related
    detail = (
      <div className="flex items-start gap-2 mt-2 text-xs" style={{ color: cfg.text }}>
        <CalendarDays size={12} className="shrink-0 mt-0.5" />
        <span>
          Already booked
          {r.student?.name && <strong> for {r.student.name}</strong>}
          {' '}at <strong>{fmtTime(r.scheduled_start!)}</strong>
          {r.scheduled_end && <> – <strong>{fmtTime(r.scheduled_end)}</strong></>}
          {r.duration_min && <span className="opacity-60"> ({r.duration_min} min)</span>}
        </span>
      </div>
    )
  }

  if (conflict.type === 'teacher_on_leave' && conflict.related?.start_date) {
    const r = conflict.related
    detail = (
      <div className="flex items-start gap-2 mt-2 text-xs" style={{ color: cfg.text }}>
        <Calendar size={12} className="shrink-0 mt-0.5" />
        <span>
          Approved leave from <strong>{fmtDate(r.start_date!)}</strong> to <strong>{fmtDate(r.end_date!)}</strong>
          {r.reason && <span className="opacity-70"> — {r.reason}</span>}
        </span>
      </div>
    )
  }

  if (conflict.type === 'teacher_unavailable') {
    detail = (
      <div className="flex items-start gap-2 mt-2 text-xs" style={{ color: cfg.text }}>
        <Clock size={12} className="shrink-0 mt-0.5" />
        <span>This session falls outside the teacher&apos;s declared availability hours.</span>
      </div>
    )
  }

  return (
    <div className="rounded-lg px-3 py-2.5" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      {/* Badge row */}
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.dot }} />
        <cfg.icon size={12} style={{ color: cfg.text }} />
        <span className="text-xs font-semibold" style={{ color: cfg.text }}>{cfg.label}</span>
      </div>
      {detail}
    </div>
  )
}

// ── Session conflict card ─────────────────────────────────────────────────────

function ConflictCard({ item }: { item: { session: Session; conflicts: ConflictItem[] } }) {
  const { session: s, conflicts } = item
  const worstType = conflicts[0]?.type
  const cfg = worstType ? CONFLICT_CONFIG[worstType] : CONFLICT_CONFIG.teacher_unavailable

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid #E8E2D5', background: '#fff' }}
    >
      {/* Header strip */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: '1px solid #E8E2D5', background: '#FAFAFA' }}
      >
        <div
          className="p-1.5 rounded-lg shrink-0"
          style={{ background: `color-mix(in srgb, ${cfg.dot} 12%, transparent)` }}
        >
          <AlertTriangle size={13} style={{ color: cfg.dot }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold" style={{ color: 'rgb(11 31 58)' }}>
              {s.student?.name ?? '—'}
            </span>
            <span className="text-xs" style={{ color: 'rgb(90 100 112)' }}>with</span>
            <span className="text-sm font-semibold" style={{ color: 'rgb(11 31 58)' }}>
              {s.teacher?.name ?? '—'}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="flex items-center gap-1 text-xs" style={{ color: 'rgb(90 100 112)' }}>
              <CalendarDays size={11} />
              {fmtDateTime(s.scheduled_start)}
            </span>
            <span className="flex items-center gap-1 text-xs" style={{ color: 'rgb(90 100 112)' }}>
              <Clock size={11} />
              {s.duration_min} min
            </span>
          </div>
        </div>

        {/* Conflict count badge */}
        <div
          className="shrink-0 px-2.5 py-1 rounded-full text-xs font-bold"
          style={{ background: `color-mix(in srgb, ${cfg.dot} 12%, transparent)`, color: cfg.dot }}
        >
          {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Conflict details */}
      <div className="px-4 py-3 space-y-2">
        {conflicts.map((cf, i) => (
          <ConflictDetail key={i} conflict={cf} />
        ))}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ScheduleConflictsPage() {
  const { data: conflicts, isLoading } = useSessionConflicts()

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'rgb(11 31 58)' }}>Schedule Conflicts</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgb(90 100 112)' }}>
            Upcoming sessions with detected scheduling problems.
          </p>
        </div>
        {!isLoading && conflicts && conflicts.length > 0 && (
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold"
            style={{ background: 'rgb(220 38 38 / 0.08)', color: 'rgb(185 28 28)', border: '1px solid rgb(220 38 38 / 0.2)' }}
          >
            <AlertTriangle size={14} />
            {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-3 py-12 justify-center">
          <div className="w-6 h-6 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgb(14 124 90 / 0.2)', borderTopColor: 'rgb(14 124 90)' }} />
          <span className="text-sm" style={{ color: 'rgb(90 100 112)' }}>Scanning sessions…</span>
        </div>
      ) : !conflicts || conflicts.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3 py-16 rounded-xl"
          style={{ border: '1px solid #E8E2D5', background: '#fff' }}
        >
          <div className="p-3 rounded-full" style={{ background: 'rgb(14 124 90 / 0.08)' }}>
            <CalendarDays size={22} style={{ color: 'rgb(14 124 90)' }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: 'rgb(11 31 58)' }}>No conflicts detected</p>
          <p className="text-xs" style={{ color: 'rgb(90 100 112)' }}>All upcoming sessions look good.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(conflicts as any[]).map((c, i) => (
            <ConflictCard key={i} item={c} />
          ))}
        </div>
      )}
    </>
  )
}
