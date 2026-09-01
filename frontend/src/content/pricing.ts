/* ============================================================
   Pricing content — lesson-package model
   Packages are sold by the lesson at a fixed total price, so the
   figure on the card is the figure the student pays. The price
   per lesson falls with every step up the ladder, which is the
   promise the page makes.

   Each package stores what it costs at the 60-minute lesson length,
   plus any shorter length the academy quotes a price for directly
   (`quotedPrices` — today that is every 30-minute price). A length
   with no quote of its own is derived from the 60-minute figure
   (see `durationPriceFactor`).
   ============================================================ */

import type { Locale } from '@/i18n/config'

export type DurationId = '30' | '45' | '60'
export type CurrencyCode = 'USD' | 'EUR'

export type Duration = {
  id: DurationId
  label: string
  minutes: number
}

export const durations: Duration[] = [
  { id: '30', label: '30 min', minutes: 30 },
  { id: '45', label: '45 min', minutes: 45 },
  { id: '60', label: '60 min', minutes: 60 },
]

export type Currency = {
  code: CurrencyCode
  symbol: string
  label: string
}

export const currencies: Currency[] = [
  { code: 'USD', symbol: '$', label: 'USD' },
  { code: 'EUR', symbol: '€', label: 'EUR' },
]

/** Icon keys map to lucide icons in the PricingPlans component. */
export type PackageIcon =
  | 'sprout'
  | 'book'
  | 'graduation'
  | 'star'
  | 'crown'
  | 'trophy'
  | 'gem'

export type PricingPackage = {
  id: string
  name: string
  tagline: string
  /** short pill shown top-right of the card */
  badge: string
  icon: PackageIcon
  /** One-to-one lessons included. */
  lessons: number
  /**
   * Fixed total price at the 60-minute lesson length, by currency.
   * Shorter lessons are derived or quoted — read it through `packagePrice`,
   * never directly, or the duration selector silently stops mattering.
   */
  price: Record<CurrencyCode, number>
  /**
   * Lesson lengths the academy prices itself rather than leaving to the
   * derivation. A length listed here wins over `durationPriceFactor`;
   * anything absent is still derived from `price`.
   */
  quotedPrices?: Partial<Record<DurationId, Record<CurrencyCode, number>>>
  featured?: boolean
  ctaLabel: string
}

/** The lesson length every stored `price` is quoted at. */
export const BASE_DURATION: DurationId = '60'

/**
 * What a package costs at each lesson length, as a share of its 60-minute
 * price — the fallback for any package that does not quote that length in
 * `quotedPrices`.
 *
 * The 45-minute share is above pro-rata: three quarters of an hour still
 * costs the teacher the same scheduling, preparation and follow-up, so it is
 * priced at 80% rather than 75%. The 30-minute share tracks the academy's own
 * quoted half-hour prices, which are close to half the hour; every package
 * currently quotes its 30-minute price directly, so this figure only applies
 * to a package added without one.
 */
export const durationPriceFactor: Record<DurationId, number> = {
  '60': 1,
  '45': 0.8,
  '30': 0.5,
}

/** Round to whole cents: a price is money, never a floating-point tail. */
function toMoney(value: number): number {
  return Math.round(value * 100) / 100
}

/** Total price of a package at a given lesson length. */
export function packagePrice(
  pkg: PricingPackage,
  currency: CurrencyCode,
  duration: DurationId = BASE_DURATION,
): number {
  // A length the academy quotes itself is used as quoted; only the rest is
  // scaled off the 60-minute price.
  const quoted = pkg.quotedPrices?.[duration]
  if (quoted) return toMoney(quoted[currency])
  return toMoney(pkg.price[currency] * durationPriceFactor[duration])
}

/** What one lesson costs in a given package — the value story on every card. */
export function lessonRate(
  pkg: PricingPackage,
  currency: CurrencyCode,
  duration: DurationId = BASE_DURATION,
): number {
  return packagePrice(pkg, currency, duration) / pkg.lessons
}

export const pricingPackages: PricingPackage[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'A first taste of our method, with no long commitment.',
    badge: 'Taster',
    icon: 'sprout',
    lessons: 4,
    price: { EUR: 39.99, USD: 43.99 },
    quotedPrices: { '30': { EUR: 19.99, USD: 21.99 } },
    ctaLabel: 'Choose this package',
  },
  {
    id: 'discovery',
    name: 'Discovery',
    tagline: 'Perfect for taking your first steps and discovering our method.',
    badge: 'Popular start',
    icon: 'book',
    lessons: 8,
    price: { EUR: 76.99, USD: 83.99 },
    quotedPrices: { '30': { EUR: 39.99, USD: 43.99 } },
    ctaLabel: 'Choose this package',
  },
  {
    id: 'essential',
    name: 'Essential',
    tagline: 'Enough lessons to build a routine and see real progress.',
    badge: 'Steady pace',
    icon: 'graduation',
    lessons: 12,
    price: { EUR: 109.99, USD: 118.99 },
    quotedPrices: { '30': { EUR: 59.99, USD: 65.99 } },
    ctaLabel: 'Choose this package',
  },
  {
    id: 'silver',
    name: 'Silver',
    tagline: 'Our balanced formula for lasting, consistent results.',
    badge: 'Balanced',
    icon: 'star',
    lessons: 16,
    price: { EUR: 145.99, USD: 157.99 },
    quotedPrices: { '30': { EUR: 79.99, USD: 87.99 } },
    ctaLabel: 'Choose this package',
  },
  {
    id: 'gold',
    name: 'Gold',
    tagline: 'An advanced commitment for rapid mastery.',
    badge: 'Most chosen',
    icon: 'crown',
    lessons: 24,
    price: { EUR: 215.99, USD: 232.99 },
    quotedPrices: { '30': { EUR: 110.99, USD: 119.99 } },
    featured: true,
    ctaLabel: 'Choose this package',
  },
  {
    id: 'platinum',
    name: 'Platinum',
    tagline: 'A full term of study, planned and followed end to end.',
    badge: 'Fast track',
    icon: 'trophy',
    lessons: 48,
    price: { EUR: 429.99, USD: 464.99 },
    quotedPrices: { '30': { EUR: 219.99, USD: 237.99 } },
    ctaLabel: 'Choose this package',
  },
  {
    id: 'diamond',
    name: 'Diamond',
    tagline: 'The ultimate package for complete immersion.',
    badge: 'Immersion',
    icon: 'gem',
    lessons: 100,
    price: { EUR: 849.99, USD: 917.99 },
    quotedPrices: { '30': { EUR: 449.99, USD: 485.99 } },
    ctaLabel: 'Choose this package',
  },
]

/**
 * Guards the page's core claim — every larger package is cheaper per lesson.
 * Throws in development if an edit breaks the ladder, rather than letting a
 * card go live promising a saving it does not give.
 *
 * Rates are compared to the cent, the way the card prints them: the quoted
 * 30-minute prices hold a flat €5.00 a lesson from 4 lessons through 16, and
 * sub-cent drift inside a flat rate is not a broken ladder. Costing a visible
 * cent more per lesson than the package below is, at any lesson length.
 */
function assertDescendingRate(packages: PricingPackage[]): void {
  if (process.env.NODE_ENV === 'production') return

  for (const currency of ['EUR', 'USD'] as CurrencyCode[]) {
    // Every lesson length is checked: each is quoted or scaled on its own and
    // rounded afterwards, so a ladder that holds at 60 minutes could in
    // principle collapse at 30.
    for (const duration of Object.keys(durationPriceFactor) as DurationId[]) {
      packages.forEach((pkg, i) => {
        if (i === 0) return
        const previous = packages[i - 1]
        const rate = toMoney(lessonRate(pkg, currency, duration))
        const previousRate = toMoney(lessonRate(previous, currency, duration))
        if (rate > previousRate) {
          throw new Error(
            `Pricing ladder broken: ${pkg.name} costs more per lesson than ${previous.name} in ${currency} at ${duration} min.`,
          )
        }
      })
    }
  }
}

assertDescendingRate(pricingPackages)

/** Feature icons map to lucide icons in the page component. */
export type IncludedIcon =
  | 'gift'
  | 'graduation'
  | 'certificate'
  | 'clock'
  | 'book'
  | 'shield'

export type IncludedFeature = {
  icon: IncludedIcon
  title: string
  desc: string
}

export const includedFeatures: IncludedFeature[] = [
  {
    icon: 'gift',
    title: 'Free trial lesson',
    desc: 'Try our method with no obligation.',
  },
  {
    icon: 'graduation',
    title: 'Al-Azhar certified teachers',
    desc: 'Learn with graduates — for men, women and children.',
  },
  {
    icon: 'certificate',
    title: 'Certificate of completion',
    desc: 'Awarded at the end of your programme.',
  },
  {
    icon: 'clock',
    title: 'Flexible scheduling',
    desc: 'Classes arranged around your timetable.',
  },
  {
    icon: 'book',
    title: 'Materials of your choice',
    desc: 'Quran, Tajwid, Arabic & Islamic studies.',
  },
  {
    icon: 'shield',
    title: 'Cancel anytime',
    desc: 'No contracts, no lock-in, no hidden fees.',
  },
]

export type PricingFaqItem = { q: string; a: string }

export const pricingFaqs: PricingFaqItem[] = [
  {
    q: 'How does package pricing work?',
    a: 'You buy a block of lessons at a fixed total price. The more lessons you book at once, the lower the price per lesson — the rate is shown on every card, and the price you see is the price you pay.',
  },
  {
    q: 'Is the first lesson really free?',
    a: 'Yes. Every student gets their first lesson completely free, with no card required. We only take payment once you decide to continue.',
  },
  {
    q: 'Do my lessons expire?',
    a: 'Your lessons stay valid as long as you keep booking regularly. If life gets in the way, message us on WhatsApp and we will extend your package.',
  },
  {
    q: 'What happens if I miss a lesson?',
    a: 'Free rescheduling with 24 hours notice. Lessons cancelled with less than 24 hours notice are counted against your package.',
  },
  {
    q: 'Can I choose a male or female teacher?',
    a: 'Absolutely. Teacher preferences — including gender — can be set when you book your trial and changed at any time on WhatsApp.',
  },
  {
    q: 'Which currencies and payment methods do you accept?',
    a: 'You can view prices in USD or EUR, and we accept all major credit and debit cards as well as PayPal. Payments are processed securely.',
  },
]

export const pricingPageContent = {
  hero: {
    eyebrow: 'First lesson offered',
    heading: 'Clear packages for stress-free learning',
    highlight: 'stress-free learning',
    subheading:
      'The more lessons you book, the lower the price per lesson. Choose the lesson length that suits you and start with a free, no-obligation trial.',
  },
  included: {
    eyebrow: 'The same guarantees for everyone',
    heading: 'Included in every package',
    highlight: 'every package',
    subheading: 'The same guarantees for everyone, whichever plan you choose.',
  },
  guarantee: {
    badge: 'No commitment',
    heading: 'Not sure which package is right for you?',
    body: 'Our team will advise you free of charge to pick the formula that suits your level and your goals — and we will offer you your first lesson free.',
    ctaPrimary: 'Book my free trial',
    ctaSecondary: 'Chat on WhatsApp',
  },
  cta: {
    heading: 'Ready to begin your Quran journey?',
    subheading:
      "Book a free trial on any package. We'll recommend the right fit based on your level and schedule.",
    ctaPrimary: 'Book Free Trial',
    ctaSecondary: 'Chat on WhatsApp',
  },
}

/* ============================================================
   French mirrors — used when the active locale is 'fr'.
   The English exports above remain the untouched default.
   ============================================================ */

export const pricingPackagesFr: PricingPackage[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Un premier aperçu de notre méthode, sans engagement.',
    badge: 'Découverte',
    icon: 'sprout',
    lessons: 4,
    price: { EUR: 39.99, USD: 43.99 },
    quotedPrices: { '30': { EUR: 19.99, USD: 21.99 } },
    ctaLabel: 'Choisir ce forfait',
  },
  {
    id: 'discovery',
    name: 'Discovery',
    tagline: 'Parfait pour faire vos premiers pas et découvrir notre méthode.',
    badge: 'Premier pas',
    icon: 'book',
    lessons: 8,
    price: { EUR: 76.99, USD: 83.99 },
    quotedPrices: { '30': { EUR: 39.99, USD: 43.99 } },
    ctaLabel: 'Choisir ce forfait',
  },
  {
    id: 'essential',
    name: 'Essential',
    tagline: 'De quoi installer une vraie routine et voir de vrais progrès.',
    badge: 'Rythme régulier',
    icon: 'graduation',
    lessons: 12,
    price: { EUR: 109.99, USD: 118.99 },
    quotedPrices: { '30': { EUR: 59.99, USD: 65.99 } },
    ctaLabel: 'Choisir ce forfait',
  },
  {
    id: 'silver',
    name: 'Silver',
    tagline: 'Notre formule équilibrée pour des résultats durables et constants.',
    badge: 'Équilibré',
    icon: 'star',
    lessons: 16,
    price: { EUR: 145.99, USD: 157.99 },
    quotedPrices: { '30': { EUR: 79.99, USD: 87.99 } },
    ctaLabel: 'Choisir ce forfait',
  },
  {
    id: 'gold',
    name: 'Gold',
    tagline: 'Un engagement avancé pour une maîtrise rapide.',
    badge: 'Le plus choisi',
    icon: 'crown',
    lessons: 24,
    price: { EUR: 215.99, USD: 232.99 },
    quotedPrices: { '30': { EUR: 110.99, USD: 119.99 } },
    featured: true,
    ctaLabel: 'Choisir ce forfait',
  },
  {
    id: 'platinum',
    name: 'Platinum',
    tagline: 'Un trimestre complet de cours, planifié et suivi de bout en bout.',
    badge: 'Progression rapide',
    icon: 'trophy',
    lessons: 48,
    price: { EUR: 429.99, USD: 464.99 },
    quotedPrices: { '30': { EUR: 219.99, USD: 237.99 } },
    ctaLabel: 'Choisir ce forfait',
  },
  {
    id: 'diamond',
    name: 'Diamond',
    tagline: 'Le forfait ultime pour une immersion complète.',
    badge: 'Immersion',
    icon: 'gem',
    lessons: 100,
    price: { EUR: 849.99, USD: 917.99 },
    quotedPrices: { '30': { EUR: 449.99, USD: 485.99 } },
    ctaLabel: 'Choisir ce forfait',
  },
]

assertDescendingRate(pricingPackagesFr)

export function getPricingPackages(locale: Locale): PricingPackage[] {
  return locale === 'fr' ? pricingPackagesFr : pricingPackages
}

export const includedFeaturesFr: IncludedFeature[] = [
  {
    icon: 'gift',
    title: 'Cours d’essai gratuit',
    desc: 'Essayez notre méthode sans aucun engagement.',
  },
  {
    icon: 'graduation',
    title: 'Enseignants certifiés Al-Azhar',
    desc: 'Apprenez avec des diplômés — pour hommes, femmes et enfants.',
  },
  {
    icon: 'certificate',
    title: 'Certificat de fin de formation',
    desc: 'Délivré à l’issue de votre programme.',
  },
  {
    icon: 'clock',
    title: 'Horaires flexibles',
    desc: 'Des cours organisés selon votre emploi du temps.',
  },
  {
    icon: 'book',
    title: 'Supports de votre choix',
    desc: 'Coran, Tajwid, arabe et sciences islamiques.',
  },
  {
    icon: 'shield',
    title: 'Annulation à tout moment',
    desc: 'Sans contrat, sans engagement et sans frais cachés.',
  },
]

export function getIncludedFeatures(locale: Locale): IncludedFeature[] {
  return locale === 'fr' ? includedFeaturesFr : includedFeatures
}

export const pricingFaqsFr: PricingFaqItem[] = [
  {
    q: 'Comment fonctionne la tarification par forfait ?',
    a: 'Vous achetez un bloc de cours à un prix total fixe. Plus vous réservez de cours à la fois, plus le prix par cours est bas — le tarif est affiché sur chaque carte, et le prix affiché est le prix payé.',
  },
  {
    q: 'Le premier cours est-il vraiment gratuit ?',
    a: 'Oui. Chaque élève bénéficie de son premier cours entièrement gratuit, sans carte bancaire requise. Nous ne prélevons de paiement qu’une fois que vous décidez de continuer.',
  },
  {
    q: 'Mes cours expirent-ils ?',
    a: 'Vos cours restent valables tant que vous continuez à réserver régulièrement. Si un imprévu survient, écrivez-nous sur WhatsApp et nous prolongerons votre forfait.',
  },
  {
    q: 'Que se passe-t-il si je manque un cours ?',
    a: 'Report gratuit avec un préavis de 24 heures. Les cours annulés avec moins de 24 heures de préavis sont décomptés de votre forfait.',
  },
  {
    q: 'Puis-je choisir un enseignant homme ou femme ?',
    a: 'Tout à fait. Les préférences d’enseignant — y compris le genre — peuvent être définies lors de la réservation de votre essai et modifiées à tout moment sur WhatsApp.',
  },
  {
    q: 'Quelles devises et quels moyens de paiement acceptez-vous ?',
    a: 'Vous pouvez consulter les prix en USD ou en EUR, et nous acceptons toutes les principales cartes de crédit et de débit ainsi que PayPal. Les paiements sont traités en toute sécurité.',
  },
]

export function getPricingFaqs(locale: Locale): PricingFaqItem[] {
  return locale === 'fr' ? pricingFaqsFr : pricingFaqs
}

export const pricingPageContentFr: typeof pricingPageContent = {
  hero: {
    eyebrow: 'Premier cours offert',
    heading: 'Des forfaits clairs pour un apprentissage serein',
    highlight: 'un apprentissage serein',
    subheading:
      'Plus vous réservez de cours, plus le prix par cours est bas. Choisissez la durée de cours qui vous convient et commencez par un essai gratuit et sans engagement.',
  },
  included: {
    eyebrow: 'Les mêmes garanties pour tous',
    heading: 'Inclus dans chaque forfait',
    highlight: 'chaque forfait',
    subheading: 'Les mêmes garanties pour tous, quel que soit le forfait que vous choisissez.',
  },
  guarantee: {
    badge: 'Sans engagement',
    heading: 'Vous ne savez pas quel forfait vous convient ?',
    body: 'Notre équipe vous conseille gratuitement pour choisir la formule adaptée à votre niveau et à vos objectifs — et nous vous offrons votre premier cours gratuitement.',
    ctaPrimary: 'Réserver mon essai gratuit',
    ctaSecondary: 'Discuter sur WhatsApp',
  },
  cta: {
    heading: 'Prêt à commencer votre parcours avec le Coran ?',
    subheading:
      'Réservez un essai gratuit sur n’importe quel forfait. Nous vous recommanderons la formule idéale selon votre niveau et votre emploi du temps.',
    ctaPrimary: 'Réserver un essai gratuit',
    ctaSecondary: 'Discuter sur WhatsApp',
  },
}

export function getPricingPageContent(locale: Locale) {
  return locale === 'fr' ? pricingPageContentFr : pricingPageContent
}
