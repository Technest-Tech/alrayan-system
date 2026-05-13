import { Star } from 'lucide-react'
import type { Testimonial } from '@/content/testimonials'

function Card({ t }: { t: Testimonial }) {
  return (
    <div className="w-[290px] shrink-0 bg-white rounded-2xl p-6 border border-border-soft shadow-soft flex flex-col select-none">
      {/* Decorative quote + stars */}
      <div className="flex items-start justify-between mb-3">
        <span className="font-display text-accent leading-none" style={{ fontSize: '3rem', lineHeight: 1 }} aria-hidden="true">
          &ldquo;
        </span>
        <div className="flex gap-0.5 pt-1" aria-label={`${t.rating} out of 5 stars`}>
          {Array.from({ length: t.rating }).map((_, i) => (
            <Star key={i} className="size-3 fill-accent text-accent" aria-hidden="true" />
          ))}
        </div>
      </div>

      {/* Quote */}
      <blockquote className="text-primary text-sm leading-relaxed flex-1 line-clamp-4 mb-5">
        {t.quote}
      </blockquote>

      {/* Divider */}
      <div className="h-px bg-border-soft mb-4" />

      {/* Author */}
      <footer className="flex items-center gap-3">
        <div
          className="size-9 rounded-full bg-primary flex items-center justify-center text-accent font-semibold text-xs shrink-0"
          aria-hidden="true"
        >
          {t.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-primary text-sm leading-none mb-1 truncate">{t.name}</p>
          <p className="text-muted-text text-xs truncate">{t.location} · {t.course}</p>
        </div>
      </footer>
    </div>
  )
}

export function TestimonialsMarquee({ items }: { items: Testimonial[] }) {
  const mid  = Math.ceil(items.length / 2)
  const row1 = items.slice(0, mid)
  const row2 = items.slice(mid)

  return (
    <div>
      {/* ── Header ── */}
      <div className="text-center mb-10">
        <p className="text-secondary text-sm font-semibold uppercase tracking-wider mb-3">Student Stories</p>
        <h2 className="heading-xl font-heading text-primary mb-5">
          Trusted by Families Worldwide
        </h2>
        <div className="flex items-center justify-center gap-2">
          <div className="flex gap-0.5" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="size-4 fill-accent text-accent" />
            ))}
          </div>
          <span className="font-bold text-primary">4.9</span>
          <span className="text-muted-text text-sm">· 2,000+ verified reviews</span>
        </div>
      </div>

      {/* ── Row 1 — scrolls left ── */}
      <div className="group overflow-hidden mb-4">
        <div className="flex gap-4 w-max animate-marquee group-hover:[animation-play-state:paused]">
          {[...row1, ...row1].map((t, i) => (
            <Card key={`r1-${t.id}-${i}`} t={t} />
          ))}
        </div>
      </div>

      {/* ── Row 2 — scrolls right ── */}
      <div className="group overflow-hidden">
        <div className="flex gap-4 w-max animate-marquee-reverse group-hover:[animation-play-state:paused]">
          {[...row2, ...row2].map((t, i) => (
            <Card key={`r2-${t.id}-${i}`} t={t} />
          ))}
        </div>
      </div>
    </div>
  )
}
