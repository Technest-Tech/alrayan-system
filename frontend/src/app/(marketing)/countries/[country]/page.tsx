import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo'
import { localBusinessSchema, breadcrumbSchema, faqSchema } from '@/lib/schema'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { LinkButton } from '@/components/ui/link-button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { whatsappLink } from '@/config/site'
import { countriesData } from '@/content/countries'
import { pricingTiers } from '@/content/pricing'
import {
  Clock,
  ShieldCheck,
  Heart,
  Users,
  Globe,
  GraduationCap,
  BookOpen,
  Star,
  CheckCircle2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type Props = { params: Promise<{ country: string }> }

const iconMap: Record<string, LucideIcon> = {
  Clock,
  ShieldCheck,
  Heart,
  Users,
  Globe,
  GraduationCap,
  BookOpen,
  Star,
}

export function generateStaticParams() {
  return countriesData.map((c) => ({ country: c.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country: slug } = await params
  const country = countriesData.find((c) => c.slug === slug)
  if (!country) return {}
  return buildMetadata({
    title: country.seo.title,
    description: country.seo.description,
    path: `/countries/${slug}`,
  })
}

export default async function CountryPage({ params }: Props) {
  const { country: slug } = await params
  const country = countriesData.find((c) => c.slug === slug)
  if (!country) notFound()

  const schemas = [
    localBusinessSchema(country),
    breadcrumbSchema([
      { name: 'Home', href: '/' },
      { name: country.name, href: `/countries/${country.slug}` },
    ]),
    faqSchema(country.faqs),
  ]

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      {/* ── Hero ── */}
      <section
        className="relative bg-primary overflow-hidden pt-40 pb-20"
        aria-labelledby="country-heading"
      >
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 80%, #C9A24B 0%, transparent 50%), radial-gradient(circle at 80% 20%, #0E7C5A 0%, transparent 50%)',
          }}
          aria-hidden="true"
        />
        <Container className="relative">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center gap-2 text-white/50 text-sm flex-wrap">
              <li>
                <Link href="/" className="hover:text-white/80 transition-colors">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-white/80" aria-current="page">
                {country.name}
              </li>
            </ol>
          </nav>

          <div className="max-w-3xl">
            <div className="text-5xl mb-6" aria-hidden="true">{country.flagEmoji}</div>
            <h1
              id="country-heading"
              className="heading-display font-display text-white text-balance mb-6"
            >
              {country.hero.h1}
            </h1>
            <p className="text-white/80 text-xl leading-relaxed mb-10">
              {country.hero.subheading}
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-8">
              <LinkButton href="/contact" size="lg" variant="gold">
                Book Free Trial Class
              </LinkButton>
              <a
                href={whatsappLink(
                  `Assalamu alaikum, I am in ${country.name} and would like to learn more about your Quran classes.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 h-14 px-7 rounded-xl border border-white/30 text-white text-base font-medium hover:border-accent hover:text-accent transition-colors"
              >
                Chat on WhatsApp
              </a>
            </div>

            <p className="text-white/50 text-sm">
              ✓ Free first class &middot; ✓ No credit card required &middot; ✓ Cancel anytime
            </p>
          </div>
        </Container>
      </section>

      {/* ── Why Us ── */}
      <Section bg="cream" aria-labelledby="why-heading">
        <Container>
          <div className="mb-10">
            <p className="text-secondary text-sm font-semibold uppercase tracking-wider mb-3">
              Why {country.shortName} Families Choose Us
            </p>
            <h2 id="why-heading" className="heading-xl font-heading text-primary">
              The Alrayan Difference
            </h2>
          </div>

          <ul
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            role="list"
          >
            {country.whyUs.map(({ icon, title, body }) => {
              const Icon = iconMap[icon] ?? BookOpen
              return (
                <li
                  key={title}
                  className="bg-white rounded-2xl p-6 border border-border-soft shadow-soft flex flex-col gap-4"
                >
                  <div className="size-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                    <Icon className="size-5 text-secondary" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary mb-2">{title}</h3>
                    <p className="text-muted-text text-sm leading-relaxed">{body}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </Container>
      </Section>

      {/* ── Timezone ── */}
      <Section aria-labelledby="timezone-heading">
        <Container>
          <div className="max-w-2xl">
            <p className="text-secondary text-sm font-semibold uppercase tracking-wider mb-3">
              Flexible Scheduling
            </p>
            <h2 id="timezone-heading" className="heading-xl font-heading text-primary mb-4">
              Classes in Your Timezone
            </h2>
            <p className="text-muted-text text-lg leading-relaxed mb-8">
              {country.timezone.note}
            </p>

            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <span className="bg-primary text-white rounded-full px-4 py-1.5 text-sm font-bold tracking-wide">
                {country.timezone.label}
              </span>
            </div>

            <ul className="flex flex-wrap gap-3" role="list" aria-label="Available class times">
              {country.timezone.slots.map((slot) => (
                <li
                  key={slot}
                  className="bg-secondary/10 text-secondary rounded-full px-4 py-2 text-sm font-medium"
                >
                  {slot}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      {/* ── Pricing Preview ── */}
      <Section bg="cream" aria-labelledby="pricing-heading">
        <Container>
          <div className="text-center mb-10">
            <p className="text-secondary text-sm font-semibold uppercase tracking-wider mb-3">
              Transparent Pricing
            </p>
            <h2 id="pricing-heading" className="heading-xl font-display text-primary">
              Simple Monthly Plans
            </h2>
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6" role="list">
            {pricingTiers.map((tier) => (
              <li
                key={tier.id}
                className={[
                  'bg-white rounded-2xl p-6 border flex flex-col gap-3',
                  tier.highlighted
                    ? 'border-accent ring-2 ring-accent shadow-xl'
                    : 'border-border-soft shadow-soft',
                ].join(' ')}
              >
                {tier.highlighted && (
                  <span className="self-start bg-accent text-primary text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <h3 className="font-display font-semibold text-primary text-lg">{tier.name}</h3>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-display font-semibold text-primary">
                    ${tier.priceUsd}
                  </span>
                  <span className="text-muted-text text-sm pb-1">/mo</span>
                </div>
                <p className="text-muted-text text-sm">
                  {tier.sessionsPerMonth} classes &middot; {tier.minutesPerSession} min each
                </p>
                <Link
                  href="/pricing"
                  className="mt-auto text-secondary text-sm font-semibold hover:underline"
                >
                  See full details →
                </Link>
              </li>
            ))}
          </ul>

          <p className="text-center text-muted-text text-sm italic mb-8">
            {country.localCurrencyNote} &middot; Free first class on every plan.
          </p>

          <div className="text-center">
            <LinkButton href="/pricing" variant="outline">
              View Full Pricing & Comparison
            </LinkButton>
          </div>
        </Container>
      </Section>

      {/* ── Testimonials ── */}
      <Section aria-labelledby="testimonials-heading">
        <Container>
          <div className="text-center mb-10">
            <p className="text-secondary text-sm font-semibold uppercase tracking-wider mb-3">
              Student Testimonials
            </p>
            <h2 id="testimonials-heading" className="heading-xl font-heading text-primary">
              What Families in {country.shortName} Say
            </h2>
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-3 gap-6" role="list">
            {country.testimonials.map((t) => (
              <li
                key={t.id}
                className="bg-cream rounded-2xl p-6 border border-border-soft flex flex-col gap-4"
              >
                <div
                  className="flex gap-0.5"
                  role="img"
                  aria-label={`${t.rating} out of 5 stars`}
                >
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="size-4 fill-accent text-accent"
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <blockquote className="text-primary text-sm leading-relaxed flex-1">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <footer className="text-sm">
                  <p className="font-semibold text-primary">{t.name}</p>
                  <p className="text-muted-text">{t.location} &middot; {t.course}</p>
                </footer>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* ── Country FAQ ── */}
      <Section bg="cream" aria-labelledby="faq-heading">
        <Container>
          <div className="mb-10">
            <p className="text-secondary text-sm font-semibold uppercase tracking-wider mb-3">
              {country.shortName} Questions
            </p>
            <h2 id="faq-heading" className="heading-xl font-heading text-primary">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="border border-border-soft rounded-2xl overflow-hidden divide-y divide-border-soft max-w-3xl">
            <Accordion multiple>
              {country.faqs.map((faq, i) => (
                <AccordionItem key={i} value={String(i)}>
                  <AccordionTrigger className="px-6 py-4 text-base font-semibold text-primary hover:no-underline text-left">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="px-6">
                    <p className="text-muted-text text-sm leading-relaxed pb-4">{faq.a}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Container>
      </Section>

      {/* ── Trust Badges ── */}
      <Section aria-label="Trust indicators">
        <Container>
          <ul
            className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
            role="list"
          >
            {[
              { value: '10,000+', label: 'Students Worldwide' },
              { value: '50+', label: 'Countries Served' },
              { value: '100%', label: 'Al-Azhar Certified' },
              { value: 'Free', label: 'First Class — No Card' },
            ].map(({ value, label }) => (
              <li key={label} className="flex flex-col items-center gap-2">
                <CheckCircle2 className="size-6 text-secondary" aria-hidden="true" />
                <span className="font-display font-bold text-2xl text-primary">{value}</span>
                <span className="text-muted-text text-sm">{label}</span>
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
              خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ
            </p>
            <p className="text-white/60 text-sm italic mb-8">
              &ldquo;The best of you are those who learn the Quran and teach it.&rdquo; — Prophet Muhammad ﷺ
            </p>
            <h2 id="cta-heading" className="heading-xl font-display text-white mb-4">
              Start Your Quran Journey in {country.shortName}
            </h2>
            <p className="text-white/70 text-lg mb-10">
              Book your free first class today. No credit card, no commitment.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <LinkButton href="/contact" size="lg" variant="gold">
                Book Free Trial Class
              </LinkButton>
              <a
                href={whatsappLink(
                  `Assalamu alaikum, I am in ${country.name} and would like to book a free trial class.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 h-14 px-7 rounded-xl border border-white/30 text-white font-medium hover:border-accent hover:text-accent transition-colors"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}
