import { beforeAll, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { LOCALE_COOKIE } from '@/i18n/config'

const SITE = 'azharyfr.test'
const APP = 'system.azharyfr.test'

let proxy: typeof import('./proxy').proxy

beforeAll(async () => {
  // The proxy reads these once, when the module loads.
  vi.stubEnv('NEXT_PUBLIC_SITE_HOST', SITE)
  vi.stubEnv('NEXT_PUBLIC_APP_HOST', APP)
  proxy = (await import('./proxy')).proxy
})

function visit(path: string, headers: Record<string, string> = {}, host = SITE) {
  return proxy(new NextRequest(`https://${host}${path}`, { headers: { host, ...headers } }))
}

describe('Egypt block', () => {
  it('refuses the public site, including the French pages', () => {
    expect(visit('/', { 'x-country-code': 'EG' }).status).toBe(403)
    expect(visit('/fr/courses', { 'x-country-code': 'EG' }).status).toBe(403)
  })

  it('leaves the admin console open', () => {
    expect(visit('/login', { 'x-country-code': 'EG' }, APP).status).toBe(200)
  })

  it('serves the site when the country is unknown', () => {
    expect(visit('/').status).toBe(200)
  })
})

describe('France redirect', () => {
  it('sends a visitor in France to the French twin of the URL', () => {
    const res = visit('/courses', { 'x-country-code': 'FR', 'accept-language': 'en-US' })
    expect(res.status).toBe(307)
    expect(new URL(res.headers.get('location')!).pathname).toBe('/fr/courses')
    expect(res.cookies.get(LOCALE_COOKIE)?.value).toBe('fr')
  })

  it('respects a visitor who picked English', () => {
    const res = visit('/courses', { 'x-country-code': 'FR', cookie: `${LOCALE_COOKIE}=en` })
    expect(res.status).toBe(200)
    expect(res.headers.get('location')).toBeNull()
  })

  it('ignores the old cookie, which also held detected English', () => {
    const res = visit('/courses', { 'x-country-code': 'FR', cookie: 'azhary.locale=en' })
    expect(res.status).toBe(307)
  })

  it('does not store a detected English, so a later visit from France still redirects', () => {
    const first = visit('/', { 'accept-language': 'en-US' })
    expect(first.status).toBe(200)
    expect(first.cookies.get(LOCALE_COOKIE)).toBeUndefined()
  })
})
