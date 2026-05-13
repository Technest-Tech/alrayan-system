# Sprint 2 — Home & About — Hero Pages

**Duration:** 2 weeks
**Status:** Detailed, ready to implement.
**Sprint goal:** Ship the two pages that make first impressions — pixel-perfect, fully responsive, conversion-ready. All copy is real. Both pages pass Lighthouse ≥ 90 performance and 95 accessibility on mobile.

---

## Definition of Done

- [ ] `/` renders all 8 sections in correct order with real copy (no lorem ipsum)
- [ ] `/about` renders all 6 sections with real copy
- [ ] All content is extracted into `src/content/` files — zero hardcoded copy inside page components
- [ ] Teachers Strip on home links to `/about`, About Teachers Grid shows all 8–10 teachers
- [ ] Stats counters animate on scroll into view (respects `prefers-reduced-motion`)
- [ ] `EducationalOrganization` JSON-LD on `/` (from Sprint 1), `AboutPage` + `Person` JSON-LD on `/about`
- [ ] Canonical, OG tags, and Twitter card correct on both pages
- [ ] `pnpm typecheck` and `pnpm lint` pass clean
- [ ] `pnpm build` completes with no errors or warnings
- [ ] Lighthouse mobile (simulated throttling) on both pages: Performance ≥ 90, Accessibility ≥ 95, Best Practices = 100, SEO = 100
- [ ] Keyboard tab order logical on both pages; focus rings visible throughout
- [ ] Tested on iPhone SE (375 px) and Pixel 5 (393 px) — no overflow, no clipped text
- [ ] Owner reviews and approves both pages on staging

---

## Story Breakdown

### S2-01 — Content files scaffold *(0.5 day)*

Create all content files before writing any page component. Components import from here; copy never lives inline.

---

**File:** `frontend/src/content/teachers.ts`

```ts
export type Teacher = {
  id: string
  name: string
  nameArabic: string
  role: string
  specialties: string[]
  languages: string[]
  credentials: string
  bio: string
  isFemale: boolean
  yearsExperience: number
  studentsCount: number
}

export const teachers: Teacher[] = [
  // 8–10 entries. Each entry must have:
  // - Real-sounding name + Arabic transliteration
  // - Actual Islamic university credential (Al-Azhar, Umm Al-Qura, etc.)
  // - Bio: 2–3 sentences, specific, no marketing fluff
  // - At least one female teacher with isFemale: true (important for Female Teachers course)
]

// Home Teachers Strip only shows the first 4
export const featuredTeachers = teachers.slice(0, 4)
```

Populate with 8 complete entries. At least 3 must be `isFemale: true`.

---

**File:** `frontend/src/content/courses.ts`

```ts
export type Course = {
  slug: string              // matches /courses/[slug] route
  title: string
  shortDescription: string  // ≤ 120 chars — used on course cards
  longDescription: string   // 2–4 sentences — used on course detail pages (Sprint 3)
  icon: string              // lucide icon name, resolved in page components
  ageGroup?: string         // e.g. 'Ages 5–14' — shown as badge when present
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels'
  durationMonths?: string   // e.g. '2–4' — shown as badge when present
  features: string[]        // 4 bullet points for detail page (Sprint 3)
}

export const courses: Course[] = [
  // 10–11 entries matching the slugs in nav.ts and sitemap.ts
]
```

Slugs must match exactly: `noorani-qaida`, `quran-classes-for-kids`, `quran-classes-for-adults`, `tajweed-course`, `hifz-memorization`, `arabic-for-non-arabs`, `tafseer-course`, `islamic-studies`, `ijazah-program`, `ten-qiraat`, `female-quran-teachers`.

---

**File:** `frontend/src/content/testimonials.ts`

```ts
export type Testimonial = {
  id: string
  name: string       // first name + last initial only (privacy)
  location: string   // e.g. 'London, UK'
  country: string    // lowercase ISO-ish slug for future flag icons
  quote: string      // 1–3 sentences, specific to their course experience
  course: string     // display name of course they took
  rating: number     // always 5 for now
}

export const testimonials: Testimonial[] = [
  // 5–6 entries. Cover at least 3 different countries.
  // Mix of: kids parent, adult beginner, adult advanced, female teacher seeker
]
```

---

**File:** `frontend/src/content/stats.ts`

```ts
export type Stat = {
  value: string        // e.g. '10,000+'
  label: string        // e.g. 'Students Taught'
  description?: string // tooltip / accessible detail
}

export const stats: Stat[] = [
  { value: '10,000+', label: 'Students Taught',      description: 'Across 50+ countries worldwide' },
  { value: '50+',     label: 'Countries Served',     description: 'From USA to Malaysia' },
  { value: '100+',    label: 'Certified Teachers',   description: 'Al-Azhar & Ijazah certified' },
  { value: '4.9★',   label: 'Average Rating',        description: 'From 2,000+ verified reviews' },
]
```

---

**File:** `frontend/src/content/home.ts`

```ts
// Inline copy that lives only on the home page
export const homeContent = {
  hero: {
    arabicVerse: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    arabicVerseTranslation: 'In the name of Allah, the Most Gracious, the Most Merciful',
    headingStart: 'Learn',
    headingEmphasis: 'Quran Online',
    headingEnd: 'with Certified Teachers',
    subheading: 'Premium 1-on-1 classes in Quran, Tajweed, Hifz, Arabic, and Islamic Studies. Certified teachers from Al-Azhar. Students in 50+ countries.',
    ctaPrimary: 'Book Free Trial Class',
    ctaSecondary: 'Chat on WhatsApp',
    microcopy: '✓ Free first class · ✓ No credit card required · ✓ Cancel anytime',
  },
  trustBadges: [
    { icon: 'Users',        label: '1-on-1 Classes' },
    { icon: 'ShieldCheck',  label: 'Free First Class' },
    { icon: 'Heart',        label: 'Female Teachers Available' },
    { icon: 'Globe',        label: 'Native Arab Tutors' },
    { icon: 'GraduationCap', label: 'Ijazah-Certified' },
  ],
  whyUs: {
    eyebrow: 'Why Alrayan Academy',
    heading: 'Scholars, Not Just Teachers',
    body: "Every teacher at Alrayan holds an authenticated Ijazah — a chain of transmission going back to the Prophet ﷺ. We don't hire tutors; we partner with certified scholars.",
    items: [
      { icon: 'BookOpen',    title: 'Qualified Teachers',  desc: 'All teachers hold Ijazah and are graduates of Al-Azhar or equivalent Islamic universities.' },
      { icon: 'Clock',       title: 'Flexible Scheduling', desc: 'Classes 7 days a week across all timezones — mornings, afternoons, or evenings.' },
      { icon: 'ShieldCheck', title: 'Risk-Free Trial',     desc: 'Book your first class completely free. No credit card, no commitment.' },
    ],
    decorativeVerse: 'اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ',
    decorativeTranslation: '"Read in the name of your Lord who created." — Al-Alaq 96:1',
  },
  cta: {
    arabicHadith: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
    hadithTranslation: '"The best of you are those who learn the Quran and teach it." — Prophet Muhammad ﷺ',
    heading: 'Begin Your Quran Journey Today',
    subheading: 'Join 10,000+ students from 50+ countries. Your first class is completely free.',
    ctaPrimary: 'Book Free Trial Class',
    ctaSecondary: 'Chat on WhatsApp',
  },
}
```

---

**File:** `frontend/src/content/about.ts`

```ts
export const aboutContent = {
  hero: {
    eyebrow: 'Our Story',
    heading: 'Born From a Mission to Connect the World to the Quran',
    subheading: 'Alrayan Academy was founded with one conviction: every Muslim, wherever they live, deserves access to the same quality of Quran education that was once only available in Makkah and Cairo.',
    quickStats: [
      { value: '2015',     label: 'Founded' },
      { value: '10,000+', label: 'Students' },
      { value: '50+',     label: 'Countries' },
      { value: '100+',    label: 'Teachers' },
    ],
  },

  mission: {
    heading: 'Guided by Purpose',
    items: [
      {
        icon: 'Target',
        title: 'Our Mission',
        body: 'To make authentic, ijazah-certified Quran and Arabic education accessible to every Muslim family in the world — regardless of where they live or what schedule they keep.',
      },
      {
        icon: 'Eye',
        title: 'Our Vision',
        body: "A world where every Muslim can read the Quran with Tajweed, understand it in Arabic, and pass it on to the next generation — with an unbroken chain back to the Prophet ﷺ.",
      },
      {
        icon: 'Heart',
        title: 'Our Values',
        body: "Authenticity over shortcuts. Patience over speed. Community over transactions. We never compromise on the quality of teachers or the integrity of the Ijazah chain.",
      },
    ],
  },

  story: {
    heading: 'The Story of Alrayan',
    // Array of paragraph strings — kept in content not JSX so it can later be CMS-driven
    paragraphs: [
      '...paragraph 1...',
      '...paragraph 2...',
      '...paragraph 3...',
      '...paragraph 4...',
    ],
    blockquote: {
      arabic: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
      translation: '"The best of you are those who learn the Quran and teach it." — Prophet Muhammad ﷺ',
    },
  },

  approach: {
    heading: 'How We Teach',
    subheading: 'Our methodology is built on three pillars that set us apart from every other online academy.',
    items: [
      {
        icon: 'Link',
        title: 'Authenticated Ijazah Chain',
        body: "Every teacher at Alrayan holds an Ijazah — a certified license with an unbroken chain of transmission going back through the centuries to the Prophet ﷺ. We verify every teacher's chain before they join.",
        stat: '100% of teachers',
      },
      {
        icon: 'ShieldCheck',
        title: 'Rigorous Teacher Vetting',
        body: 'Less than 10% of applicants pass our process: degree verification, Tajweed test, live teaching observation, background check, and a 3-month probationary period.',
        stat: '< 10% acceptance rate',
      },
      {
        icon: 'Users',
        title: '1-on-1 Private Classes',
        body: 'No group classes. Every student gets their own teacher, their own schedule, and a curriculum paced to their individual level.',
        stat: '4.9★ average rating',
      },
    ],
  },
}
```

**Acceptance:**
- [ ] All six content files exist with complete, non-placeholder data
- [ ] TypeScript types are exported and used consistently
- [ ] No content strings exist inside page `.tsx` files (page files only import)

---

### S2-02 — Home page: Hero section *(0.5 day)*

**File:** `frontend/src/app/(marketing)/page.tsx` (assembled in S2-09)

Visual design:
- `min-h-[92vh]` so it fills the screen on landing without being exactly 100vh (avoids mobile browser chrome issues)
- `bg-primary` (#0B1F3A) with two decorative radial gradients at 7% opacity (gold bottom-left, green top-right)
- Additional `blur-3xl` circle top-right for depth
- Content left-aligned, `max-w-3xl`

Markup order inside `<Container>`:
1. Arabic Bismillah — `font-arabic text-accent text-2xl`, `dir="rtl" lang="ar"`, with English `aria-label`
2. `<h1>` — `.heading-display font-display text-white`. "Quran Online" wrapped in `<em className="text-accent not-italic">`
3. Subheading — `text-white/80 text-xl`
4. CTA row: `LinkButton href="/contact" variant="gold"` + WhatsApp ghost link
5. Microcopy — `text-white/50 text-sm`

```tsx
<section
  className="relative min-h-[92vh] flex items-center bg-primary overflow-hidden"
  aria-labelledby="hero-heading"
>
  {/* decorative gradients */}
  <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: '...' }} aria-hidden="true" />

  <Container className="relative py-32 lg:py-40">
    <div className="max-w-3xl">
      <p className="font-arabic text-accent text-2xl mb-6" dir="rtl" lang="ar" aria-label="...">
        {homeContent.hero.arabicVerse}
      </p>
      <h1 id="hero-heading" className="heading-display font-display text-white text-balance mb-6">
        {homeContent.hero.headingStart}{' '}
        <em className="text-accent not-italic">{homeContent.hero.headingEmphasis}</em>
        {' '}{homeContent.hero.headingEnd}
      </h1>
      {/* ... */}
    </div>
  </Container>
</section>
```

**Acceptance:**
- [ ] Navbar is transparent over hero (white text), turns white after scroll
- [ ] CTA buttons are visually distinct (gold primary, ghost secondary)
- [ ] Bismillah renders in Amiri font, correct RTL direction
- [ ] No text overflow on iPhone SE (375px)

---

### S2-03 — Home: Trust Badges + Stats counters *(0.5 day)*

**Trust Badges** — directly below hero, `bg-cream` section:
- `<ul role="list">` of pill badges: `flex flex-wrap justify-center gap-4`
- Each badge: `bg-white border border-border-soft rounded-full px-5 py-3`, icon left + label
- Icons from `lucide-react`, mapped by string name from `homeContent.trustBadges`

**Stats counters** — white section below badges:
- `<dl className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">`
- `<dt>` = value in `.heading-xl font-display text-secondary`
- `<dd>` = label in `text-muted-text text-sm uppercase tracking-wide`
- Numbers animate from 0 to target when the `<dl>` scrolls into view

**Scroll-in animation hook:**

```ts
// frontend/src/hooks/useCountUp.ts
'use client'
import { useEffect, useRef, useState } from 'react'

export function useCountUp(target: number, duration = 1500) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        // Skip animation if reduced motion preferred
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          setCount(target)
          return
        }
        const start = performance.now()
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1)
          setCount(Math.floor(progress * target))
          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { threshold: 0.3 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration])

  return { count, ref }
}
```

The stat value strings like `'10,000+'` contain a suffix. Strip trailing non-numeric characters, animate the number, reattach suffix on render.

**Acceptance:**
- [ ] Badges wrap cleanly on 375px (two rows max)
- [ ] Stats animate on first scroll into view; do not re-animate on subsequent scrolls
- [ ] With `prefers-reduced-motion: reduce`, numbers appear instantly (no animation)
- [ ] Numbers are accessible: `<dt>` has the animated value, the final value is in `aria-label` on the element so screen readers announce the real number

---

### S2-04 — Home: Courses Grid *(0.5 day)*

- Import `courses` from `src/content/courses.ts`
- `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`
- Each card is an `<a href="/courses/${slug}">` — full card is clickable
- Card anatomy: icon square (top-left) + arrow (top-right, slides right on group-hover) / title / short description / "Learn more" text link
- Icon squares: `bg-secondary/10` with `text-secondary` lucide icon. Icon name from `courses.icon` — resolved via a local `iconMap` record in the page file
- `"View All Courses"` outline button centred below grid links to `/courses` (stub page, Sprint 3)
- Display all 10–11 courses (not paginated)

**Acceptance:**
- [ ] Cards are equal height within each row (flexbox column layout)
- [ ] Arrow icon nudges right on hover
- [ ] Entire card surface is clickable (no nested interactive elements inside the `<a>`)
- [ ] `/courses` link exists and does not 404 (can be a stub `not-found` redirect for now)

---

### S2-05 — Home: Why Alrayan *(0.5 day)*

Two-column layout (`lg:grid-cols-2 gap-16 items-center`):

**Left column:**
- Eyebrow text (secondary green, uppercase, small)
- `<h2>` — "Scholars, Not Just Teachers"
- Body paragraph
- Feature list: `<ul>` of 3 items, each with icon square + title + description
- Two CTA buttons: primary ("Meet Our Teachers" → `/about`) + outline ("See Pricing" → `/pricing`)

**Right column (desktop only, `hidden lg:block`):**
- Dark card `bg-primary rounded-3xl p-10 text-white`
- Decorative circle `bg-secondary/20 absolute top-right`
- Arabic verse + English translation in italic
- 2×2 grid of stat values in gold `font-display`
- `aria-hidden="true"` — purely decorative; stats are already announced in the Stats section

**Acceptance:**
- [ ] Right column hidden on mobile (`hidden lg:block`) — not just invisible
- [ ] Feature list icons use gold (`text-accent`) in `bg-accent/15` squares
- [ ] "Meet Our Teachers" links to `/about` page

---

### S2-06 — Home: Teachers Strip *(0.5 day)*

- Import `featuredTeachers` (first 4 from teachers.ts)
- `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6`, `bg-cream` section
- Each card: centered layout — avatar circle / name / role / specialty pills (max 2) / stats line
- Avatar circle: `size-16 bg-primary text-accent font-display font-semibold text-2xl` showing first letter of name
- Specialty pills: cream background, small text, max 2 shown (third+ truncated silently)
- Stats line: `{yearsExperience} years · {studentsCount}+ students`, `text-muted-text text-xs`
- Below grid: `LinkButton href="/about" variant="outline"` — "Meet All Our Teachers"

No teacher photos in this sprint (placeholder initials). Photo upload is an owner input for Sprint 3+.

**Acceptance:**
- [ ] All 4 featured teachers show correct data from `teachers.ts`
- [ ] "Meet All Our Teachers" routes to `/about`
- [ ] Cards are equal height

---

### S2-07 — Home: Testimonials *(0.5 day)*

- Import `testimonials` from `src/content/testimonials.ts`
- `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`, `bg-cream` section
- Each card: 5 stars / blockquote / footer (avatar initial + name + location · course)
- Stars: `fill-accent text-accent`, container `aria-label="5 out of 5 stars"`, individual stars `aria-hidden`
- Blockquote uses `&ldquo;` / `&rdquo;` entities
- Footer avatar: same initial pattern as teacher avatars

No carousel in Sprint 2 — static 3-column grid. Mobile swipe carousel is a Sprint 3+ enhancement.

**Acceptance:**
- [ ] 5 or 6 testimonials render
- [ ] Star rating is accessible (`aria-label` on the flex container)
- [ ] No horizontal overflow on 375px

---

### S2-08 — Home: CTA Banner *(0.25 day)*

- `<Section bg="primary">` — navy background, white text
- Arabic hadith centred + small italic English translation below
- `<h2>` — "Begin Your Quran Journey Today" in `font-display`
- Subheading in `text-white/70`
- Two CTAs: `LinkButton variant="gold"` + WhatsApp ghost link (same pattern as hero)
- `aria-labelledby` pointing to the h2 id

---

### S2-09 — Home page assembly + metadata *(0.25 day)*

**File:** `frontend/src/app/(marketing)/page.tsx`

Assembly order:
```
<Hero />            ← full-height bg-primary
<TrustBadges />     ← bg-cream
<Stats />           ← bg-white
<CoursesGrid />     ← bg-cream
<WhyAlrayan />      ← bg-white
<TeachersStrip />   ← bg-cream
<Testimonials />    ← bg-white  (alternating cream/white continues)
<CtaBanner />       ← bg-primary
```

Note the alternating white / cream / white / cream pattern. This is intentional and must be preserved.

```ts
export const metadata: Metadata = buildMetadata({
  title: 'Online Quran Academy | 1-on-1 Classes | Alrayan Academy',
  description: 'Learn Quran online with certified teachers from Al-Azhar. 1-on-1 Tajweed, Hifz, Arabic, and Islamic studies classes. Free trial available worldwide.',
  path: '/',
})
```

JSON-LD: `organizationSchema()` from Sprint 1 — already wired, no changes needed.

**Acceptance:**
- [ ] Background alternation is exactly: primary / cream / white / cream / white / cream / white / primary
- [ ] Canonical URL is `https://alrayan-academy.com/` (no trailing path)
- [ ] OG image defaults to `/og-default.jpg`

---

### S2-10 — About: Hero *(0.25 day)*

**File:** `frontend/src/app/(marketing)/about/page.tsx`

- Same decorative gradient treatment as home hero (different gradient positions)
- `pt-40 pb-24` (no min-height — about hero is shorter, content-driven)
- Text centered (`text-center`)
- Eyebrow / `<h1>` / subheading
- Quick-stats row: 4 numbers (Founded / Students / Countries / Teachers) in gold `font-display`

```tsx
<section className="relative bg-primary overflow-hidden pt-40 pb-24" aria-labelledby="about-hero-heading">
  <Container className="relative text-center">
    <p className="text-accent text-sm font-semibold uppercase tracking-widest mb-4">
      {aboutContent.hero.eyebrow}
    </p>
    <h1 id="about-hero-heading" className="heading-display font-display text-white text-balance mb-6 max-w-4xl mx-auto">
      {aboutContent.hero.heading}
    </h1>
    <p className="text-white/70 text-xl leading-relaxed max-w-2xl mx-auto">
      {aboutContent.hero.subheading}
    </p>
    <div className="mt-12 flex flex-wrap justify-center gap-8">
      {aboutContent.hero.quickStats.map(({ value, label }) => (
        <div key={label}>
          <p className="text-accent text-3xl font-display font-semibold">{value}</p>
          <p className="text-white/60 text-sm mt-1">{label}</p>
        </div>
      ))}
    </div>
  </Container>
</section>
```

---

### S2-11 — About: Mission / Vision / Values *(0.5 day)*

- `<Section>` (white background)
- Centred `<h2>` above
- `grid md:grid-cols-3 gap-8`
- Each card: `bg-cream rounded-2xl p-8 border border-border-soft`
- Icon square: `bg-accent/15`, icon in `text-accent`
- Icons resolved from `aboutContent.mission.items[n].icon` string via `iconMap` (same pattern as courses)
- No hover state — these are static informational cards

**Acceptance:**
- [ ] Three cards stack single-column on mobile, 3-column on md+
- [ ] Mission / Vision / Values are in that exact order (left to right)

---

### S2-12 — About: Story of Alrayan *(0.5 day)*

- `<Section bg="cream">`
- Content column `max-w-3xl mx-auto` — comfortable reading measure
- Eyebrow "Our History" in secondary green
- `<h2>` — "The Story of Alrayan"
- Paragraphs: `space-y-6`, each `text-primary/80 text-lg leading-relaxed`
- Block quote below paragraphs: `border-l-4 border-accent pl-6`, Arabic text + footer citation

The story should cover:
1. Founding context — why it was created, the gap that existed
2. Early growth — first years, the non-negotiable Ijazah standard
3. Scale milestones — 1,000 → 5,000 → 10,000 students
4. Name meaning — Alrayan (gate of Paradise for those who fast) as a reminder that this is worship

**Acceptance:**
- [ ] Line length is comfortable (max ~75 chars on desktop via `max-w-3xl`)
- [ ] Block quote uses `<blockquote>` semantic element with `<footer>` for attribution
- [ ] Arabic in blockquote is `dir="rtl" lang="ar"`

---

### S2-13 — About: Our Approach *(0.5 day)*

- `<Section>` (white background)
- Centred section header: eyebrow / `<h2>` / subheading
- `grid md:grid-cols-3 gap-8`
- Each card: `bg-primary rounded-2xl p-8 text-white relative overflow-hidden`
- Decorative circle: `absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-8 -translate-y-8`
- Inside card: stat line (accent, small caps) / icon square / title / body
- All three stat lines must be visually consistent: same font size, same color

Cards in order:
1. "Authenticated Ijazah Chain" — stat: `100% of teachers`
2. "Rigorous Teacher Vetting" — stat: `< 10% acceptance rate`
3. "1-on-1 Private Classes" — stat: `4.9★ average rating`

**Acceptance:**
- [ ] Dark cards readable at WCAG AA contrast (white on #0B1F3A is 11:1 — fine)
- [ ] Cards stack gracefully on mobile
- [ ] Decorative circle is `aria-hidden`

---

### S2-14 — About: Teachers Grid *(1 day)*

- `<Section bg="cream">`
- Section header: eyebrow / `<h2>` "Meet Our Scholars" / subheading
- `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6`
- Render **all** teachers from `teachers.ts` (not just featured 4)

Card anatomy (top to bottom):
```
┌─────────────────────────────────┐
│  [Avatar]  Name                 │
│            Role                 │
│  X yrs · Y+ students            │
│  [Specialty] [Specialty]        │
│                                 │
│  Bio text (line-clamp-3)        │
│  ─────────────────────────────  │
│  Teaches in: Arabic, English    │
└─────────────────────────────────┘
```

- Avatar: `size-14 rounded-full bg-primary text-accent font-display font-semibold text-xl` — first letter of name
- Specialty pills: cream bg, `text-xs`, show at most 3 (remaining silently hidden)
- Bio: `line-clamp-3` to maintain equal card heights — full text available in future teacher profile pages
- Language line: `text-xs text-muted-text`, separated from bio by border-top

Below grid: paragraph + two CTAs ("Book a Free Trial Class" → `/contact`, "Ask About a Teacher" → whatsapp link with pre-filled message)

No teacher profile pages in this sprint — cards are not links.

**Acceptance:**
- [ ] All 8–10 teachers render from content file (no hardcoded names in TSX)
- [ ] Female teacher badge or indicator visible (at minimum: role field reflects it, e.g. "Senior Female Quran Teacher")
- [ ] Bio is clamped to 3 lines — no card taller than others due to longer bio
- [ ] Grid is 4 columns on lg, 2 columns on sm, 1 column on mobile

---

### S2-15 — About: CTA Banner *(0.25 day)*

- Same `<Section bg="primary">` pattern as home CTA banner
- 5 stars centred above the heading
- `<h2>` — "Join 10,000+ Students Learning With Us"
- Subheading
- Two CTAs: gold primary + WhatsApp ghost

---

### S2-16 — About page assembly + JSON-LD schemas *(0.5 day)*

**File:** `frontend/src/app/(marketing)/about/page.tsx`

Assembly order:
```
<AboutHero />              ← bg-primary
<MissionVisionValues />    ← bg-white
<StoryOfAlrayan />         ← bg-cream
<OurApproach />            ← bg-white
<TeachersGrid />           ← bg-cream
<CtaBanner />              ← bg-primary
```

```ts
export const metadata: Metadata = buildMetadata({
  title: 'About Alrayan Academy | Our Story, Mission & Teachers',
  description: 'Learn how Alrayan Academy connects Muslims worldwide with Al-Azhar certified Quran teachers. Our story, mission, teaching approach, and full teacher team.',
  path: '/about',
})
```

**JSON-LD: add two new helpers to `src/lib/schema.ts`:**

```ts
export function aboutPageSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: `About ${siteConfig.name}`,
    url: `${siteConfig.url}/about`,
    description: 'Learn about Alrayan Academy — our mission, story, teaching approach, and certified teachers.',
    publisher: {
      '@type': 'EducationalOrganization',
      name: siteConfig.name,
      url: siteConfig.url,
    },
  }
}

export function personSchema(teacher: Teacher) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: teacher.name,
    jobTitle: teacher.role,
    worksFor: { '@type': 'EducationalOrganization', name: siteConfig.name },
    knowsLanguage: teacher.languages,
    description: teacher.bio,
  }
}
```

Inject in page:

```tsx
const schemas = [aboutPageSchema(), ...teachers.map(personSchema)]
return (
  <>
    {schemas.map((schema, i) => (
      <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    ))}
    {/* sections */}
  </>
)
```

**Acceptance:**
- [ ] Google Rich Results Test on `/about` finds `AboutPage` schema
- [ ] `Person` schema present for every teacher (validate with structured data tool)
- [ ] No duplicate `@context` warnings

---

### S2-17 — QA + Lighthouse *(0.5 day)*

- [ ] `pnpm typecheck` passes clean
- [ ] `pnpm lint` passes clean (zero warnings, zero errors)
- [ ] `pnpm build` completes with all routes listed
- [ ] Lighthouse mobile `/`: Performance ≥ 90, Accessibility ≥ 95, Best Practices = 100, SEO = 100
- [ ] Lighthouse mobile `/about`: same thresholds
- [ ] Tab through `/`: focus rings on every interactive element, logical tab order
- [ ] Tab through `/about`: same
- [ ] iPhone SE (375px): hero text doesn't overflow, CTA buttons stack vertically, course grid is single column
- [ ] Pixel 5 (393px): same checks
- [ ] Disable JS in Chrome DevTools — both pages fully readable (content is SSR, no client-only rendering for copy)
- [ ] Test with OS `prefers-reduced-motion: reduce` — stats appear instantly, no animation

---

## Files created / modified in this sprint

```
frontend/src/
├── content/                          ← NEW directory
│   ├── about.ts                      ← NEW
│   ├── courses.ts                    ← NEW
│   ├── home.ts                       ← NEW
│   ├── stats.ts                      ← NEW
│   ├── teachers.ts                   ← NEW
│   └── testimonials.ts               ← NEW
│
├── hooks/
│   └── useCountUp.ts                 ← NEW (scroll-triggered counter animation)
│
├── app/(marketing)/
│   ├── page.tsx                      ← MODIFIED (imports from content/, adds Teachers Strip)
│   └── about/
│       └── page.tsx                  ← NEW
│
└── lib/
    └── schema.ts                     ← MODIFIED (adds aboutPageSchema, personSchema)
```

Nothing else changes. No new dependencies. No layout changes.

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Teacher photos not available | Use initial-avatar circles throughout Sprint 2. Add `photoUrl?: string` to `Teacher` type so photos can be dropped in Sprint 3+ without refactoring. |
| Copy needs owner approval | Mark all content files with `// PLACEHOLDER — owner to review` comments. Ship with placeholder copy, owner reviews on staging before Sprint 3 starts. |
| Stats animation causes CLS | Render initial `0` server-side; animate client-side after hydration. Avoids layout shift since the element size is fixed. |
| `useCountUp` breaks SSR | Mark the stats section as `'use client'` or wrap in a client component; keep the parent page as a server component. |
| Course slugs drift from nav.ts | Single source of truth: `courses.ts` exports the slugs. `nav.ts` should import from `courses.ts` in a future refactor; for now, manually keep in sync and add a note. |
| Testimonial quotes feel fake | Owner provides real testimonials before staging review. Placeholder quotes are structurally correct but flagged for replacement. |

---

## Owner inputs needed before sprint ends

- [ ] **Real testimonials** — at least 5, covering different countries and courses
- [ ] **Teacher roster** — confirm the 8–10 teachers, their real names, credentials, and bios (or approve placeholders)
- [ ] **Teacher photos** — optional for Sprint 2, but hand off now so they can be added without sprint work
- [ ] **Academy founding story** — confirm the 2015 founding year, the "gate of Paradise" name origin story, and growth milestones
- [ ] **WhatsApp number** — confirm or accept the placeholder (`201000000000`)

---

## What this sprint does NOT deliver

- Working course detail pages (Sprint 3)
- Trial booking form (Sprint 4)
- Country/regional landing pages (Sprint 5)
- Blog / CMS (Sprint 6)
- Admin panel (Sprint 7)
- Teacher profile detail pages
- Mobile swipe carousel for testimonials
- Teacher photos (placeholder initials used throughout)
- Pricing page (referenced but stub only)
