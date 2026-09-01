import { defaultLocale, isLocale, type Locale } from './config'

/**
 * Prefix an internal path with the locale segment. English (default) stays
 * unprefixed (`/courses`); French becomes `/fr/courses`. External URLs, hashes,
 * and mailto/tel links are returned untouched.
 */
export function localizedHref(path: string, locale: Locale): string {
  if (locale === defaultLocale) return path
  if (!path.startsWith('/')) return path // external, mailto:, tel:, #hash
  if (path === '/') return `/${locale}`
  return `/${locale}${path}`
}

/** Remove a leading locale segment from a pathname, returning the base path. */
export function stripLocale(pathname: string): { locale: Locale; path: string } {
  const segments = pathname.split('/')
  const first = segments[1]
  if (isLocale(first)) {
    const rest = '/' + segments.slice(2).join('/')
    return { locale: first, path: rest === '/' ? '/' : rest.replace(/\/$/, '') || '/' }
  }
  return { locale: defaultLocale, path: pathname }
}

/** Rewrite the current pathname to point at a different locale (for the switcher). */
export function switchLocalePath(pathname: string, target: Locale): string {
  const { path } = stripLocale(pathname)
  return localizedHref(path, target)
}
