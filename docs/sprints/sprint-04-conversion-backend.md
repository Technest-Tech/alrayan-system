# Sprint 4 — Conversion Pages + Backend

**Duration:** 2 weeks
**Status:** Detailed, ready to implement.
**Sprint goal:** The three "money pages" (pricing, FAQ, contact) ship with real copy and fully working forms. Submitting a trial booking saves a row in the database, fires two branded emails (admin + visitor), and hands the visitor a reference number + WhatsApp deep link — end to end, on staging.

---

## Definition of Done

- [ ] `/pricing`, `/faq`, `/contact` all render on staging with real copy
- [ ] Submitting the trial booking form from staging:
  - Saves a `trial_bookings` row in the DB
  - Sends `TrialBookingAdminNotification` to `info@alrayan-academy.com`
  - Sends `TrialBookingConfirmation` to the visitor's email
  - Returns `{ reference, message }` JSON to the frontend
  - UI displays the reference number + a WhatsApp deep link
- [ ] `ContactMessage` flow works identically (two emails, reference, success UI)
- [ ] Cloudflare Turnstile token is verified server-side on both endpoints — missing/invalid token returns 422
- [ ] Rate limiter rejects the 6th request from the same IP within 60 seconds with HTTP 429
- [ ] All Laravel feature tests pass in CI (`php artisan test`)
- [ ] `pnpm typecheck` and `pnpm lint` pass clean
- [ ] `pnpm build` completes with `/pricing`, `/faq`, `/contact` listed
- [ ] Lighthouse mobile on all three pages: Performance ≥ 90, Accessibility ≥ 95, SEO = 100
- [ ] Owner submits a real trial booking on staging and receives the confirmation email
- [ ] `FAQPage` schema present on `/faq` (Google Rich Results Test passes)

---

## Story Breakdown

### S4-01 — Content files *(0.5 day)*

Create two new content files before writing any page component. All copy lives here; pages import from here.

---

**File:** `frontend/src/content/pricing.ts`

```ts
export type PricingTier = {
  id: 'starter' | 'growth' | 'premium'
  name: string
  priceUsd: number          // monthly price per student
  sessionsPerMonth: number
  minutesPerSession: number
  highlighted: boolean      // true = "Most Popular" ribbon
  ctaLabel: string
  features: string[]        // shown as checkmark list on card
  notIncluded?: string[]    // shown as ✗ list on card (Starter only)
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
  { feature: 'Classes per month',      starter: '8 × 30 min',  growth: '12 × 45 min', premium: '20 × 60 min' },
  { feature: 'Certified teacher',      starter: true,          growth: true,          premium: true },
  { feature: 'Free first class',       starter: true,          growth: true,          premium: true },
  { feature: 'Progress tracking',      starter: true,          growth: true,          premium: true },
  { feature: 'WhatsApp access',        starter: true,          growth: true,          premium: true },
  { feature: 'Priority teacher pick',  starter: false,         growth: true,          premium: true },
  { feature: 'Monthly progress report',starter: false,         growth: true,          premium: true },
  { feature: 'Ijazah track',           starter: false,         growth: false,         premium: true },
  { feature: 'Sibling discount (20%)', starter: false,         growth: false,         premium: true },
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
    body: 'Enroll two or more siblings on the Premium plan and every additional student is 20% off. Contact us to activate the discount after your free trial.',
  },
  cta: {
    heading: 'Not Sure Which Plan to Choose?',
    subheading: 'Book a free trial class on any plan. We will recommend the right fit based on your child\'s level and schedule.',
    ctaPrimary: 'Book Free Trial',
    ctaSecondary: 'Chat on WhatsApp',
  },
}
```

---

**File:** `frontend/src/content/faq.ts`

```ts
export type FaqItem = {
  id: string
  q: string
  a: string
  category: FaqCategory
}

export type FaqCategory =
  | 'General'
  | 'Classes'
  | 'Teachers'
  | 'Pricing'
  | 'Technical'

export const faqCategories: FaqCategory[] = [
  'General',
  'Classes',
  'Teachers',
  'Pricing',
  'Technical',
]

export const faqs: FaqItem[] = [
  // General
  {
    id: 'g1',
    category: 'General',
    q: 'What is Alrayan Academy?',
    a: 'Alrayan Academy is an online Quran and Arabic education academy offering 1-on-1 live classes with certified teachers from Al-Azhar University and other leading Islamic institutions. We serve students in 50+ countries across all age groups and levels.',
  },
  {
    id: 'g2',
    category: 'General',
    q: 'What courses do you offer?',
    a: 'We offer Noorani Qaida, Quran recitation for kids and adults, Tajweed, Hifz (memorization), Arabic for non-Arabic speakers, Tafseer, Islamic Studies, Ijazah program, and Ten Qiraat. See our Courses page for full details.',
  },
  {
    id: 'g3',
    category: 'General',
    q: 'Which countries do you serve?',
    a: 'We serve students in over 50 countries including the USA, UK, Canada, Australia, and across Europe, Asia, and Africa. Classes run 7 days a week to cover all major timezones.',
  },
  {
    id: 'g4',
    category: 'General',
    q: 'Do you offer classes for children?',
    a: 'Yes. We have dedicated programs for children as young as 5. Our teachers are trained to engage young learners, and we offer female teachers for families who prefer them.',
  },
  // Classes
  {
    id: 'c1',
    category: 'Classes',
    q: 'How does a trial class work?',
    a: 'Fill out the contact form and we will match you with a suitable teacher based on your level, schedule, and preferences. The first class is completely free — no credit card required. After the class, you decide whether to continue.',
  },
  {
    id: 'c2',
    category: 'Classes',
    q: 'What platform are classes held on?',
    a: 'Classes are held via Zoom, Google Meet, or Skype — whichever you prefer. We send you the meeting link before each session.',
  },
  {
    id: 'c3',
    category: 'Classes',
    q: 'Can I choose my class schedule?',
    a: 'Yes. After matching with a teacher, you agree on a recurring time slot that fits both schedules. Classes run 7 days a week, including evenings and weekends.',
  },
  {
    id: 'c4',
    category: 'Classes',
    q: 'What if I need to reschedule?',
    a: 'We offer free rescheduling with 24 hours notice. Simply message your teacher or our admin team on WhatsApp and we will arrange an alternative slot.',
  },
  {
    id: 'c5',
    category: 'Classes',
    q: 'Are classes recorded?',
    a: 'Sessions are not recorded by default to protect student privacy. If you would like recordings for review, please discuss this with your teacher and our admin team.',
  },
  // Teachers
  {
    id: 't1',
    category: 'Teachers',
    q: 'Are your teachers qualified?',
    a: 'All teachers hold an authenticated Ijazah — a certified chain of Quran transmission traceable back to the Prophet ﷺ — and are graduates of Al-Azhar University or equivalent accredited Islamic institutions. Less than 10% of applicants pass our vetting process.',
  },
  {
    id: 't2',
    category: 'Teachers',
    q: 'Do you have female teachers?',
    a: 'Yes. We have several highly qualified female teachers available for female students or families who prefer a female teacher for their children. Indicate your preference when booking your trial.',
  },
  {
    id: 't3',
    category: 'Teachers',
    q: 'Can I request a specific teacher?',
    a: 'Growth and Premium plan subscribers can request priority teacher selection. Starter plan students are matched based on level and availability. You can always request a change if the initial match is not the right fit.',
  },
  {
    id: 't4',
    category: 'Teachers',
    q: 'What if my child doesn\'t connect with their teacher?',
    a: 'Teacher compatibility matters. If your child is not clicking with their current teacher, message us on WhatsApp and we will arrange a free switch to another teacher — no questions asked.',
  },
  // Pricing
  {
    id: 'p1',
    category: 'Pricing',
    q: 'How much do classes cost?',
    a: 'Plans start at $30/month for 8 classes. See our Pricing page for the full breakdown of Starter, Growth, and Premium plans.',
  },
  {
    id: 'p2',
    category: 'Pricing',
    q: 'Is there a contract or lock-in period?',
    a: 'No. All plans are month-to-month. You can upgrade, downgrade, or cancel at any time before your next billing date.',
  },
  {
    id: 'p3',
    category: 'Pricing',
    q: 'Do you offer family discounts?',
    a: 'Yes. Premium plan subscribers receive 20% off for each additional sibling enrolled. Contact us after your free trial to activate the sibling discount.',
  },
  {
    id: 'p4',
    category: 'Pricing',
    q: 'What payment methods do you accept?',
    a: 'We accept Visa, Mastercard, Amex, and PayPal. All transactions are in USD and processed securely via Stripe.',
  },
  // Technical
  {
    id: 'tech1',
    category: 'Technical',
    q: 'What do I need to join a class?',
    a: 'A computer, tablet, or smartphone with a working camera, microphone, and a stable internet connection. Zoom, Google Meet, or Skype installed (free). No other software is required.',
  },
  {
    id: 'tech2',
    category: 'Technical',
    q: 'What internet speed do I need?',
    a: 'A minimum of 2 Mbps upload and download is sufficient for video classes. We recommend 5 Mbps+ for the best experience.',
  },
  {
    id: 'tech3',
    category: 'Technical',
    q: 'Can I join from a mobile phone or tablet?',
    a: 'Yes. Zoom, Meet, and Skype all have iOS and Android apps. Many students join from tablets, which provide a large enough screen for reading Quran text.',
  },
  {
    id: 'tech4',
    category: 'Technical',
    q: 'What if I have a technical issue during a class?',
    a: 'Contact your teacher or our WhatsApp support line. If a class is disrupted by a technical issue on our side, the session is not counted against your monthly allocation.',
  },
]

export const faqPageContent = {
  hero: {
    eyebrow: 'Frequently Asked Questions',
    heading: 'Everything You Need to Know',
    subheading: 'Can\'t find your answer? Chat with us on WhatsApp — we reply within minutes.',
  },
  cta: {
    heading: 'Still Have Questions?',
    subheading: 'Our team is available on WhatsApp 7 days a week. We typically reply within 10 minutes.',
    ctaPrimary: 'Book Free Trial',
    ctaSecondary: 'Chat on WhatsApp',
  },
}
```

**Acceptance:**
- [ ] All five FAQ categories are represented with at least 3 items each
- [ ] TypeScript types exported and used in page components
- [ ] Pricing tiers match the sprint overview pricing ($30 / $50 / $70)

---

### S4-02 — `/pricing` page *(1 day)*

**File:** `frontend/src/app/(marketing)/pricing/page.tsx`

Page section order:
```
<PricingHero />          ← bg-primary
<PricingCards />         ← bg-cream
<FamilyDiscount />       ← bg-white (callout strip)
<PricingComparison />    ← bg-cream (desktop table / mobile stacked)
<PricingFAQ />           ← bg-white (accordion, 6 items)
<CtaBanner />            ← bg-primary
```

**PricingHero:** Same short-hero pattern as `/courses` — `pt-40 pb-20 text-center`, eyebrow / h1 / subheading. No CTA buttons in hero (cards below do the work).

**PricingCards:**

Three cards in `grid-cols-1 md:grid-cols-3 gap-6`. The Growth card (`highlighted: true`) gets a gold border, gold "Most Popular" ribbon, and is visually elevated (`ring-2 ring-accent shadow-xl scale-[1.02]` on md+).

Card anatomy (top to bottom):
```
┌─────────────────────────────────┐
│  [Most Popular ribbon — gold]   │  ← only on Growth
│  Plan name                      │
│  $XX / month                    │
│  X classes · Y min each         │
│  ─────────────────────────────  │
│  ✓ Feature 1                    │
│  ✓ Feature 2 ...                │
│  ✗ Not included (Starter only)  │
│  ─────────────────────────────  │
│  [Book Free Trial button]       │
└─────────────────────────────────┘
```

- Price: `text-5xl font-display text-primary` with `/mo` suffix in `text-muted-text text-base`
- Session info: `text-muted-text text-sm` below price
- Feature checkmarks: `CheckCircle2` in `text-secondary`; ✗ items: `XCircle` in `text-muted-text/50`
- CTA: `LinkButton href="/contact" variant="gold"` on highlighted card, `variant="outline"` on others

**FamilyDiscount:** A centered strip — `bg-accent/10 border border-accent/20 rounded-2xl p-8 max-w-2xl mx-auto`. Icon (`Users`) + heading + body + WhatsApp link to activate.

**PricingComparison:**

Desktop (`hidden md:block`): HTML `<table>` with sticky first column:
- `<thead>`: empty corner cell + three plan name headers (Growth header in gold)
- `<tbody>`: one row per `comparisonRow`
  - Feature name (`text-left font-medium text-primary`)
  - Per-plan cell: `CheckCircle2 text-secondary` (true) / `Minus text-muted-text/40` (false) / text value (string)
- `border-collapse`, `w-full`, alternating `bg-cream` / `bg-white` row stripes

Mobile (`md:hidden`): Three stacked cards — one per plan — each listing all features as a simple checklist. No table.

**PricingFAQ:**

Reuse the existing `Accordion` component from `@/components/ui/accordion`. Section header: "Frequently Asked Questions". All 6 `pricingFaqs` rendered — `openMultiple` enabled.

**Metadata:**
```ts
export const metadata: Metadata = buildMetadata({
  title: 'Quran Class Pricing | Transparent Plans | Alrayan Academy',
  description: 'Simple, transparent pricing for online Quran classes. Plans from $30/month. Free first class, no contracts, cancel anytime.',
  path: '/pricing',
})
```

**Acceptance:**
- [ ] Growth card has gold ribbon + ring + scale treatment
- [ ] Feature checkmarks green, ✗ icons muted
- [ ] Comparison table hidden on mobile; mobile stacked cards shown instead
- [ ] FAQ accordion opens/closes
- [ ] All three CTA buttons link to `/contact`

---

### S4-03 — `/faq` page *(0.75 day)*

**File:** `frontend/src/app/(marketing)/faq/page.tsx`

Page section order:
```
<FaqHero />           ← bg-primary
<FaqContent />        ← bg-cream  (client component for search + filter)
<CtaBanner />         ← bg-primary
```

**FaqHero:** Same short-hero pattern. Eyebrow / h1 / subheading.

**FaqContent** (`'use client'`):

Two-column layout on md+: sidebar (category filter) left + questions right.

Sidebar:
- `<nav aria-label="FAQ categories">`
- "All" + one button per category, `sticky top-24`
- Active category: `bg-secondary text-white rounded-xl`; inactive: `text-primary hover:bg-cream`
- Clicking a category filters the right-side list without page reload

Search input at top of right column:
- `<input type="search" placeholder="Search questions…">` with `Search` lucide icon inside
- Filters `faqs` by matching `q` or `a` text (case-insensitive, no debounce needed — list is small)
- Combined with category filter (both apply simultaneously)

Question list:
- Uses the existing `Accordion` component
- Grouped by category when "All" is selected — show a `<h3>` category heading above each group
- When a specific category is selected or search text is active — show flat list, no category headings
- "No results" state: empty-state message with WhatsApp link

**FAQPage JSON-LD** (server-rendered in the page file, before the client component):
```ts
const allFaqs = faqs.map(({ q, a }) => ({ q, a }))
// inject faqSchema(allFaqs) as <script type="application/ld+json">
```

**Metadata:**
```ts
export const metadata: Metadata = buildMetadata({
  title: 'FAQ | Quran Classes Online | Alrayan Academy',
  description: 'Answers to common questions about Alrayan Academy\'s online Quran, Arabic, and Islamic Studies classes — teachers, pricing, scheduling, and more.',
  path: '/faq',
})
```

**Acceptance:**
- [ ] Category filter and search both work client-side (no page reload)
- [ ] Both filters apply simultaneously
- [ ] FAQPage schema present in page source for all FAQ items
- [ ] "No results" state shows when query matches nothing
- [ ] Accordion keyboard accessible (Enter/Space open/close)

---

### S4-04 — Form primitives: `FormField`, `SuccessState` *(0.25 day)*

**File:** `frontend/src/components/conversion/FormField.tsx`

Thin wrapper around the existing `Input`, `Label`, `Textarea` from `@/components/ui/`. Adds:
- Label above input
- Error message below (`aria-live="polite"`, `role="alert"`, `text-destructive text-sm`)
- `aria-invalid` and `aria-describedby` wired automatically

```tsx
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type FormFieldProps = {
  id: string
  label: string
  error?: string
  required?: boolean
} & (
  | ({ as?: 'input' } & React.ComponentProps<'input'>)
  | ({ as: 'textarea' } & React.ComponentProps<'textarea'>)
)

export function FormField({ id, label, error, required, as, ...rest }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
      </Label>
      {as === 'textarea' ? (
        <Textarea
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          {...(rest as React.ComponentProps<'textarea'>)}
        />
      ) : (
        <Input
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          {...(rest as React.ComponentProps<'input'>)}
        />
      )}
      {error && (
        <p id={`${id}-error`} role="alert" aria-live="polite" className="text-destructive text-sm">
          {error}
        </p>
      )}
    </div>
  )
}
```

---

**File:** `frontend/src/components/conversion/SuccessState.tsx`

Shown after a successful form submission.

```tsx
import { CheckCircle2 } from 'lucide-react'
import { LinkButton } from '@/components/ui/link-button'
import { whatsappLink } from '@/config/site'

type SuccessStateProps = {
  reference: string
  type: 'trial' | 'contact'
}

export function SuccessState({ reference, type }: SuccessStateProps) {
  const waMessage =
    type === 'trial'
      ? `Assalamu alaikum, I just booked a free trial (Ref: ${reference}). I'd like to discuss scheduling.`
      : `Assalamu alaikum, I submitted a contact message (Ref: ${reference}). I'd like to follow up.`

  return (
    <div className="text-center py-12 px-6 max-w-md mx-auto" role="status" aria-live="polite">
      <div className="size-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="size-8 text-secondary" />
      </div>
      <h2 className="text-2xl font-display font-semibold text-primary mb-2">
        {type === 'trial' ? 'Trial Class Booked!' : 'Message Received!'}
      </h2>
      <p className="text-muted-text mb-1">Your reference number:</p>
      <p className="font-mono text-lg font-semibold text-primary mb-4">{reference}</p>
      <p className="text-muted-text text-sm mb-8">
        {type === 'trial'
          ? 'Check your inbox — a confirmation email is on its way. We will be in touch within 24 hours to confirm your teacher and time slot.'
          : 'We have received your message and will reply within 24 hours. Check your email for a confirmation.'}
      </p>
      <a
        href={whatsappLink(waMessage)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] text-white px-6 py-3 font-medium hover:bg-[#1da851] transition-colors"
      >
        Continue on WhatsApp
      </a>
    </div>
  )
}
```

**Acceptance:**
- [ ] `FormField` wires `aria-invalid` and `aria-describedby` correctly — screen reader reads error inline
- [ ] `SuccessState` renders reference number and correct WhatsApp deep link
- [ ] WhatsApp link contains the reference number in the pre-filled message

---

### S4-05 — `TurnstileWidget` client component *(0.25 day)*

**File:** `frontend/src/components/conversion/TurnstileWidget.tsx`

Cloudflare Turnstile renders a challenge widget that gives the user a token. The token is sent to the backend for server-side verification. No npm package needed — load the Cloudflare script directly.

```tsx
'use client'
import { useEffect, useRef } from 'react'

type Props = {
  siteKey: string
  onSuccess: (token: string) => void
  onError?: () => void
  onExpire?: () => void
}

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: object) => string
      reset: (widgetId: string) => void
    }
    onloadTurnstileCallback?: () => void
  }
}

export function TurnstileWidget({ siteKey, onSuccess, onError, onExpire }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)

  useEffect(() => {
    const render = () => {
      if (!containerRef.current || !window.turnstile) return
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onSuccess,
        'error-callback': onError,
        'expired-callback': onExpire,
        theme: 'light',
      })
    }

    if (window.turnstile) {
      render()
    } else {
      window.onloadTurnstileCallback = render
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback'
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current)
      }
    }
  }, [siteKey, onSuccess, onError, onExpire])

  return <div ref={containerRef} className="my-2" />
}
```

The `siteKey` prop comes from `process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY`. In development / test environments, Cloudflare provides a special test key (`1x00000000000000000000AA`) that always passes — use it in `.env.local` so forms work locally without a real challenge.

**Acceptance:**
- [ ] Widget renders the Cloudflare iframe in supported browsers
- [ ] `onSuccess` fires with a token string when the user passes
- [ ] Using the test site key (`1x00000000000000000000AA`) makes the widget pass immediately

---

### S4-06 — `TrialBookingForm` component *(1 day)*

**File:** `frontend/src/components/conversion/TrialBookingForm.tsx`

`'use client'` — uses `react-hook-form`, `zod`, and `TurnstileWidget`.

**Zod schema:**
```ts
import { z } from 'zod'

const schema = z.object({
  name:           z.string().min(2, 'Full name required'),
  email:          z.email('Valid email required'),
  country:        z.string().min(1, 'Please select your country'),
  phone:          z.string().optional(),
  ageGroup:       z.enum(['kid-5-8', 'kid-9-12', 'teen', 'adult'], {
                    required_error: 'Please select an age group',
                  }),
  courseInterest: z.string().min(1, 'Please select a course'),
  preferredTime:  z.string().min(1, 'Please select a preferred time'),
  timezone:       z.string().min(1, 'Timezone required'),
  message:        z.string().max(500).optional(),
  turnstileToken: z.string().min(1, 'Please complete the security check'),
})

type FormValues = z.infer<typeof schema>
```

**Fields (in order):**
1. `name` — text input, required
2. `email` — email input, required
3. `country` — `<select>` from a short list of 20 top countries + "Other"
4. `phone` — tel input, optional, label "Phone (optional)"
5. `ageGroup` — radio group: "Child (5–8)" / "Child (9–12)" / "Teen (13–17)" / "Adult (18+)"
6. `courseInterest` — `<select>` listing all 11 course titles (mapped from `courses` in `content/courses.ts`)
7. `preferredTime` — `<select>`: "Early Morning (6–9 AM)" / "Morning (9 AM–12 PM)" / "Afternoon (12–4 PM)" / "Evening (4–8 PM)" / "Night (8 PM+)"
8. `timezone` — text input, pre-filled with `Intl.DateTimeFormat().resolvedOptions().timeZone` on mount
9. `message` — textarea, optional, max 500 chars, label "Additional notes (optional)"
10. Turnstile widget — `<TurnstileWidget>` sets `turnstileToken` via `setValue`

**Submission:**
```ts
const onSubmit = async (data: FormValues) => {
  setStatus('loading')
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/trial-bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message ?? 'Submission failed')
    }
    const { reference } = await res.json()
    setReference(reference)
    setStatus('success')
  } catch (e) {
    setStatus('error')
    setErrorMsg(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
  }
}
```

**States:**
- `idle` → show form
- `loading` → submit button disabled + spinner, form fields disabled
- `success` → replace form with `<SuccessState type="trial" reference={reference} />`
- `error` → show error alert above submit button (red bordered `<div role="alert">`)

**Submit button:** `variant="gold" size="lg" className="w-full"` — "Book My Free Trial Class →"

**Acceptance:**
- [ ] All required fields prevent submission when empty (inline error messages, not browser native)
- [ ] Turnstile widget must be completed before submission is allowed
- [ ] Loading state disables the entire form
- [ ] Success state shows reference number
- [ ] Error state is dismissible / cleared on next attempt
- [ ] `timezone` pre-filled on mount via `Intl.DateTimeFormat().resolvedOptions().timeZone`

---

### S4-07 — `ContactForm` component *(0.25 day)*

**File:** `frontend/src/components/conversion/ContactForm.tsx`

Simpler variant — for visitors who just have a question, not ready to book.

`'use client'` — same pattern as `TrialBookingForm`.

**Zod schema:**
```ts
const schema = z.object({
  name:           z.string().min(2, 'Full name required'),
  email:          z.email('Valid email required'),
  subject:        z.string().min(3, 'Subject required'),
  message:        z.string().min(10, 'Please write at least 10 characters'),
  turnstileToken: z.string().min(1, 'Please complete the security check'),
})
```

**Fields:** name, email, subject (text input), message (textarea), Turnstile widget.

**Submission:** `POST /api/v1/contacts` — same success/error pattern, `<SuccessState type="contact" reference={reference} />`.

**Acceptance:**
- [ ] All 4 non-token fields validated
- [ ] Success shows reference number starting with `CT-`

---

### S4-08 — `/contact` page assembly *(0.5 day)*

**File:** `frontend/src/app/(marketing)/contact/page.tsx`

Page structure:
```
<ContactHero />      ← bg-primary (short — same pattern as /pricing hero)
<ContactBody />      ← bg-cream
<CtaBanner />        ← bg-primary
```

**ContactBody** (`max-w-6xl mx-auto grid lg:grid-cols-5 gap-12`):

Left column (`lg:col-span-3`): `TrialBookingForm`

Right column (`lg:col-span-2`):
- Sticky `top-32`
- Contact info card: `bg-white rounded-2xl p-8 border border-border-soft shadow-sm`
  - Section heading "Get in Touch"
  - Email row: `Mail` icon + `info@alrayan-academy.com`
  - WhatsApp row: phone icon + WhatsApp link "Chat on WhatsApp"
  - Hours row: `Clock` icon + "7 days a week · All timezones"
  - Divider
  - "Just have a quick question?" toggle link → shows/hides the `<ContactForm>` below the info card

The toggle is a client component (`'use client'`) that wraps the right column, managing `showContactForm` boolean state.

**Metadata:**
```ts
export const metadata: Metadata = buildMetadata({
  title: 'Book a Free Trial Quran Class | Contact Alrayan Academy',
  description: 'Book your free first Quran class. Fill out the form and we will match you with a certified teacher within 24 hours. No credit card required.',
  path: '/contact',
})
```

**Acceptance:**
- [ ] Form occupies left 3/5 on desktop; full-width stacked on mobile
- [ ] Contact info sidebar is sticky on desktop
- [ ] "Just have a quick question?" toggle shows/hides `ContactForm` inline
- [ ] Page does not have two `<h1>` elements

---

### S4-09 — Backend: Migrations + Models *(0.5 day)*

**Migration:** `database/migrations/YYYY_MM_DD_HHMMSS_create_trial_bookings_table.php`

```php
Schema::create('trial_bookings', function (Blueprint $table) {
    $table->id();
    $table->string('reference', 20)->unique();        // TB-2026-0001
    $table->string('name');
    $table->string('email');
    $table->string('country', 100);
    $table->string('phone', 30)->nullable();
    $table->enum('age_group', ['kid-5-8', 'kid-9-12', 'teen', 'adult']);
    $table->string('course_interest', 100);
    $table->string('preferred_time', 50);
    $table->string('timezone', 100);
    $table->text('message')->nullable();
    $table->string('source', 50)->default('website');
    $table->enum('status', ['new', 'contacted', 'converted', 'lost'])->default('new');
    $table->timestamp('submitted_at')->useCurrent();
    $table->timestamps();

    $table->index(['status', 'submitted_at']);
    $table->index('email');
});
```

**Migration:** `create_contact_messages_table.php`

```php
Schema::create('contact_messages', function (Blueprint $table) {
    $table->id();
    $table->string('reference', 20)->unique();        // CT-2026-0001
    $table->string('name');
    $table->string('email');
    $table->string('subject', 255);
    $table->text('message');
    $table->enum('status', ['new', 'read', 'replied'])->default('new');
    $table->timestamp('submitted_at')->useCurrent();
    $table->timestamps();

    $table->index(['status', 'submitted_at']);
    $table->index('email');
});
```

**Model:** `app/Models/TrialBooking.php`

```php
class TrialBooking extends Model
{
    protected $fillable = [
        'reference', 'name', 'email', 'country', 'phone',
        'age_group', 'course_interest', 'preferred_time',
        'timezone', 'message', 'source', 'status', 'submitted_at',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
    ];
}
```

**Model:** `app/Models/ContactMessage.php` — same pattern with its own fillable list.

**Acceptance:**
- [ ] `php artisan migrate` runs without errors on a fresh DB
- [ ] `php artisan migrate:fresh` is idempotent
- [ ] Models have no mass-assignment errors when created via factory

---

### S4-10 — Backend: `BookingReferenceGenerator` service *(0.25 day)*

**File:** `app/Services/BookingReferenceGenerator.php`

```php
namespace App\Services;

use App\Models\ContactMessage;
use App\Models\TrialBooking;

class BookingReferenceGenerator
{
    public function forTrialBooking(): string
    {
        return $this->generate('TB', fn ($n) => TrialBooking::where('reference', $n)->exists());
    }

    public function forContact(): string
    {
        return $this->generate('CT', fn ($n) => ContactMessage::where('reference', $n)->exists());
    }

    private function generate(string $prefix, callable $exists): string
    {
        $year = now()->year;
        do {
            $number = str_pad(random_int(1, 9999), 4, '0', STR_PAD_LEFT);
            $ref = "{$prefix}-{$year}-{$number}";
        } while ($exists($ref));

        return $ref;
    }
}
```

Register as a singleton in `AppServiceProvider`:
```php
$this->app->singleton(BookingReferenceGenerator::class);
```

**Acceptance:**
- [ ] References follow the pattern `TB-2026-NNNN` / `CT-2026-NNNN`
- [ ] Collision loop re-generates until unique (covered in tests via mocking)

---

### S4-11 — Backend: Turnstile verification middleware *(0.25 day)*

**File:** `app/Http/Middleware/VerifyTurnstileToken.php`

```php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class VerifyTurnstileToken
{
    public function handle(Request $request, Closure $next): mixed
    {
        // Allow bypass in test environment (use the Cloudflare test secret)
        $secret = config('services.turnstile.secret');

        $token = $request->input('turnstileToken');
        if (! $token) {
            return response()->json(['message' => 'Security check required.'], 422);
        }

        $response = Http::asForm()->post(
            'https://challenges.cloudflare.com/turnstile/v0/siteverify',
            ['secret' => $secret, 'response' => $token, 'remoteip' => $request->ip()],
        );

        if (! $response->json('success', false)) {
            return response()->json(['message' => 'Security check failed. Please try again.'], 422);
        }

        return $next($request);
    }
}
```

Add to `config/services.php`:
```php
'turnstile' => [
    'site_key' => env('TURNSTILE_SITE_KEY'),
    'secret'   => env('TURNSTILE_SECRET_KEY'),
],
```

Register in `bootstrap/app.php`:
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias(['turnstile' => \App\Http\Middleware\VerifyTurnstileToken::class]);
})
```

In `.env.example`:
```
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

Test secret key (`1x0000000000000000000000000000000AA`) always returns `success: true` — use in `.env.testing`.

**Acceptance:**
- [ ] Missing token returns 422
- [ ] Invalid token returns 422
- [ ] Valid token passes through to the controller
- [ ] Test environment bypasses Cloudflare with the test secret

---

### S4-12 — Backend: Rate limiter *(0.25 day)*

**File:** `app/Providers/AppServiceProvider.php`

```php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

public function boot(): void
{
    RateLimiter::for('form', function (Request $request) {
        return Limit::perMinute(5)->by($request->ip())->response(function () {
            return response()->json([
                'message' => 'Too many submissions. Please wait a minute and try again.',
            ], 429);
        });
    });
}
```

**Acceptance:**
- [ ] 5th request within 60 s succeeds
- [ ] 6th request returns HTTP 429 with JSON body

---

### S4-13 — Backend: `TrialBookingController` *(0.5 day)*

**File:** `app/Http/Controllers/Api/V1/TrialBookingController.php`

```php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Mail\TrialBookingAdminNotification;
use App\Mail\TrialBookingConfirmation;
use App\Models\TrialBooking;
use App\Services\BookingReferenceGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class TrialBookingController extends Controller
{
    public function store(Request $request, BookingReferenceGenerator $refs): JsonResponse
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:100',
            'email'          => 'required|email|max:255',
            'country'        => 'required|string|max:100',
            'phone'          => 'nullable|string|max:30',
            'ageGroup'       => 'required|in:kid-5-8,kid-9-12,teen,adult',
            'courseInterest' => 'required|string|max:100',
            'preferredTime'  => 'required|string|max:50',
            'timezone'       => 'required|string|max:100',
            'message'        => 'nullable|string|max:500',
        ]);

        $booking = TrialBooking::create([
            ...$validated,
            'age_group'       => $validated['ageGroup'],
            'course_interest' => $validated['courseInterest'],
            'preferred_time'  => $validated['preferredTime'],
            'reference'       => $refs->forTrialBooking(),
        ]);

        Mail::to(config('mail.admin_address'))
            ->queue(new TrialBookingAdminNotification($booking));
        Mail::to($booking->email)
            ->queue(new TrialBookingConfirmation($booking));

        return response()->json([
            'reference' => $booking->reference,
            'message'   => 'Your trial class has been booked! Check your email for confirmation.',
        ], 201);
    }
}
```

**Acceptance:**
- [ ] Valid payload returns 201 with `reference` and `message` keys
- [ ] Invalid payload returns 422 with `errors` key
- [ ] Two mail jobs queued to the `default` queue
- [ ] `TrialBooking` row created in DB

---

### S4-14 — Backend: `ContactController` *(0.25 day)*

Same pattern as `TrialBookingController`. Validates `name`, `email`, `subject`, `message`. Creates `ContactMessage`, queues `ContactReceived` (admin) + `ContactConfirmation` (visitor). Returns `{ reference, message }`.

**Acceptance:**
- [ ] Valid payload returns 201
- [ ] Invalid payload returns 422
- [ ] Reference starts with `CT-`

---

### S4-15 — Backend: Mailables + Blade templates *(1 day)*

Four Mailables, each extending `Mailable` + implements `ShouldQueue`.

**Common email design (all four):**
- Branded Blade layout: navy header band (`#0B1F3A`) with white logo text "Alrayan Academy", gold `#C9A96E` horizontal divider, white content area, footer with academy email + WhatsApp number
- Plain-text version included (`->text('mail.plain')` or inline `->text()`)

**`TrialBookingAdminNotification`:**

Subject: `[Trial Booking] {name} — {reference}`

Body:
- Heading: "New Trial Booking"
- Table of all booking fields: Name / Email / Country / Phone / Age Group / Course / Preferred Time / Timezone / Message / Submitted At
- Gold CTA button linking to WhatsApp `https://wa.me/{whatsapp}?text=...` pre-filled with student name and reference

**`TrialBookingConfirmation`:**

Subject: "Your free trial class is booked! (Ref: {reference})"

Body:
- Greeting: "Assalamu alaikum, {name}!"
- "Your booking is confirmed. Here are your details:" — small table (Course / Preferred Time / Reference)
- "What happens next?" — 3 steps: "We match you with a teacher → You receive a WhatsApp message with the meeting link → First class is free, no payment required."
- Gold CTA button: "Chat on WhatsApp"
- Closing: "Jazakum Allahu khayran — The Alrayan Academy Team"

**`ContactReceived`:** Subject + table of fields. Simple admin notification.

**`ContactConfirmation`:** Subject "We received your message (Ref: {reference})" — confirms receipt, expected reply time 24h, WhatsApp fallback.

**File locations:**
```
backend/app/Mail/
├── TrialBookingAdminNotification.php
├── TrialBookingConfirmation.php
├── ContactReceived.php
└── ContactConfirmation.php

backend/resources/views/mail/
├── trial-booking-admin.blade.php
├── trial-booking-confirmation.blade.php
├── contact-received.blade.php
└── contact-confirmation.blade.php
```

**Acceptance:**
- [ ] All 4 mailables instantiate without errors
- [ ] Subject lines include the reference number
- [ ] Admin emails include all submitted fields
- [ ] Confirmation emails include next-steps instructions
- [ ] Blade templates render without syntax errors (`php artisan view:cache`)

---

### S4-16 — Backend: Mail config (Resend) + Queue *(0.25 day)*

**`config/mail.php`** — add Resend as a mailer option (Laravel 11 ships with Resend support via `resend` driver):
```php
'resend' => [
    'transport' => 'resend',
],
```

In `.env`:
```
MAIL_MAILER=resend
MAIL_FROM_ADDRESS=info@alrayan-academy.com
MAIL_FROM_NAME="Alrayan Academy"
MAIL_ADMIN_ADDRESS=info@alrayan-academy.com
RESEND_API_KEY=
```

Add `admin_address` to `config/mail.php`:
```php
'admin_address' => env('MAIL_ADMIN_ADDRESS', 'info@alrayan-academy.com'),
```

Queue driver in `.env`:
```
QUEUE_CONNECTION=database
```

(The `jobs` table migration already exists from Sprint 1.)

For local development, set `QUEUE_CONNECTION=sync` so emails send inline without needing a queue worker.

See [SERVER-SETUP.md](../SERVER-SETUP.md) for the `php artisan queue:work` systemd service configuration (documented in Sprint 1, activate in Sprint 4 deploy).

**Acceptance:**
- [ ] `php artisan config:cache` succeeds
- [ ] Sending a test mailable via `php artisan tinker` reaches Resend (staging only)
- [ ] `QUEUE_CONNECTION=sync` in `.env.testing` so test suite doesn't require a running worker

---

### S4-17 — Backend: Routes + CORS *(0.25 day)*

**`routes/api.php`** — uncomment and finalize:
```php
Route::prefix('v1')
    ->middleware(['throttle:form', 'turnstile'])
    ->group(function () {
        Route::post('/trial-bookings', [TrialBookingController::class, 'store']);
        Route::post('/contacts',       [ContactController::class, 'store']);
    });
```

**`config/cors.php`:**
```php
'allowed_origins' => explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:3000')),
```

`.env` (staging):
```
CORS_ALLOWED_ORIGINS=https://staging.alrayan-academy.com,https://alrayan-academy.com
```

**Acceptance:**
- [ ] `OPTIONS /api/v1/trial-bookings` returns 200 with correct CORS headers from the frontend origin
- [ ] Cross-origin POST from the Next.js app succeeds (no CORS error in browser console)

---

### S4-18 — Backend: Feature tests *(1 day)*

**Files:**
- `tests/Feature/Api/V1/TrialBookingTest.php`
- `tests/Feature/Api/V1/ContactTest.php`

Use `RefreshDatabase` trait. Set `QUEUE_CONNECTION=sync` and `Mail::fake()` in tests.

**`TrialBookingTest` — at minimum these 7 tests:**

```php
/** @test */
public function it_creates_a_trial_booking_with_valid_data(): void // 201, reference in response
public function it_returns_422_when_required_fields_missing(): void
public function it_returns_422_with_invalid_email(): void
public function it_returns_422_with_invalid_age_group(): void
public function it_queues_two_emails_on_success(): void // Mail::assertQueued(TrialBookingAdminNotification::class) etc.
public function it_enforces_rate_limit_after_five_requests(): void // 6th returns 429
public function it_returns_422_when_turnstile_token_missing(): void
```

For Turnstile in tests: inject `TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA` (the Cloudflare test secret that always succeeds) via `.env.testing`, OR mock `Http::fake()` to return `['success' => true]`.

**`ContactTest` — minimum 6 tests mirroring the above.**

**Acceptance:**
- [ ] `php artisan test` passes all tests (green)
- [ ] No database calls in tests hit an external API (Turnstile mocked)
- [ ] Mail assertions confirm correct mailable types are queued

---

### S4-19 — Sitemap update *(0.25 day)*

**File:** `frontend/src/app/sitemap.ts`

Add the three new static routes:
```ts
{ url: `${base}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
{ url: `${base}/faq`,     lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
{ url: `${base}/contact`, lastModified: now, changeFrequency: 'yearly',  priority: 0.8 },
```

**Acceptance:**
- [ ] `/sitemap.xml` includes all three URLs
- [ ] No duplicate entries

---

### S4-20 — QA *(0.5 day)*

- [ ] `pnpm typecheck` passes clean
- [ ] `pnpm lint` passes clean
- [ ] `pnpm build` completes — `/pricing`, `/faq`, `/contact` listed
- [ ] `php artisan test` — all tests green
- [ ] Submit trial booking form on staging — row in DB, two emails received
- [ ] Submit contact form — row in DB, two emails received
- [ ] 6th form submission in 60 s → 429 error shown in UI
- [ ] Turnstile widget renders and must be completed before submit
- [ ] Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95, SEO = 100 on all three pages
- [ ] FAQPage schema passes Google Rich Results Test on `/faq`
- [ ] `/pricing` comparison table readable on iPhone SE (375px)
- [ ] Form fields on `/contact` tab in logical order; focus rings visible
- [ ] Success state on both forms shows reference number and WhatsApp link
- [ ] Owner submits a real booking on staging and receives the confirmation email

---

## Files created / modified in this sprint

```
frontend/src/
├── content/
│   ├── pricing.ts                              ← NEW
│   └── faq.ts                                  ← NEW
│
├── components/conversion/                      ← NEW directory
│   ├── FormField.tsx                           ← NEW
│   ├── SuccessState.tsx                        ← NEW
│   ├── TurnstileWidget.tsx                     ← NEW
│   ├── TrialBookingForm.tsx                    ← NEW
│   └── ContactForm.tsx                         ← NEW
│
└── app/(marketing)/
    ├── pricing/
    │   └── page.tsx                            ← NEW
    ├── faq/
    │   └── page.tsx                            ← NEW
    └── contact/
        └── page.tsx                            ← NEW

frontend/src/app/sitemap.ts                     ← MODIFIED

backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/V1/
│   │   │   ├── TrialBookingController.php      ← NEW
│   │   │   └── ContactController.php           ← NEW
│   │   └── Middleware/
│   │       └── VerifyTurnstileToken.php        ← NEW
│   ├── Mail/
│   │   ├── TrialBookingAdminNotification.php   ← NEW
│   │   ├── TrialBookingConfirmation.php        ← NEW
│   │   ├── ContactReceived.php                 ← NEW
│   │   └── ContactConfirmation.php             ← NEW
│   ├── Models/
│   │   ├── TrialBooking.php                    ← NEW
│   │   └── ContactMessage.php                  ← NEW
│   ├── Providers/
│   │   └── AppServiceProvider.php              ← MODIFIED (rate limiter)
│   └── Services/
│       └── BookingReferenceGenerator.php       ← NEW
│
├── bootstrap/app.php                           ← MODIFIED (middleware alias)
│
├── config/
│   ├── mail.php                                ← MODIFIED (Resend, admin_address)
│   ├── services.php                            ← MODIFIED (Turnstile keys)
│   └── cors.php                                ← MODIFIED (allowed origins)
│
├── database/migrations/
│   ├── ..._create_trial_bookings_table.php     ← NEW
│   └── ..._create_contact_messages_table.php   ← NEW
│
├── resources/views/mail/
│   ├── trial-booking-admin.blade.php           ← NEW
│   ├── trial-booking-confirmation.blade.php    ← NEW
│   ├── contact-received.blade.php              ← NEW
│   └── contact-confirmation.blade.php          ← NEW
│
├── routes/api.php                              ← MODIFIED (uncomment Sprint 4 routes)
│
└── tests/Feature/Api/V1/
    ├── TrialBookingTest.php                    ← NEW
    └── ContactTest.php                         ← NEW
```

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Turnstile widget blocked by browser privacy extensions | Show a fallback message: "If the security widget doesn't load, please contact us on WhatsApp directly." |
| Resend domain not verified before sprint demo | Use `MAIL_MAILER=log` locally so emails appear in `storage/logs/laravel.log` without an active Resend account. |
| CORS misconfiguration blocking staging form | Test with `curl -X OPTIONS` from the frontend origin during deploy; `config/cors.php` uses an env list so it's easy to patch. |
| Queue worker not running → emails never send | Set `QUEUE_CONNECTION=sync` on staging until the systemd service is confirmed active. |
| Zod v4 API differs from v3 | This project uses Zod v4 (`zod@^4.4.3`). Use `z.email()` not `z.string().email()`, and `z.enum()` accepts the array directly. |
| Next.js 16 server / client component boundary | `TrialBookingForm`, `ContactForm`, `FaqContent`, `TurnstileWidget` are all `'use client'`. Page files (`pricing/page.tsx`, `faq/page.tsx`, `contact/page.tsx`) stay as server components and import these as client leaves. |

---

## Owner inputs needed before sprint ends

- [ ] **Cloudflare Turnstile keys** — create a widget at dash.cloudflare.com, provide `TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`
- [ ] **Resend API key** — create account at resend.com, verify `alrayan-academy.com` domain, provide `RESEND_API_KEY`
- [ ] **Confirm pricing** — approve $30 / $50 / $70 USD tier pricing
- [ ] **WhatsApp number** — confirm the final number (currently placeholder `201000000000`)
- [ ] **Admin email** — confirm `info@alrayan-academy.com` is the right destination for booking notifications

---

## What this sprint does NOT deliver

- Online payment / Stripe integration (pricing cards link to `/contact` — owner invoices manually)
- Admin dashboard to view/manage bookings (Sprint 7)
- Country landing pages (Sprint 5)
- Blog (Sprint 6)
- Email unsubscribe flow
- SMS notifications
- Teacher profile pages
- Automated teacher-matching logic — admin reviews bookings and assigns teachers manually
