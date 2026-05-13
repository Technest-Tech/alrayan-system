'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { AttendanceMarker } from '@/components/system/attendance/AttendanceMarker'
import { useSessions, useBulkAttendance } from '@/hooks/system/useSessions'

export default function AttendancePage() {
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0])
  const [selected, setSelected]     = useState<number[]>([])

  const { data: result, isLoading, refetch } = useSessions({
    from: `${dateFilter}T00:00:00Z`,
    to:   `${dateFilter}T23:59:59Z`,
  })

  const sessions = (result as any)?.data ?? []
  const bulkMark = useBulkAttendance()

  const toggleSelect = (id: number) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const bulkAttend = () => {
    bulkMark.mutate(
      selected.map(id => ({ session_id: id, status: 'attended' })),
      { onSuccess: () => { setSelected([]); refetch() } }
    )
  }

  return (
    <>
      <PageHeader title="Attendance" description="Mark and review session outcomes." />

      <div className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3">
          <input
            type="date"
            className="px-3 py-1.5 rounded-md border bg-background text-sm"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
          />
        </div>

        {selected.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{selected.length} selected</span>
            <button
              onClick={bulkAttend}
              disabled={bulkMark.isPending}
              className="px-3 py-1.5 text-sm rounded-md bg-green-600 text-white hover:bg-green-700"
            >
              Bulk-mark as attended
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : sessions.length === 0 ? (
          <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
            No sessions found for this date.
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="py-2 px-3 text-left w-8">
                    <input
                      type="checkbox"
                      checked={selected.length === sessions.filter((s: any) => s.status === 'scheduled').length}
                      onChange={e => setSelected(e.target.checked ? sessions.filter((s: any) => s.status === 'scheduled').map((s: any) => s.id) : [])}
                    />
                  </th>
                  <th className="py-2 px-3 text-left">Time</th>
                  <th className="py-2 px-3 text-left">Student</th>
                  <th className="py-2 px-3 text-left">Teacher</th>
                  <th className="py-2 px-3 text-left">Status</th>
                  <th className="py-2 px-3 text-left">Mark</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session: any) => (
                  <tr key={session.id} className="border-t hover:bg-muted/30">
                    <td className="py-2 px-3">
                      {session.status === 'scheduled' && (
                        <input
                          type="checkbox"
                          checked={selected.includes(session.id)}
                          onChange={() => toggleSelect(session.id)}
                        />
                      )}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">
                      {new Date(session.scheduled_start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </td>
                    <td className="py-2 px-3 font-medium">{session.student?.name ?? '—'}</td>
                    <td className="py-2 px-3 text-muted-foreground">{session.teacher?.name ?? '—'}</td>
                    <td className="py-2 px-3">
                      <span className="text-xs capitalize">{session.status.replace('_', ' ')}</span>
                    </td>
                    <td className="py-2 px-3">
                      <AttendanceMarker session={session} onUpdate={refetch} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
