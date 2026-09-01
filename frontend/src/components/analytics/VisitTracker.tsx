'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

// Tracking beacon for the public marketing site.
//
// One fire-and-forget POST per page view to our own API — no third party, no
// cookie, no advertising id. The server reduces the caller to a hash that
// rotates daily (see App\Services\Site\VisitRecorder), so the numbers in the
// admin panel describe traffic without describing people.
//
// This reads useSearchParams, which opts its subtree out of prerendering, so it
// must stay wrapped in the <Suspense> boundary the marketing layout puts around
// it — otherwise the whole marketing tree would render on the client and lose
// its static HTML.

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8001'

/** Key under which the per-tab session id is kept. */
const SESSION_KEY = 'zad.sid'

/**
 * An id that lives for one browsing session in one tab, so the dashboard can
 * tell "five pages, one person" from "five people".
 *
 * sessionStorage — not a cookie and not localStorage — because the id should
 * die with the tab and never travel with a request on its own.
 */
function sessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY)
    if (existing) return existing

    const created = crypto.randomUUID()
    sessionStorage.setItem(SESSION_KEY, created)
    return created
  } catch {
    // Private mode, or storage disabled — every view then counts as its own
    // session, which is a worse statistic but never a broken page.
    return crypto.randomUUID()
  }
}

export function VisitTracker({ locale }: { locale: string }) {
  const pathname = usePathname()
  const params = useSearchParams()

  useEffect(() => {
    if (!pathname) return

    const body = JSON.stringify({
      path: pathname,
      sessionId: sessionId(),
      locale,
      referrer: document.referrer || null,
      utmSource: params.get('utm_source'),
      utmMedium: params.get('utm_medium'),
      utmCampaign: params.get('utm_campaign'),
    })

    // Analytics must never delay or break the page it measures: failures are
    // swallowed, and `keepalive` lets the request outlive a fast navigation.
    void fetch(`${API}/api/v1/site-visits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {})
  }, [pathname, params, locale])

  return null
}
