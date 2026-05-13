# Sprint 3 — Course Pages

**Duration:** 2 weeks
**Status:** Detailed, ready to implement.
**Sprint goal:** Every one of the 11 courses has a fully SEO-optimized landing page strong enough to be the destination of a Google Ads campaign. Each page has real copy, structured data, curriculum, FAQs, a teacher strip, and related courses. The `/courses` index page aggregates all courses in one scannable view. All pages are statically generated at build time.

---

## Definition of Done

- [ ] `/courses` renders all 11 course cards with level / duration / age-group badges
- [ ] `/courses/[slug]` exists for all 11 slugs, generated at build time via `generateStaticParams`
- [ ] Each course detail page has: Hero → Outcomes → Curriculum → Who This Is For → Teachers Strip → Pricing Teaser → FAQ → Related Courses → CTA Banner
- [ ] `StickyCourseCta` shows on mobile after scrolling past the hero (fixed bottom bar)
- [ ] `Course` schema + `FAQPage` schema + `BreadcrumbList` schema injected on every detail page
- [ ] All 11 `seoTitle` values are ≤ 60 chars; all `seoDescription` values are ≤ 160 chars
- [ ] Teacher strips filter by course specialty — no irrelevant teachers shown
- [ ] Accordion works (opens / closes) for both Curriculum and FAQ sections
- [ ] `pnpm typecheck` and `pnpm lint` pass clean
- [ ] `pnpm build` completes — all 11 course routes listed in the output
- [ ] Lighthouse mobile on any 3 spot-checked course pages: Performance ≥ 90, Accessibility ≥ 95, SEO = 100
- [ ] Sitemap includes `/courses` and all 11 `/courses/[slug]` URLs
- [ ] Owner spot-checks 3 random course pages and approves copy on staging

---

## Story Breakdown

### S3-01 — Expand Course content type *(0.5 day)*

**File:** `frontend/src/content/courses.ts`

Expand the `Course` type to include all fields needed for the detail page. The existing `features` array stays (used on home page). New fields:

```ts
export type Course = {
  // existing fields (unchanged) ...
  slug: string
  title: string
  shortDescription: string
  longDescription: string
  icon: string
  ageGroup?: string
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels'
  durationMonths?: string
  features: string[]

  // NEW — Sprint 3
  seoTitle: string        // ≤ 60 chars — used in <title> and OG
  seoDescription: string  // ≤ 160 chars — used in meta description
  outcomes: string[]      // 4–6 learning outcomes for "What You'll Learn"
  curriculum: Array<{
    module: string        // e.g. 'Lesson 1–7: Arabic Alphabet'
    topics: string[]      // 3+ topic lines per module
  }>                      // 5+ modules
  personas: Array<{
    title: string         // e.g. 'Complete Beginners'
    description: string   // 1–2 sentences
  }>                      // 2–3 personas
  faqs: Array<{
    q: string             // Question
    a: string             // Answer (1–3 sentences)
  }>                      // 5+ FAQ items
  relatedSlugs: string[]  // exactly 3 course slugs
  specialtyTags: string[] // matches teacher.specialties entries for filtering
}
```

Populate all new fields for all 11 courses. Every course needs:
- `seoTitle` ≤ 60 chars
- `seoDescription` ≤ 160 chars
- 4–6 `outcomes`
- 5+ `curriculum` modules with 3+ topics each
- 2–3 `personas`
- 5+ `faqs`
- exactly 3 `relatedSlugs`
- 1–5 `specialtyTags` matching strings in `teachers.specialties`

**Acceptance:**
- [ ] TypeScript compiles — no type errors after expansion
- [ ] All 11 courses have fully populated new fields (no empty arrays, no placeholder strings)
- [ ] `seoTitle` lengths verified ≤ 60 chars
- [ ] `relatedSlugs` values exist as actual course slugs (no broken references)

---

### S3-02 — Add courseSchema to schema.ts *(0.25 day)*

**File:** `frontend/src/lib/schema.ts`

```ts
export function courseSchema(course: Course) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.longDescription,
    provider: {
      '@type': 'EducationalOrganization',
      name: siteConfig.name,
      url: siteConfig.url,
    },
    url: `${siteConfig.url}/courses/${course.slug}`,
    educationalLevel: course.level,
    ...(course.ageGroup && { typicalAgeRange: course.ageGroup }),
    offers: {
      '@type': 'Offer',
      url: `${siteConfig.url}/pricing`,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'Online',
      instructor: {
        '@type': 'EducationalOrganization',
        name: siteConfig.name,
      },
    },
  }
}
```

Also import `Course` type from `@/content/courses` (already done for `personSchema` pattern with `Teacher`).

The `faqSchema` helper already exists from Sprint 2. No changes needed to it.

**Acceptance:**
- [ ] `courseSchema` exported from `schema.ts`
- [ ] Schema validated against Schema.org — no `@type` errors

---

### S3-03 — Courses index page `/courses` *(0.5 day)*

**File:** `frontend/src/app/(marketing)/courses/page.tsx`

Page structure:
```
<Hero section>      ← bg-primary, centered, eyebrow / h1 / subhead
<CoursesGrid>       ← bg-cream, all 11 cards
<CtaBanner>         ← bg-primary (reuse same pattern as home + about)
```

**Hero** (shorter than home hero):
- `bg-primary pt-40 pb-20 text-center`
- Eyebrow: "All Courses"
- `<h1>` — "Learn Quran, Arabic & Islamic Studies Online"
- Subheading — 1 sentence
- Two CTAs: "Book Free Trial" (gold) + "Chat on WhatsApp" (ghost)

**Courses grid** (`bg-cream`):
- `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`
- Each card is an `<a href="/courses/${slug}">` — full card clickable
- Card anatomy:
  ```
  ┌─────────────────────────────────────┐
  │ [Icon]                     [Badges] │
  │                                     │
  │ Title                               │
  │ Short description                   │
  │                                     │
  │ • Feature 1  • Feature 2            │
  │                                ──→  │
  └─────────────────────────────────────┘
  ```
- Badges (top right): level badge + optional age group badge + optional duration badge
- Level badge colors:
  - `Beginner` → `bg-green-100 text-green-800`
  - `Intermediate` → `bg-amber-100 text-amber-800`
  - `Advanced` → `bg-red-100 text-red-800`
  - `All Levels` → `bg-blue-100 text-blue-800`
- Icon: resolved via `iconMap` (all course icons must be in the map)
- Features: first 2 from `course.features`, displayed as small bullet list
- Arrow (`→`) slides right on group-hover

**Metadata:**
```ts
export const metadata: Metadata = buildMetadata({
  title: 'Online Quran & Arabic Courses | Alrayan Academy',
  description: 'Browse all Quran, Tajweed, Hifz, Arabic, and Islamic Studies courses. 1-on-1 online classes with certified teachers. Free trial available.',
  path: '/courses',
})
```

**Acceptance:**
- [ ] All 11 courses rendered, no card missing
- [ ] Level badge colors correct for each course
- [ ] Arrow nudges right on hover
- [ ] Entire card surface is one `<a>` — no nested interactive elements

---

### S3-04 — Course Hero section *(0.5 day)*

**Part of:** `frontend/src/app/(marketing)/courses/[slug]/page.tsx`

Visual design:
- `bg-primary` with same radial gradient decoration as home hero
- `pt-40 pb-20` (not full-height — content-driven)
- Text left-aligned, `max-w-3xl`

Markup order:
1. Breadcrumb — `Home > Courses > [Course Title]` in `text-white/50 text-sm`, links styled white/ghost
2. `<h1>` — course title in `heading-display font-display text-white`
3. Subheading — `longDescription`, `text-white/80 text-xl`
4. Meta bar — horizontal row of badges: Level / Duration (if present) / Age Group (if present) / "1-on-1 · Online"
5. Two CTAs: "Book Free Trial" (gold LinkButton) + WhatsApp ghost link
6. Microcopy — "✓ Free first class · ✓ No credit card required"

Meta bar badge style: `bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-white/80 text-sm`

**Acceptance:**
- [ ] Breadcrumb links are functional (Home → `/`, Courses → `/courses`)
- [ ] Meta bar only shows Duration and Age Group badges when those fields are present in content
- [ ] H1 equals the course `title` field (not the seoTitle)

---

### S3-05 — Course Outcomes section *(0.25 day)*

**Part of:** `/courses/[slug]/page.tsx` — `bg-cream` section

Section header: eyebrow "What You'll Learn" / `<h2>` / no subheading needed.

Outcomes list:
- `grid grid-cols-1 sm:grid-cols-2 gap-4`
- Each item: green checkmark icon (`CheckCircle2` from lucide) + outcome text
- Checkmark: `text-secondary size-5 shrink-0`
- Text: `text-primary font-medium`

**Acceptance:**
- [ ] 4–6 outcomes shown per course
- [ ] Grid is 2 columns on sm+ and single column on mobile

---

### S3-06 — Course Curriculum accordion *(0.5 day)*

**Part of:** `/courses/[slug]/page.tsx` — `bg-white` section

Uses existing `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` from `@/components/ui/accordion`.

```tsx
<Accordion openMultiple>
  {course.curriculum.map((item, i) => (
    <AccordionItem key={item.module} value={String(i)}>
      <AccordionTrigger className="text-base font-semibold text-primary py-4">
        <span className="flex items-center gap-3">
          <span className="size-7 rounded-full bg-secondary/10 text-secondary text-sm font-bold flex items-center justify-center shrink-0">
            {i + 1}
          </span>
          {item.module}
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <ul className="pl-10 space-y-2 pb-4">
          {item.topics.map((topic) => (
            <li key={topic} className="flex items-center gap-2 text-muted-text text-sm">
              <span className="size-1.5 rounded-full bg-accent shrink-0" aria-hidden="true" />
              {topic}
            </li>
          ))}
        </ul>
      </AccordionContent>
    </AccordionItem>
  ))}
</Accordion>
```

Wrap accordion in `<div className="border border-border-soft rounded-2xl overflow-hidden divide-y divide-border-soft">`.

**Acceptance:**
- [ ] Accordion opens and closes correctly (test at least 2 items)
- [ ] Module number circles are visually consistent (same size per row)
- [ ] Topics indented correctly under each module

---

### S3-07 — Who This Is For *(0.25 day)*

**Part of:** `/courses/[slug]/page.tsx` — `bg-cream` section

- Section header: "Who This Is For"
- `grid grid-cols-1 md:grid-cols-3 gap-6` (or `md:grid-cols-2` if only 2 personas — use `personas.length`)
- Each card: `bg-white rounded-2xl p-6 border border-border-soft`
- Icon: `UserCheck` lucide icon in `bg-secondary/10` square
- Title: `font-semibold text-primary`
- Description: `text-muted-text text-sm leading-relaxed`

**Acceptance:**
- [ ] Grid adapts to 2 or 3 columns based on number of personas
- [ ] Cards are equal height (flex column layout)

---

### S3-08 — Course Teachers Strip *(0.5 day)*

**Part of:** `/courses/[slug]/page.tsx` — `bg-white` section

Filtering logic (server-side — no client state):
```ts
const courseTeachers = teachers
  .filter((t) => t.specialties.some((s) => course.specialtyTags.includes(s)))
  .slice(0, 4)
```

If `courseTeachers.length === 0`, fall back to `featuredTeachers.slice(0, 3)`.

Layout: same card pattern as home Teachers Strip:
- `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6`
- Avatar circle / name / role / specialty pills (max 2) / years · students
- Note: show max 4 teachers. If fewer match, show what's available (no empty placeholders).

Below grid: "Meet All Our Teachers" outline button → `/about`.

**Acceptance:**
- [ ] Teachers shown are relevant to the course (share at least one specialty tag)
- [ ] Female teacher courses (e.g. `female-quran-teachers`) show female teachers prominently
- [ ] Grid does not break if only 1–2 teachers match

---

### S3-09 — Pricing Teaser *(0.25 day)*

**Part of:** `/courses/[slug]/page.tsx` — `bg-cream` section

Simple two-column card:
- Left: `bg-primary text-white rounded-2xl p-8` — heading "Affordable, Flexible Pricing" / subtext / "View Pricing" gold LinkButton
- Right: `bg-white border border-border-soft rounded-2xl p-8` — 4 bullet points:
  - "No long-term contracts"
  - "Cancel anytime"
  - "Free first class"
  - "Family discount available"

Wraps in `grid md:grid-cols-2 gap-6`.

**Acceptance:**
- [ ] "View Pricing" links to `/pricing` (stub page — should not 404 at build time)
- [ ] Pricing cards stack on mobile (single column)

---

### S3-10 — FAQ accordion *(0.5 day)*

**Part of:** `/courses/[slug]/page.tsx` — `bg-white` section

Same accordion component as Curriculum. Key differences:
- No number circle — plain trigger text
- `openMultiple` — user can open multiple FAQs at once
- `AccordionTrigger` uses `text-base font-semibold text-primary`

Section header: eyebrow "Frequently Asked Questions" / `<h2>` "Common Questions About {course.title}"

```tsx
<Accordion openMultiple>
  {course.faqs.map((faq, i) => (
    <AccordionItem key={i} value={String(i)}>
      <AccordionTrigger>{faq.q}</AccordionTrigger>
      <AccordionContent>
        <p className="text-muted-text text-sm leading-relaxed">{faq.a}</p>
      </AccordionContent>
    </AccordionItem>
  ))}
</Accordion>
```

**Acceptance:**
- [ ] ≥ 5 FAQs shown per course
- [ ] Questions legible and not truncated on mobile
- [ ] FAQPage JSON-LD on the page matches these exact Q&A pairs

---

### S3-11 — Related Courses *(0.25 day)*

**Part of:** `/courses/[slug]/page.tsx` — `bg-cream` section

```ts
const relatedCourses = course.relatedSlugs
  .map((s) => courses.find((c) => c.slug === s))
  .filter(Boolean) as Course[]
```

- `grid grid-cols-1 sm:grid-cols-3 gap-6` — always 3 cards (guaranteed by content)
- Same card style as home courses grid (icon + title + short description + "Learn more")
- Section header: "You Might Also Like"

**Acceptance:**
- [ ] Always exactly 3 related courses (enforced by content type)
- [ ] Cards link to the correct `/courses/[slug]` pages
- [ ] No course links to itself as a related course

---

### S3-12 — CTA Banner *(0.25 day)*

**Part of:** `/courses/[slug]/page.tsx` — `bg-primary` section

Reuse the same CTA banner pattern from home and about:
- Arabic hadith + English translation
- `<h2>` — "Start Your {course.title} Journey Today"
- Subheading — "Book your free first class. No credit card, no commitment."
- Two CTAs: gold "Book Free Trial" + WhatsApp ghost

**Acceptance:**
- [ ] H2 includes the specific course title (not a generic heading)
- [ ] CTA buttons same style as home CTA banner

---

### S3-13 — StickyCourseCta (mobile) *(0.5 day)*

**File:** `frontend/src/components/courses/StickyCourseCta.tsx`

Client component (`'use client'`). Shows a fixed bottom bar on mobile after scrolling 400px past the top.

```tsx
'use client'
import { useState, useEffect } from 'react'
import { LinkButton } from '@/components/ui/link-button'
import { whatsappLink } from '@/config/site'

export function StickyCourseCta({ courseTitle }: { courseTitle: string }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll() // set initial state
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-primary border-t border-white/10 px-4 py-3 lg:hidden"
      role="complementary"
      aria-label="Course booking options"
    >
      <div className="flex gap-3 max-w-sm mx-auto">
        <LinkButton href="/contact" variant="gold" size="sm" className="flex-1 justify-center">
          Book Free Trial
        </LinkButton>
        <a
          href={whatsappLink(`I'm interested in ${courseTitle}`)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center rounded-xl border border-white/30 text-white text-sm font-medium py-2 hover:border-accent hover:text-accent transition-colors"
        >
          WhatsApp
        </a>
      </div>
    </div>
  )
}
```

Add `<div className="h-20 lg:hidden" aria-hidden="true" />` spacer before the closing `</>` in the page to prevent the last section from being hidden behind the sticky bar on mobile.

**Acceptance:**
- [ ] Sticky bar is hidden on `lg` and above (`lg:hidden`)
- [ ] Bar appears after ~400px scroll, not on page load
- [ ] Does not cause layout shift (fixed positioning, outside normal flow)
- [ ] With JS disabled, bar is never rendered (client component → no SSR)

---

### S3-14 — Dynamic page assembly + JSON-LD + generateStaticParams *(0.5 day)*

**File:** `frontend/src/app/(marketing)/courses/[slug]/page.tsx`

```ts
export function generateStaticParams() {
  return courses.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const course = courses.find((c) => c.slug === slug)
  if (!course) return {}
  return buildMetadata({
    title: course.seoTitle,
    description: course.seoDescription,
    path: `/courses/${slug}`,
  })
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const course = courses.find((c) => c.slug === slug)
  if (!course) notFound()
  // ...
}
```

JSON-LD injected at top of return:
```ts
const schemas = [
  courseSchema(course),
  breadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Courses', href: '/courses' },
    { name: course.title, href: `/courses/${course.slug}` },
  ]),
  faqSchema(course.faqs),
]
```

Page section order:
```
<CourseHero />            ← bg-primary
<CourseOutcomes />        ← bg-cream
<CourseCurriculum />      ← bg-white
<CoursePersonas />        ← bg-cream
<CourseTeachersStrip />   ← bg-white
<CoursePricingTeaser />   ← bg-cream
<CourseFAQ />             ← bg-white
<RelatedCourses />        ← bg-cream
<CourseCTABanner />       ← bg-primary
<div className="h-20 lg:hidden" aria-hidden="true" />  ← spacer for sticky bar
<StickyCourseCta courseTitle={course.title} />
```

All sections except `StickyCourseCta` are inline JSX in the page file (no separate component files — DRY violation risk is low since each section is only used once).

**Acceptance:**
- [ ] `pnpm build` lists all 11 `/courses/[slug]` routes as statically generated
- [ ] Navigating to an invalid slug (e.g. `/courses/fake`) returns 404
- [ ] All three JSON-LD scripts render in `<head>` (inspect via DevTools > Elements)

---

### S3-15 — Sitemap update *(0.25 day)*

**File:** `frontend/src/app/sitemap.ts`

Add `/courses` index to `staticRoutes`:
```ts
{ url: `${base}/courses`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
```

The 11 course routes (`courseRoutes`) are already in the sitemap from Sprint 1. No changes needed there.

**Acceptance:**
- [ ] `/sitemap.xml` includes `/courses` URL
- [ ] `/sitemap.xml` includes all 11 `/courses/[slug]` URLs
- [ ] No duplicate entries

---

### S3-16 — QA + Lighthouse *(0.5 day)*

- [ ] `pnpm typecheck` passes clean
- [ ] `pnpm lint` passes clean
- [ ] `pnpm build` completes — all 11 course routes listed
- [ ] Spot-check 3 course pages: Noorani Qaida, Tajweed, Female Teachers
- [ ] Lighthouse mobile on each: Performance ≥ 90, Accessibility ≥ 95, SEO = 100
- [ ] Schema.org validator: `Course`, `FAQPage`, and `BreadcrumbList` pass on each page
- [ ] Accordion opens and closes — keyboard accessible (Enter/Space)
- [ ] Sticky bar appears on mobile at ~400px scroll, hidden on desktop
- [ ] Related course links do not 404
- [ ] `/courses` index — all 11 cards, all link to correct detail pages

---

## Files created / modified in this sprint

```
frontend/src/
├── content/
│   └── courses.ts                            ← MODIFIED (expanded type + content)
│
├── lib/
│   └── schema.ts                             ← MODIFIED (adds courseSchema)
│
├── components/
│   └── courses/
│       └── StickyCourseCta.tsx               ← NEW (client component)
│
└── app/(marketing)/
    └── courses/
        ├── page.tsx                          ← NEW (courses index)
        └── [slug]/
            └── page.tsx                      ← NEW (course detail, all 11 pages)

frontend/src/app/sitemap.ts                   ← MODIFIED (adds /courses index route)
```

No new dependencies. No layout changes. No changes to existing page components.

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Accordion requires JS — FAQ not indexed by Google | FAQPage JSON-LD provides the Q&A to search engines regardless of rendering. The accordion is a UX enhancement only. |
| Teacher filtering returns 0 results for a course | Fallback to `featuredTeachers.slice(0, 3)` in the page component. Prevent via `specialtyTags` review in QA. |
| seoTitle > 60 chars | Enforced in content file with inline comments. Verify in QA with a character count script. |
| Related slugs point to non-existent course | Type safety — `relatedSlugs` are `string[]`, not validated at compile time. Verify in QA: `courses.find(c => c.slug === slug)` returns undefined for broken refs. |
| Next.js 16 async `params` — wrong usage | Always `await params` before destructuring. Pattern confirmed against `/docs/01-app/03-api-reference/04-functions/generate-static-params.md`. |
| StickyCourseCta causes CLS | Fixed positioning removes it from document flow — no CLS. Spacer div prevents content being hidden behind bar. |

---

## Owner inputs needed before sprint ends

- [ ] **Pricing page** — `/pricing` must exist (even as a stub) to avoid 404 on "View Pricing" link
- [ ] **Contact page** — `/contact` must exist for CTA buttons
- [ ] **Real course pricing** — actual USD pricing to add to Pricing Teaser cards (or confirm "contact for pricing" approach)
- [ ] **Spot check copy** — review at least 3 course pages on staging for accuracy of curriculum / FAQ content

---

## What this sprint does NOT deliver

- Country-specific course landing pages (Sprint 5)
- Trial booking form with backend (Sprint 4)
- Teacher profile detail pages — teacher cards are not links in this sprint
- Course review / rating system
- Video preview embeds (placeholder text used instead)
- Mobile swipe carousel for related courses
- Pricing page content (stub only — Sprint 4)
