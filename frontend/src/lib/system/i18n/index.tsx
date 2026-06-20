'use client'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { en } from './en'
import { fr } from './fr'
import type { Messages } from './en'

export type Locale = 'en' | 'fr'

const MESSAGES: Record<Locale, Messages> = { en, fr }
const STORAGE_KEY = 'system:locale'
const COOKIE_NAME = 'system_locale'

function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  let cur: unknown = obj
  for (const key of path.split('.')) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[key]
  }
  return typeof cur === 'string' ? cur : undefined
}

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, vars?: Record<string, string>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
    if (stored === 'en' || stored === 'fr') setLocaleState(stored)
  }, [])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    localStorage.setItem(STORAGE_KEY, next)
    document.cookie = `${COOKIE_NAME}=${next};path=/;max-age=31536000`
  }, [])

  const t = useCallback(
    (key: string, vars?: Record<string, string>): string => {
      const messages = MESSAGES[locale] as unknown as Record<string, unknown>
      const fallback  = MESSAGES.en  as unknown as Record<string, unknown>
      const msg = getNestedValue(messages, key) ?? getNestedValue(fallback, key) ?? key
      if (!vars) return msg
      return msg.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`)
    },
    [locale],
  )

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}
