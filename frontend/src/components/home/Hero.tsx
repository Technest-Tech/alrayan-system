'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Star } from 'lucide-react'
import { LinkButton } from '@/components/ui/link-button'
import { Container } from '@/components/layout/Container'
import { whatsappLink } from '@/config/site'
import { homeContent } from '@/content/home'

// WebGL scene is client-only and lazy-loaded so it never blocks first paint or SSR.
const CosmicScene = dynamic(() => import('./CosmicScene'), { ssr: false })

export function Hero() {
  const [enable3d, setEnable3d] = useState(false)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Skip the heavy scene on very small / likely low-power screens.
    const tooSmall = window.matchMedia('(max-width: 640px)').matches
    if (!reduce && !tooSmall) setEnable3d(true)
  }, [])

  return (
    <section
      className="hero-cosmic relative min-h-screen flex items-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0B1F3A 0%, #0E2649 55%, #0B1F3A 100%)' }}
      aria-labelledby="hero-heading"
    >
      <style>{`
        /* Static geometric fallback (shown before the scene mounts / reduced-motion) */
        @keyframes verse3dFade {
          0%, 100% { opacity: 0; transform: translateY(8px); }
          15%, 70% { opacity: 1; transform: translateY(0); }
        }
        .verse-3d {
          display: flex; flex-direction: column; align-items: center; gap: .4rem;
          text-align: center; white-space: nowrap;
          opacity: 0;
          animation: verse3dFade 15s ease-in-out infinite;
          text-shadow: 0 0 24px rgba(201,162,75,0.55), 0 2px 8px rgba(0,0,0,0.6);
        }
        .verse-3d .font-arabic { color: #F0D58A; font-size: 2.4rem; line-height: 1.2; }
        .verse-3d-en { color: rgba(255,255,255,0.75); font-size: .85rem; letter-spacing: .04em; }
        @media (prefers-reduced-motion: reduce) {
          .verse-3d { animation: none; opacity: 1; }
        }
      `}</style>

      {/* ── 3D scene (background) ── */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        {enable3d ? (
          <CosmicScene />
        ) : (
          /* Static fallback: Islamic geometric pattern + glows */
          <>
            <div className="absolute inset-0 opacity-[0.06]">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="hero-geo-fallback" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                    <path
                      d="M80,50 L62.9,44.6 L71.2,28.8 L55.4,37.1 L50,20 L44.6,37.1 L28.8,28.8 L37.1,44.6 L20,50 L37.1,55.4 L28.8,71.2 L44.6,62.9 L50,80 L55.4,62.9 L71.2,71.2 L62.9,55.4 Z"
                      fill="none"
                      stroke="#C9A24B"
                      strokeWidth="0.7"
                    />
                    <circle cx="50" cy="50" r="28" fill="none" stroke="#C9A24B" strokeWidth="0.35" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#hero-geo-fallback)" />
              </svg>
            </div>
            <div
              className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full blur-[120px] -translate-y-1/3 translate-x-1/3"
              style={{ backgroundColor: 'rgba(14,124,90,0.18)' }}
            />
            <div
              className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4"
              style={{ backgroundColor: 'rgba(201,162,75,0.07)' }}
            />
          </>
        )}
      </div>

      {/* Legibility scrim behind the text column */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        aria-hidden="true"
        style={{ background: 'radial-gradient(ellipse 70% 90% at 0% 50%, rgba(11,31,58,0.85) 0%, rgba(11,31,58,0.35) 45%, transparent 70%)' }}
      />

      {/* ── Content overlay ── */}
      <Container className="relative z-10 pt-28 pb-16 sm:pt-32 sm:pb-20 lg:py-28">
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
            <em className="text-accent not-italic relative inline-block">
              {homeContent.hero.headingEmphasis}
              <span
                className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full bg-accent/40"
                aria-hidden="true"
              />
            </em>
            {' '}{homeContent.hero.headingEnd}
          </h1>

          <p className="text-white/75 text-lg sm:text-xl leading-relaxed mb-7 sm:mb-10 max-w-xl">
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
              className="flex items-center justify-center gap-2.5 h-14 px-7 rounded-xl border border-white/25 text-white text-base font-medium hover:border-accent/60 hover:text-accent hover:bg-white/5 transition-all duration-200 w-full sm:w-auto backdrop-blur-sm"
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
              <p className="text-white/60 text-xs">Trusted by 10,000+ students worldwide</p>
            </div>
          </div>
        </div>
      </Container>

      {/* Scroll cue */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden sm:flex flex-col items-center gap-2" aria-hidden="true">
        <span className="text-white/40 text-[11px] tracking-[0.2em] uppercase">Scroll</span>
        <span className="block w-px h-8 bg-gradient-to-b from-accent/60 to-transparent" />
      </div>
    </section>
  )
}
