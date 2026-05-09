import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'

type BuildMetadataArgs = {
  title: string
  description: string
  path?: string
  image?: string
  type?: 'website' | 'article'
  noIndex?: boolean
}

export function buildMetadata({
  title,
  description,
  path = '',
  image,
  type = 'website',
  noIndex = false,
}: BuildMetadataArgs): Metadata {
  const url = `${siteConfig.url}${path}`
  const ogImage = image ?? `${siteConfig.url}/og-default.jpg`

  return {
    title,
    description,
    metadataBase: new URL(siteConfig.url),
    ...(noIndex && { robots: { index: false, follow: false } }),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type,
      siteName: siteConfig.name,
      locale: 'en_US',
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
      title,
      description,
      images: [ogImage],
    },
  }
}
