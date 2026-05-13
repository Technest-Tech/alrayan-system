# Sprint 5 — Country Landing Pages + SEO Sweep

**Duration:** 2 weeks
**Status:** Detailed, ready to implement.
**Sprint goal:** Four geo-targeted country pages ship with fully unique copy, local context, and validated Schema.org markup. The entire site passes a schema audit. `buildMetadata` emits hreflang on every page. Lighthouse mobile ≥ 95 across the five key audit pages.

---

## Definition of Done

- [ ] `/countries/usa`, `/countries/uk`, `/countries/canada`, `/countries/australia` all render on staging
- [ ] Each country page has ≥ 60% unique content — no copy-paste across pages
- [ ] `LocalBusiness` + `BreadcrumbList` JSON-LD present in page source on every country page
- [ ] `BreadcrumbList` present on `/pricing`, `/faq`, `/contact`, `/courses`, and every `/courses/[slug]`
- [ ] `FAQPage` schema on `/faq` and on each `/countries/[country]` page
- [ ] `hreflang` (`en-US` + `x-default`) emitted on every page via `buildMetadata`
- [ ] `sitemap.xml` includes all four country URLs at `priority: 0.85`
- [ ] `robots.ts` — prod = allow, staging = disallow (already correct, confirm unchanged)
- [ ] `pnpm typecheck` and `pnpm lint` pass clean
- [ ] `pnpm build` completes — all four country pages listed as static routes
- [ ] Lighthouse mobile ≥ 95 on `/`, `/pricing`, `/contact`, `/courses/tajweed-course`, `/countries/usa`
- [ ] Google Rich Results Test passes on each country page (`LocalBusiness`) and `/faq` (`FAQPage`)
- [ ] All `<Image>` components on country pages have meaningful alt text

---

## Story Breakdown

### S5-01 — Content file: `countries.ts` *(1 day)*

**File:** `frontend/src/content/countries.ts`

All four country datasets live here. Page components import from this file — no copy lives in component files.

```ts
import type { Testimonial } from './testimonials'

export type CountrySlug = 'usa' | 'uk' | 'canada' | 'australia'

export type WhyReason = {
  title: string
  body: string
  icon: string   // lucide icon name
}

export type CountryData = {
  slug: CountrySlug
  name: string          // "United States"
  shortName: string     // "USA"
  flagEmoji: string
  // Hero
  hero: {
    h1: string          // "Online Quran Classes in the USA"
    subheading: string  // ≥ 1 sentence unique to this country
  }
  // Why section — 4 reasons, region-specific
  whyUs: WhyReason[]
  // Timezone section
  timezone: {
    label: string        // "ET · CT · MT · PT"
    note: string         // 1–2 sentences about scheduling
    slots: string[]      // ["6 AM – 9 AM ET", "4 PM – 9 PM ET", ...]
  }
  // Pricing — local currency note only; actual USD tiers imported from pricing.ts
  localCurrencyNote: string   // "≈ £24–£56/mo at current rates"
  // Testimonials — 3 country-specific
  testimonials: Testimonial[]
  // Country-specific FAQ — 5+ items
  faqs: Array<{ q: string; a: string }>
  // SEO
  seo: {
    title: string
    description: string
  }
  // Schema.org locality
  schema: {
    addressLocality: string    // virtual city or capital
    addressCountry: string     // ISO 3166-1 alpha-2
  }
}
```

**Content — USA:**

```ts
{
  slug: 'usa',
  name: 'United States',
  shortName: 'USA',
  flagEmoji: '🇺🇸',
  hero: {
    h1: 'Online Quran Classes in the USA',
    subheading: 'Certified Al-Azhar teachers available morning through night across all four US time zones — Eastern, Central, Mountain, and Pacific.',
  },
  whyUs: [
    {
      icon: 'Clock',
      title: 'All US Timezones Covered',
      body: 'Classes run from 6 AM ET to midnight ET, seven days a week. Whether you\'re in New York or Los Angeles, we have a slot that fits your schedule.',
    },
    {
      icon: 'ShieldCheck',
      title: 'Al-Azhar Certified Teachers',
      body: 'Every teacher holds an authenticated Ijazah and has passed a rigorous vetting process. Less than 10% of applicants are accepted.',
    },
    {
      icon: 'Heart',
      title: 'Female Teachers Available',
      body: 'We have qualified female Quran teachers for female students and for families who prefer a female instructor for their children.',
    },
    {
      icon: 'Users',
      title: 'Serving 10,000+ US Families',
      body: 'From Dearborn to Houston to New York, thousands of American Muslim families trust Alrayan Academy for their children\'s Quran education.',
    },
  ],
  timezone: {
    label: 'ET · CT · MT · PT',
    note: 'All classes are scheduled in your local time zone. We confirm the meeting link and time 24 hours before every session.',
    slots: ['6 AM – 9 AM (morning)', '12 PM – 3 PM (afternoon)', '5 PM – 9 PM (evening)', '9 PM – 12 AM (night)'],
  },
  localCurrencyNote: 'Prices are in USD. Plans start at $30/month.',
  faqs: [
    {
      q: 'Do you offer Quran classes across all US time zones?',
      a: 'Yes. We have teachers available from 6 AM to midnight Eastern Time, which covers early morning slots for Eastern states and evening slots for Pacific Time. You choose a recurring time that works for you.',
    },
    {
      q: 'Are your teachers recognized or certified in the United States?',
      a: 'Our teachers hold Ijazah certifications from Al-Azhar University and equivalent accredited Islamic institutions — these are the highest internationally recognized credentials in Quranic education. Certification is religious rather than state-issued, and Al-Azhar is accepted by Islamic scholars and mosques across the US.',
    },
    {
      q: 'Can my child join if they have never learned Quran before?',
      a: 'Absolutely. We have complete beginners of all ages. We start with Noorani Qaida — the foundational Arabic letter recognition program — and progress at your child\'s pace. No prior knowledge is required.',
    },
    {
      q: 'Do you serve students in Dearborn, Houston, or other large Muslim communities?',
      a: 'Yes. Students join from all 50 states. Being fully online means there are no geographic restrictions. You need only a device, an internet connection, and a quiet space.',
    },
    {
      q: 'What video platform do you use for classes?',
      a: 'Classes are held via Zoom, Google Meet, or Skype — whichever you prefer. We send a meeting link before each session. No special software beyond the video app is required.',
    },
    {
      q: 'Is the first class really free with no credit card?',
      a: 'Yes. The trial class is completely free and requires no payment information. We only discuss payment if you decide to continue after your first session.',
    },
  ],
  seo: {
    title: 'Online Quran Classes USA | Certified Teachers | Alrayan Academy',
    description: 'Learn Quran online in the USA with certified Al-Azhar teachers. All US time zones, 1-on-1 classes, free first lesson. Join 10,000+ American Muslim families.',
  },
  schema: { addressLocality: 'Washington D.C.', addressCountry: 'US' },
}
```

**Content — UK:**

```ts
{
  slug: 'uk',
  name: 'United Kingdom',
  shortName: 'UK',
  flagEmoji: '🇬🇧',
  hero: {
    h1: 'Online Quran Classes in the United Kingdom',
    subheading: 'Morning and evening sessions timed for GMT and BST — serving students in England, Scotland, Wales, and Northern Ireland since 2015.',
  },
  whyUs: [
    {
      icon: 'Clock',
      title: 'GMT & BST Scheduling',
      body: 'Classes run from 6 AM to 11 PM UK time throughout the year — with automatic adjustment for British Summer Time. No disrupted schedules when the clocks change.',
    },
    {
      icon: 'GraduationCap',
      title: 'Al-Azhar & Deobandi-Trained Teachers',
      body: 'Our teacher pool includes scholars trained at Al-Azhar, Darul Uloom institutions, and other leading Islamic universities. All hold authenticated Ijazah.',
    },
    {
      icon: 'BookOpen',
      title: 'Complement Your Child\'s Islamic School',
      body: 'Many of our UK students also attend Saturday madrassa or an Islamic school. Our 1-on-1 classes provide focused practice that group classes cannot match.',
    },
    {
      icon: 'Heart',
      title: 'Female Teachers for Sisters & Girls',
      body: 'A dedicated team of qualified female teachers is available for female students of all ages. Many UK families specifically request our female teacher option.',
    },
  ],
  timezone: {
    label: 'GMT · BST',
    note: 'All sessions are booked in UK local time and automatically adjust for British Summer Time. You will never need to manually calculate time differences.',
    slots: ['7 AM – 9 AM (before school)', '4 PM – 7 PM (after school)', '7 PM – 10 PM (evening)', 'Weekend mornings 8 AM – 12 PM'],
  },
  localCurrencyNote: '≈ £24–£56/month at current exchange rates (billed in USD).',
  faqs: [
    {
      q: 'Do you adjust class times for British Summer Time (BST)?',
      a: 'Yes. We book all classes in UK local time, so your schedule stays consistent regardless of whether the UK is on GMT or BST. You will never need to recalculate times around the clocks changing.',
    },
    {
      q: 'Can these classes complement my child\'s madrassa or Saturday school?',
      a: 'Yes — this is actually one of the most popular use cases in the UK. Group classes at madrassa cover a lot of students and can move quickly. Our 1-on-1 sessions let the teacher focus entirely on your child\'s specific weaknesses, recitation errors, or memorization targets.',
    },
    {
      q: 'Do you have teachers trained at UK or European institutions?',
      a: 'Our teachers are primarily trained at Al-Azhar University in Egypt and similar internationally accredited institutions. Several have also studied at Darul Uloom institutions with UK affiliations. All hold an authenticated Ijazah chain.',
    },
    {
      q: 'Are there classes available for adults who want to improve their recitation?',
      a: 'Yes. A large portion of our UK students are adults who learned Quran as children but want to correct their Tajweed or complete the full Quran with proper pronunciation. We offer dedicated Tajweed courses for adults.',
    },
    {
      q: 'Can I get an Ijazah certificate through Alrayan Academy?',
      a: 'Yes. Our Ijazah program is available for students who have memorized the Quran (Huffaz) and want to receive a certified chain of transmission. The process typically takes 6–12 months of dedicated sessions. UK students have completed their Ijazah with us.',
    },
  ],
  seo: {
    title: 'Online Quran Classes UK | Certified Teachers | Alrayan Academy',
    description: 'Online Quran classes in the UK with Al-Azhar certified teachers. GMT & BST scheduling, female teachers available, free trial class. Serving England, Scotland, Wales & NI.',
  },
  schema: { addressLocality: 'London', addressCountry: 'GB' },
}
```

**Content — Canada:**

```ts
{
  slug: 'canada',
  name: 'Canada',
  shortName: 'Canada',
  flagEmoji: '🇨🇦',
  hero: {
    h1: 'Online Quran Classes in Canada',
    subheading: 'Six Canadian time zones covered — from Halifax on Atlantic Time to Vancouver on Pacific Time. 1-on-1 classes with certified teachers, seven days a week.',
  },
  whyUs: [
    {
      icon: 'Globe',
      title: 'All Six Canadian Time Zones',
      body: 'We cover Atlantic, Eastern, Central, Mountain, Pacific, and Newfoundland time. Whether you\'re in Halifax, Toronto, Calgary, or Vancouver, we have a class time that works.',
    },
    {
      icon: 'Users',
      title: 'Welcoming Canada\'s Diverse Muslim Communities',
      body: 'Canada\'s Muslim population spans dozens of ethnic and cultural backgrounds. Our teachers are experienced working with students from South Asian, Arab, African, and convert backgrounds.',
    },
    {
      icon: 'ShieldCheck',
      title: 'Ijazah-Certified, Fully Vetted Teachers',
      body: 'Every teacher holds an authenticated chain of Quran transmission traceable to the Prophet ﷺ. All undergo background screening and a supervised trial teaching session before joining.',
    },
    {
      icon: 'BookOpen',
      title: 'From Alif-Ba-Ta to Ijazah',
      body: 'Whether your child is learning their first Arabic letters or you are an adult aiming to complete your Hifz, we have a program and a teacher for every level.',
    },
  ],
  timezone: {
    label: 'AT · ET · CT · MT · PT · NT',
    note: 'Classes are booked in your local Canadian time zone. Sessions are available early morning, after school, and evening to fit school and work schedules.',
    slots: ['7 AM – 9 AM (before school/work)', '4 PM – 7 PM (after school)', '7 PM – 10 PM (evening)', 'Weekends 8 AM – 1 PM'],
  },
  localCurrencyNote: '≈ C$41–C$95/month at current exchange rates (billed in USD).',
  faqs: [
    {
      q: 'Do you serve students across all Canadian provinces and territories?',
      a: 'Yes. Since classes are fully online, students join from all ten provinces and three territories. We have active students in Ontario, Quebec, British Columbia, Alberta, and beyond.',
    },
    {
      q: 'Can French-speaking students from Quebec join?',
      a: 'Our classes are conducted in English and Arabic. We do not currently offer French-language instruction. However, many Quebec students — including those whose first language is French — join our English-language Quran classes without difficulty, as the primary focus is Arabic Quranic recitation.',
    },
    {
      q: 'What are the class times for students in British Columbia (Pacific Time)?',
      a: 'Pacific Time students typically book early morning sessions (6–9 AM PT) or evening sessions (5–10 PM PT). These correspond to afternoon and late-evening slots for our teachers, all of which are available.',
    },
    {
      q: 'Is there a sibling discount for Canadian families with multiple children?',
      a: 'Yes. Premium plan subscribers receive a 20% discount on each additional sibling enrolled. Contact us via WhatsApp after your free trial to activate the family discount.',
    },
    {
      q: 'How do Canadian payment methods work?',
      a: 'Payments are processed in USD via Stripe, which accepts all major Canadian credit and debit cards (Visa, Mastercard, Amex). There are no additional currency conversion fees from our side — your bank may apply a standard FX conversion rate.',
    },
  ],
  seo: {
    title: 'Online Quran Classes Canada | Certified Teachers | Alrayan Academy',
    description: 'Online Quran classes in Canada with Al-Azhar certified teachers. All Canadian time zones, 1-on-1 sessions, free first class. Serving Ontario, BC, Alberta & all provinces.',
  },
  schema: { addressLocality: 'Toronto', addressCountry: 'CA' },
}
```

**Content — Australia:**

```ts
{
  slug: 'australia',
  name: 'Australia',
  shortName: 'Australia',
  flagEmoji: '🇦🇺',
  hero: {
    h1: 'Online Quran Classes in Australia',
    subheading: 'AEST, ACST, and AWST all covered — early morning, afternoon, and evening sessions for students from Sydney to Perth.',
  },
  whyUs: [
    {
      icon: 'Clock',
      title: 'AEST, ACST & AWST Scheduling',
      body: 'We serve students in all three Australian time zones — Eastern (NSW, VIC, QLD), Central (SA, NT), and Western (WA). Classes available before school, after school, and in the evenings.',
    },
    {
      icon: 'ShieldCheck',
      title: 'Authentic Ijazah Certification',
      body: 'Australian Muslim families increasingly demand authentic Islamic credentials, not just basic tutoring. All our teachers hold a verified Ijazah chain that is recognized by Islamic scholars worldwide.',
    },
    {
      icon: 'Heart',
      title: 'School Holiday Availability',
      body: 'Unlike local Islamic schools and weekend classes that close for holidays, Alrayan Academy runs year-round. We are fully available during Australian school holidays and public holidays.',
    },
    {
      icon: 'BookOpen',
      title: 'Perfect Complement to Weekend Madrassa',
      body: 'Many Australian students attend mosque-based weekend classes. Our weekday 1-on-1 sessions provide targeted practice that dramatically accelerates progress.',
    },
  ],
  timezone: {
    label: 'AEST · ACST · AWST',
    note: 'All classes are scheduled in your local Australian time zone. Early morning slots (6–9 AM) are especially popular for students who prefer to study before school.',
    slots: ['6 AM – 9 AM AEST (before school)', '4 PM – 7 PM AEST (after school)', '7 PM – 10 PM AEST (evening)', 'Weekends 7 AM – 12 PM AEST'],
  },
  localCurrencyNote: '≈ A$46–A$108/month at current exchange rates (billed in USD).',
  faqs: [
    {
      q: 'Do you offer Quran classes in Perth (Western Australian Time)?',
      a: 'Yes. Perth students book early morning sessions in AWST, which correspond to afternoon slots for our teachers. We have dedicated availability for Western Australia, typically from 6 AM to 10 AM AWST on weekdays and weekends.',
    },
    {
      q: 'Are classes available during Australian school holidays?',
      a: 'Yes. We operate year-round, including during all Australian state school holidays, long weekends, and public holidays. Many families use the school holiday break to schedule extra classes and accelerate their child\'s progress.',
    },
    {
      q: 'Can you help my child prepare for Islamic Studies at an Australian Islamic school?',
      a: 'Our courses cover Quran recitation, Tajweed, Hifz, Tafseer, and Islamic Studies — all of which align with the curriculum taught at Australian Islamic schools and weekend madrassas. Our 1-on-1 format helps students who need targeted remediation or enrichment beyond what classroom teaching provides.',
    },
    {
      q: 'How is the connection quality for Zoom classes from Australia?',
      a: 'The vast majority of our Australian students report excellent video quality for their Zoom, Google Meet, or Skype sessions. A standard NBN connection (25 Mbps or above) is more than sufficient. If you experience any connectivity issues, we can switch to audio-only mode — Quran recitation requires clear audio more than video.',
    },
    {
      q: 'Do you have experience working with Australian-born children who speak English as their first language?',
      a: 'Yes — this is very common among our Australian students. Our teachers are experienced working with children who have no prior Arabic or Quran knowledge. Classes are conducted in English (with Arabic instruction), and teachers use age-appropriate techniques specifically for native English-speaking children.',
    },
  ],
  seo: {
    title: 'Online Quran Classes Australia | Certified Teachers | Alrayan Academy',
    description: 'Online Quran classes in Australia with certified Al-Azhar teachers. AEST, ACST & AWST scheduling, free first class. Serving Sydney, Melbourne, Brisbane, Perth & more.',
  },
  schema: { addressLocality: 'Sydney', addressCountry: 'AU' },
}
```

**Testimonials per country** — add 2 more per country beyond the existing `testimonials.ts` entries:

The inline `testimonials` arrays in each `CountryData` entry include the existing global testimonials filtered by `country` plus 2 new country-specific entries defined directly in the `CountryData`. New entries follow the same `Testimonial` type.

**Acceptance:**
- [ ] All four slugs exported
- [ ] Each country has ≥ 5 FAQ items
- [ ] Each country has ≥ 3 testimonials
- [ ] TypeScript types exported and used by the page

---

### S5-02 — Schema.org: `localBusinessSchema` + schema audit *(0.5 day)*

**File:** `frontend/src/lib/schema.ts`

Add the `localBusinessSchema` function:

```ts
export type CountrySchemaData = {
  slug: string
  name: string          // "United States"
  schema: {
    addressLocality: string
    addressCountry: string
  }
}

export function localBusinessSchema(country: CountrySchemaData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${siteConfig.url}/countries/${country.slug}`,
    name: siteConfig.name,
    description: `Online Quran and Arabic classes for students in ${country.name}. Certified Al-Azhar teachers, free first class.`,
    url: `${siteConfig.url}/countries/${country.slug}`,
    telephone: siteConfig.phone,
    email: siteConfig.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: country.schema.addressLocality,
      addressCountry: country.schema.addressCountry,
    },
    areaServed: country.name,
    priceRange: '$30–$70/month',
    openingHours: 'Mo-Su 00:00-23:59',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Quran Classes',
      itemListElement: [
        {
          '@type': 'Offer',
          name: 'Free Trial Class',
          price: '0',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
        {
          '@type': 'Offer',
          name: 'Starter Plan',
          price: '30',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
      ],
    },
    sameAs: Object.values(siteConfig.social),
  }
}
```

**Schema audit — pages that need BreadcrumbList added:**

| Page | Missing schema | Action |
|---|---|---|
| `/pricing` | `BreadcrumbList` | Add `breadcrumbSchema` + inject `<script>` |
| `/contact` | `BreadcrumbList` | Add `breadcrumbSchema` + inject `<script>` |
| `/faq` | `BreadcrumbList` | Add alongside existing `faqSchema` |
| `/courses` (listing) | `BreadcrumbList` | Add `breadcrumbSchema` |
| `/countries/[country]` | `LocalBusiness` + `FAQPage` + `BreadcrumbList` | New page — all three |

Already covered (no action needed):
- `/` — `EducationalOrganization` ✓
- `/about` — `AboutPage` + `Person` ✓
- `/courses/[slug]` — `Course` + `FAQPage` + `BreadcrumbList` ✓

**Acceptance:**
- [ ] `localBusinessSchema` exported from `schema.ts`
- [ ] All pages in the audit table have their missing schemas added

---

### S5-03 — `hreflang` via `buildMetadata` *(0.25 day)*

**File:** `frontend/src/lib/seo.ts`

Add `languages` to `alternates` in the return value so every page emits the `hreflang` `<link>` tags:

```ts
alternates: {
  canonical: url,
  languages: {
    'en-US': url,
    'x-default': url,
  },
},
```

This tells Google that the canonical English-US version is this same URL, and sets the x-default fallback. When Arabic (`ar`) is added in a later sprint, the Arabic URL will be added here.

**Acceptance:**
- [ ] `pnpm build` output: every page HTML contains `<link rel="alternate" hreflang="en-US">` pointing to its canonical URL
- [ ] `<link rel="alternate" hreflang="x-default">` present on every page

---

### S5-04 — Country page dynamic route *(1.5 days)*

**File:** `frontend/src/app/(marketing)/countries/[country]/page.tsx`

Server component. Uses `generateStaticParams` to pre-render all four slugs.

```ts
export function generateStaticParams() {
  return countriesData.map((c) => ({ country: c.slug }))
}
```

**Page section order:**
```
Hero                ← bg-primary (H1 + subheading + breadcrumb + flag + CTA buttons)
WhyUsSection        ← bg-cream  (4 cards)
TimezoneSection     ← bg-white  (time slots visual + note)
PricingPreview      ← bg-cream  (price cards — link to /pricing — with local currency note)
TestimonialsSection ← bg-white  (3 cards, country-specific)
CountryFaqSection   ← bg-cream  (accordion, 5+ items, FAQPage schema on all items)
TrustBadges         ← bg-white  (reuse existing trust badge row from home)
CtaBanner           ← bg-primary
```

**Hero section details:**
- Breadcrumb: Home → [Country]
- Flag emoji (`text-5xl`) + H1 (`heading-display font-display text-white`)
- Subheading (`text-white/80 text-xl`)
- Two CTAs: `LinkButton href="/contact" variant="gold"` + WhatsApp link
- Trust line: "✓ Free first class · ✓ No credit card · ✓ Cancel anytime"

**WhyUs section:**
- Eyebrow: `Why Families in [Country] Choose Alrayan`
- H2: `The Alrayan Difference`
- 4 cards in `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6`
- Card: icon box (secondary/10 bg, text-secondary icon) + title + body

**Timezone section:**
- Eyebrow: `Flexible Scheduling`
- H2: `Classes in Your Timezone`
- `timezone.note` paragraph
- Time slots as a flex-wrap chip list (`bg-secondary/10 text-secondary rounded-full px-4 py-2 text-sm font-medium`)
- Timezone label badge: `bg-primary text-white rounded-full px-4 py-1.5 text-sm font-bold`

**Pricing preview:**
- Eyebrow: `Transparent Pricing`
- H2: `Simple Monthly Plans`
- Three mini pricing cards (condensed — name, price, sessions) imported from `pricingTiers`
- Local currency note below cards: `text-muted-text text-sm text-center italic`
- `LinkButton href="/pricing"` to see full comparison

**Testimonials section:**
- Eyebrow: `What Families in [Country] Say`
- H2: `Student Testimonials`
- 3 testimonial cards — quote, name, location, star rating
- Card: `bg-cream rounded-2xl p-6 border border-border-soft`

**CountryFaq section:**
- Eyebrow: `Questions from [Country] Families`
- H2: `Frequently Asked Questions`
- Uses existing `Accordion` component
- All country FAQs from `country.faqs`

**TrustBadges:**
- Same 4 trust items used on the home page
- `"10,000+ Students Worldwide"`, `"50+ Countries"`, `"Al-Azhar Certified"`, `"Free First Class"`

**Metadata:**
```ts
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country: slug } = await params
  const country = countriesData.find((c) => c.slug === slug)
  if (!country) return {}
  return buildMetadata({
    title: country.seo.title,
    description: country.seo.description,
    path: `/countries/${slug}`,
  })
}
```

**Schemas injected at top of page JSX:**
```ts
const schemas = [
  localBusinessSchema(country),
  breadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: country.name, href: `/countries/${country.slug}` },
  ]),
  faqSchema(country.faqs),
]
```

**Acceptance:**
- [ ] `generateStaticParams` returns all 4 slugs — `pnpm build` lists all 4 routes
- [ ] `/countries/bogus` returns 404
- [ ] All three JSON-LD blocks present in page source
- [ ] Hero H1 is unique per country (no shared text)
- [ ] Testimonial cards show 3 per country
- [ ] FAQ accordion is keyboard accessible
- [ ] No `<a>` tags for internal navigation — all use `<Link>`

---

### S5-05 — Add testimonials for country pages *(0.25 day)*

**File:** `frontend/src/content/testimonials.ts`

Add 8 new testimonials (2 per country) so each country page can show 3:

```ts
// Additional USA testimonials
{
  id: 't7',
  name: 'Khalid M.',
  location: 'Houston, TX',
  country: 'usa',
  quote: 'My son started from zero and is now halfway through his Hifz. The teacher checks in with us on WhatsApp every week — we feel like part of a family.',
  course: 'Hifz / Memorization',
  rating: 5,
},
{
  id: 't8',
  name: 'Nadia S.',
  location: 'Dearborn, MI',
  country: 'usa',
  quote: 'As a convert, I was nervous about finding a teacher who would be patient with my complete beginner level. My teacher has been wonderful — kind, clear, and encouraging.',
  course: 'Noorani Qaida',
  rating: 5,
},
// Additional UK testimonials
{
  id: 't9',
  name: 'Zaynab H.',
  location: 'Manchester, UK',
  country: 'uk',
  quote: 'My daughter was struggling with Tajweed at madrassa. Within two months of 1-on-1 sessions with Alrayan, her teacher at madrassa commented on the improvement. Highly recommend.',
  course: 'Tajweed Course',
  rating: 5,
},
// Additional Canada testimonials
{
  id: 't10',
  name: 'Ibrahim F.',
  location: 'Calgary, AB',
  country: 'canada',
  quote: 'Calgary is not well served by local Islamic schools. Alrayan filled that gap perfectly. My children now have consistent, high-quality Quran instruction from home.',
  course: 'Quran for Kids',
  rating: 5,
},
{
  id: 't11',
  name: 'Maryam T.',
  location: 'Vancouver, BC',
  country: 'canada',
  quote: 'The Pacific Time evening slots are perfect. My kids finish school, have a snack, and join their Quran class before dinner. The routine has been transformative for our household.',
  course: 'Quran for Kids',
  rating: 5,
},
// Additional Australia testimonials
{
  id: 't12',
  name: 'Aisha N.',
  location: 'Sydney, NSW',
  country: 'australia',
  quote: 'We tried local tutors but found it hard to be consistent. Alrayan\'s fixed weekly schedule and WhatsApp reminders kept us on track. My son completed his first Juz in six months.',
  course: 'Hifz / Memorization',
  rating: 5,
},
{
  id: 't13',
  name: 'Hassan W.',
  location: 'Brisbane, QLD',
  country: 'australia',
  quote: 'I started learning Quran as an adult. I thought it was too late, but my teacher made me feel completely at ease. I now read Surah Al-Baqarah with confidence.',
  course: 'Quran for Adults',
  rating: 5,
},
```

**Acceptance:**
- [ ] USA, UK, Canada, Australia each have ≥ 3 testimonials in `testimonials.ts`
- [ ] New testimonials follow the `Testimonial` type exactly

---

### S5-06 — Sitemap verification *(0.25 day)*

**File:** `frontend/src/app/sitemap.ts`

The country routes are already in `sitemap.ts` from Sprint 4 prep. Verify:
- `['usa', 'uk', 'canada', 'australia']` generates 4 entries
- `priority: 0.85`, `changeFrequency: 'monthly'`
- No duplicates

**Acceptance:**
- [ ] `pnpm build` + `curl localhost:3000/sitemap.xml` returns all country URLs
- [ ] No duplicate entries

---

### S5-07 — QA *(0.5 day)*

- [ ] `pnpm typecheck` passes clean
- [ ] `pnpm lint` passes clean
- [ ] `pnpm build` completes — all 4 country pages listed as static routes
- [ ] `/countries/usa`, `/countries/uk`, `/countries/canada`, `/countries/australia` render correctly
- [ ] Hero H1 is different on each page
- [ ] All four pages have `LocalBusiness` JSON-LD in page source
- [ ] `FAQPage` JSON-LD present on all four country pages and `/faq`
- [ ] `BreadcrumbList` present on `/pricing`, `/contact`, `/faq`, `/courses`, `/countries/*`
- [ ] `hreflang="en-US"` and `hreflang="x-default"` in `<head>` on every page
- [ ] Accordion keyboard accessible on country FAQ (Enter/Space open, arrow keys navigate)
- [ ] Mobile layout (375px): all sections stack correctly, no horizontal overflow
- [ ] Internal `<Link>` used for all country-to-page navigation (not bare `<a>`)
- [ ] Sitemap includes all 4 country URLs
- [ ] Google Rich Results Test passes on `/countries/usa` (LocalBusiness) and `/faq` (FAQPage)
- [ ] Lighthouse mobile ≥ 95 on `/countries/usa`

---

## Files created / modified in this sprint

```
frontend/src/
├── content/
│   ├── countries.ts                              ← NEW
│   └── testimonials.ts                           ← MODIFIED (8 new entries)
│
├── lib/
│   ├── schema.ts                                 ← MODIFIED (localBusinessSchema)
│   └── seo.ts                                    ← MODIFIED (hreflang in alternates)
│
└── app/(marketing)/
    ├── countries/
    │   └── [country]/
    │       └── page.tsx                          ← NEW
    ├── pricing/page.tsx                          ← MODIFIED (add breadcrumbSchema)
    ├── faq/page.tsx                              ← MODIFIED (add breadcrumbSchema)
    ├── contact/page.tsx                          ← MODIFIED (add breadcrumbSchema)
    └── courses/page.tsx                          ← MODIFIED (add breadcrumbSchema)
```

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| `LocalBusiness` schema rejected by Google Rich Results for virtual/online business | Use `areaServed` + `openingHours: Mo-Su 00:00-23:59` to signal virtual operation. Google accepts `LocalBusiness` for online-only businesses when `address` is present (virtual location). |
| 60% unique content threshold for country pages | Every hero, whyUs block, timezone note, FAQ set, and testimonials are 100% unique per country. The only shared elements are the pricing preview (same tiers) and trust badges (same stats) — these are UI chrome, not body copy. |
| `generateStaticParams` adding build time | Four pages with no external data fetches — build time impact is negligible. |
| hreflang `x-default` pointing to `en` canonical confusing multilingual crawlers | `x-default` should point to the page that handles all uncategorized traffic — in a single-language site this is the page itself. Correct pattern. |

---

## What this sprint does NOT deliver

- Dynamic OG images per country (Sprint 6 or later — requires `@vercel/og` setup)
- Arabic (`ar`) hreflang (Phase 2 post-launch)
- City-level landing pages (e.g., `/cities/london`) — post-launch SEO expansion
- Blog (Sprint 6)
- Admin dashboard (Sprint 7)
- Google Search Console verification (requires production DNS access — owner action)
- Analytics install (Sprint 6)
