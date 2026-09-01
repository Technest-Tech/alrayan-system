'use client'

import { createContext, useContext, useMemo } from 'react'
import { dictionaries, translate, type TranslateFn } from './translate'
import type { Locale } from './config'

interface MarketingI18nValue {
  locale: Locale
  t: TranslateFn
}

const MarketingI18nContext = createContext<MarketingI18nValue | null>(null)

/**
 * Seeds client components with the locale resolved on the server (from the URL /
 * proxy header). Unlike the admin provider, there is no localStorage here — the
 * locale is owned by the URL, so it is passed down as a prop and never guessed
 * on the client (avoids hydration mismatch).
 */
export function MarketingI18nProvider({
  locale,
  children,
}: {
  locale: Locale
  children: React.ReactNode
}) {
  const value = useMemo<MarketingI18nValue>(() => {
    const messages = dictionaries[locale]
    return { locale, t: (key, vars) => translate(messages, key, vars) }
  }, [locale])

  return <MarketingI18nContext.Provider value={value}>{children}</MarketingI18nContext.Provider>
}

export function useT(): MarketingI18nValue {
  const ctx = useContext(MarketingI18nContext)
  if (!ctx) throw new Error('useT must be used inside MarketingI18nProvider')
  return ctx
}
