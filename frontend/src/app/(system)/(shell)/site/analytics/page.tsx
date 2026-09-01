'use client'

import { useMemo, useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import {
  Panel,
  TrafficBreakdown,
  TrafficChart,
  TrafficFunnelPanel,
  TrafficStatTiles,
} from '@/components/system/site/SiteTrafficPanels'
import { useSiteAnalytics } from '@/hooks/system/useSiteAnalytics'

/** Windows offered above the report, in days back from today. */
const RANGES = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
  { label: '12 months', days: 365 },
] as const

function isoDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().slice(0, 10)
}

export default function SiteAnalyticsPage() {
  const [days, setDays] = useState<number>(30)

  // `days - 1` because the window includes today.
  const from = useMemo(() => isoDaysAgo(days - 1), [days])
  const to = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const { data, isLoading, isError } = useSiteAnalytics(from, to)

  return (
    <>
      <PageHeader
        title="Site Traffic"
        description="Who visits the public website, where they come from and what they read."
      >
        <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: 'rgb(var(--surface-card-2))' }}>
          {RANGES.map((range) => (
            <button
              key={range.days}
              type="button"
              onClick={() => setDays(range.days)}
              aria-pressed={days === range.days}
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              style={
                days === range.days
                  ? { background: 'rgb(var(--surface-card))', color: 'rgb(11 31 58)' }
                  : { color: 'rgb(90 100 112)' }
              }
            >
              {range.label}
            </button>
          ))}
        </div>
      </PageHeader>

      {isError && (
        <Panel title="Traffic unavailable">
          <p className="text-sm opacity-60">
            The traffic report could not be loaded. Refresh the page to try again.
          </p>
        </Panel>
      )}

      {isLoading && !data && <SkeletonReport />}

      {data && (
        <div className="space-y-4">
          <TrafficStatTiles summary={data.summary} />

          <TrafficChart series={data.series} />

          <div className="grid gap-4 lg:grid-cols-2">
            <TrafficBreakdown
              title="Top pages"
              subtitle="Most-read pages in this period"
              rows={data.top_pages}
            />
            <TrafficBreakdown
              title="Traffic sources"
              subtitle="Campaign tag, or the site that linked here"
              rows={data.sources}
            />
            <TrafficBreakdown
              title="Countries"
              subtitle="Resolved by the CDN — Unknown when it reports none"
              rows={data.countries}
            />
            <TrafficBreakdown
              title="Devices"
              subtitle="Desktop, mobile and tablet"
              rows={data.devices}
            />
            <TrafficBreakdown
              title="Browsers"
              rows={data.browsers}
            />
            <TrafficBreakdown
              title="Languages"
              subtitle="Which version of the site was served"
              rows={data.locales}
            />
          </div>

          <TrafficFunnelPanel funnel={data.funnel} />

          <p className="flex items-center gap-1.5 text-xs opacity-50">
            <BarChart3 className="size-3.5" aria-hidden="true" />
            Bots and crawlers are excluded. Visitors are counted once per day, from a
            hash that stores no IP address and sets no cookie.
          </p>
        </div>
      )}
    </>
  )
}

function SkeletonReport() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: 'rgb(var(--surface-card-2))' }} />
        ))}
      </div>
      <div className="h-[336px] rounded-2xl animate-pulse" style={{ background: 'rgb(var(--surface-card-2))' }} />
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-64 rounded-2xl animate-pulse" style={{ background: 'rgb(var(--surface-card-2))' }} />
        ))}
      </div>
    </div>
  )
}
