'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useT } from '@/i18n/MarketingI18nProvider'
import { switchLocalePath } from '@/i18n/href'
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, locales, type Locale } from '@/i18n/config'

const LABELS: Record<Locale, string> = { en: 'EN', fr: 'FR' }

/**
 * Record the pick before leaving the page. Without this, choosing English in a
 * French-speaking country would bounce straight back: the English URL carries no
 * `/fr` prefix, so the proxy would fall through to country detection and send
 * the visitor to French again. Writing the cookie first makes the choice the
 * answer the proxy finds. (The proxy keeps it up to date afterwards; this is
 * only needed to beat the redirect on this one navigation.)
 */
function rememberChoice(locale: Locale) {
  try {
    const secure = window.location.protocol === 'https:' ? '; secure' : ''
    document.cookie =
      `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax${secure}`
  } catch {
    // Cookies blocked — the switch still works for this navigation, it just
    // will not be remembered on the next visit.
  }
}

/**
 * Modern EN | FR segmented toggle. The URL is the single source of truth for
 * locale, so switching just navigates to the same path in the other language.
 *
 * We deliberately use a full-page navigation (not `router.push`) here. The proxy
 * rewrites `/fr` → `/` (see src/proxy.ts), so the EN and FR URLs resolve to the
 * *same* internal route under the same `(marketing)` layout. A client-side push
 * therefore reuses the cached layout — it never re-runs `getLocale()` — so the
 * dictionary never swaps and the toggle appears to do nothing. A real navigation
 * re-runs the proxy → `x-locale` → server render in the target language.
 */
export function LanguageSwitcher({
  className,
  variant = 'light',
}: {
  className?: string
  /** `light` = for dark/transparent backgrounds; `dark` = for light backgrounds. */
  variant?: 'light' | 'dark'
}) {
  const pathname = usePathname()
  const { locale, t } = useT()
  const [isPending, setIsPending] = useState(false)

  const go = (target: Locale) => {
    if (target === locale) return
    setIsPending(true)
    rememberChoice(target)
    window.location.assign(switchLocalePath(pathname, target))
  }

  const isLight = variant === 'light'

  return (
    <div
      role="group"
      aria-label={t('common.languageSwitcher')}
      data-pending={isPending ? '' : undefined}
      className={cn(
        'inline-flex items-center rounded-full p-0.5 text-xs font-semibold transition-colors',
        isLight ? 'bg-white/10 ring-1 ring-white/20' : 'bg-primary/5 ring-1 ring-primary/10',
        className,
      )}
    >
      {locales.map((l) => {
        const active = l === locale
        return (
          <button
            key={l}
            type="button"
            onClick={() => go(l)}
            aria-pressed={active}
            aria-label={t(l === 'fr' ? 'common.french' : 'common.english')}
            className={cn(
              'min-w-8 rounded-full px-2.5 py-1 transition-all duration-150',
              active
                ? isLight
                  ? 'bg-accent text-primary shadow-sm'
                  : 'bg-secondary text-white shadow-sm'
                : isLight
                  ? 'text-white/70 hover:text-white'
                  : 'text-primary/60 hover:text-primary',
            )}
          >
            {LABELS[l]}
          </button>
        )
      })}
    </div>
  )
}
