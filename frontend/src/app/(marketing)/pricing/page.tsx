import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { breadcrumbSchema } from '@/lib/schema'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { LinkButton } from '@/components/ui/link-button'
import { whatsappLink } from '@/config/site'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  pricingTiers,
  comparisonRows,
  pricingFaqs,
  pricingPageContent,
} from '@/content/pricing'
import { CheckCircle2, XCircle, Minus, Users } from 'lucide-react'

export const metadata: Metadata = buildMetadata({
  title: 'Quran Class Pricing | Transparent Plans | Alrayan Academy',
  description:
    'Simple, transparent pricing for online Quran classes. Plans from 1,500 EGP/month. Free first class, no contracts, cancel anytime.',
  path: '/pricing',
})

function ComparisonCell({ value }: { value: boolean | string }) {
  if (typeof value === 'string') {
    return <span className="text-sm font-medium text-primary">{value}</span>
  }
  if (value) {
    return <CheckCircle2 className="size-5 text-secondary mx-auto" aria-label="Included" />
  }
  return <Minus className="size-5 text-muted-foreground/40 mx-auto" aria-label="Not included" />
}

export default function PricingPage() {
  const { hero, familyDiscount, cta } = pricingPageContent
  const crumbs = breadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Pricing', href: '/pricing' },
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
        aria-labelledby="pricing-heading"
      >
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 30% 70%, #C9A24B 0%, transparent 50%), radial-gradient(circle at 70% 30%, #0E7C5A 0%, transparent 50%)',
          }}
          aria-hidden="true"
        />
        <Container className="relative text-center">
          <p className="text-accent text-sm font-semibold uppercase tracking-widest mb-4">
            {hero.eyebrow}
          </p>
          <h1
            id="pricing-heading"
            className="heading-display font-display text-white text-balance mb-6 max-w-3xl mx-auto"
          >
            {hero.heading}
          </h1>
          <p className="text-white/70 text-xl leading-relaxed max-w-2xl mx-auto">
            {hero.subheading}
          </p>
        </Container>
      </section>

      {/* ── Pricing Cards ── */}
      <Section bg="cream">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {pricingTiers.map((tier) => (
              <div
                key={tier.id}
                className={[
                  'relative flex flex-col rounded-2xl bg-white border p-8 transition-shadow',
                  tier.highlighted
                    ? 'border-accent ring-2 ring-accent shadow-xl md:scale-[1.03] md:-translate-y-2'
                    : 'border-border-soft shadow-soft',
                ].join(' ')}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-accent text-primary text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-sm">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-primary mb-1">{tier.name}</h2>
                  <div className="flex items-end gap-1">
                    <span className="text-5xl font-display font-semibold text-primary">
                      {tier.priceEgp.toLocaleString('en-EG')}
                    </span>
                    <span className="text-muted-foreground text-base pb-1"> EGP/mo</span>
                  </div>
                  <p className="text-muted-foreground text-sm mt-1">
                    {tier.sessionsPerMonth} classes &middot; {tier.minutesPerSession} min each
                  </p>
                </div>

                <ul className="space-y-3 mb-8 flex-1" aria-label={`${tier.name} plan features`}>
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-primary">
                      <CheckCircle2
                        className="size-4 text-secondary shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      {f}
                    </li>
                  ))}
                  {tier.notIncluded?.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground/60">
                      <XCircle className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>

                <LinkButton
                  href="/contact"
                  variant={tier.highlighted ? 'gold' : 'outline'}
                  className="w-full justify-center"
                >
                  {tier.ctaLabel}
                </LinkButton>
              </div>
            ))}
          </div>

          <p className="text-center text-muted-foreground text-sm mt-8">
            All plans include a <strong className="text-primary">free first class</strong>. No credit card required.
          </p>
        </Container>
      </Section>

      {/* ── Family Discount callout ── */}
      <Section bg="white">
        <Container>
          <div className="bg-accent/10 border border-accent/25 rounded-2xl p-8 md:p-10 max-w-2xl mx-auto text-center">
            <div className="size-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
              <Users className="size-6 text-accent" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-display font-semibold text-primary mb-3">
              {familyDiscount.heading}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">{familyDiscount.body}</p>
            <a
              href={whatsappLink('Assalamu alaikum, I would like to activate the sibling discount for the Premium plan.')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
            >
              Activate via WhatsApp →
            </a>
          </div>
        </Container>
      </Section>

      {/* ── Comparison Table ── */}
      <Section bg="cream">
        <Container>
          <div className="text-center mb-10">
            <h2 className="heading-xl font-display text-primary">Compare Plans</h2>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-border-soft shadow-soft">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="text-left px-6 py-4 font-medium w-1/2">Feature</th>
                  {pricingTiers.map((t) => (
                    <th
                      key={t.id}
                      className={[
                        'text-center px-6 py-4 font-semibold',
                        t.highlighted ? 'text-accent' : '',
                      ].join(' ')}
                    >
                      {t.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={i % 2 === 0 ? 'bg-white' : 'bg-cream'}
                  >
                    <td className="px-6 py-3.5 font-medium text-primary">{row.feature}</td>
                    <td className="px-6 py-3.5 text-center">
                      <ComparisonCell value={row.starter} />
                    </td>
                    <td className="px-6 py-3.5 text-center bg-accent/5">
                      <ComparisonCell value={row.growth} />
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <ComparisonCell value={row.premium} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked cards */}
          <div className="md:hidden space-y-6">
            {pricingTiers.map((tier) => (
              <div
                key={tier.id}
                className="bg-white rounded-2xl border border-border-soft p-6 shadow-soft"
              >
                <h3 className="font-display font-semibold text-primary text-lg mb-4">
                  {tier.name} — {tier.priceEgp.toLocaleString('en-EG')} EGP/mo
                </h3>
                <ul className="space-y-2.5">
                  {comparisonRows.map((row) => {
                    const val = row[tier.id]
                    return (
                      <li key={row.feature} className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-muted-foreground">{row.feature}</span>
                        {typeof val === 'string' ? (
                          <span className="font-medium text-primary">{val}</span>
                        ) : val ? (
                          <CheckCircle2 className="size-4 text-secondary shrink-0" />
                        ) : (
                          <Minus className="size-4 text-muted-foreground/40 shrink-0" />
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ── Pricing FAQ ── */}
      <Section bg="white">
        <Container>
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-secondary text-sm font-semibold uppercase tracking-wider mb-3">
                Pricing FAQ
              </p>
              <h2 className="heading-xl font-display text-primary">Frequently Asked Questions</h2>
            </div>

            <div className="border border-border-soft rounded-2xl overflow-hidden divide-y divide-border-soft">
              <Accordion multiple>
                {pricingFaqs.map((faq, i) => (
                  <AccordionItem key={i} value={String(i)}>
                    <AccordionTrigger className="px-6 py-4 text-base font-semibold text-primary hover:no-underline">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="px-6">
                      <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </Container>
      </Section>

      {/* ── CTA Banner ── */}
      <Section bg="primary">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <h2
              id="pricing-cta-heading"
              className="heading-xl font-display text-white mb-4"
            >
              {cta.heading}
            </h2>
            <p className="text-white/70 text-lg mb-10">{cta.subheading}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <LinkButton href="/contact" size="lg" variant="gold">
                {cta.ctaPrimary}
              </LinkButton>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 h-14 px-7 rounded-xl border border-white/30 text-white font-medium hover:border-accent hover:text-accent transition-colors"
              >
                {cta.ctaSecondary}
              </a>
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}
