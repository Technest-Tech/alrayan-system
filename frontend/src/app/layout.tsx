import type { Metadata } from 'next'
import { fontDisplay, fontHeading, fontBody, fontArabic } from '@/styles/fonts'
import { siteConfig } from '@/config/site'
import { getLocale } from '@/i18n/getLocale'
import { localeTag, ogLocale } from '@/i18n/config'
import './globals.css'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: `${siteConfig.name} | Online Quran Academy`,
      template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    openGraph: {
      type: 'website',
      locale: ogLocale[locale],
      url: siteConfig.url,
      siteName: siteConfig.name,
      images: [{ url: '/og-default.jpg', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  return (
    <html
      lang={localeTag[locale]}
      suppressHydrationWarning
      className={[
        fontDisplay.variable,
        fontHeading.variable,
        fontBody.variable,
        fontArabic.variable,
      ].join(' ')}
    >
      <body className="min-h-screen flex flex-col antialiased">{children}</body>
    </html>
  )
}
