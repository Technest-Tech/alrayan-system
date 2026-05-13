'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useLeadAnalytics } from '@/hooks/system/useLeads'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

function pct(n: number, total: number) {
  if (!total) return '0%'
  return Math.round((n / total) * 100) + '%'
}

const PRESETS: Record<string, { from: string; to: string }> = {
  '30d': { from: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) },
  '90d': { from: new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) },
  '180d': { from: new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) },
}

export default function LeadAnalyticsPage() {
  const [preset, setPreset] = useState('30d')
  const { from, to } = PRESETS[preset]
  const { data, isLoading } = useLeadAnalytics(from, to)

  return (
    <>
      <PageHeader title="Lead analytics" description="Conversion funnel, sources, and trends.">
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild><Link href="/leads">← Leads</Link></Button>
          <Select value={preset} onValueChange={setPreset}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="180d">Last 180 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      {isLoading && <p className="text-muted-foreground p-4">Loading…</p>}
      {data && (
        <div className="space-y-8">
          {/* Funnel */}
          <section>
            <h2 className="font-semibold mb-3">Conversion funnel</h2>
            <div className="space-y-2">
              {([['Leads', data.funnel.leads, data.funnel.leads], ['Contacted', data.funnel.contacted, data.funnel.leads], ['Trials', data.funnel.trials, data.funnel.leads], ['Enrolled', data.funnel.enrolled, data.funnel.leads]] as [string, number, number][]).map(([label, val, base]) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="w-20 text-sm text-muted-foreground">{label}</span>
                  <div className="flex-1 h-4 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: pct(val, base) }} />
                  </div>
                  <span className="text-sm font-medium w-20 text-right">{val} ({pct(val, base)})</span>
                </div>
              ))}
            </div>
          </section>

          {/* By source */}
          <section>
            <h2 className="font-semibold mb-3">By source</h2>
            <div className="divide-y rounded border">
              {data.by_source.map(s => (
                <div key={s.source} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span className="capitalize">{s.source.replace(/_/g, ' ')}</span>
                  <span className="text-muted-foreground">{s.total} leads → {s.enrolled_count} enrolled ({pct(s.enrolled_count, s.total)})</span>
                </div>
              ))}
            </div>
          </section>

          {/* Daily trend */}
          <section>
            <h2 className="font-semibold mb-3">Daily trend</h2>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data.trend_daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="leads_count" stroke="#3b82f6" fill="#bfdbfe" name="Leads" />
                <Area type="monotone" dataKey="trials_count" stroke="#8b5cf6" fill="#ddd6fe" name="Trials" />
                <Area type="monotone" dataKey="enrolled_count" stroke="#22c55e" fill="#bbf7d0" name="Enrolled" />
              </AreaChart>
            </ResponsiveContainer>
          </section>
        </div>
      )}
    </>
  )
}
