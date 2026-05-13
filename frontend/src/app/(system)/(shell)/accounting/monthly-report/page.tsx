'use client'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { MoneyDisplay } from '@/components/system/primitives/MoneyDisplay'
import { useMonthlyReports, useRegenerateMonthlyReport } from '@/hooks/system/useMonthlyReports'

export default function MonthlyReportPage() {
  const { data, isLoading } = useMonthlyReports()
  const { mutate: regenerate, isPending } = useRegenerateMonthlyReport()

  const reports = data?.data ?? []

  return (
    <>
      <PageHeader title="Monthly Reports" description="Auto-generated on the 1st of each month." />

      <div className="mt-6 rounded-2xl overflow-hidden" style={{ border: '1px solid rgb(var(--border-default))' }}>
        <table className="w-full text-sm">
          <thead style={{ background: 'rgb(var(--surface-card-2))' }}>
            <tr>
              <th className="px-4 py-3 text-left font-medium">Period</th>
              <th className="px-4 py-3 text-left font-medium">Generated</th>
              <th className="px-4 py-3 text-right font-medium">Net profit</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} style={{ borderTop: '1px solid rgb(var(--border-default))' }}>
                {[1,2,3,4].map(j => <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded" style={{ background: 'rgb(var(--surface-card-2))' }} /></td>)}
              </tr>
            ))}
            {reports.map(r => (
              <tr key={r.id} style={{ borderTop: '1px solid rgb(var(--border-default))' }}>
                <td className="px-4 py-3 font-medium">{r.label}</td>
                <td className="px-4 py-3 opacity-60">{r.generated_at ? new Date(r.generated_at).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3 text-right">
                  {r.summary.net_profit != null
                    ? <MoneyDisplay value={r.summary.net_profit} currency={r.summary.base_currency} />
                    : '—'}
                </td>
                <td className="px-4 py-3 text-right flex gap-2 justify-end">
                  {r.pdf_path && (
                    <a href={`/api/system/monthly-reports/${r.id}/pdf`} target="_blank" rel="noopener noreferrer"
                      className="px-3 py-1 text-xs rounded-lg border" style={{ borderColor: 'rgb(var(--border-default))' }}>
                      PDF
                    </a>
                  )}
                  {r.xlsx_path && (
                    <a href={`/api/system/monthly-reports/${r.id}/xlsx`} target="_blank" rel="noopener noreferrer"
                      className="px-3 py-1 text-xs rounded-lg border" style={{ borderColor: 'rgb(var(--border-default))' }}>
                      Excel
                    </a>
                  )}
                  <button
                    onClick={() => regenerate({ year: r.period_year, month: r.period_month })}
                    disabled={isPending}
                    className="px-3 py-1 text-xs rounded-lg border opacity-60 hover:opacity-100 transition-opacity"
                    style={{ borderColor: 'rgb(var(--border-default))' }}>
                    Regenerate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
