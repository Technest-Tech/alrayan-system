import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { organizationSchema } from '@/lib/schema'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { LinkButton } from '@/components/ui/link-button'
import { StatsSection } from '@/components/home/StatsSection'
import { CoursesCarousel } from '@/components/home/CoursesCarousel'
import { TestimonialsMarquee } from '@/components/home/TestimonialsMarquee'
import { whatsappLink } from '@/config/site'
import { homeContent } from '@/content/home'
import { stats } from '@/content/stats'
import Image from 'next/image'
import { courses } from '@/content/courses'
import { testimonials } from '@/content/testimonials'
import {
  BookOpen,
  Users,
  Globe,
  Star,
  ShieldCheck,
  GraduationCap,
  Heart,
  Clock,
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
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0B1F3A 0%, #0E2649 55%, #0B1F3A 100%)' }}
        aria-labelledby="hero-heading"
      >
        {/* Islamic geometric star pattern */}
        <div className="absolute inset-0 opacity-[0.055]" aria-hidden="true">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="islamic-geo" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <path
                  d="M80,50 L62.9,44.6 L71.2,28.8 L55.4,37.1 L50,20 L44.6,37.1 L28.8,28.8 L37.1,44.6 L20,50 L37.1,55.4 L28.8,71.2 L44.6,62.9 L50,80 L55.4,62.9 L71.2,71.2 L62.9,55.4 Z"
                  fill="none"
                  stroke="#C9A24B"
                  strokeWidth="0.7"
                />
                <circle cx="50" cy="50" r="28" fill="none" stroke="#C9A24B" strokeWidth="0.35" />
                <circle cx="0"   cy="0"   r="3.5" fill="#C9A24B" opacity="0.4" />
                <circle cx="100" cy="0"   r="3.5" fill="#C9A24B" opacity="0.4" />
                <circle cx="0"   cy="100" r="3.5" fill="#C9A24B" opacity="0.4" />
                <circle cx="100" cy="100" r="3.5" fill="#C9A24B" opacity="0.4" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#islamic-geo)" />
          </svg>
        </div>

        {/* Ambient glow — green top-right */}
        <div
          className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full blur-[120px] -translate-y-1/3 translate-x-1/3"
          style={{ backgroundColor: 'rgba(14,124,90,0.18)' }}
          aria-hidden="true"
        />
        {/* Ambient glow — gold bottom-left */}
        <div
          className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4"
          style={{ backgroundColor: 'rgba(201,162,75,0.07)' }}
          aria-hidden="true"
        />

        <Container className="relative pt-28 pb-16 sm:pt-32 sm:pb-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">

            {/* ── Left: Content ── */}
            <div>
              {/* Arabic verse with ornamental lines */}
              <div className="flex items-center gap-3 mb-7">
                <span className="h-px w-10 bg-gradient-to-r from-transparent to-accent/60" aria-hidden="true" />
                <p
                  className="font-arabic text-accent text-xl tracking-wide"
                  dir="rtl"
                  lang="ar"
                  aria-label={homeContent.hero.arabicVerseLabel}
                >
                  {homeContent.hero.arabicVerse}
                </p>
                <span className="h-px w-10 bg-gradient-to-l from-transparent to-accent/60" aria-hidden="true" />
              </div>

              <h1
                id="hero-heading"
                className="heading-display font-display text-white text-balance mb-6"
              >
                {homeContent.hero.headingStart}{' '}
                <em className="text-accent not-italic relative inline-block">
                  {homeContent.hero.headingEmphasis}
                  <span
                    className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full bg-accent/40"
                    aria-hidden="true"
                  />
                </em>
                {' '}{homeContent.hero.headingEnd}
              </h1>

              <p className="text-white/70 text-lg sm:text-xl leading-relaxed mb-7 sm:mb-10 max-w-xl">
                {homeContent.hero.subheading}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-10">
                <LinkButton
                  href="/contact"
                  size="lg"
                  variant="gold"
                  className="w-full sm:w-auto justify-center"
                >
                  {homeContent.hero.ctaPrimary}
                </LinkButton>
                <a
                  href={whatsappLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 h-14 px-7 rounded-xl border border-white/25 text-white text-base font-medium hover:border-accent/60 hover:text-accent hover:bg-white/5 transition-all duration-200 w-full sm:w-auto"
                >
                  {homeContent.hero.ctaSecondary}
                </a>
              </div>

              {/* Social proof strip */}
              <div className="flex items-center gap-3 sm:gap-5">
                {/* Avatar stack */}
                <div className="flex -space-x-2.5" aria-hidden="true">
                  {(
                    [
                      { bg: '#0E7C5A', letter: 'A' },
                      { bg: '#1A5C8A', letter: 'M' },
                      { bg: '#7B4EA6', letter: 'S' },
                      { bg: '#C9A24B', letter: 'F' },
                      { bg: '#0B6B6B', letter: 'Y' },
                    ] as const
                  ).map(({ bg, letter }, i) => (
                    <div
                      key={letter}
                      className="size-9 rounded-full border-2 border-[#0B1F3A] flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: bg, zIndex: 5 - i }}
                    >
                      {letter}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="size-3.5 fill-accent text-accent" aria-hidden="true" />
                    ))}
                    <span className="text-white font-semibold text-sm ml-1.5">4.9</span>
                  </div>
                  <p className="text-white/50 text-xs">Trusted by 10,000+ students worldwide</p>
                </div>
              </div>
            </div>

            {/* ── Right: Hero image ── */}
            <div className="hidden lg:block" aria-hidden="true">
              <div className="relative py-6">

                {/* Ambient glow behind the image card */}
                <div
                  className="absolute inset-[8%] rounded-full blur-3xl z-0"
                  style={{ background: 'radial-gradient(ellipse, rgba(14,124,90,0.32) 0%, transparent 70%)' }}
                />

                {/* Image — wrapped in a rounded card so the studio background looks intentional */}
                <div className="relative z-10 rounded-3xl overflow-hidden shadow-[0_20px_56px_rgba(0,0,0,0.45)]">
                  <Image
                    src="/hero/2children-learn-quran-online.png"
                    alt="Two children learning Quran online with a certified teacher"
                    width={1536}
                    height={1024}
                    className="w-full h-auto block"
                    priority
                  />
                </div>

                {/* ── Rating badge — floats above the image card (top-right) ── */}
                <div
                  className="absolute top-0 right-8 z-20 rounded-2xl px-4 py-3 whitespace-nowrap"
                  style={{
                    background: 'rgba(11,31,58,0.92)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(201,162,75,0.5)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
                  }}
                >
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="size-3.5 fill-accent text-accent" aria-hidden="true" />
                    ))}
                    <span className="text-white font-bold text-sm ml-1.5">4.9</span>
                  </div>
                  <p className="text-white/55 text-[11px]">2,000+ verified reviews</p>
                </div>

                {/* ── Students badge — floats below the image card (bottom-left) ── */}
                <div
                  className="absolute bottom-0 left-8 z-20 rounded-2xl px-4 py-3 whitespace-nowrap"
                  style={{
                    background: 'rgba(11,31,58,0.92)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(201,162,75,0.5)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="size-2 rounded-full bg-secondary shrink-0" aria-hidden="true" />
                    <p className="text-accent font-display font-semibold leading-none" style={{ fontSize: '1.35rem' }}>
                      10,000+
                    </p>
                  </div>
                  <p className="text-white/55 text-[11px] pl-4">Students · 50+ countries</p>
                </div>

              </div>
            </div>

          </div>
        </Container>

      </section>

      {/* ── Trust Strip ── */}
      <section
        className="relative z-10 pb-16 md:pb-20"
        style={{
          marginTop: '-68px',
          background: 'linear-gradient(to bottom, transparent 68px, #F8F4ED 68px)',
        }}
        aria-label="Why choose Alrayan"
      >
        <Container>
          {/* Single unified panel — gap-px on #E8E2D9 creates hairline cell dividers */}
          <div className="rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.10)]" style={{ background: '#E8E2D9' }}>
            <ul className="grid grid-cols-2 lg:grid-cols-5 gap-px" role="list">
              {homeContent.trustBadges.map(({ icon, label }, idx) => {
                const Icon = iconMap[icon] ?? BookOpen
                const subtext: Record<string, string> = {
                  'Users':         'Every student, one teacher',
                  'ShieldCheck':   'No credit card needed',
                  'Heart':         'Sister teachers on request',
                  'Globe':         'Egyptian & Levantine accents',
                  'GraduationCap': 'Al-Azhar graduates',
                }
                const iconStyle: Record<string, { wrap: string; icon: string }> = {
                  'Users':         { wrap: 'bg-secondary/12', icon: 'text-secondary' },
                  'ShieldCheck':   { wrap: 'bg-accent/12',    icon: 'text-accent'    },
                  'Heart':         { wrap: 'bg-secondary/12', icon: 'text-secondary' },
                  'Globe':         { wrap: 'bg-accent/12',    icon: 'text-accent'    },
                  'GraduationCap': { wrap: 'bg-secondary/12', icon: 'text-secondary' },
                }
                const { wrap, icon: iconCls } = iconStyle[icon] ?? { wrap: 'bg-secondary/12', icon: 'text-secondary' }
                const isLastOdd = idx === homeContent.trustBadges.length - 1 && homeContent.trustBadges.length % 2 !== 0
                return (
                  <li
                    key={label}
                    className={`bg-white flex items-center gap-4 px-5 py-5 ${isLastOdd ? 'col-span-2 lg:col-span-1' : ''}`}
                  >
                    <div className={`shrink-0 size-11 rounded-xl flex items-center justify-center ${wrap}`}>
                      <Icon className={`size-5 ${iconCls}`} aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-semibold text-primary text-sm leading-snug">{label}</p>
                      <p className="text-muted-text text-xs mt-0.5 leading-snug">{subtext[icon] ?? ''}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </Container>
      </section>

      {/* ── Stats (client component — scroll-animated counters) ── */}
      <StatsSection stats={stats} />

      {/* ── How It Works ── */}
      <Section aria-labelledby="how-heading">
        <Container>
          <div className="text-center mb-10">
            <p className="text-secondary text-sm font-semibold uppercase tracking-wider mb-3">Simple Process</p>
            <h2 id="how-heading" className="heading-xl font-heading text-primary mb-4">
              Start in 3 Easy Steps
            </h2>
            <p className="text-muted-text text-lg max-w-md mx-auto">
              From sign-up to your first lesson in minutes — no commitment until you love it.
            </p>
          </div>
          <div className="flex justify-center">
            <Image
              src="/images/contact-trial-steps.png"
              alt="Step 1: Book your free trial. Step 2: Get matched and schedule. Step 3: Start your first lesson."
              width={900}
              height={320}
              className="w-full max-w-3xl h-auto rounded-2xl"
            />
          </div>
        </Container>
      </Section>

      {/* ── Courses Carousel ── */}
      <Section bg="cream" aria-labelledby="courses-heading">
        <Container>
          <CoursesCarousel courses={courses} />
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

            <div className="hidden lg:flex items-center justify-center" aria-hidden="true">
              <Image
                src="/images/about-methodology.png"
                alt="Alrayan teaching methodology — listen, learn, certify"
                width={600}
                height={400}
                className="w-full h-auto rounded-3xl shadow-lg"
              />
            </div>
          </div>
        </Container>
      </Section>

      {/* ── Testimonials ── */}
      <Section bg="cream" aria-labelledby="testimonials-heading">
        <div id="testimonials-heading" className="sr-only">Student Stories</div>
        <TestimonialsMarquee items={testimonials} />
      </Section>

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
      </section>
    </>
  )
}
