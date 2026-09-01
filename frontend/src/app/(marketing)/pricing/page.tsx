import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { breadcrumbSchema } from '@/lib/schema'
import { Container } from '@/components/layout/Container'
import { PricingPlans } from '@/components/pricing/PricingPlans'
import { whatsappLink } from '@/config/site'
import {
  getIncludedFeatures,
  getPricingPageContent,
  type IncludedIcon,
} from '@/content/pricing'
import { getLocale } from '@/i18n/getLocale'
import { getT } from '@/i18n/getDictionary'
import { localizedHref } from '@/i18n/href'
import {
  Gift,
  GraduationCap,
  Award,
  Clock,
  BookOpen,
  ShieldCheck,
  Sparkles,
  MessageCircle,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = getT(locale)
  return buildMetadata({
    title: t('meta.pricingTitle'),
    description: t('meta.pricingDescription'),
    path: '/pricing',
    locale,
  })
}

const INCLUDED_ICONS: Record<IncludedIcon, LucideIcon> = {
  gift: Gift,
  graduation: GraduationCap,
  certificate: Award,
  clock: Clock,
  book: BookOpen,
  shield: ShieldCheck,
}

export default async function PricingPage() {
  const locale = await getLocale()
  const t = getT(locale)
  const { hero, included, guarantee } = getPricingPageContent(locale)
  const includedFeatures = getIncludedFeatures(locale)
  const crumbs = breadcrumbSchema([
    { name: t('nav.home'), href: localizedHref('/', locale) },
    { name: t('nav.pricing'), href: localizedHref('/pricing', locale) },
  ])

  const renderHighlight = (text: string, highlight?: string) => {
    if (!highlight || !text.includes(highlight)) return text
    const [before, after] = text.split(highlight)
    return (
      <>
        {before}
        <span className="gold-underline text-accent">{highlight}</span>
        {after}
      </>
    )
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />

      <div className="bg-primary text-white">
        {/* ── Ambient background ── */}
        <div className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 12%, #C0A854 0%, transparent 42%), radial-gradient(circle at 82% 30%, #0E7C5A 0%, transparent 45%)',
            }}
            aria-hidden="true"
          />

          {/* ── Hero + Plans ── */}
          <section className="relative pt-36 pb-20" aria-labelledby="pricing-heading">
            <Container>
              <div className="mx-auto mb-12 max-w-2xl text-center">
                <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
                  <Sparkles className="size-3.5" aria-hidden="true" />
                  {hero.eyebrow}
                </p>
                <h1
                  id="pricing-heading"
                  className="heading-display font-display text-balance text-white"
                >
                  {renderHighlight(hero.heading, hero.highlight)}
                </h1>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/65">
                  {hero.subheading}
                </p>
              </div>

              <PricingPlans ctaHref={localizedHref('/contact', locale)} />
            </Container>
          </section>
        </div>

        {/* ── Included in every package ── */}
        <section className="border-t border-white/5 py-20" aria-labelledby="included-heading">
          <Container>
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2
                id="included-heading"
                className="heading-xl font-display text-white"
              >
                {renderHighlight(included.heading, included.highlight)}
              </h2>
              <p className="mt-4 text-white/60">{included.subheading}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {includedFeatures.map((f) => {
                const Icon = INCLUDED_ICONS[f.icon]
                return (
                  <div
                    key={f.title}
                    className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-white/20 hover:bg-white/[0.05]"
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-heading text-base font-semibold text-white">
                        {f.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-white/55">{f.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Container>
        </section>

        {/* ── No-commitment guarantee ── */}
        <section className="pb-20" aria-labelledby="guarantee-heading">
          <Container>
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-secondary/15 via-white/[0.02] to-accent/10 px-6 py-14 text-center sm:px-10">
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.08]"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 50% 0%, #C0A854 0%, transparent 55%)',
                }}
                aria-hidden="true"
              />
              <div className="relative mx-auto max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-accent">
                  <ShieldCheck className="size-3.5" aria-hidden="true" />
                  {guarantee.badge}
                </span>
                <h2
                  id="guarantee-heading"
                  className="heading-lg mt-6 font-display text-white"
                >
                  {guarantee.heading}
                </h2>
                <p className="mx-auto mt-4 max-w-xl leading-relaxed text-white/65">
                  {guarantee.body}
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <a
                    href={whatsappLink(t('pricingPlans.waMessage'))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-secondary px-6 text-sm font-semibold text-white transition-colors hover:bg-[#0a6849]"
                  >
                    <MessageCircle className="size-4" aria-hidden="true" />
                    {guarantee.ctaSecondary}
                  </a>
                  <a
                    href={localizedHref('/contact', locale)}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-6 text-sm font-semibold text-primary transition-colors hover:bg-[#d8b258]"
                  >
                    {guarantee.ctaPrimary}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          </Container>
        </section>

      </div>
    </>
  )
}
