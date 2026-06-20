import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { breadcrumbSchema } from '@/lib/schema'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { LinkButton } from '@/components/ui/link-button'
import { whatsappLink } from '@/config/site'
import { TrialBookingForm } from '@/components/conversion/TrialBookingForm'
import { ContactSidebar } from '@/components/conversion/ContactSidebar'

export const metadata: Metadata = buildMetadata({
  title: 'Book a Free Trial Quran Class | Contact Azhary',
  description:
    'Book your free first Quran class. Fill out the form and we will match you with a certified teacher within 24 hours. No credit card required.',
  path: '/contact',
})

export default function ContactPage() {
  const crumbs = breadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Contact', href: '/contact' },
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
              'radial-gradient(circle at 25% 75%, #C9A24B 0%, transparent 50%), radial-gradient(circle at 75% 25%, #0E7C5A 0%, transparent 50%)',
          }}
          aria-hidden="true"
        />
        <Container className="relative text-center">
          <p className="text-accent text-sm font-semibold uppercase tracking-widest mb-4">
            Book Your Free Trial
          </p>
          <h1
            id="contact-heading"
            className="heading-display font-display text-white text-balance mb-6 max-w-3xl mx-auto"
          >
            Start Your Quran Journey Today
          </h1>
          <p className="text-white/70 text-xl leading-relaxed max-w-2xl mx-auto">
            Fill out the form below. We&rsquo;ll match you with a certified teacher and confirm
            your first free class within 24 hours.
          </p>
        </Container>
      </section>

      {/* ── Form + Sidebar ── */}
      <Section bg="cream">
        <Container>
          <div className="grid lg:grid-cols-5 gap-12 items-start">
            {/* Form — left 3/5 */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl border border-border-soft shadow-soft p-8">
                <h2 className="text-xl font-display font-semibold text-primary mb-1">
                  Book a Free Trial Class
                </h2>
                <p className="text-muted-foreground text-sm mb-8">
                  No credit card. No commitment. Your first class is completely free.
                </p>
                <TrialBookingForm />
              </div>
            </div>

            {/* Sidebar — right 2/5 */}
            <div className="lg:col-span-2">
              <ContactSidebar />
            </div>
          </div>
        </Container>
      </Section>

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
              &ldquo;The best of you are those who learn the Quran and teach it.&rdquo; &mdash; Prophet
              Muhammad ﷺ
            </p>
            <h2 className="heading-xl font-display text-white mb-4">
              Prefer to Chat First?
            </h2>
            <p className="text-white/70 text-lg mb-10">
              Our team is on WhatsApp 7 days a week and typically replies within minutes.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <LinkButton href="/faq" size="lg" variant="outline">
                Read the FAQ
              </LinkButton>
              <a
                href={whatsappLink()}
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
