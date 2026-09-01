import { NextResponse, type NextRequest } from 'next/server'
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_HEADER,
  isLocale,
  type Locale,
} from '@/i18n/config'
import { detectLocale, isBot } from '@/i18n/negotiate'

// Next 16 renamed the `middleware` convention to `proxy`. This file also owns
// locale routing for the public marketing site: French lives under a `/fr`
// prefix, English stays unprefixed. The `/fr` prefix is stripped and the target
// route is served with an `x-locale` request header that server code reads
// (see src/i18n/getLocale.ts).
//
// Language is resolved in this order, first hit wins:
//   1. the URL — `/fr/...` is French, anything else is English;
//   2. the locale cookie — what the visitor last browsed in or picked
//      with the switcher;
//   3. the country the request comes from, then `Accept-Language`
//      (see src/i18n/negotiate.ts) — first visit only, and the result is
//      written to the cookie so it is never guessed twice.
// A visitor detected as French-speaking is redirected to the French twin of the
// URL they asked for, so the address bar always agrees with the page.

const APP_HOST = process.env.NEXT_PUBLIC_APP_HOST!   // app.azharyfr.com OR app.localhost:3000
const SITE_HOST = process.env.NEXT_PUBLIC_SITE_HOST! // alrayan-academy.com OR localhost:3000

function isAppHost(host: string) {
  return (
    host === APP_HOST ||
    host === `app-staging.${SITE_HOST}` ||
    host.startsWith('app.localhost')
  )
}

const MARKETING_PATHS = [
  '/about', '/courses', '/pricing', '/faq', '/contact', '/blog', '/countries',
]

const SYSTEM_PATHS = [
  '/dashboard', '/students', '/teachers', '/leads',
  '/calendar', '/payments', '/quality',
  '/billing', '/payroll', '/accounting', '/certificates',
  '/notifications', '/whatsapp-groups', '/whatsapp', '/settings', '/audit-log',
  '/users', '/teacher', '/analytics', '/salary-tiers', '/site',
]

/** Forward the request to `pathname`, tagging it with the active locale. */
function serve(req: NextRequest, pathname: string, locale: Locale, mode: 'next' | 'rewrite') {
  const headers = new Headers(req.headers)
  headers.set(LOCALE_HEADER, locale)
  if (mode === 'next' && pathname === req.nextUrl.pathname) {
    return NextResponse.next({ request: { headers } })
  }
  const url = req.nextUrl.clone()
  url.pathname = pathname
  return NextResponse.rewrite(url, { request: { headers } })
}

/**
 * Persist the active language, but only when it actually changed — an
 * unnecessary `Set-Cookie` on every page view would keep the CDN from caching
 * responses that are otherwise identical for everyone.
 *
 * Readable by the browser on purpose: the switcher writes it before navigating
 * so that leaving French is not undone by detection on the next request.
 */
function remember<T extends NextResponse>(res: T, locale: Locale, current: Locale | null): T {
  if (current === locale) return res
  res.cookies.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: 'lax',
    httpOnly: false,
  })
  return res
}

/** `/sitemap.xml`, `/robots.txt`, `/og-default.jpg` — never language-routed. */
function isFile(path: string) {
  return path.slice(path.lastIndexOf('/')).includes('.')
}

export function proxy(req: NextRequest) {
  const host = req.headers.get('host') ?? ''
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
    return NextResponse.next()
  }

  const matchesPath = (list: string[], path: string) =>
    list.some(p => path === p || path.startsWith(p + '/'))

  if (isAppHost(host)) {
    // The app host is the admin console — English only, no marketing site.
    if (pathname === '/' || matchesPath(MARKETING_PATHS, pathname)) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return serve(req, pathname, 'en', 'next')
  }

  // ── Public marketing site (site host) ──
  // Resolve locale from the `/fr` prefix, then run the rest of the routing on
  // the un-prefixed path.
  const stored = req.cookies.get(LOCALE_COOKIE)?.value
  const chosen = isLocale(stored) ? stored : null

  let locale: Locale = 'en'
  let basePath = pathname
  let prefixed = false
  if (pathname === '/fr' || pathname.startsWith('/fr/')) {
    locale = 'fr'
    prefixed = true
    basePath = pathname.slice(3) || '/' // drop '/fr'
    if (!basePath.startsWith('/')) basePath = '/' + basePath
  }

  // System paths are not part of the public site — hide them behind the 404.
  if (matchesPath(SYSTEM_PATHS, basePath)) {
    return serve(req, '/not-found', locale, 'rewrite')
  }

  // An un-prefixed URL is English unless we know — or can tell — that the
  // visitor reads French, in which case send them to the French twin. Crawlers
  // and static files are left alone: both languages must stay reachable at
  // their own URL for the hreflang pair in src/lib/seo.ts to hold.
  if (!prefixed) {
    if (isFile(basePath) || isBot(req.headers.get('user-agent'))) {
      return serve(req, basePath, locale, 'next')
    }

    const preferred = chosen ?? detectLocale(req.headers)
    if (preferred === 'fr') {
      const url = req.nextUrl.clone()
      url.pathname = basePath === '/' ? '/fr' : `/fr${basePath}`
      const res = remember(NextResponse.redirect(url, 307), 'fr', chosen)
      // Keep this hop out of every cache in front of us: it is decided per
      // visitor, from their country and their cookie.
      res.headers.set('Cache-Control', 'no-store')
      return res
    }
    locale = preferred
  }

  return remember(serve(req, basePath, locale, 'next'), locale, chosen)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|logo).*)'],
}
