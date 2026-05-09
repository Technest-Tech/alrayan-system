# Sprint 2 — Home & About — Hero Pages  *(OVERVIEW)*

> Detailed plan will be written at the start of Sprint 2, after Sprint 1 ships.

**Duration:** 2 weeks
**Status:** Overview only

---

## Goal

Ship the two pages that make first impressions — pixel-perfect, fully responsive, conversion-ready.

## Pages

- `/` — Home
- `/about` — About + Teachers preview

## Scope

**Home page sections (in order):**
1. Hero — display-serif H1 with primary keyword "Online Quran Academy", subhead, two CTAs (Free Trial primary green, WhatsApp gold), trust microcopy ("Free first class • 30-day money back")
2. Trust badges row — 5 horizontal pill badges (1-on-1, Free Trial, Female Teachers, Native Arab Tutors, Ijazah-Certified)
3. Stats counters — 4 numbers, animate on scroll into view (10,000+ students / 50+ countries / 100+ teachers / 4.9 rating)
4. Courses grid — 8–10 course cards linking to `/courses/[slug]`, gold accent on hover
5. "Why Alrayan" — 3-column feature block with icon + title + 1-line description
6. Teachers strip — 4–6 teacher avatars with name + credentials, link to /about
7. Testimonials — carousel or 3-column on desktop, swipe on mobile
8. CTA banner — primary green block with H2 + free trial button

**About page sections:**
1. Hero — story-led headline + subhead
2. Mission / Vision / Values — 3 cards
3. The Story of Alrayan — long-form copy (1 column, comfortable line length)
4. Our Approach — methodology, ijazah lineage, teacher vetting
5. Teachers grid — full grid of all teachers (initially 8–10) with bios on hover/click
6. CTA banner

## Components built

- `Hero`, `TrustBadges`, `StatsCounters`, `CoursesGrid` (course card variant), `WhyUs`, `TeachersStrip`, `Testimonials`, `CtaBanner`, `MissionVisionValues`, `StoryBlock`

## Content files populated

- `frontend/src/content/home.ts` (hero, why-us, cta copy)
- `frontend/src/content/about.ts` (story, mission, values)
- `frontend/src/content/testimonials.ts` (5–6 realistic ones)
- `frontend/src/content/stats.ts`
- `frontend/src/content/teachers.ts` (8–10 entries with credentials, languages, specialties)
- `frontend/src/content/courses.ts` (10–11 entries — minimum fields: slug, title, shortDescription, icon)

## SEO

- Home: title `Online Quran Academy | 1-on-1 Classes | Alrayan Academy`, `EducationalOrganization` JSON-LD
- About: `AboutPage` schema, `Person` schema for teachers if photos provided

## Out of scope

- Course detail pages (Sprint 3)
- Working forms (Sprint 4)
- Country pages (Sprint 5)

## Definition of Done

- Both pages live on staging
- Lighthouse mobile ≥ 90 perf, 95 a11y, 100 SEO on both
- Animations respect `prefers-reduced-motion`
- All copy is real (not lorem)
- Owner reviews and approves
