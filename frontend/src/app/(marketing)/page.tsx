import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { organizationSchema } from '@/lib/schema'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { LinkButton } from '@/components/ui/link-button'
import { StatsSection } from '@/components/home/StatsSection'
import { whatsappLink } from '@/config/site'
import { homeContent } from '@/content/home'
import { stats } from '@/content/stats'
import { courses } from '@/content/courses'
import { testimonials } from '@/content/testimonials'
import { featuredTeachers } from '@/content/teachers'
import {
  BookOpen,
  Users,
  Globe,
  Star,
  ShieldCheck,
  GraduationCap,
  Heart,
  Clock,
  ArrowRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const metadata: Metadata = buildMetadata({
  title: 'Online Quran Academy | 1-on-1 Classes | Alrayan Academy',
  description:
    'Learn Quran online with certified teachers from Al-Azhar. 1-on-1 Tajweed, Hifz, Arabic, and Islamic studies classes. Free trial available worldwide.',
  path: '/',
})

const iconMap: Record<string, LucideIcon> = {
  Users,
  Globe,
  Heart,
  GraduationCap,
  ShieldCheck,
  BookOpen,
  Clock,
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema()) }}
      />

      {/* ── Hero ── */}
      <section
        className="relative min-h-[92vh] flex items-center bg-primary overflow-hidden"
        aria-labelledby="hero-heading"
      >
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 80%, #C9A24B 0%, transparent 50%), radial-gradient(circle at 80% 20%, #0E7C5A 0%, transparent 50%)',
          }}
          aria-hidden="true"
        />
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-secondary/10 -translate-y-1/4 translate-x-1/4 blur-3xl"
          aria-hidden="true"
        />

        <Container className="relative py-32 lg:py-40">
          <div className="max-w-3xl">
            <p
              className="font-arabic text-accent text-2xl mb-6"
              dir="rtl"
              lang="ar"
              aria-label={homeContent.hero.arabicVerseLabel}
            >
              {homeContent.hero.arabicVerse}
            </p>

            <h1
              id="hero-heading"
              className="heading-display font-display text-white text-balance mb-6"
            >
              {homeContent.hero.headingStart}{' '}
              <em className="text-accent not-italic">{homeContent.hero.headingEmphasis}</em>
              {' '}{homeContent.hero.headingEnd}
            </h1>

            <p className="text-white/80 text-xl leading-relaxed mb-10 max-w-2xl">
              {homeContent.hero.subheading}
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-10">
              <LinkButton href="/contact" size="lg" variant="gold">
                {homeContent.hero.ctaPrimary}
              </LinkButton>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 h-14 px-7 rounded-xl border border-white/30 text-white text-base font-medium hover:border-accent hover:text-accent transition-colors"
              >
                {homeContent.hero.ctaSecondary}
              </a>
            </div>

            <p className="text-white/50 text-sm">{homeContent.hero.microcopy}</p>
          </div>
        </Container>
      </section>

      {/* ── Trust Badges ── */}
      <Section bg="cream">
        <Container>
          <ul
            className="flex flex-wrap items-center justify-center gap-4 md:gap-6"
            role="list"
            aria-label="Trust badges"
          >
            {homeContent.trustBadges.map(({ icon, label }) => {
              const Icon = iconMap[icon] ?? BookOpen
              return (
                <li
                  key={label}
                  className="flex items-center gap-2.5 bg-white border border-border-soft rounded-full px-5 py-3 text-sm font-medium text-primary shadow-soft"
                >
                  <Icon className="size-4 text-secondary" aria-hidden="true" />
                  {label}
                </li>
              )
            })}
          </ul>
        </Container>
      </Section>

      {/* ── Stats (client component — scroll-animated counters) ── */}
      <StatsSection stats={stats} />

      {/* ── Courses Grid ── */}
      <Section bg="cream" aria-labelledby="courses-heading">
        <Container>
          <div className="text-center mb-14">
            <p className="text-secondary text-sm font-semibold uppercase tracking-wider mb-3">Our Courses</p>
            <h2 id="courses-heading" className="heading-xl font-heading text-primary mb-4">
              What Would You Like to Learn?
            </h2>
            <p className="text-muted-text text-lg max-w-xl mx-auto">
              From complete beginners to advanced students seeking Ijazah — we have a program tailored for you.
            </p>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" role="list">
            {courses.map(({ slug, title, shortDescription }) => (
              <li key={slug}>
                <a
                  href={`/courses/${slug}`}
                  className="group flex flex-col h-full bg-white rounded-2xl p-7 border border-border-soft shadow-soft hover:shadow-md hover:border-secondary/30 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                      <BookOpen className="size-5 text-secondary" aria-hidden="true" />
                    </div>
                    <span
                      className="text-accent text-xl font-display group-hover:translate-x-1 transition-transform"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </div>
                  <h3 className="font-heading font-semibold text-primary text-lg mb-2">{title}</h3>
                  <p className="text-muted-text text-sm leading-relaxed flex-1">{shortDescription}</p>
                  <span className="mt-4 text-secondary text-sm font-semibold">Learn more</span>
                </a>
              </li>
            ))}
          </ul>

          <div className="text-center mt-12">
            <LinkButton href="/courses" variant="outline">View All Courses</LinkButton>
          </div>
        </Container>
      </Section>

      {/* ── Why Alrayan ── */}
      <Section aria-labelledby="why-heading">
        <Container>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-secondary text-sm font-semibold uppercase tracking-wider mb-3">
                {homeContent.whyUs.eyebrow}
              </p>
              <h2 id="why-heading" className="heading-xl font-heading text-primary mb-6">
                {homeContent.whyUs.heading}
              </h2>
              <p className="text-muted-text text-lg leading-relaxed mb-8">
                {homeContent.whyUs.body}
              </p>
              <ul className="space-y-6" role="list">
                {homeContent.whyUs.items.map(({ icon, title, desc }) => {
                  const Icon = iconMap[icon] ?? BookOpen
                  return (
                    <li key={title} className="flex gap-4">
                      <div className="shrink-0 w-11 h-11 rounded-xl bg-accent/15 flex items-center justify-center">
                        <Icon className="size-5 text-accent" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-primary mb-1">{title}</h3>
                        <p className="text-muted-text text-sm leading-relaxed">{desc}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
              <div className="mt-10 flex gap-4 flex-wrap">
                <LinkButton href="/about">Meet Our Teachers</LinkButton>
                <LinkButton href="/pricing" variant="outline">See Pricing</LinkButton>
              </div>
            </div>

            <div
              className="hidden lg:block bg-primary rounded-3xl p-10 text-white relative overflow-hidden"
              aria-hidden="true"
            >
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-secondary/20 translate-x-1/3 -translate-y-1/3" />
              <p className="font-arabic text-accent text-3xl mb-6" dir="rtl" lang="ar">
                {homeContent.whyUs.decorativeVerse}
              </p>
              <p className="text-white/60 text-sm italic mb-10">
                {homeContent.whyUs.decorativeVerseTranslation}
              </p>
              <div className="grid grid-cols-2 gap-6">
                {stats.map(({ value, label }) => (
                  <div key={label}>
                    <p className="text-accent text-3xl font-display font-semibold">{value}</p>
                    <p className="text-white/60 text-xs mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* ── Teachers Strip ── */}
      <Section bg="cream" aria-labelledby="teachers-strip-heading">
        <Container>
          <div className="text-center mb-12">
            <p className="text-secondary text-sm font-semibold uppercase tracking-wider mb-3">Our Scholars</p>
            <h2 id="teachers-strip-heading" className="heading-xl font-heading text-primary mb-4">
              Meet Some of Our Teachers
            </h2>
            <p className="text-muted-text text-lg max-w-xl mx-auto">
              Al-Azhar graduates and Ijazah-certified scholars — vetting takes months, trust takes years.
            </p>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10" role="list">
            {featuredTeachers.map((teacher) => (
              <li key={teacher.id}>
                <div className="bg-white rounded-2xl p-6 border border-border-soft shadow-soft text-center">
                  <div
                    className="size-16 rounded-full bg-primary flex items-center justify-center text-accent font-display font-semibold text-2xl mx-auto mb-4"
                    aria-hidden="true"
                  >
                    {teacher.name.charAt(0)}
                  </div>
                  <p className="font-heading font-semibold text-primary text-sm">{teacher.name}</p>
                  <p className="text-secondary text-xs font-medium mt-1 mb-3">{teacher.role}</p>
                  <div className="flex flex-wrap justify-center gap-1 mb-3">
                    {teacher.specialties.slice(0, 2).map((s) => (
                      <span
                        key={s}
                        className="text-xs bg-cream text-muted-text px-2.5 py-0.5 rounded-full border border-border-soft"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <p className="text-muted-text text-xs">
                    {teacher.yearsExperience} years · {teacher.studentsCount}+ students
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="text-center">
            <LinkButton href="/about" variant="outline">
              <span className="flex items-center gap-2">
                Meet All Our Teachers
                <ArrowRight className="size-4" aria-hidden="true" />
              </span>
            </LinkButton>
          </div>
        </Container>
      </Section>

      {/* ── Testimonials ── */}
      <Section aria-labelledby="testimonials-heading">
        <Container>
          <div className="text-center mb-14">
            <p className="text-secondary text-sm font-semibold uppercase tracking-wider mb-3">Student Stories</p>
            <h2 id="testimonials-heading" className="heading-xl font-heading text-primary">
              Trusted by Families Worldwide
            </h2>
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list">
            {testimonials.map(({ id, name, location, quote, course }) => (
              <li key={id} className="bg-cream rounded-2xl p-7 border border-border-soft">
                <div className="flex mb-4" aria-label="5 out of 5 stars">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="size-4 fill-accent text-accent" aria-hidden="true" />
                  ))}
                </div>
                <blockquote className="text-primary text-sm leading-relaxed mb-6">
                  &ldquo;{quote}&rdquo;
                </blockquote>
                <footer className="flex items-center gap-3">
                  <div
                    className="size-10 rounded-full bg-primary flex items-center justify-center text-accent font-semibold text-sm shrink-0"
                    aria-hidden="true"
                  >
                    {name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-primary text-sm">{name}</p>
                    <p className="text-muted-text text-xs">{location} · {course}</p>
                  </div>
                </footer>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* ── CTA Banner ── */}
      <Section bg="primary" aria-labelledby="cta-heading">
        <Container>
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
            <div className="flex flex-wrap justify-center gap-4">
              <LinkButton href="/contact" size="lg" variant="gold">
                {homeContent.cta.ctaPrimary}
              </LinkButton>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 h-14 px-7 rounded-xl border border-white/30 text-white font-medium hover:border-accent hover:text-accent transition-colors"
              >
                {homeContent.cta.ctaSecondary}
              </a>
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}
