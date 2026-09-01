import { describe, it, expect } from 'vitest'
import {
  countryFrom,
  detectLocale,
  isBot,
  localeFromAcceptLanguage,
  localeFromCountry,
} from './negotiate'

const headers = (init: Record<string, string>) => new Headers(init)

describe('countryFrom', () => {
  it('reads the Cloudflare header the site sits behind', () => {
    expect(countryFrom(headers({ 'cf-ipcountry': 'FR' }))).toBe('FR')
  })

  it('accepts the other CDN spellings and normalizes case', () => {
    expect(countryFrom(headers({ 'x-vercel-ip-country': 'ma' }))).toBe('MA')
    expect(countryFrom(headers({ 'x-country-code': 'us' }))).toBe('US')
  })

  it('ignores the placeholders a CDN sends when it cannot place the address', () => {
    expect(countryFrom(headers({ 'cf-ipcountry': 'XX' }))).toBeNull()
    expect(countryFrom(headers({ 'cf-ipcountry': 'T1' }))).toBeNull() // Tor
    expect(countryFrom(headers({ 'cf-ipcountry': 'FRA' }))).toBeNull()
  })

  it('is null when no CDN sits in front (local development)', () => {
    expect(countryFrom(headers({}))).toBeNull()
  })
})

describe('localeFromCountry', () => {
  it('answers French across the francophone world', () => {
    for (const c of ['FR', 'MA', 'DZ', 'TN', 'SN', 'CI', 'CD', 'HT', 'MC', 'RE']) {
      expect(localeFromCountry(c)).toBe('fr')
    }
  })

  it('leaves the country undecided elsewhere', () => {
    for (const c of ['US', 'GB', 'AU', 'EG', 'PK', 'ID']) {
      expect(localeFromCountry(c)).toBeNull()
    }
  })

  it('leaves bilingual countries to the browser, not the border', () => {
    for (const c of ['CA', 'BE', 'CH', 'MU', 'LB']) {
      expect(localeFromCountry(c)).toBeNull()
    }
  })
})

describe('localeFromAcceptLanguage', () => {
  it('picks the highest-weighted supported language', () => {
    expect(localeFromAcceptLanguage('fr-FR,fr;q=0.9,en;q=0.8')).toBe('fr')
    expect(localeFromAcceptLanguage('en-US,en;q=0.9')).toBe('en')
  })

  it('honours q-weights over header order', () => {
    expect(localeFromAcceptLanguage('en;q=0.4,fr;q=0.9')).toBe('fr')
  })

  it('skips languages we do not publish', () => {
    expect(localeFromAcceptLanguage('ar-EG,ar;q=0.9,fr;q=0.6')).toBe('fr')
    expect(localeFromAcceptLanguage('ar,ur,tr')).toBeNull()
  })

  it('treats a wildcard and a q=0 rejection as no preference', () => {
    expect(localeFromAcceptLanguage('*')).toBeNull()
    expect(localeFromAcceptLanguage('fr;q=0')).toBeNull()
  })

  it('survives a missing or malformed header', () => {
    expect(localeFromAcceptLanguage(null)).toBeNull()
    expect(localeFromAcceptLanguage('')).toBeNull()
    expect(localeFromAcceptLanguage('fr;q=abc')).toBeNull()
  })
})

describe('detectLocale', () => {
  it('follows the country first', () => {
    expect(detectLocale(headers({ 'cf-ipcountry': 'FR', 'accept-language': 'en-US' }))).toBe('fr')
    expect(detectLocale(headers({ 'cf-ipcountry': 'US', 'accept-language': 'en-US' }))).toBe('en')
  })

  it('falls back to the browser when the country does not settle it', () => {
    expect(detectLocale(headers({ 'cf-ipcountry': 'CA', 'accept-language': 'fr-CA,fr;q=0.9' }))).toBe('fr')
    expect(detectLocale(headers({ 'cf-ipcountry': 'CA', 'accept-language': 'en-CA' }))).toBe('en')
  })

  it('falls back to the browser when there is no country at all', () => {
    expect(detectLocale(headers({ 'accept-language': 'fr-BE,fr;q=0.9' }))).toBe('fr')
  })

  it('defaults to English when nothing is known', () => {
    expect(detectLocale(headers({}))).toBe('en')
  })
})

describe('isBot', () => {
  it('recognizes the crawlers that must see both languages', () => {
    expect(isBot('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')).toBe(true)
    expect(isBot('Mozilla/5.0 (compatible; bingbot/2.0)')).toBe(true)
    expect(isBot('facebookexternalhit/1.1')).toBe(true)
    expect(isBot('WhatsApp/2.19')).toBe(true)
  })

  it('leaves real browsers alone', () => {
    expect(
      isBot('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36'),
    ).toBe(false)
    expect(isBot('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1')).toBe(false)
    expect(isBot(null)).toBe(false)
  })
})
