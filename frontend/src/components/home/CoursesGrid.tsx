import Image from 'next/image'
import { LinkButton } from '@/components/ui/link-button'
import { SectionDivider } from '@/components/layout/SectionDivider'
import { CoursesCarousel } from '@/components/home/CoursesCarousel'
import type { Course } from '@/content/courses'
import type { Locale } from '@/i18n/config'
import { getT } from '@/i18n/getDictionary'
import { localizedHref } from '@/i18n/href'

export function CoursesGrid({ courses, locale }: { courses: Course[]; locale: Locale }) {
  const t = getT(locale)
  const featured = courses.slice(0, 8)

  return (
    <section
      className="relative overflow-hidden py-20 md:py-24"
      aria-labelledby="courses-heading"
    >
      {/* Background image */}
      <Image
        src="/images/why-alrayan-bg.png"
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
        aria-hidden="true"
      />
      {/* Dark overlay to deepen the pattern and lift the cards */}
      <div className="absolute inset-0 bg-primary/88" aria-hidden="true" />
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(14,124,90,0.18), transparent 70%)' }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionDivider tone="dark" className="mb-12 -mt-4" />
        {/* Header */}
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 id="courses-heading" className="heading-xl font-heading font-bold text-white">
            {t('coursesGrid.headingLead')}{' '}
            <span className="text-emerald-300">{t('coursesGrid.headingAccent')}</span>
          </h2>
          <p className="mt-4 text-base text-white/60">
            {t('coursesGrid.subheading')}
          </p>
        </div>

        <CoursesCarousel courses={featured} locale={locale} />

        {/* Footer CTA */}
        <div className="mt-7 text-center sm:mt-12">
          <LinkButton
            href={localizedHref('/courses', locale)}
            variant="gold"
            size="lg"
            className="w-full justify-center sm:w-auto"
          >
            {t('coursesGrid.viewAll')}
          </LinkButton>
        </div>
      </div>
    </section>
  )
}
