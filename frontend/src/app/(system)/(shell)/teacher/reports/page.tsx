'use client'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useSessionReports } from '@/hooks/system/useSessionReports'

const PERF_LABELS: Record<string, string> = {
  excellent:        '🌟 Excellent',
  good:             '👍 Good',
  needs_improvement:'📈 Needs improvement',
}

export default function TeacherReportsPage() {
  const { data: result, isLoading } = useSessionReports({})
  const reports = (result as any)?.data ?? []

  return (
    <>
      <PageHeader title="My reports" description="Session reports you've submitted." />

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : reports.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          No reports submitted yet.
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map((r: any) => (
            <div key={r.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium">{r.student?.name ?? '—'}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.session ? new Date(r.session.scheduled_start).toLocaleString() : new Date(r.submitted_at).toLocaleString()}
                  </div>
                </div>
                <span className="text-sm">{PERF_LABELS[r.performance] ?? r.performance}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{r.covered_text}</p>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
