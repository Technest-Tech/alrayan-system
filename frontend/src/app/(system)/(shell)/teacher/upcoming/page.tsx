'use client'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { CalendarView } from '@/components/system/schedule/CalendarView'
import { SessionDrawer } from '@/components/system/schedule/SessionDrawer'
import { useSessions } from '@/hooks/system/useSessions'
import { useState } from 'react'
import type { Session } from '@/types/system/session'

export default function TeacherUpcomingPage() {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)

  const from = new Date().toISOString()
  const to   = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: result, isLoading, refetch } = useSessions({ from, to })
  const sessions = (result as any)?.data ?? []

  return (
    <>
      <PageHeader title="Upcoming" description="Your sessions for the next 7 days." />

      <CalendarView
        sessions={sessions}
        loading={isLoading}
        onEventClick={setSelectedSession}
        initialView="timeGridWeek"
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
