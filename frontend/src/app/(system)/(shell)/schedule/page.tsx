'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { CalendarView } from '@/components/system/schedule/CalendarView'
import { SessionDrawer } from '@/components/system/schedule/SessionDrawer'
import { ConflictBanner } from '@/components/system/schedule/ConflictBanner'
import { useSessions } from '@/hooks/system/useSessions'
import type { Session } from '@/types/system/session'

export default function SchedulePage() {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [teacherFilter, setTeacherFilter]     = useState('')
  const [statusFilter, setStatusFilter]       = useState('')

  const { data: result, isLoading, refetch } = useSessions({
    teacher_id: teacherFilter || undefined,
    status:     statusFilter  || undefined,
  })

  const sessions = (result as any)?.data ?? []

  return (
    <>
      <PageHeader title="Schedule" description="View and manage sessions across all teachers and students." />

      <div className="space-y-4">
        <ConflictBanner />

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <select
            className="text-sm px-3 py-1.5 rounded-md border bg-background"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="attended">Attended</option>
            <option value="absent">Absent</option>
            <option value="cancelled">Cancelled</option>
            <option value="pending_substitute">Needs substitute</option>
          </select>
        </div>

        <CalendarView
          sessions={sessions}
          loading={isLoading}
          onEventClick={setSelectedSession}
          editable
        />
      </div>

      <SessionDrawer
        session={selectedSession}
        open={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        onUpdate={refetch}
      />
    </>
  )
}
