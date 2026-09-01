import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { breadcrumbSchema } from '@/lib/schema'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { LinkButton } from '@/components/ui/link-button'
import { whatsappLink } from '@/config/site'
import { TrialBookingForm } from '@/components/conversion/TrialBookingForm'
import { ContactSidebar } from '@/components/conversion/ContactSidebar'
import { getLocale } from '@/i18n/getLocale'
import { getT } from '@/i18n/getDictionary'
import { localizedHref } from '@/i18n/href'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = getT(locale)
  return buildMetadata({
    title: t('meta.contactTitle'),
    description: t('meta.contactDescription'),
    path: '/contact',
    locale,
  })
}

export default async function ContactPage() {
  const locale = await getLocale()
  const t = getT(locale)
  const crumbs = breadcrumbSchema([
    { name: t('nav.home'), href: localizedHref('/', locale) },
    { name: t('footer.contact'), href: localizedHref('/contact', locale) },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />

      {/* ── Hero ── */}
      <section
        className="relative bg-primary overflow-hidden pt-40 pb-20"
        aria-labelledby="contact-heading"
      >
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 75%, #C0A854 0%, transparent 50%), radial-gradient(circle at 75% 25%, #0E7C5A 0%, transparent 50%)',
          }}
          aria-hidden="true"
        />
        <Container className="relative text-center">
          <p className="text-accent text-sm font-semibold uppercase tracking-widest mb-4">
            {t('contactPage.eyebrow')}
          </p>
          <h1
            id="contact-heading"
            className="heading-display font-display text-white text-balance mb-6 max-w-3xl mx-auto"
          >
            {t('contactPage.heading')}
          </h1>
          <p className="text-white/70 text-xl leading-relaxed max-w-2xl mx-auto">
            {t('contactPage.subheading')}
          </p>
        </Container>
      </section>

      {/* ── Trial booking card ── */}
      <section className="bg-primary py-16 sm:py-20">
        <Container>
          <TrialBookingForm />
          <div className="mx-auto mt-12 max-w-3xl">
            <ContactSidebar />
          </div>
        </Container>
      </section>

      {/* ── CTA Banner ── */}
      <Section bg="primary">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <p
              className="font-arabic text-accent text-2xl mb-4"
              dir="rtl"
              lang="ar"
              aria-hidden="true"
            >
              خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ
            </p>
            <p className="text-white/60 text-sm italic mb-8">
              {t('coursesIndex.hadith')}
            </p>
            <h2 className="heading-xl font-display text-white mb-4">
              {t('contactPage.chatHeading')}
            </h2>
            <p className="text-white/70 text-lg mb-10">
              {t('contactPage.chatSub')}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <LinkButton href={localizedHref('/faq', locale)} size="lg" variant="outline">
                {t('contactPage.readFaq')}
              </LinkButton>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 h-14 px-7 rounded-xl border border-white/30 text-white font-medium hover:border-accent hover:text-accent transition-colors"
              >
                {t('nav.chatWhatsapp')}
              </a>
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}
