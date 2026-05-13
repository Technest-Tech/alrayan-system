'use client'
import type { Session } from '@/types/system/session'
import { useMarkAttendance } from '@/hooks/system/useSessions'

interface Props {
  session: Session
  onUpdate?: () => void
}

export function AttendanceMarker({ session, onUpdate }: Props) {
  const mark = useMarkAttendance()

  if (session.status !== 'scheduled') {
    const labels: Record<string, string> = {
      attended: '✅ Attended',
      absent:   '❌ Absent',
      cancelled:'⊘ Cancelled',
      pending_substitute: '🟠 Sub needed',
    }
    return <span className="text-xs text-muted-foreground">{labels[session.status] ?? session.status}</span>
  }

  const handle = (status: 'attended' | 'absent') => {
    mark.mutate({ id: session.id, status }, { onSuccess: onUpdate })
  }

  return (
    <div className="flex gap-1">
      <button
        onClick={() => handle('attended')}
        disabled={mark.isPending}
        title="Mark attended"
        className="px-2 py-1 text-xs rounded bg-green-100 text-green-800 hover:bg-green-200"
      >
        ✓
      </button>
      <button
        onClick={() => handle('absent')}
        disabled={mark.isPending}
        title="Mark absent"
        className="px-2 py-1 text-xs rounded bg-red-100 text-red-800 hover:bg-red-200"
      >
        ✗
      </button>
    </div>
  )
}
