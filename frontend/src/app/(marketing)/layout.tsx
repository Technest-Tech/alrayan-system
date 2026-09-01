import { Suspense } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppButton } from '@/components/layout/WhatsAppButton'
import { VisitTracker } from '@/components/analytics/VisitTracker'
import { MarketingI18nProvider } from '@/i18n/MarketingI18nProvider'
import { getLocale } from '@/i18n/getLocale'

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  return (
    <MarketingI18nProvider locale={locale}>
      <Navbar />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <WhatsAppButton />
      {/* Renders nothing — records the page view for the admin traffic report.
          Suspense keeps the rest of the layout prerendered. */}
      <Suspense fallback={null}>
        <VisitTracker locale={locale} />
      </Suspense>
    </MarketingI18nProvider>
  )
}
