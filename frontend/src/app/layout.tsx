import type { Metadata } from 'next'
import { GoogleAnalytics } from '@next/third-parties/google'
import { fontDisplay, fontHeading, fontBody, fontArabic } from '@/styles/fonts'
import { siteConfig } from '@/config/site'
import './globals.css'

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | Online Quran Academy`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: [{ url: '/og-default.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@alrayanacademy',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={[
        fontDisplay.variable,
        fontHeading.variable,
        fontBody.variable,
        fontArabic.variable,
      ].join(' ')}
    >
      <body className="min-h-screen flex flex-col antialiased">{children}</body>
      {GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null}
    </html>
  )
}
