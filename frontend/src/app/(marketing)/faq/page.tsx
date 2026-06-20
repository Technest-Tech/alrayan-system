import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { LinkButton } from '@/components/ui/link-button'
import { whatsappLink } from '@/config/site'
import { faqSchema, breadcrumbSchema } from '@/lib/schema'
import { faqs, faqPageContent } from '@/content/faq'
import { FaqContent } from '@/components/conversion/FaqContent'

export const metadata: Metadata = buildMetadata({
  title: 'FAQ | Quran Classes Online | Azhary',
  description:
    "Answers to common questions about Azhary's online Quran, Arabic, and Islamic Studies classes — teachers, pricing, scheduling, and more.",
  path: '/faq',
})

export default function FaqPage() {
  const { hero, cta } = faqPageContent
  const schemas = [
    faqSchema(faqs.map(({ q, a }) => ({ q, a }))),
    breadcrumbSchema([
      { name: 'Home', href: '/' },
      { name: 'FAQ', href: '/faq' },
    ]),
  ]

  return (
    <>
      {schemas.map((s, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }}
        />
      ))}

      {/* ── Hero ── */}
      <section
        className="relative bg-primary overflow-hidden pt-40 pb-20"
        aria-labelledby="faq-heading"
      >
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 80%, #C9A24B 0%, transparent 50%), radial-gradient(circle at 80% 20%, #0E7C5A 0%, transparent 50%)',
          }}
          aria-hidden="true"
        />
        <Container className="relative text-center">
          <p className="text-accent text-sm font-semibold uppercase tracking-widest mb-4">
            {hero.eyebrow}
          </p>
          <h1
            id="faq-heading"
            className="heading-display font-display text-white text-balance mb-6 max-w-3xl mx-auto"
          >
            {hero.heading}
          </h1>
          <p className="text-white/70 text-xl leading-relaxed max-w-2xl mx-auto">
            {hero.subheading}
          </p>
        </Container>
      </section>

      {/* ── FAQ Content (client component) ── */}
      <Section bg="cream">
        <Container>
          <FaqContent />
        </Container>
      </Section>

      {/* ── CTA Banner ── */}
      <Section bg="primary">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="heading-xl font-display text-white mb-4">{cta.heading}</h2>
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
