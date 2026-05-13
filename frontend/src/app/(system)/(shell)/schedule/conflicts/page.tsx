'use client'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useSessionConflicts } from '@/hooks/system/useSessions'

const CONFLICT_LABELS: Record<string, string> = {
  teacher_double_booking: 'Double-booked',
  teacher_on_leave:       'Teacher on leave',
  teacher_unavailable:    'Outside availability',
}

export default function ScheduleConflictsPage() {
  const { data: conflicts, isLoading } = useSessionConflicts()

  return (
    <>
      <PageHeader title="Schedule conflicts" description="Sessions with detected scheduling problems." />

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : !conflicts || conflicts.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          ✅ No conflicts detected — all upcoming sessions look good.
        </div>
      ) : (
        <div className="space-y-2">
          {conflicts.map((c: any, i: number) => (
            <div key={i} className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium">
                  {c.session.student?.name} with {c.session.teacher?.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(c.session.scheduled_start).toLocaleString()}
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {c.conflicts.map((cf: any, j: number) => (
                  <span key={j} className="text-xs rounded-full px-2 py-0.5 bg-orange-100 text-orange-800 border border-orange-200">
                    {CONFLICT_LABELS[cf.type] ?? cf.type}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
