'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { Star } from 'lucide-react'
import { LinkButton } from '@/components/ui/link-button'
import { Container } from '@/components/layout/Container'
import { whatsappLink } from '@/config/site'
import { homeContent } from '@/content/home'

/**
 * 3D hero: pointer position is written to CSS custom properties (--mx/--my) on
 * the section, so decorative layers parallax and the image card tilts without
 * React re-rendering on every move. Disabled under prefers-reduced-motion.
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (window.matchMedia('(hover: none)').matches) return // skip touch devices

    let frame = 0
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        const mx = (e.clientX - r.left) / r.width - 0.5 // -0.5 .. 0.5
        const my = (e.clientY - r.top) / r.height - 0.5
        el.style.setProperty('--mx', mx.toFixed(4))
        el.style.setProperty('--my', my.toFixed(4))
      })
    }
    const onLeave = () => {
      cancelAnimationFrame(frame)
      el.style.setProperty('--mx', '0')
      el.style.setProperty('--my', '0')
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="hero-3d relative min-h-screen flex items-center overflow-hidden"
      style={
        {
          background: 'linear-gradient(135deg, #0B1F3A 0%, #0E2649 55%, #0B1F3A 100%)',
          '--mx': '0',
          '--my': '0',
        } as React.CSSProperties
      }
      aria-labelledby="hero-heading"
    >
      <style>{`
        .hero-3d .depth { transition: transform .25s cubic-bezier(.22,.61,.36,1); will-change: transform; }
        @keyframes heroFloat {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-10px); }
        }
        .hero-3d .float { animation: heroFloat 6s ease-in-out infinite; }
        .hero-3d .float-slow { animation: heroFloat 8s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .hero-3d .depth, .hero-3d .float, .hero-3d .float-slow { animation: none !important; transition: none !important; }
        }
      `}</style>

      {/* Islamic geometric star pattern — deepest layer (moves least) */}
      <div
        className="depth absolute inset-0 opacity-[0.055]"
        aria-hidden="true"
        style={{ transform: 'translate3d(calc(var(--mx) * 14px), calc(var(--my) * 14px), 0)' }}
      >
        <svg width="120%" height="120%" className="-ml-[10%] -mt-[10%]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="islamic-geo" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path
                d="M80,50 L62.9,44.6 L71.2,28.8 L55.4,37.1 L50,20 L44.6,37.1 L28.8,28.8 L37.1,44.6 L20,50 L37.1,55.4 L28.8,71.2 L44.6,62.9 L50,80 L55.4,62.9 L71.2,71.2 L62.9,55.4 Z"
                fill="none"
                stroke="#C9A24B"
                strokeWidth="0.7"
              />
              <circle cx="50" cy="50" r="28" fill="none" stroke="#C9A24B" strokeWidth="0.35" />
              <circle cx="0" cy="0" r="3.5" fill="#C9A24B" opacity="0.4" />
              <circle cx="100" cy="0" r="3.5" fill="#C9A24B" opacity="0.4" />
              <circle cx="0" cy="100" r="3.5" fill="#C9A24B" opacity="0.4" />
              <circle cx="100" cy="100" r="3.5" fill="#C9A24B" opacity="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#islamic-geo)" />
        </svg>
      </div>

      {/* Ambient glow — green top-right (parallax, opposite direction for depth) */}
      <div
        className="depth absolute top-0 right-0 w-[800px] h-[800px] rounded-full blur-[120px] -translate-y-1/3 translate-x-1/3"
        style={{
          backgroundColor: 'rgba(14,124,90,0.18)',
          transform: 'translate3d(calc(var(--mx) * -40px - 33.3%), calc(var(--my) * -40px - 33.3%), 0)',
        }}
        aria-hidden="true"
      />
      {/* Ambient glow — gold bottom-left */}
      <div
        className="depth absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-[100px]"
        style={{
          backgroundColor: 'rgba(201,162,75,0.07)',
          transform: 'translate3d(calc(var(--mx) * -28px - 25%), calc(var(--my) * -28px + 33.3%), 0)',
        }}
        aria-hidden="true"
      />

      <Container className="relative pt-28 pb-16 sm:pt-32 sm:pb-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">

          {/* ── Left: Content (gentle parallax, moves with pointer) ── */}
          <div
            className="depth"
            style={{ transform: 'translate3d(calc(var(--mx) * 10px), calc(var(--my) * 8px), 0)' }}
          >
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
              <LinkButton href="/contact" size="lg" variant="gold" className="w-full sm:w-auto justify-center">
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

          {/* ── Right: Hero image with 3D tilt ── */}
          <div className="hidden lg:block" aria-hidden="true" style={{ perspective: '1200px' }}>
            <div
              className="depth relative py-6"
              style={{
                transformStyle: 'preserve-3d',
                transform:
                  'rotateY(calc(var(--mx) * 9deg)) rotateX(calc(var(--my) * -9deg)) translate3d(calc(var(--mx) * 12px), calc(var(--my) * 12px), 0)',
              }}
            >
              {/* Ambient glow behind the image card */}
              <div
                className="absolute inset-[8%] rounded-full blur-3xl z-0"
                style={{ background: 'radial-gradient(ellipse, rgba(14,124,90,0.32) 0%, transparent 70%)' }}
              />

              {/* Image card — pushed back in 3D space */}
              <div
                className="relative z-10 rounded-3xl overflow-hidden shadow-[0_20px_56px_rgba(0,0,0,0.45)]"
                style={{ transform: 'translateZ(20px)' }}
              >
                <Image
                  src="/hero/2children-learn-quran-online.png"
                  alt="Two children learning Quran online with a certified teacher"
                  width={1536}
                  height={1024}
                  className="w-full h-auto block"
                  priority
                />
              </div>

              {/* Rating badge — floats above the card, closest layer */}
              <div
                className="float absolute top-0 right-8 z-20 rounded-2xl px-4 py-3 whitespace-nowrap"
                style={{
                  background: 'rgba(11,31,58,0.92)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(201,162,75,0.5)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
                  transform: 'translateZ(70px)',
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

              {/* Students badge — floats below the card */}
              <div
                className="float-slow absolute bottom-0 left-8 z-20 rounded-2xl px-4 py-3 whitespace-nowrap"
                style={{
                  background: 'rgba(11,31,58,0.92)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(201,162,75,0.5)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
                  transform: 'translateZ(90px)',
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
  )
}
