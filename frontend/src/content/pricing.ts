export type PricingTier = {
  id: 'starter' | 'growth' | 'premium'
  name: string
  priceUsd: number
  sessionsPerMonth: number
  minutesPerSession: number
  highlighted: boolean
  ctaLabel: string
  features: string[]
  notIncluded?: string[]
}

export const pricingTiers: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    priceUsd: 30,
    sessionsPerMonth: 8,
    minutesPerSession: 30,
    highlighted: false,
    ctaLabel: 'Book Free Trial',
    features: [
      '8 classes per month (30 min each)',
      'Certified Al-Azhar teacher',
      'Free first class trial',
      'Progress tracking',
      'WhatsApp teacher access',
    ],
    notIncluded: [
      'Priority teacher selection',
      'Monthly progress report',
      'Ijazah track',
      'Sibling discount',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    priceUsd: 50,
    sessionsPerMonth: 12,
    minutesPerSession: 45,
    highlighted: true,
    ctaLabel: 'Book Free Trial',
    features: [
      '12 classes per month (45 min each)',
      'Certified Al-Azhar teacher',
      'Free first class trial',
      'Progress tracking',
      'WhatsApp teacher access',
      'Priority teacher selection',
      'Monthly progress report',
    ],
    notIncluded: [
      'Ijazah track',
      'Sibling discount',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    priceUsd: 70,
    sessionsPerMonth: 20,
    minutesPerSession: 60,
    highlighted: false,
    ctaLabel: 'Book Free Trial',
    features: [
      '20 classes per month (60 min each)',
      'Certified Al-Azhar teacher',
      'Free first class trial',
      'Progress tracking',
      'WhatsApp teacher access',
      'Priority teacher selection',
      'Monthly progress report',
      'Ijazah track available',
      'Family discount (20% off siblings)',
    ],
  },
]

export type ComparisonRow = {
  feature: string
  starter: boolean | string
  growth: boolean | string
  premium: boolean | string
}

export const comparisonRows: ComparisonRow[] = [
  { feature: 'Classes per month',       starter: '8 × 30 min',  growth: '12 × 45 min', premium: '20 × 60 min' },
  { feature: 'Certified teacher',       starter: true,           growth: true,          premium: true },
  { feature: 'Free first class',        starter: true,           growth: true,          premium: true },
  { feature: 'Progress tracking',       starter: true,           growth: true,          premium: true },
  { feature: 'WhatsApp teacher access', starter: true,           growth: true,          premium: true },
  { feature: 'Priority teacher pick',   starter: false,          growth: true,          premium: true },
  { feature: 'Monthly progress report', starter: false,          growth: true,          premium: true },
  { feature: 'Ijazah track',            starter: false,          growth: false,         premium: true },
  { feature: 'Sibling discount (20%)',  starter: false,          growth: false,         premium: true },
]

export type PricingFaqItem = { q: string; a: string }

export const pricingFaqs: PricingFaqItem[] = [
  {
    q: 'Can I cancel or change my plan at any time?',
    a: 'Yes. There are no contracts or lock-in periods. You can upgrade, downgrade, or cancel at any point before your next billing cycle.',
  },
  {
    q: 'Is the first class really free?',
    a: 'Absolutely. Every student — on every plan — gets the first class completely free with no credit card required. We only start billing after you decide to continue.',
  },
  {
    q: 'Do you offer a sibling or family discount?',
    a: 'Yes. Premium plan subscribers get 20% off for each additional sibling enrolled. Reach out via WhatsApp or the contact form to set this up.',
  },
  {
    q: 'What happens if I miss a class?',
    a: 'We offer free rescheduling with 24 hours notice. Classes cancelled with less than 24 hours notice are counted against your monthly sessions.',
  },
  {
    q: 'Can I switch between male and female teachers?',
    a: 'Yes. Teacher preferences — including gender — can be set when booking your trial or changed at any time by messaging us on WhatsApp.',
  },
  {
    q: 'Which payment methods do you accept?',
    a: 'We accept all major credit and debit cards (Visa, Mastercard, Amex) as well as PayPal. All payments are in USD and processed securely.',
  },
]

export const pricingPageContent = {
  hero: {
    eyebrow: 'Simple, Transparent Pricing',
    heading: 'Invest in Your Quran Journey',
    subheading: 'No hidden fees. No contracts. Cancel anytime. Your first class is always free.',
  },
  familyDiscount: {
    heading: '20% Sibling Discount on Premium',
    body: "Enroll two or more siblings on the Premium plan and every additional student is 20% off. Contact us to activate the discount after your free trial.",
  },
  cta: {
    heading: 'Not Sure Which Plan to Choose?',
    subheading: "Book a free trial class on any plan. We'll recommend the right fit based on your level and schedule.",
    ctaPrimary: 'Book Free Trial',
    ctaSecondary: 'Chat on WhatsApp',
  },
}
