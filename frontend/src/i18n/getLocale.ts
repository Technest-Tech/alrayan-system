import 'server-only'
import { cache } from 'react'
import { headers } from 'next/headers'
import { defaultLocale, isLocale, LOCALE_HEADER, type Locale } from './config'

/**
 * Resolve the active locale on the server from the `x-locale` request header
 * that the proxy attaches (see src/proxy.ts). Cached per request.
 */
export const getLocale = cache(async (): Promise<Locale> => {
  const h = await headers()
  const value = h.get(LOCALE_HEADER)
  return isLocale(value) ? value : defaultLocale
})
