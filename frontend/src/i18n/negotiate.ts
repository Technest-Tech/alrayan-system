import { defaultLocale, isLocale, type Locale } from './config'

// First-visit language detection for the public marketing site.
//
// A visitor who has never chosen a language is shown the language of the
// country they are browsing from. The country comes from the CDN header the
// site sits behind (Cloudflare's `CF-IPCountry`) — the same signal the backend
// already uses to attribute visits, so the two agree. When there is no such
// header (local development, a direct hit that bypasses the CDN) detection
// falls back to the browser's `Accept-Language`, and finally to English.
//
// Nothing here overrides an explicit choice: the `/fr` prefix and the remembered
// cookie are both resolved before this runs (see src/proxy.ts).

/**
 * Country headers, in the order they are trusted. Mirrors the list in
 * App\Services\Site\VisitRecorder so both ends read the same signal.
 */
const COUNTRY_HEADERS = ['cf-ipcountry', 'x-vercel-ip-country', 'x-country-code'] as const

/**
 * Countries where French is the language a first-time visitor expects — the
 * francophone world: France and its overseas territories, Monaco, Luxembourg,
 * the Maghreb, francophone West and Central Africa, and Haiti.
 *
 * Deliberately absent are the bilingual countries — Canada, Belgium,
 * Switzerland, Mauritius, Lebanon, Rwanda — where the country says nothing
 * useful on its own. Those fall through to `Accept-Language`, so a Montrealer
 * browsing in `fr-CA` gets French while one browsing in `en-CA` gets English.
 */
const FRENCH_SPEAKING = new Set([
  // France and its overseas départements and collectivities
  'FR', 'GP', 'MQ', 'GF', 'RE', 'YT', 'PM', 'BL', 'MF', 'NC', 'PF', 'WF',
  // Europe
  'MC', 'LU',
  // Maghreb
  'DZ', 'MA', 'TN', 'MR',
  // West Africa
  'SN', 'ML', 'BF', 'NE', 'CI', 'GN', 'BJ', 'TG',
  // Central Africa
  'CM', 'CF', 'TD', 'GA', 'CG', 'CD',
  // Indian Ocean and Horn
  'MG', 'KM', 'DJ',
  // Caribbean
  'HT',
])

/** Read the visitor's country from whichever CDN header is present. */
export function countryFrom(headers: Headers): string | null {
  for (const name of COUNTRY_HEADERS) {
    const value = headers.get(name)?.trim().toUpperCase()
    // Cloudflare answers "XX" when it cannot place the address, and "T1" for Tor.
    if (value && value.length === 2 && /^[A-Z]{2}$/.test(value) && value !== 'XX') {
      return value
    }
  }
  return null
}

/** The language of a country, or null when the country does not settle it. */
export function localeFromCountry(country: string | null): Locale | null {
  if (!country) return null
  return FRENCH_SPEAKING.has(country.toUpperCase()) ? 'fr' : null
}

/**
 * Highest-ranked supported language in an `Accept-Language` header, honouring
 * q-weights: `fr-CH, fr;q=0.9, en;q=0.8` → French.
 */
export function localeFromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null

  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';')
      const q = params.find((p) => p.trim().startsWith('q='))
      const weight = q ? Number.parseFloat(q.trim().slice(2)) : 1
      return { tag: tag.trim().toLowerCase(), q: Number.isFinite(weight) ? weight : 0 }
    })
    .filter((entry) => entry.tag && entry.q > 0)
    // Stable sort keeps the header's own order among equal weights.
    .sort((a, b) => b.q - a.q)

  for (const { tag } of ranked) {
    if (tag === '*') break // "any language" — no preference to honour
    const primary = tag.split('-')[0]
    if (isLocale(primary)) return primary
  }
  return null
}

/** The language to show a visitor who has not chosen one. */
export function detectLocale(headers: Headers): Locale {
  return (
    localeFromCountry(countryFrom(headers)) ??
    localeFromAcceptLanguage(headers.get('accept-language')) ??
    defaultLocale
  )
}

/**
 * Crawlers and link previewers are never redirected by country: each language
 * has to stay reachable at its own stable URL for the hreflang pair in
 * src/lib/seo.ts to mean anything. A Googlebot crawling from Paris must still
 * see the English site at the English URL.
 */
const BOT_AGENT =
  /bot|crawler|spider|crawling|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|discord|embedly|preview|lighthouse|pingdom|headlesschrome/i

export function isBot(userAgent: string | null): boolean {
  return !!userAgent && BOT_AGENT.test(userAgent)
}
