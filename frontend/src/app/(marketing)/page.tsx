import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { organizationSchema } from '@/lib/schema'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { LinkButton } from '@/components/ui/link-button'
import { Hero } from '@/components/home/Hero'
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
  title: 'Online Quran Academy | 1-on-1 Classes | Azhary',
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
      <Hero />


      {/* ── Trust Strip ── */}
      <section
        className="relative z-10 pb-16 md:pb-20"
        style={{
          marginTop: '-68px',
          background: 'linear-gradient(to bottom, transparent 68px, #F8F4ED 68px)',
        }}
        aria-label="Why choose Azhary"
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

      {/* ── Why Azhary ── */}
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
                alt="Azhary teaching methodology — listen, learn, certify"
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
