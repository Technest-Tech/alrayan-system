import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppButton } from '@/components/layout/WhatsAppButton'
import { Container } from '@/components/layout/Container'
import { LinkButton } from '@/components/ui/link-button'
import { MarketingI18nProvider } from '@/i18n/MarketingI18nProvider'
import { getLocale } from '@/i18n/getLocale'
import { getT } from '@/i18n/getDictionary'
import { localizedHref } from '@/i18n/href'

// This page sits outside the (marketing) route group, so it must supply the
// i18n provider itself — Navbar and WhatsAppButton call useT().
export default async function NotFound() {
  const locale = await getLocale()
  const t = getT(locale)

  return (
    <MarketingI18nProvider locale={locale}>
      <Navbar />
      <main id="main" className="flex-1 flex items-center justify-center section bg-cream">
        <Container>
          <div className="text-center max-w-lg mx-auto">
            <p className="font-arabic text-accent text-4xl mb-4" dir="rtl" lang="ar" aria-hidden="true">
              أكاديمية زاد
            </p>
            <h1 className="heading-xl font-display text-primary mb-4">{t('notFound.title')}</h1>
            <p className="text-muted-text text-lg mb-8">{t('notFound.body')}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <LinkButton href={localizedHref('/', locale)}>{t('notFound.backHome')}</LinkButton>
              <LinkButton href={localizedHref('/courses', locale)} variant="outline">
                {t('notFound.browseCourses')}
              </LinkButton>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
      <WhatsAppButton />
    </MarketingI18nProvider>
  )
}
