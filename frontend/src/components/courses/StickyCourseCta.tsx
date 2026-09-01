'use client'
import { useState, useEffect } from 'react'
import { LinkButton } from '@/components/ui/link-button'
import { whatsappLink } from '@/config/site'
import { useT } from '@/i18n/MarketingI18nProvider'
import { localizedHref } from '@/i18n/href'

export function StickyCourseCta({ courseTitle }: { courseTitle: string }) {
  const { locale, t } = useT()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-primary border-t border-white/10 px-4 py-3 lg:hidden"
      role="complementary"
      aria-label={t('coursePage.stickyAria')}
    >
      <div className="flex gap-3 max-w-sm mx-auto">
        <LinkButton href={localizedHref('/contact', locale)} variant="gold" size="sm" className="flex-1 justify-center">
          {t('coursePage.stickyBookTrial')}
        </LinkButton>
        <a
          href={whatsappLink(t('coursePage.waInterested', { course: courseTitle }))}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center rounded-xl border border-white/30 text-white text-sm font-medium py-2 hover:border-accent hover:text-accent transition-colors"
        >
          {t('nav.whatsapp')}
        </a>
      </div>
    </div>
  )
}
