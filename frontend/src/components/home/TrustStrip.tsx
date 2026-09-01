import {
  BookOpen,
  Clock,
  Globe,
  GraduationCap,
  Heart,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Container } from '@/components/layout/Container'
import type { Locale } from '@/i18n/config'
import { getT } from '@/i18n/getDictionary'

type TrustBadge = {
  icon: string
  label: string
}

type BadgeCardProps = {
  badge: TrustBadge
  locale: Locale
  mobile?: boolean
}

const iconMap: Record<string, LucideIcon> = {
  Users,
  Globe,
  Heart,
  GraduationCap,
  ShieldCheck,
  BookOpen,
  Clock,
}

const iconStyles: Record<string, { wrap: string; icon: string }> = {
  Users: { wrap: 'bg-secondary/12', icon: 'text-secondary' },
  ShieldCheck: { wrap: 'bg-accent/12', icon: 'text-accent' },
  Heart: { wrap: 'bg-secondary/12', icon: 'text-secondary' },
  Globe: { wrap: 'bg-accent/12', icon: 'text-accent' },
  GraduationCap: { wrap: 'bg-secondary/12', icon: 'text-secondary' },
}

function BadgeCard({ badge: { icon, label }, locale, mobile = false }: BadgeCardProps) {
  const t = getT(locale)
  const Icon = iconMap[icon] ?? BookOpen
  const subtextKey = `home.trustSubtext.${icon}`
  const resolved = t(subtextKey)
  const subtext = resolved === subtextKey ? '' : resolved
  const style = iconStyles[icon] ?? {
    wrap: 'bg-secondary/12',
    icon: 'text-secondary',
  }

  return (
    <li
      className={`group flex flex-col items-center gap-3.5 rounded-[1.4rem] border border-border-soft bg-white px-4 py-6 text-center shadow-[0_8px_26px_rgba(11,31,58,0.07)] transition-all duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_14px_32px_rgba(11,31,58,0.10)] ${
        mobile ? 'w-[68vw] max-w-[260px] shrink-0' : ''
      }`}
    >
      <div
        className={`flex size-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 ${style.wrap}`}
      >
        <Icon className={`size-6 ${style.icon}`} aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm font-semibold leading-snug text-primary">{label}</p>
        <p className="mt-1 text-xs leading-snug text-muted-text">{subtext}</p>
      </div>
    </li>
  )
}

export function TrustStrip({
  ariaLabel,
  eyebrow,
  badges,
  locale,
}: {
  ariaLabel: string
  eyebrow: string
  badges: TrustBadge[]
  locale: Locale
}) {
  return (
    <section className="overflow-hidden bg-cream py-10 md:py-12" aria-label={ariaLabel}>
      <Container>
        <div className="mb-7 flex items-center justify-center gap-3 sm:gap-4">
          <span
            className="h-px w-10 bg-gradient-to-r from-transparent to-accent/60 sm:w-16"
            aria-hidden="true"
          />
          <span className="size-1.5 rotate-45 rounded-[1px] bg-accent" aria-hidden="true" />
          <p className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-secondary">
            {eyebrow}
          </p>
          <span className="size-1.5 rotate-45 rounded-[1px] bg-accent" aria-hidden="true" />
          <span
            className="h-px w-10 bg-gradient-to-l from-transparent to-accent/60 sm:w-16"
            aria-hidden="true"
          />
        </div>

        {/* Mobile: two identical groups create a seamless, continuously moving loop. */}
        <div
          className="-mx-5 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] sm:hidden"
          dir="ltr"
        >
          <div className="flex w-max animate-trust-marquee hover:[animation-play-state:paused] active:[animation-play-state:paused]">
            <ul className="flex gap-3 pr-3" role="list">
              {badges.map((badge) => (
                <BadgeCard key={badge.label} badge={badge} locale={locale} mobile />
              ))}
            </ul>
            <ul className="flex gap-3 pr-3" aria-hidden="true">
              {badges.map((badge) => (
                <BadgeCard
                  key={`duplicate-${badge.label}`}
                  badge={badge}
                  locale={locale}
                  mobile
                />
              ))}
            </ul>
          </div>
        </div>

        {/* Tablet and desktop retain the compact grid. */}
        <ul className="hidden grid-cols-3 gap-4 sm:grid lg:grid-cols-5" role="list">
          {badges.map((badge) => (
            <BadgeCard key={badge.label} badge={badge} locale={locale} />
          ))}
        </ul>
      </Container>
    </section>
  )
}
