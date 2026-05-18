'use client'
import { useState, useMemo } from 'react'
import { CalendarDays, Clock, AlertTriangle, FileText, Search } from 'lucide-react'
import { CalendarView } from '@/components/system/schedule/CalendarView'
import { SessionDrawer } from '@/components/system/schedule/SessionDrawer'
import { ConflictBanner } from '@/components/system/schedule/ConflictBanner'
import { useSessions, useSessionConflicts } from '@/hooks/system/useSessions'
import type { Session } from '@/types/system/session'

/* ─── Stat card (matches students/teachers pattern exactly) ─── */
function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: string }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 rounded-xl border"
      style={{ background: '#fff', borderColor: 'rgb(var(--border-default,229 233 240))' }}
    >
      <div
        className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
        style={{ background: `color-mix(in srgb, ${accent} 10%, transparent)`, color: accent }}
      >
        {icon}
      </div>
      <div>
        <p className="text-xl font-semibold leading-none" style={{ color: 'rgb(11 31 58)' }}>{value}</p>
        <p className="text-xs mt-0.5" style={{ color: 'rgb(90 100 112)' }}>{label}</p>
      </div>
    </div>
  )
}

const STATUS_PILLS = [
  { value: '',                   label: 'All' },
  { value: 'scheduled',          label: 'Scheduled' },
  { value: 'attended',           label: 'Attended' },
  { value: 'absent',             label: 'Absent' },
  { value: 'cancelled',          label: 'Cancelled' },
  { value: 'pending_substitute', label: 'Needs Sub' },
]

export default function SchedulePage() {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [statusFilter, setStatusFilter]       = useState('')

  const { data: result, isLoading, refetch } = useSessions({ status: statusFilter || undefined })
  const { data: conflicts }                   = useSessionConflicts()

  const sessions: Session[] = (result as any)?.data ?? []
  const todayStr = new Date().toDateString()

  const todayCount = useMemo(
    () => sessions.filter(s => new Date(s.scheduled_start).toDateString() === todayStr).length,
    [sessions, todayStr],
  )

  const upcomingCount = useMemo(() => {
    const now  = Date.now()
    const week = now + 7 * 24 * 60 * 60 * 1000
    return sessions.filter(s => {
      const t = new Date(s.scheduled_start).getTime()
      return t >= now && t <= week && s.status === 'scheduled'
    }).length
  }, [sessions])

  const pendingReports = useMemo(
    () => sessions.filter(s => s.status === 'attended' && !s.has_report).length,
    [sessions],
  )

  return (
    <>
      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'rgb(11 31 58)' }}>Schedule</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgb(90 100 112)' }}>
            View and manage sessions across all teachers and students.
          </p>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard icon={<CalendarDays size={15} />}  label="Today's sessions"   value={todayCount}            accent="#0B1F3A" />
        <StatCard icon={<Clock size={15} />}          label="Upcoming this week"  value={upcomingCount}          accent="rgb(30 90 171)" />
        <StatCard icon={<AlertTriangle size={15} />}  label="Conflicts"           value={conflicts?.length ?? 0} accent="rgb(234 88 12)" />
        <StatCard icon={<FileText size={15} />}       label="Pending reports"     value={pendingReports}         accent="rgb(124 58 237)" />
      </div>

      {/* ── Conflict alert ── */}
      <ConflictBanner />

      {/* ── Filters card ── */}
      <div
        className="rounded-xl border mb-4 overflow-hidden"
        style={{ borderColor: 'rgb(var(--border-default,229 233 240))', background: '#fff' }}
      >
        {/* Status pills */}
        <div
          className="flex items-center gap-1.5 px-4 py-3 border-b overflow-x-auto"
          style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}
        >
          {STATUS_PILLS.map(p => {
            const active = statusFilter === p.value
            return (
              <button
                key={p.value}
                onClick={() => setStatusFilter(p.value)}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all"
                style={active ? {
                  background: 'rgb(14 124 90)',
                  color: '#fff',
                  boxShadow: '0 1px 4px rgb(14 124 90 / 0.3)',
                } : {
                  background: 'transparent',
                  color: 'rgb(90 100 112)',
                  border: '1px solid rgb(var(--border-default,229 233 240))',
                }}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Calendar ── */}
      <CalendarView
        sessions={sessions}
        loading={isLoading}
        onEventClick={setSelectedSession}
        editable
      />

      <SessionDrawer
        session={selectedSession}
        open={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        onUpdate={refetch}
      />
    </>
  )
}
