/** Shapes returned by GET /site/analytics. */

/** One row of a ranked breakdown — a page, source, country, device or browser. */
export interface TrafficBreakdownRow {
  label: string
  pageviews: number
  visitors: number
}

export interface TrafficPoint {
  date: string
  pageviews: number
  visitors: number
}

export interface TrafficTotals {
  pageviews: number
  visitors: number
  sessions: number
  bounce_rate: number
  pages_per_session: number
}

/** Headline totals, plus the same figures for the preceding window. */
export interface TrafficSummary extends TrafficTotals {
  previous: TrafficTotals
}

export interface TrafficFunnel {
  visitors: number
  trial_bookings: number
  contacts: number
  trial_rate: number
  contact_rate: number
}

export interface SiteAnalytics {
  range: { from: string; to: string }
  summary: TrafficSummary
  series: TrafficPoint[]
  top_pages: TrafficBreakdownRow[]
  sources: TrafficBreakdownRow[]
  countries: TrafficBreakdownRow[]
  devices: TrafficBreakdownRow[]
  browsers: TrafficBreakdownRow[]
  locales: TrafficBreakdownRow[]
  funnel: TrafficFunnel
}
