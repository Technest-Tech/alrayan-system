// Marketing-site internationalization config.
// The admin console under (system) has its own separate i18n at src/lib/system/i18n.

export const locales = ['en', 'fr'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

/** Request header the proxy attaches so server code can read the active locale. */
export const LOCALE_HEADER = 'x-locale'

/**
 * Cookie holding the language a visitor picked or was sent to: written by the
 * `/fr` prefix and by the switcher, so a manual choice is never overruled on the
 * next page. A detected English is not stored, so detection can still send that
 * visitor to French later.
 *
 * Renamed from `azhary.locale`, which also stored detected English for a year.
 * That kept visitors in France on English, and their cookies can't be told apart
 * from a manual choice, so the old name is ignored.
 */
export const LOCALE_COOKIE = 'azhary.locale.v2'

/** A year: the choice should outlive the visit that made it. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'en' || value === 'fr'
}

/** BCP-47 tag for <html lang>, Intl formatting, and OpenGraph. */
export const localeTag: Record<Locale, string> = {
  en: 'en-US',
  fr: 'fr-FR',
}

export const ogLocale: Record<Locale, string> = {
  en: 'en_US',
  fr: 'fr_FR',
}
