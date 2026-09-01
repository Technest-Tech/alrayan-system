import Link from 'next/link'
import Image from 'next/image'
import { Mail, Phone, MapPin } from 'lucide-react'
import { footerNav } from '@/config/nav'
import { siteConfig } from '@/config/site'
import { fetchSiteSettings, waLink, type SiteSocial } from '@/content/siteSettings'
import { getLocale } from '@/i18n/getLocale'
import { getT } from '@/i18n/getDictionary'
import { localizedHref } from '@/i18n/href'
import { Container } from './Container'

const SOCIAL_META: Record<keyof SiteSocial, { label: string; path: string }> = {
  facebook: {
    label: 'Facebook',
    path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  },
  instagram: {
    label: 'Instagram',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
  },
  youtube: {
    label: 'YouTube',
    path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  },
  twitter: {
    label: 'X (Twitter)',
    path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  },
  tiktok: {
    label: 'TikTok',
    path: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
  },
  telegram: {
    label: 'Telegram',
    path: 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z',
  },
}

export async function Footer() {
  const locale = await getLocale()
  const t = getT(locale)
  const href = (p: string) => localizedHref(p, locale)

  const settings = await fetchSiteSettings()
  const { contact, social } = settings
  const socials = (Object.keys(SOCIAL_META) as (keyof SiteSocial)[])
    .map((k) => ({ key: k, href: social[k], ...SOCIAL_META[k] }))
    .filter((s) => s.href && s.href.trim())

  const year = new Date().getFullYear()
  const { courses, ...otherGroups } = footerNav

  return (
    <footer className="bg-primary text-white" role="contentinfo">
      {/* Main footer */}
      <div className="py-12 lg:py-14">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-x-8 gap-y-10">
            {/* Brand column — spans 2 cols on lg */}
            <div className="lg:col-span-2 space-y-5">
              <Link
                href={href('/')}
                aria-label={t('nav.homeAria')}
                className="inline-block"
              >
                <Image
                  /* Footer is always the deep-green surface, so the cream mark. */
                  src="/logo/azhary-light.png"
                  alt="Azhary"
                  width={512}
                  height={512}
                  className="h-28 w-auto"
                />
              </Link>

              <p className="text-white/70 text-sm leading-relaxed max-w-xs">
                {t('footer.brandBlurb')}
              </p>

              {/* Arabic ayah */}
              <p
                className="font-arabic text-accent text-lg leading-relaxed"
                dir="rtl"
                lang="ar"
                aria-label={t('footer.verseAria')}
              >
                اقْرَأْ بِاسْمِ رَبِّكَ
              </p>

              {/* Contact details */}
              <ul className="space-y-3 text-sm text-white/70" role="list">
                {contact.email && (
                  <li>
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-2.5 hover:text-accent transition-colors"
                    >
                      <Mail className="size-4 shrink-0" aria-hidden="true" />
                      {contact.email}
                    </a>
                  </li>
                )}
                {contact.phone && (
                  <li>
                    <a
                      href={waLink(contact.whatsapp || contact.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 hover:text-accent transition-colors"
                      aria-label={t('footer.chatWhatsapp')}
                    >
                      <Phone className="size-4 shrink-0" aria-hidden="true" />
                      {contact.phone}
                    </a>
                  </li>
                )}
                {contact.address && (
                  <li className="flex items-center gap-2.5">
                    <MapPin className="size-4 shrink-0" aria-hidden="true" />
                    {contact.address}
                  </li>
                )}
              </ul>

              {/* Social links */}
              <div className="flex items-center gap-3">
                {socials.map((s) => (
                  <a
                    key={s.key}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t('footer.followOn', { name: s.label })}
                    className="flex items-center justify-center size-9 rounded-full border border-white/20 text-white/60 hover:border-accent hover:text-accent transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
                      <path d={s.path} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Courses — split into two columns, spans 2 cols on lg */}
            <div className="lg:col-span-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-accent mb-4">
                {t(courses.headingKey)}
              </h3>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5" role="list">
                {courses.items.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={href(link.href)}
                      className="text-sm text-white/70 hover:text-white transition-colors"
                    >
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Remaining nav columns */}
            {Object.entries(otherGroups).map(([group, { headingKey, items }]) => (
              <div key={group}>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-accent mb-4">
                  {t(headingKey)}
                </h3>
                <ul className="space-y-2.5" role="list">
                  {items.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={href(link.href)}
                        className="text-sm text-white/70 hover:text-white transition-colors"
                      >
                        {t(link.labelKey)}
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
              © {year} {siteConfig.name} ({siteConfig.nameArabic}). {t('footer.rights')}
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
