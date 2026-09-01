import {
  ArrowRight,
  CalendarCheck2,
  GraduationCap,
  UserRoundCheck,
  type LucideIcon,
} from 'lucide-react'
import type { Locale } from '@/i18n/config'

type JourneyStep = {
  number: string
  title: string
  description: string
  icon: LucideIcon
}

const journeyCopy: Record<Locale, JourneyStep[]> = {
  en: [
    {
      number: '01',
      title: 'Book your free trial',
      description: 'Tell us what you want to learn and choose a time that suits you.',
      icon: CalendarCheck2,
    },
    {
      number: '02',
      title: 'Meet your best match',
      description: 'We pair you with a certified teacher who fits your goals and schedule.',
      icon: UserRoundCheck,
    },
    {
      number: '03',
      title: 'Start learning',
      description: 'Join your private live classroom and begin your personalised plan.',
      icon: GraduationCap,
    },
  ],
  fr: [
    {
      number: '01',
      title: 'Réservez votre essai gratuit',
      description: 'Dites-nous ce que vous souhaitez apprendre et choisissez votre horaire.',
      icon: CalendarCheck2,
    },
    {
      number: '02',
      title: 'Rencontrez votre professeur',
      description: 'Nous vous proposons un enseignant certifié adapté à vos objectifs.',
      icon: UserRoundCheck,
    },
    {
      number: '03',
      title: 'Commencez à apprendre',
      description: 'Rejoignez votre classe privée en direct et suivez votre plan personnalisé.',
      icon: GraduationCap,
    },
  ],
}

const journeyLabels: Record<Locale, { step: string; swipe: string; aria: string }> = {
  en: {
    step: 'Step',
    swipe: 'Swipe',
    aria: 'Three simple steps',
  },
  fr: {
    step: 'Étape',
    swipe: 'Glisser',
    aria: 'Trois étapes simples',
  },
}

export function MobileJourney({ locale }: { locale: Locale }) {
  const steps = journeyCopy[locale]
  const labels = journeyLabels[locale]

  return (
    <div className="-mx-5 md:hidden">
      <div
        className="mobile-snap-rail flex gap-3 overflow-x-auto px-5 pb-4"
        role="list"
        aria-label={labels.aria}
      >
        {steps.map(({ number, title, description, icon: Icon }, index) => (
          <article
            key={number}
            className="relative min-w-[calc(100vw-3.5rem)] max-w-[340px] snap-center overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-5 text-start shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-sm"
            role="listitem"
          >
            <div
              className="absolute -right-8 -top-10 size-28 rounded-full bg-accent/10 blur-2xl"
              aria-hidden="true"
            />
            <div className="relative mb-8 flex items-center justify-between">
              <span className="font-display text-sm font-bold tracking-[0.2em] text-accent">
                {labels.step} {number}
              </span>
              <span className="flex size-11 items-center justify-center rounded-2xl bg-accent text-primary shadow-[0_8px_24px_rgba(201,162,75,0.22)]">
                <Icon className="size-5" aria-hidden="true" />
              </span>
            </div>
            <h3 className="relative font-heading text-xl font-bold text-white">{title}</h3>
            <p className="relative mt-2 text-sm leading-relaxed text-white/60">{description}</p>

            {index < steps.length - 1 && (
              <ArrowRight
                className="absolute bottom-5 right-5 size-4 text-accent/50 motion-safe:animate-[journey-nudge_1.8s_ease-in-out_infinite]"
                aria-hidden="true"
              />
            )}
          </article>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2" aria-hidden="true">
        <span className="h-1.5 w-7 rounded-full bg-accent" />
        <span className="size-1.5 rounded-full bg-white/25" />
        <span className="size-1.5 rounded-full bg-white/25" />
        <span className="ml-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
          {labels.swipe}
        </span>
      </div>
    </div>
  )
}
