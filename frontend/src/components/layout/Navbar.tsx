'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { mainNav, type NavItem } from '@/config/nav'
import { whatsappLink } from '@/config/site'
import { LinkButton } from '@/components/ui/link-button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const isHome = pathname === '/'

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
  }, [pathname])

  const scrolledOrInner = scrolled || !isHome

  const navClass = cn(
    'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
    scrolledOrInner
      ? 'bg-white/90 backdrop-blur-md shadow-soft border-b border-border-soft'
      : 'bg-transparent',
  )
  const linkClass = (active: boolean) =>
    cn(
      'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
      scrolledOrInner ? 'text-primary hover:bg-cream' : 'text-white hover:bg-white/10',
      active && 'text-accent',
    )

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-accent focus:text-primary focus:px-4 focus:py-2 focus:rounded-lg focus:font-medium"
      >
        Skip to main content
      </a>

      <header className={navClass} role="banner">
        <nav
          className="container-site flex items-center justify-between h-16 md:h-20"
          aria-label="Main navigation"
        >
          {/* Logo */}
          <Link
            href="/"
            aria-label="Alrayan Academy — Home"
            className="inline-flex items-center"
          >
            <Image
              src={scrolledOrInner ? '/logo/alrayan-full.svg' : '/logo/alrayan-white.svg'}
              alt="Alrayan Academy"
              width={200}
              height={52}
              priority
              className="h-10 md:h-12 w-auto"
            />
          </Link>

          {/* Desktop nav */}
          <ul className="hidden lg:flex items-center gap-1" role="list">
            {mainNav.map((item) => (
              <li
                key={item.href}
                className="relative"
                onMouseEnter={() => item.children && setOpenDropdown(item.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                {item.children ? (
                  <>
                    <button
                      className={cn(linkClass(false), 'gap-1')}
                      aria-haspopup="true"
                      aria-expanded={openDropdown === item.label}
                    >
                      {item.label}
                      <ChevronDown
                        className={cn(
                          'size-3.5 transition-transform duration-200',
                          openDropdown === item.label ? 'rotate-180' : '',
                        )}
                        aria-hidden="true"
                      />
                    </button>
                    {/* Dropdown */}
                    <div
                      className={cn(
                        'absolute top-full left-1/2 -translate-x-1/2 pt-2 transition-all duration-200 min-w-[220px]',
                        openDropdown === item.label
                          ? 'opacity-100 translate-y-0 pointer-events-auto'
                          : 'opacity-0 -translate-y-2 pointer-events-none',
                      )}
                      role="menu"
                    >
                      <div className="bg-white rounded-2xl shadow-lg border border-border-soft p-2">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            role="menuitem"
                            className="block px-4 py-2.5 text-sm text-primary rounded-xl hover:bg-cream hover:text-secondary transition-colors font-medium"
                            onClick={() => setOpenDropdown(null)}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={linkClass(pathname === item.href)}
                    aria-current={pathname === item.href ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex items-center gap-1.5 text-sm font-medium transition-colors',
                scrolledOrInner ? 'text-primary hover:text-secondary' : 'text-white hover:text-accent',
              )}
              aria-label="Chat with us on WhatsApp"
            >
              <Phone className="size-4" aria-hidden="true" />
              <span className="hidden xl:inline">Chat</span>
            </a>
            <LinkButton href="/contact" size="sm" variant="gold">
              Free Trial Class
            </LinkButton>
          </div>

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              className={cn(
                'lg:hidden p-2 rounded-lg transition-colors',
                scrolledOrInner ? 'text-primary hover:bg-cream' : 'text-white hover:bg-white/10',
              )}
              aria-label="Open navigation menu"
            >
              <Menu className="size-6" aria-hidden="true" />
            </SheetTrigger>

            <SheetContent side="right" className="w-80 p-0 bg-white" showCloseButton={false}>
              <div className="flex flex-col h-full">
                {/* Mobile header */}
                <div className="flex items-center justify-between p-5 border-b border-border-soft">
                  <Link href="/" aria-label="Alrayan Academy" onClick={() => setMobileOpen(false)}>
                    <Image
                      src="/logo/alrayan-full.svg"
                      alt="Alrayan Academy"
                      width={160}
                      height={42}
                      className="h-9 w-auto"
                    />
                  </Link>
                  <button
                    className="p-2 rounded-lg text-muted-text hover:bg-cream transition-colors"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close navigation menu"
                  >
                    <X className="size-5" aria-hidden="true" />
                  </button>
                </div>

                {/* Mobile nav items */}
                <nav className="flex-1 overflow-y-auto p-5 space-y-1" aria-label="Mobile navigation">
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
                  <LinkButton
                    href="/contact"
                    className="w-full justify-center"
                    onClick={() => setMobileOpen(false)}
                  >
                    Book Free Trial Class
                  </LinkButton>
                  <a
                    href={whatsappLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-border-soft text-sm font-medium text-primary hover:bg-cream transition-colors"
                  >
                    Chat on WhatsApp
                  </a>
                </div>
              </div>
            </SheetContent>
          </Sheet>
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

  if (!item.children) {
    return (
      <Link
        href={item.href}
        onClick={onClose}
        className={cn(
          'flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors',
          currentPath === item.href
            ? 'bg-cream text-secondary'
            : 'text-primary hover:bg-cream',
        )}
        aria-current={currentPath === item.href ? 'page' : undefined}
      >
        {item.label}
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
        {item.label}
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
              href={child.href}
              onClick={onClose}
              className="flex items-center px-4 py-2.5 rounded-xl text-sm text-muted-text hover:text-secondary hover:bg-cream transition-colors"
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
