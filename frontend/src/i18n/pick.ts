import type { Locale } from './config'

/**
 * Select the value for the active locale from a `{ en, fr }` pair, falling back
 * to English if a French variant is missing. Used by the locale-keyed content
 * files in src/content/*.ts, e.g. `pick(homeContent, locale)`.
 */
export function pick<T>(byLocale: { en: T; fr?: T }, locale: Locale): T {
  if (locale === 'fr' && byLocale.fr !== undefined) return byLocale.fr
  return byLocale.en
}

export type ByLocale<T> = { en: T; fr: T }
