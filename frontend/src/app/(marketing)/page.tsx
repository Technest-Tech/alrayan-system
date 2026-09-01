import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { organizationSchema } from '@/lib/schema'
import { SectionDivider } from '@/components/layout/SectionDivider'
import { Container } from '@/components/layout/Container'
import { LinkButton } from '@/components/ui/link-button'
import { Hero } from '@/components/home/Hero'
import { StatsSection } from '@/components/home/StatsSection'
import { CoursesGrid } from '@/components/home/CoursesGrid'
import { TestimonialsMarquee } from '@/components/home/TestimonialsMarquee'
import { TeachersSection } from '@/components/home/TeachersSection'
import { CourseFinderQuest } from '@/components/home/CourseFinderQuest'
import { MobileJourney } from '@/components/home/MobileJourney'
import { TrustStrip } from '@/components/home/TrustStrip'
import { TrialBookingForm } from '@/components/conversion/TrialBookingForm'
import { whatsappLink } from '@/config/site'
import { getHomeContent } from '@/content/home'
import { getStats } from '@/content/stats'
import Image from 'next/image'
import { getCourses } from '@/content/courses'
import { getTestimonials } from '@/content/testimonials'
import { getLocale } from '@/i18n/getLocale'
import { getT } from '@/i18n/getDictionary'
import { localizedHref } from '@/i18n/href'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = getT(locale)
  return buildMetadata({
    title: t('meta.homeTitle'),
    description: t('meta.homeDescription'),
    path: '/',
    locale,
  })
}

export default async function HomePage() {
  const locale = await getLocale()
  const t = getT(locale)
  const homeContent = getHomeContent(locale)
  const stats = getStats(locale)
  const courses = getCourses(locale)
  const testimonials = getTestimonials(locale)
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema()) }}
      />

      {/* ── Hero ── */}
      <Hero />


      {/* ── Trust Strip ── */}
      <TrustStrip
        ariaLabel={t('home.whyChooseAria')}
        eyebrow={homeContent.whyUs.eyebrow}
        badges={homeContent.trustBadges}
        locale={locale}
      />

      {/* ── Interactive course finder ── */}
      <CourseFinderQuest />

      {/* ── Stats (client component — scroll-animated counters) ── */}
      <StatsSection stats={stats} />

      {/* ── Testimonials (directly below stats) ── */}
      <TestimonialsMarquee items={testimonials} locale={locale} />

      {/* ── How It Works ── */}
      <section className="relative overflow-hidden bg-navy-soft py-12 sm:py-14" aria-labelledby="how-heading">
        {/* Islamic geometric star pattern */}
        <div className="absolute inset-0 opacity-[0.06]" aria-hidden="true">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="how-stars" x="0" y="0" width="90" height="90" patternUnits="userSpaceOnUse">
                {/* Eight-pointed star (two overlapping squares) */}
                <rect x="21" y="21" width="48" height="48" fill="none" stroke="#C0A854" strokeWidth="1" />
                <path d="M45 12 78 45 45 78 12 45 Z" fill="none" stroke="#C0A854" strokeWidth="1" />
                <circle cx="45" cy="45" r="6" fill="none" stroke="#C0A854" strokeWidth="1" />
                {/* Corner nodes for interlace feel */}
                <circle cx="0"  cy="0"  r="2.5" fill="#C0A854" opacity="0.6" />
                <circle cx="90" cy="0"  r="2.5" fill="#C0A854" opacity="0.6" />
                <circle cx="0"  cy="90" r="2.5" fill="#C0A854" opacity="0.6" />
                <circle cx="90" cy="90" r="2.5" fill="#C0A854" opacity="0.6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#how-stars)" />
          </svg>
        </div>
        {/* Warm radial glow for depth */}
        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{ background: 'radial-gradient(ellipse 60% 55% at 50% 0%, rgba(201,162,75,0.12), transparent 70%)' }}
        />

        <Container className="relative">
          <SectionDivider tone="dark" className="mb-6 -mt-2" />
          <div className="text-center mb-6">
            <p className="text-accent text-sm font-semibold uppercase tracking-wider mb-3">{t('home.simpleProcess')}</p>
            <h2 id="how-heading" className="heading-xl font-heading text-white">
              {t('home.startSteps')}
            </h2>
          </div>
          <MobileJourney locale={locale} />
          <div className="hidden justify-center md:flex">
            <Image
              src="/images/contact-trial-steps.png"
              alt={t('home.stepsAlt')}
              width={900}
              height={320}
              className="w-full max-w-3xl h-auto rounded-2xl"
            />
          </div>
        </Container>
      </section>

      {/* ── Teachers ── */}
      <TeachersSection />

      {/* ── Courses ── */}
      <CoursesGrid courses={courses} locale={locale} />

      {/* ── Book a Free Trial ── */}
      <section id="book" className="bg-navy-soft py-16 sm:py-20 scroll-mt-24" aria-label={t('home.bookTrialAria')}>
        <Container>
          <SectionDivider tone="dark" className="mb-10 -mt-4" />
          <TrialBookingForm />
        </Container>
      </section>

      {/* ── CTA Banner ── */}
      <section className="section relative overflow-hidden" aria-labelledby="cta-heading">
        {/* Background: Quran with lantern */}
        <Image
          src="/images/hero-home.png"
          alt=""
          fill
          className="object-cover"
          aria-hidden="true"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-primary/85" aria-hidden="true" />

        <Container className="relative">
          <SectionDivider tone="dark" className="mb-10 -mt-2" />
          <div className="text-center max-w-2xl mx-auto">
            <p className="font-arabic text-accent text-2xl mb-4" dir="rtl" lang="ar" aria-hidden="true">
              {homeContent.cta.arabicHadith}
            </p>
            <p className="text-white/60 text-sm italic mb-8">
              {homeContent.cta.hadithTranslation}
            </p>
            <h2 id="cta-heading" className="heading-xl font-display text-white mb-4">
              {homeContent.cta.heading}
            </h2>
            <p className="text-white/70 text-lg mb-10">
              {homeContent.cta.subheading}
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
              <LinkButton
                href={localizedHref('/contact', locale)}
                size="lg"
                variant="gold"
                className="w-full justify-center sm:w-auto"
              >
                {homeContent.cta.ctaPrimary}
              </LinkButton>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-14 w-full items-center justify-center gap-2.5 rounded-xl border border-white/30 px-7 font-medium text-white transition-colors hover:border-accent hover:text-accent sm:w-auto"
              >
                {homeContent.cta.ctaSecondary}
              </a>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
