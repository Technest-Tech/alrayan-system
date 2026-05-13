'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useSessionReports } from '@/hooks/system/useSessionReports'

const PERF_LABELS: Record<string, string> = {
  excellent:        'Excellent',
  good:             'Good',
  needs_improvement:'Needs improvement',
}

export default function SessionReportsPage() {
  const { data: result, isLoading } = useSessionReports({})

  const reports = (result as any)?.data ?? []

  return (
    <>
      <PageHeader title="Session reports" description="Review submitted reports and track missing ones." />

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : reports.length === 0 ? (
          <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
            No session reports found.
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="py-2 px-3 text-left">Submitted</th>
                  <th className="py-2 px-3 text-left">Student</th>
                  <th className="py-2 px-3 text-left">Teacher</th>
                  <th className="py-2 px-3 text-left">Performance</th>
                  <th className="py-2 px-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r: any) => (
                  <tr key={r.id} className="border-t hover:bg-muted/30">
                    <td className="py-2 px-3 text-muted-foreground">
                      {new Date(r.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-3 font-medium">{r.student?.name ?? '—'}</td>
                    <td className="py-2 px-3 text-muted-foreground">{r.teacher?.name ?? '—'}</td>
                    <td className="py-2 px-3">{PERF_LABELS[r.performance] ?? r.performance}</td>
                    <td className="py-2 px-3">
                      <span className="text-xs rounded-full px-2 py-0.5 bg-green-100 text-green-800">Submitted</span>
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
