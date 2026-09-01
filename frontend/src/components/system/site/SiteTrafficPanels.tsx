'use client'

import {
  Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import type {
  TrafficBreakdownRow, TrafficFunnel, TrafficPoint, TrafficSummary,
} from '@/types/system/siteAnalytics'

// Two series, one axis: page views and visitors are both counts of the same
// thing happening, so they share a scale. Colours are the console's blue and a
// deepened gold — the pair passes lightness, chroma, CVD separation and 3:1
// contrast against the white card (validated, not eyeballed).
const VISITORS_CLR  = '#1E5AAB'
const PAGEVIEWS_CLR = '#9A7117'
const INK           = 'rgb(11 31 58)'
const MUTED         = 'rgb(90 100 112)'
const GRID          = 'rgb(229 233 240)'
const SUCCESS       = 'rgb(var(--status-success, 14 124 90))'
const DANGER        = 'rgb(var(--status-danger, 166 39 30))'

const CARD_STYLE = {
  background: 'rgb(var(--surface-card))',
  border: '1px solid rgb(var(--border-default))',
}
/** The muted track a proportional bar sits in. */
const TRACK_STYLE = { background: 'rgb(var(--surface-card-2))' }

export function Panel({ title, subtitle, children, right }: {
  title: string; subtitle?: string; children: React.ReactNode; right?: React.ReactNode
}) {
  return (
    <section className="rounded-2xl p-5" style={CARD_STYLE}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs opacity-60">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  )
}

/* ───────────────────────── Headline numbers ───────────────────────── */

function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(Math.round(value))
}

/** Percentage change against the previous window, or null when there's no base. */
function delta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return ((current - previous) / previous) * 100
}

function Delta({ value, invert = false }: { value: number | null; invert?: boolean }) {
  if (value === null) {
    return <span className="text-xs opacity-50">new</span>
  }

  const rounded = Math.round(value * 10) / 10
  // For bounce rate, down is the good direction — hence `invert`.
  const good = invert ? rounded < 0 : rounded > 0
  const Icon = rounded === 0 ? Minus : rounded > 0 ? ArrowUp : ArrowDown

  return (
    <span
      className="inline-flex items-center gap-0.5 text-xs font-medium"
      style={rounded === 0 ? { opacity: 0.5 } : { color: good ? SUCCESS : DANGER }}
    >
      <Icon className="size-3" aria-hidden="true" />
      {Math.abs(rounded)}%
    </span>
  )
}

function Tile({ label, value, suffix, deltaValue, invert }: {
  label: string; value: string; suffix?: string; deltaValue: number | null; invert?: boolean
}) {
  return (
    <div className="rounded-2xl p-5" style={CARD_STYLE}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-60">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular">{value}</span>
        {suffix && <span className="text-sm opacity-60">{suffix}</span>}
      </div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <Delta value={deltaValue} invert={invert} />
        <span className="text-xs opacity-50">vs previous period</span>
      </div>
    </div>
  )
}

export function TrafficStatTiles({ summary }: { summary: TrafficSummary }) {
  const prev = summary.previous

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <Tile
        label="Visitors"
        value={formatNumber(summary.visitors)}
        deltaValue={delta(summary.visitors, prev.visitors)}
      />
      <Tile
        label="Page views"
        value={formatNumber(summary.pageviews)}
        deltaValue={delta(summary.pageviews, prev.pageviews)}
      />
      <Tile
        label="Sessions"
        value={formatNumber(summary.sessions)}
        deltaValue={delta(summary.sessions, prev.sessions)}
      />
      <Tile
        label="Bounce rate"
        value={String(summary.bounce_rate)}
        suffix="%"
        deltaValue={delta(summary.bounce_rate, prev.bounce_rate)}
        invert
      />
      <Tile
        label="Pages / session"
        value={String(summary.pages_per_session)}
        deltaValue={delta(summary.pages_per_session, prev.pages_per_session)}
      />
    </div>
  )
}

/* ───────────────────────── Traffic over time ───────────────────────── */

function formatDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function TrafficChart({ series }: { series: TrafficPoint[] }) {
  const data = series.map((point) => ({ ...point, label: formatDay(point.date) }))

  return (
    <Panel title="Traffic over time" subtitle="Page views and unique visitors per day">
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={VISITORS_CLR} stopOpacity={0.22} />
              <stop offset="100%" stopColor={VISITORS_CLR} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="fillPageviews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={PAGEVIEWS_CLR} stopOpacity={0.18} />
              <stop offset="100%" stopColor={PAGEVIEWS_CLR} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          {/* Recessive grid: horizontal only, so it reads as a scale not a cage. */}
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: MUTED, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            tick={{ fill: MUTED, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={48}
          />
          <Tooltip
            cursor={{ stroke: 'rgb(203 211 222)', strokeWidth: 1 }}
            contentStyle={{
              borderRadius: 12,
              border: `1px solid ${GRID}`,
              fontSize: 12,
              color: INK,
            }}
            formatter={(value, name) => [formatNumber(Number(value ?? 0)), String(name ?? '')]}
          />
          <Legend
            verticalAlign="top"
            align="right"
            height={28}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, color: MUTED }}
          />
          <Area
            type="monotone"
            dataKey="pageviews"
            name="Page views"
            stroke={PAGEVIEWS_CLR}
            strokeWidth={2}
            fill="url(#fillPageviews)"
          />
          <Area
            type="monotone"
            dataKey="visitors"
            name="Visitors"
            stroke={VISITORS_CLR}
            strokeWidth={2}
            fill="url(#fillVisitors)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Panel>
  )
}

/* ───────────────────────── Ranked breakdowns ───────────────────────── */

/**
 * A ranked list is a magnitude comparison against the leader, so it is drawn as
 * proportional bars with the value written on every row — no legend and no
 * colour coding, because the label already carries the identity.
 */
export function TrafficBreakdown({ title, subtitle, rows, emptyLabel = 'No traffic yet.' }: {
  title: string
  subtitle?: string
  rows: TrafficBreakdownRow[]
  emptyLabel?: string
}) {
  const max = Math.max(1, ...rows.map((r) => r.pageviews))

  return (
    <Panel title={title} subtitle={subtitle}>
      {rows.length === 0 ? (
        <p className="text-sm opacity-60">{emptyLabel}</p>
      ) : (
        <ol className="space-y-2.5">
          {rows.map((row) => (
            <li key={row.label}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate" title={row.label}>{row.label}</span>
                <span className="shrink-0 tabular font-medium">
                  {formatNumber(row.pageviews)}
                  <span className="ml-1.5 text-xs font-normal opacity-50">
                    {formatNumber(row.visitors)} vis.
                  </span>
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full" style={TRACK_STYLE}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(row.pageviews / max) * 100}%`, background: VISITORS_CLR }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  )
}

/* ───────────────────────── Conversion funnel ───────────────────────── */

export function TrafficFunnelPanel({ funnel }: { funnel: TrafficFunnel }) {
  const steps = [
    { label: 'Visitors', value: funnel.visitors, rate: null as number | null },
    { label: 'Trial bookings', value: funnel.trial_bookings, rate: funnel.trial_rate },
    { label: 'Contact messages', value: funnel.contacts, rate: funnel.contact_rate },
  ]
  const max = Math.max(1, funnel.visitors)

  return (
    <Panel
      title="From visit to enquiry"
      subtitle="Share of visitors who went on to book a trial or send a message"
    >
      <ol className="space-y-3">
        {steps.map((step) => (
          <li key={step.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span>{step.label}</span>
              <span className="tabular font-medium">
                {formatNumber(step.value)}
                {step.rate !== null && (
                  <span className="ml-1.5 text-xs font-normal opacity-50">{step.rate}%</span>
                )}
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full" style={TRACK_STYLE}>
              <div
                className="h-full rounded-full"
                style={{ width: `${(step.value / max) * 100}%`, background: VISITORS_CLR }}
              />
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  )
}
