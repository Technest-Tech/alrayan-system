import Image from 'next/image'
import { Star, ArrowRight } from 'lucide-react'
import { LinkButton } from '@/components/ui/link-button'
import { Container } from '@/components/layout/Container'
import { HeroInteractiveBackground } from '@/components/home/HeroInteractiveBackground'
import { whatsappLink } from '@/config/site'
import { getHomeContent } from '@/content/home'
import { getLocale } from '@/i18n/getLocale'
import { getT } from '@/i18n/getDictionary'
import { localizedHref } from '@/i18n/href'

/** Small twinkling stars scattered across the hero backdrop. */
const TWINKLES = [
  { top: '18%', left: '12%', size: 3, delay: '0s' },
  { top: '30%', left: '82%', size: 2, delay: '1.2s' },
  { top: '62%', left: '20%', size: 2, delay: '2.1s' },
  { top: '48%', left: '68%', size: 3, delay: '0.6s' },
  { top: '76%', left: '88%', size: 2, delay: '1.8s' },
  { top: '22%', left: '46%', size: 2, delay: '2.6s' },
  { top: '84%', left: '38%', size: 3, delay: '0.3s' },
  { top: '12%', left: '70%', size: 2, delay: '1.5s' },
] as const

export async function Hero() {
  const locale = await getLocale()
  const t = getT(locale)
  const homeContent = getHomeContent(locale)
  const [subheadingBeforeAlAzhar, subheadingAfterAlAzhar] =
    homeContent.hero.subheading.split('Al-Azhar')

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #18483C 0%, #0C2B24 55%, #18483C 100%)' }}
      aria-labelledby="hero-heading"
    >
      {/* ── Animated background ── */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        {/* Drifting Islamic geometric pattern */}
        <div className="hero-pattern absolute inset-0 opacity-[0.06]" />

        {/* Floating glow orbs */}
        <div
          className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full blur-[120px] -translate-y-1/3 translate-x-1/3 animate-hero-orb-a"
          style={{ backgroundColor: 'rgba(14,124,90,0.20)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-[560px] h-[560px] rounded-full blur-[110px] translate-y-1/3 -translate-x-1/4 animate-hero-orb-b"
          style={{ backgroundColor: 'rgba(201,162,75,0.10)' }}
        />

        {/* Twinkling stars */}
        {TWINKLES.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-accent animate-hero-twinkle"
            style={{
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              animationDelay: s.delay,
            }}
          />
        ))}
      </div>

      {/* Legibility scrim behind the text column */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        aria-hidden="true"
        style={{ background: 'radial-gradient(ellipse 70% 90% at 0% 50%, rgba(11,31,58,0.85) 0%, rgba(11,31,58,0.35) 45%, transparent 70%)' }}
      />

      <HeroInteractiveBackground />

      {/* ── Content ── */}
      <Container className="relative z-10 pt-28 pb-16 sm:pt-32 sm:pb-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-10 items-center">
          {/* Text column */}
          <div className="max-w-2xl">
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

            <h1 id="hero-heading" className="heading-display font-display text-white text-balance mb-6">
              {homeContent.hero.headingStart}{' '}
              {/* Underlined with text-decoration, not an absolutely placed bar: the
                  French headline is long enough to wrap on a phone, and a bar
                  pinned to the box would sit under only the last line. */}
              <em className="text-accent not-italic underline decoration-accent/40 decoration-2 underline-offset-[0.15em]">
                {homeContent.hero.headingEmphasis}
              </em>
              {' '}{homeContent.hero.headingEnd}
            </h1>

            <p className="text-white/75 text-lg sm:text-xl leading-relaxed mb-7 sm:mb-10 max-w-xl">
              {subheadingBeforeAlAzhar}
              <strong className="whitespace-nowrap rounded-md border border-accent/40 bg-accent/15 px-1.5 py-0.5 font-bold text-accent shadow-[0_0_20px_rgba(201,162,75,0.2)]">
                Al-Azhar
              </strong>
              {subheadingAfterAlAzhar}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
              <LinkButton
                href={localizedHref('/contact', locale)}
                size="lg"
                variant="gold"
                className="group w-full sm:w-auto justify-center font-bold text-primary animate-cta-pulse hover:scale-[1.03]"
              >
                {homeContent.hero.ctaPrimary}
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </LinkButton>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 h-14 px-7 rounded-xl border border-white/25 text-white text-base font-medium hover:border-accent/60 hover:text-accent hover:bg-white/5 transition-all duration-200 w-full sm:w-auto backdrop-blur-sm"
              >
                {homeContent.hero.ctaSecondary}
              </a>
            </div>

            {/* Reassurance microcopy under the CTA */}
            <p className="flex items-center gap-2 text-white/60 text-sm mb-8 sm:mb-10">
              <span className="inline-block size-1.5 rounded-full bg-secondary" aria-hidden="true" />
              {t('home.heroReassure')}
            </p>

            {/* Social proof strip */}
            <div className="flex items-center gap-3 pr-12 sm:gap-5 sm:pr-0">
              <div className="flex -space-x-2.5" aria-hidden="true">
                {(
                  [
                    { bg: '#0E7C5A', letter: 'A' },
                    { bg: '#1A5C8A', letter: 'M' },
                    { bg: '#7B4EA6', letter: 'S' },
                    { bg: '#C0A854', letter: 'F' },
                    { bg: '#0B6B6B', letter: 'Y' },
                  ] as const
                ).map(({ bg, letter }, i) => (
                  <div
                    key={letter}
                    className="size-9 rounded-full border-2 border-[#18483C] flex items-center justify-center text-xs font-bold text-white"
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
                <p className="text-white/60 text-xs">{t('home.heroSocialProof')}</p>
              </div>
            </div>
          </div>

          {/* ── Hero image ── */}
          <div className="relative hidden lg:block" aria-hidden="true">
            <div className="relative mx-auto w-full max-w-lg animate-hero-frame">
              {/* Soft gold glow behind the image */}
              <div className="absolute -inset-8 rounded-[3rem] bg-accent/15 blur-3xl animate-hero-glow" />

              <div className="relative rounded-3xl overflow-hidden ring-1 ring-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.55)]">
                <Image
                  src="/images/hero-image.png"
                  alt={t('home.heroImageAlt')}
                  width={900}
                  height={600}
                  priority
                  className="w-full h-auto"
                />
                {/* Gentle tint to seat the image in the dark scene */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/30 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* Scroll cue */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden sm:flex flex-col items-center gap-2" aria-hidden="true">
        <span className="text-white/40 text-[11px] tracking-[0.2em] uppercase">{t('home.heroScroll')}</span>
        <span className="block w-px h-8 bg-gradient-to-b from-accent/60 to-transparent" />
      </div>
    </section>
  )
}
