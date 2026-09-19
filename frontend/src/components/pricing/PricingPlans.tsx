'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Sprout,
  BookOpen,
  GraduationCap,
  Star,
  Crown,
  Trophy,
  Gem,
  Check,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react'
import {
  durations,
  currencies,
  BASE_DURATION,
  DEFAULT_DURATION,
  getPricingPackages,
  lessonRate,
  packagePrice,
  type DurationId,
  type CurrencyCode,
  type PricingPackage,
  type PackageIcon,
} from '@/content/pricing'
import { useT } from '@/i18n/MarketingI18nProvider'
import { localeTag, type Locale } from '@/i18n/config'
import type { TranslateFn } from '@/i18n/translate'

const ICONS: Record<PackageIcon, LucideIcon> = {
  sprout: Sprout,
  book: BookOpen,
  graduation: GraduationCap,
  star: Star,
  crown: Crown,
  trophy: Trophy,
  gem: Gem,
}

function formatMoney(amount: number, currency: CurrencyCode, locale: Locale) {
  return new Intl.NumberFormat(localeTag[locale], {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

type Segment<T extends string> = { id: T; label: string }

function SegmentedControl<T extends string>({
  label,
  segments,
  value,
  onChange,
}: {
  label: string
  segments: Segment<T>[]
  value: T
  onChange: (id: T) => void
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
        {label}
      </span>
      <div
        role="tablist"
        aria-label={label}
        className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur"
      >
        {segments.map((seg) => {
          const active = seg.id === value
          return (
            <button
              key={seg.id}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => onChange(seg.id)}
              className={[
                'rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 outline-none',
                'focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2',
                active
                  ? 'bg-secondary text-white shadow-[0_4px_16px_rgba(14,124,90,0.45)]'
                  : 'text-white/55 hover:text-white',
              ].join(' ')}
            >
              {seg.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function PackageCard({
  pkg,
  entry,
  duration,
  currency,
  ctaHref,
  locale,
  t,
}: {
  pkg: PricingPackage
  /** Smallest package — the baseline every saving is measured against. */
  entry: PricingPackage
  duration: DurationId
  currency: CurrencyCode
  ctaHref: string
  locale: Locale
  t: TranslateFn
}) {
  const Icon = ICONS[pkg.icon]

  // Every figure on the card follows the selected lesson length: the stored
  // price is the 60-minute one, the rest is derived from it.
  const price = packagePrice(pkg, currency, duration)
  const rate = lessonRate(pkg, currency, duration)
  const minutes = durations.find((d) => d.id === duration)?.minutes ?? 60

  // The saving is measured against the entry package's per-lesson rate, which
  // is what "the more you book, the less you pay" actually means here.
  const entryRate = lessonRate(entry, currency, duration)
  const savings = Math.round((entryRate - rate) * pkg.lessons * 100) / 100
  const hasDiscount = savings > 0
  const featured = pkg.featured

  return (
    <div
      className={[
        'group relative flex w-full flex-col rounded-3xl p-6 sm:p-7 transition-all duration-300',
        featured
          ? 'bg-gradient-to-b from-accent/[0.14] to-white/[0.02] border border-accent/50 shadow-[0_24px_70px_-24px_rgba(201,162,75,0.55)] lg:-translate-y-3'
          : 'bg-white/[0.03] border border-white/10 hover:border-white/25 hover:bg-white/[0.05]',
      ].join(' ')}
    >
      {featured && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-primary shadow-lg">
            <Star className="size-3.5 fill-primary" aria-hidden="true" />
            {pkg.badge}
          </span>
        </div>
      )}

      {/* Header: icon + badge */}
      <div className="mb-4 flex items-start justify-between">
        <div
          className={[
            'flex size-11 items-center justify-center rounded-xl',
            featured ? 'bg-accent/20 text-accent' : 'bg-secondary/15 text-secondary',
          ].join(' ')}
        >
          <Icon className="size-5" aria-hidden="true" />
        </div>
        {!featured && (
          <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/45">
            {pkg.badge}
          </span>
        )}
      </div>

      <h3 className="font-heading text-xl font-semibold text-white">{pkg.name}</h3>
      <p className="mt-1.5 min-h-[2.5rem] text-sm leading-relaxed text-white/50">
        {pkg.tagline}
      </p>

      {/* Lesson count strip */}
      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white/[0.04] px-4 py-3 ring-1 ring-inset ring-white/5">
        <span
          className={[
            'font-display text-4xl font-semibold leading-none',
            featured ? 'text-accent' : 'text-white',
          ].join(' ')}
        >
          {pkg.lessons}
        </span>
        <div className="text-xs leading-tight text-white/55">
          <div className="font-semibold uppercase tracking-wide text-white/75">{t('pricingPlans.lessons')}</div>
          <div>{t('pricingPlans.minEach', { m: minutes })}</div>
        </div>
      </div>

      {/* Price */}
      <div className="mt-5">
        <div className="flex items-end gap-2">
          <span className="font-display text-4xl font-semibold text-white">
            {formatMoney(price, currency, locale)}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="text-white/55">
            {formatMoney(rate, currency, locale)}{' '}
            <span className="text-white/40">{t('pricingPlans.perLesson')}</span>
          </span>
          {hasDiscount && (
            <span className="inline-flex items-center rounded-full bg-secondary/20 px-2 py-0.5 text-xs font-semibold text-emerald-300 ring-1 ring-inset ring-secondary/30">
              {t('pricingPlans.save', { amount: formatMoney(savings, currency, locale) })}
            </span>
          )}
        </div>
      </div>

      {/* Features */}
      <ul className="mt-6 mb-7 flex-1 space-y-2.5 text-sm">
        {[
          t('pricingPlans.lessonsFeature', { n: pkg.lessons }),
          t('pricingPlans.minutesFeature', { m: minutes }),
          t('pricingPlans.certifiedTeacher'),
          t('pricingPlans.personalisedFollowUp'),
        ].map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-white/70">
            <Check
              className={[
                'mt-0.5 size-4 shrink-0',
                featured ? 'text-accent' : 'text-secondary',
              ].join(' ')}
              aria-hidden="true"
            />
            {f}
          </li>
        ))}
      </ul>

      <Link
        href={ctaHref}
        className={[
          'inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-200',
          'focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2',
          featured
            ? 'bg-accent text-primary hover:bg-[#d8b258] shadow-[0_8px_24px_-6px_rgba(201,162,75,0.6)]'
            : 'border border-white/15 text-white hover:border-secondary hover:bg-secondary/10 hover:text-white',
        ].join(' ')}
      >
        {pkg.ctaLabel}
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  )
}

export function PricingPlans({ ctaHref = '/contact' }: { ctaHref?: string }) {
  const { locale, t } = useT()
  // Opens on the hour — the length the academy's quoted prices are set at,
  // so the headline figure matches the price list.
  const [duration, setDuration] = useState<DurationId>(DEFAULT_DURATION)
  const [currency, setCurrency] = useState<CurrencyCode>('USD')

  const pricingPackages = useMemo(() => getPricingPackages(locale), [locale])
  const durationSegments = useMemo(
    () => durations.map((d) => ({ id: d.id, label: d.label })),
    [],
  )
  const currencySegments = useMemo(
    () => currencies.map((c) => ({ id: c.code, label: c.label })),
    [],
  )

  return (
    <div>
      {/* Controls */}
      <div className="mb-12 flex flex-col items-center justify-center gap-8 sm:flex-row sm:gap-14">
        <SegmentedControl
          label={t('pricingPlans.lessonDuration')}
          segments={durationSegments}
          value={duration}
          onChange={setDuration}
        />
        <SegmentedControl
          label={t('pricingPlans.currency')}
          segments={currencySegments}
          value={currency}
          onChange={setCurrency}
        />
      </div>

      {/* Cards — wrapped rather than gridded so an odd last row stays centred */}
      <div className="flex flex-wrap justify-center gap-5">
        {pricingPackages.map((pkg) => (
          <div
            key={pkg.id}
            className="flex w-full sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]"
          >
            <PackageCard
              pkg={pkg}
              entry={pricingPackages[0]}
              duration={duration}
              currency={currency}
              ctaHref={ctaHref}
              locale={locale}
              t={t}
            />
          </div>
        ))}
      </div>

      <p className="mt-10 text-center text-sm text-white/50">
        Every package includes a{' '}
        <strong className="font-semibold text-accent">free first lesson</strong>. No card
        required.
      </p>
    </div>
  )
}
