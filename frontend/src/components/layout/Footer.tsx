import Link from 'next/link'
import Image from 'next/image'
import { Mail, Phone, MapPin } from 'lucide-react'
import { footerNav } from '@/config/nav'
import { siteConfig, whatsappLink } from '@/config/site'
import { Container } from './Container'

const socialLinks = [
  {
    href: siteConfig.social.facebook,
    label: 'Facebook',
    svg: (
      <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    href: siteConfig.social.instagram,
    label: 'Instagram',
    svg: (
      <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
  },
  {
    href: siteConfig.social.youtube,
    label: 'YouTube',
    svg: (
      <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
  {
    href: siteConfig.social.twitter,
    label: 'X (Twitter)',
    svg: (
      <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-primary text-white" role="contentinfo">
      {/* Main footer */}
      <div className="section">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-8">
            {/* Brand column — spans 2 cols on lg */}
            <div className="lg:col-span-2 space-y-6">
              <Link
                href="/"
                aria-label="Alrayan Academy — Home"
                className="inline-block"
              >
                <Image
                  src="/logo/alrayan-white.svg"
                  alt="Alrayan Academy"
                  width={200}
                  height={52}
                  className="h-12 w-auto"
                />
              </Link>

              <p className="text-white/70 text-sm leading-relaxed max-w-xs">
                Premium online Quran, Arabic, and Islamic studies for students
                worldwide. Certified teachers. 1-on-1 classes. Free trial.
              </p>

              {/* Arabic ayah */}
              <p
                className="font-arabic text-accent text-lg leading-relaxed"
                dir="rtl"
                lang="ar"
                aria-label="Quranic verse — Al-Alaq 1"
              >
                اقْرَأْ بِاسْمِ رَبِّكَ
              </p>

              {/* Contact details */}
              <ul className="space-y-3 text-sm text-white/70" role="list">
                <li>
                  <a
                    href={`mailto:${siteConfig.email}`}
                    className="flex items-center gap-2.5 hover:text-accent transition-colors"
                  >
                    <Mail className="size-4 shrink-0" aria-hidden="true" />
                    {siteConfig.email}
                  </a>
                </li>
                <li>
                  <a
                    href={whatsappLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 hover:text-accent transition-colors"
                    aria-label="Chat on WhatsApp"
                  >
                    <Phone className="size-4 shrink-0" aria-hidden="true" />
                    {siteConfig.phone}
                  </a>
                </li>
                <li className="flex items-center gap-2.5">
                  <MapPin className="size-4 shrink-0" aria-hidden="true" />
                  Online — Worldwide
                </li>
              </ul>

              {/* Social links */}
              <div className="flex items-center gap-3">
                {socialLinks.map((s) => (
                  <a
                    key={s.href}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Follow us on ${s.label}`}
                    className="flex items-center justify-center size-9 rounded-full border border-white/20 text-white/60 hover:border-accent hover:text-accent transition-colors"
                  >
                    {s.svg}
                  </a>
                ))}
              </div>
            </div>

            {/* Nav columns */}
            {(
              Object.entries(footerNav) as [
                keyof typeof footerNav,
                { label: string; href: string }[],
              ][]
            ).map(([group, links]) => (
              <div key={group}>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-accent mb-5">
                  {group}
                </h3>
                <ul className="space-y-3" role="list">
                  {links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/70 hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* Gold divider */}
      <div className="border-t border-white/10">
        <Container>
          <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
            <p>
              © {year} {siteConfig.name} ({siteConfig.nameArabic}). All rights
              reserved.
            </p>
            <p className="text-accent/80 font-arabic text-sm" aria-hidden="true">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
          </div>
        </Container>
      </div>
    </footer>
  )
}
