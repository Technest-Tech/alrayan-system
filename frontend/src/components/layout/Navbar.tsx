'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { mainNav, type NavItem } from '@/config/nav'
import { whatsappLink } from '@/config/site'
import { LinkButton } from '@/components/ui/link-button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useT } from '@/i18n/MarketingI18nProvider'
import { localizedHref, stripLocale } from '@/i18n/href'
import { LanguageSwitcher } from './LanguageSwitcher'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { locale, t } = useT()
  const rawPathname = usePathname()
  const { path: pathname } = stripLocale(rawPathname)
  const href = (p: string) => localizedHref(p, locale)
  // Pages that open with a dark hero get the transparent-at-top navbar treatment.
  const hasDarkHero =
    pathname === '/' ||
    pathname.startsWith('/our-teachers/') ||
    pathname.startsWith('/courses/')

  useEffect(() => {
    let raf: number
    const onScroll = () => {
      raf = requestAnimationFrame(() => setScrolled(window.scrollY > 24))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false)
  }, [rawPathname])

  // Light bar only on inner pages sitting at the very top; everywhere else
  // (home hero at top, or ANY page once scrolled) uses light text.
  const lightBar = !hasDarkHero && !scrolled
  const useLightText = !lightBar
  // Announcement bar only at the top of the home page.
  const showAnnouncement = pathname === '/' && !scrolled

  const navClass = cn(
    'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
    scrolled
      ? 'bg-[#0F332B]/95 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.35)] border-b border-white/10'
      : hasDarkHero
        ? 'bg-transparent'
        : 'bg-white/92 backdrop-blur-md shadow-soft border-b border-border-soft',
  )
  const linkClass = (active: boolean) =>
    cn(
      'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 relative',
      useLightText ? 'text-white/90 hover:bg-white/10' : 'text-primary hover:bg-cream',
      active && !useLightText && 'text-secondary bg-secondary/8 font-semibold',
      active && useLightText && 'text-accent',
    )

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-accent focus:text-primary focus:px-4 focus:py-2 focus:rounded-lg focus:font-medium"
      >
        {t('nav.skipToContent')}
      </a>

      <header className={navClass} role="banner">
        {/* Announcement bar — visible only at top of home page */}
        <div
          className={cn(
            'overflow-hidden transition-all duration-500',
            showAnnouncement ? 'max-h-10 opacity-100' : 'max-h-0 opacity-0',
          )}
        >
          <div
            className="flex items-center justify-center gap-2 min-h-[2.5rem] py-2 px-4 text-center"
            style={{ background: 'rgba(201,162,75,0.12)', borderBottom: '1px solid rgba(201,162,75,0.2)' }}
          >
            <span className="text-accent shrink-0" aria-hidden="true">✦</span>
            <p className="text-accent text-xs font-medium">
              {t('nav.announcement')}{' '}
              <Link href={href('/contact')} className="underline decoration-accent/40 underline-offset-2 hover:decoration-accent transition-all">
                {t('nav.announcementCta')}
              </Link>
            </p>
          </div>
        </div>

        <nav
          className="container-site flex items-center justify-between h-16 sm:h-20 md:h-24 lg:h-28"
          aria-label={t('nav.mainNavAria')}
        >
          {/* Logo */}
          <Link
            href={href('/')}
            aria-label={t('nav.homeAria')}
            className="flex items-center leading-none group"
          >
            <Image
              /* The mark is drawn in the same deep green as the bar, so over a
                 dark bar it would vanish (1.01:1). Use the cream variant there. */
              src={useLightText ? '/logo/azhary-light.png' : '/logo/azhary.png'}
              alt="Azhary"
              width={512}
              height={512}
              priority
              className="h-14 w-auto sm:h-16 md:h-20 lg:h-24"
            />
          </Link>

          {/* Desktop nav */}
          <ul className="hidden lg:flex items-center gap-1" role="list">
            {mainNav.map((item) => (
              <li
                key={item.href}
                className="relative"
                onMouseEnter={() => item.children && setOpenDropdown(item.labelKey)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                {item.children ? (
                  <>
                    <button
                      className={cn(linkClass(false), 'gap-1')}
                      aria-haspopup="true"
                      aria-expanded={openDropdown === item.labelKey}
                    >
                      {t(item.labelKey)}
                      <ChevronDown
                        className={cn(
                          'size-3.5 transition-transform duration-200',
                          openDropdown === item.labelKey ? 'rotate-180' : '',
                        )}
                        aria-hidden="true"
                      />
                    </button>
                    {/* Dropdown */}
                    <div
                      className={cn(
                        'absolute top-full left-1/2 -translate-x-1/2 pt-2 transition-all duration-200 min-w-[220px]',
                        openDropdown === item.labelKey
                          ? 'opacity-100 translate-y-0 pointer-events-auto'
                          : 'opacity-0 -translate-y-2 pointer-events-none',
                      )}
                      role="menu"
                    >
                      <div className="bg-white rounded-2xl shadow-lg border border-border-soft p-2">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={href(child.href)}
                            role="menuitem"
                            className="block px-4 py-2.5 text-sm text-primary rounded-xl hover:bg-cream hover:text-secondary transition-colors font-medium"
                            onClick={() => setOpenDropdown(null)}
                          >
                            {t(child.labelKey)}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <Link
                    href={href(item.href)}
                    className={linkClass(pathname === item.href)}
                    aria-current={pathname === item.href ? 'page' : undefined}
                  >
                    {t(item.labelKey)}
                  </Link>
                )}
              </li>
            ))}
          </ul>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <LanguageSwitcher variant={useLightText ? 'light' : 'dark'} />
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex items-center gap-1.5 text-sm font-medium transition-colors',
                useLightText ? 'text-white/80 hover:text-white' : 'text-primary hover:text-secondary',
              )}
              aria-label={t('nav.chatWhatsapp')}
            >
              <Phone className="size-4" aria-hidden="true" />
              <span className="hidden xl:inline">{t('nav.whatsapp')}</span>
            </a>
            <span
              className={cn('w-px h-5 opacity-20', useLightText ? 'bg-white' : 'bg-primary')}
              aria-hidden="true"
            />
            <LinkButton
              href={href('/contact')}
              size="sm"
              variant="gold"
              className={cn(
                useLightText && 'shadow-[0_0_20px_rgba(201,162,75,0.35)]',
              )}
            >
              {t('nav.freeTrial')}
            </LinkButton>
          </div>

          {/* Mobile actions */}
          <div className="flex items-center gap-2 lg:hidden">
            <Link
              href={href('/contact')}
              className="inline-flex h-9 items-center rounded-full bg-accent px-3.5 text-xs font-bold text-primary shadow-[0_7px_22px_rgba(201,162,75,0.24)] active:scale-[0.98]"
            >
              {t('nav.freeTrial')}
            </Link>

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                className={cn(
                  'flex size-10 items-center justify-center rounded-full border transition-colors',
                  useLightText
                    ? 'border-white/15 bg-white/5 text-white hover:bg-white/10'
                    : 'border-border-soft bg-white text-primary hover:bg-cream',
                )}
                aria-label={t('nav.openMenu')}
              >
                <Menu className="size-5" aria-hidden="true" />
              </SheetTrigger>

              <SheetContent side="right" className="w-[88vw] max-w-sm p-0 bg-white" showCloseButton={false}>
                <div className="flex flex-col h-full">
                {/* Mobile header */}
                <div className="flex items-center justify-between p-5 border-b border-border-soft">
                  <Link href={href('/')} aria-label={t('nav.homeAria')} onClick={() => setMobileOpen(false)} className="flex items-center leading-none">
                    <Image
                      src="/logo/azhary.png"
                      alt="Azhary"
                      width={512}
                      height={512}
                      className="h-16 w-auto rounded-lg"
                    />
                  </Link>
                  <button
                    className="p-2 rounded-lg text-muted-text hover:bg-cream transition-colors"
                    onClick={() => setMobileOpen(false)}
                    aria-label={t('nav.closeMenu')}
                  >
                    <X className="size-5" aria-hidden="true" />
                  </button>
                </div>

                {/* Mobile nav items */}
                <nav className="flex-1 overflow-y-auto p-5 space-y-1" aria-label={t('nav.mobileNavAria')}>
                  {mainNav.map((item) => (
                    <MobileNavItem
                      key={item.href}
                      item={item}
                      currentPath={pathname}
                      onClose={() => setMobileOpen(false)}
                    />
                  ))}
                </nav>

                {/* Mobile CTA */}
                <div className="p-5 border-t border-border-soft space-y-3">
                  <div className="flex justify-center">
                    <LanguageSwitcher variant="dark" />
                  </div>
                  <LinkButton
                    href={href('/contact')}
                    className="w-full justify-center"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t('nav.bookFreeTrial')}
                  </LinkButton>
                  <a
                    href={whatsappLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-border-soft text-sm font-medium text-primary hover:bg-cream transition-colors"
                  >
                    {t('nav.chatWhatsapp')}
                  </a>
                </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </header>
    </>
  )
}

function MobileNavItem({
  item,
  currentPath,
  onClose,
}: {
  item: NavItem
  currentPath: string
  onClose: () => void
}) {
  const [open, setOpen] = useState(false)
  const { locale, t } = useT()
  const href = (p: string) => localizedHref(p, locale)

  if (!item.children) {
    return (
      <Link
        href={href(item.href)}
        onClick={onClose}
        className={cn(
          'flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors',
          currentPath === item.href
            ? 'bg-cream text-secondary'
            : 'text-primary hover:bg-cream',
        )}
        aria-current={currentPath === item.href ? 'page' : undefined}
      >
        {t(item.labelKey)}
      </Link>
    )
  }

  return (
    <div>
      <button
        className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium text-primary hover:bg-cream transition-colors"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        {t(item.labelKey)}
        <ChevronDown
          className={cn('size-4 transition-transform', open ? 'rotate-180' : '')}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="pl-4 mt-1 space-y-1">
          {item.children?.map((child) => (
            <Link
              key={child.href}
              href={href(child.href)}
              onClick={onClose}
              className="flex items-center px-4 py-2.5 rounded-xl text-sm text-muted-text hover:text-secondary hover:bg-cream transition-colors"
            >
              {t(child.labelKey)}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
