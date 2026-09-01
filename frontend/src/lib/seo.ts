import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'
import { defaultLocale, ogLocale, type Locale } from '@/i18n/config'

type BuildMetadataArgs = {
  title: string
  description: string
  path?: string
  image?: string
  type?: 'website' | 'article'
  noIndex?: boolean
  /** Active locale. Defaults to English. */
  locale?: Locale
}

/** Absolute URL for a path in a given locale (French pages live under /fr). */
export function localeUrl(path: string, locale: Locale): string {
  const prefix = locale === defaultLocale ? '' : `/${locale}`
  // Normalize the home path so canonicals match the sitemap ("/fr", not "/fr/").
  const suffix = path === '/' ? '' : path
  return `${siteConfig.url}${prefix}${suffix}`
}

export function buildMetadata({
  title,
  description,
  path = '',
  image,
  type = 'website',
  noIndex = false,
  locale = defaultLocale,
}: BuildMetadataArgs): Metadata {
  const url = localeUrl(path, locale)
  const ogImage = image ?? `${siteConfig.url}/og-default.jpg`
  // `title` is brand-free so the `%s | Azhary` template does not double it up in
  // <title>. Social cards bypass that template, so brand them here or a shared
  // link shows the page name with no academy on it.
  const socialTitle = `${title} | ${siteConfig.name}`

  return {
    title,
    description,
    metadataBase: new URL(siteConfig.url),
    ...(noIndex && { robots: { index: false, follow: false } }),
    alternates: {
      canonical: url,
      // hreflang — tells search engines each page has an English and a French twin.
      languages: {
        en: localeUrl(path, 'en'),
        fr: localeUrl(path, 'fr'),
        'x-default': localeUrl(path, 'en'),
      },
    },
    openGraph: {
      title: socialTitle,
      description,
      url,
      type,
      siteName: siteConfig.name,
      locale: ogLocale[locale],
      alternateLocale: locale === 'fr' ? ogLocale.en : ogLocale.fr,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} — ${title}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: [ogImage],
    },
  }
}
