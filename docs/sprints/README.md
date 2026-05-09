# Sprint Roadmap

7 sprints × 2 weeks each ≈ **14 weeks** to v1 launch.

> **Process:** Only Sprint 1 is fully detailed today. Each subsequent sprint will be expanded into a complete plan **just before** its implementation begins, so plans incorporate what we learned from the prior sprint instead of going stale.

---

## Sprint summary

| # | Title | Focus | Est. duration | Status |
|---|---|---|---|---|
| 1 | [Foundation & Design System](sprint-01-foundation-design-system.md) | Project bootstrap, design tokens, layout shell | 2 weeks | **PLANNED — DETAILED** |
| 2 | [Home & About — Hero Pages](sprint-02-home-about.md) | The two highest-polish marketing pages | 2 weeks | Overview only |
| 3 | [Course Pages](sprint-03-course-pages.md) | All 11 course detail pages, dynamic routing | 2 weeks | Overview only |
| 4 | [Conversion Pages + Backend](sprint-04-conversion-backend.md) | Pricing, FAQ, Contact + Laravel API for forms | 2 weeks | Overview only |
| 5 | [Country Landing Pages + SEO](sprint-05-country-seo.md) | USA/UK/CA/AU pages, schema, sitemap, OG | 2 weeks | Overview only |
| 6 | [Blog + Headless CMS](sprint-06-blog-cms.md) | Blog index, post pages, Laravel content models | 2 weeks | Overview only |
| 7 | [Admin Panel + Launch](sprint-07-admin-launch.md) | Filament admin, optimization, launch readiness | 2 weeks | Overview only |

---

## What "done" means for each sprint

Every sprint must end with:

1. ✅ All scoped pages/features deployed to **staging** and clickable
2. ✅ Lighthouse score ≥ 90 on every new page (mobile)
3. ✅ TypeScript: no `any`, no errors
4. ✅ Lint passes
5. ✅ At least one test (smoke test minimum) for any new backend endpoint
6. ✅ Demo video or screenshots reviewed by owner
7. ✅ Owner sign-off → merge to `main`

---

## Sprint 1 — Foundation & Design System  *(DETAILED)*

**Goal:** project initialized, design system in code, layout shell + WhatsApp + base components ready. End of sprint = empty pages render with the right look-and-feel.

**Deliverables:**
- Monorepo set up (`frontend/` + `backend/`)
- Next.js 15 + Tailwind + shadcn primitives configured with the locked design system
- Global layout: Navbar (sticky, blur on scroll), Footer, Floating WhatsApp button
- Base components: Button, Container, Card, Section, Input
- Fonts loaded via `next/font` (Cormorant, Fraunces, Inter, Amiri)
- `site.ts` config + `nav.ts` populated
- Logo SVG (placeholder, navy + gold, Arabic + English wordmark)
- `robots.ts` + `sitemap.ts` skeleton
- Laravel 11 scaffold with `/api/v1/up` health endpoint
- CI: typecheck + lint on every PR
- Staging deployed to Vercel

→ Full plan: [sprint-01-foundation-design-system.md](sprint-01-foundation-design-system.md)

---

## Sprint 2 — Home & About — Hero Pages  *(OVERVIEW)*

**Goal:** the two pages that decide every first impression are pixel-perfect and fully responsive.

**Pages built:** `/`, `/about`

**Highlights:**
- Hero with display serif H1, gold accent rule, dual CTAs (primary trial + WhatsApp)
- Trust badges row (1-on-1, free trial, female teachers available, native Arab tutors, Ijazah-certified)
- Animated stats counters (10,000+ students, 50+ countries, 100+ teachers)
- Course grid (10 cards linking to placeholder course routes)
- Testimonial section (5–6 realistic quotes)
- Teachers strip (4–6 SVG-initial profile cards)
- Mission/vision/story sections on About
- CTA banner before footer
- All copy from `frontend/src/content/home.ts` and `about.ts`

**Out of scope:** course detail pages, forms.

→ Detailed plan written at start of Sprint 2.

---

## Sprint 3 — Course Pages  *(OVERVIEW)*

**Goal:** all 11 courses live as fully SEO-optimized landing pages.

**Pages built:**
- `/courses` index
- `/courses/[slug]` for: noorani-qaida, quran-classes-for-kids, quran-classes-for-adults, tajweed-course, hifz-memorization, arabic-for-non-arabs, islamic-studies, ijazah-program, tafseer-course, ten-qiraat, female-quran-teachers

**Highlights:**
- Single dynamic route powered by `frontend/src/content/courses.ts`
- Each page: hero (with primary keyword H1), what-you-learn, curriculum modules, who-it's-for, pricing teaser, course-specific FAQ accordion, related courses, sticky trial-CTA on scroll
- `Course` + `FAQPage` JSON-LD schema injected per page
- All pages added to sitemap
- Fully written copy for all 11 courses (no lorem ipsum)

**Out of scope:** form submission backend (still mocked), country pages, blog.

→ Detailed plan written at start of Sprint 3.

---

## Sprint 4 — Conversion Pages + Backend  *(OVERVIEW)*

**Goal:** money pages live and forms actually work end-to-end.

**Pages built:** `/pricing`, `/faq`, `/contact`

**Backend built (Laravel):**
- Migrations + models: `TrialBooking`, `ContactMessage`
- Endpoints: `POST /api/v1/trial-bookings`, `POST /api/v1/contacts`, `GET /api/v1/up`
- FormRequests with full validation
- Mailables: `TrialBookingAdminNotification`, `TrialBookingConfirmation`, `ContactReceived`
- Queue worker on the VPS (systemd service)
- Resend / Brevo email integration
- hCaptcha verification middleware
- Rate limiting (5/min per IP on form endpoints)
- Booking reference generator (`TB-2026-NNNN`)
- Feature tests for both endpoints
- CORS configured to allow only the production + staging frontends

**Frontend:**
- Pricing tiers from `pricing.ts` with "Most Popular" highlight + sibling discount note
- FAQ accordion (FAQPage schema)
- Contact page with `TrialBookingForm` (react-hook-form + zod) — name, email, country, age group, course interest, preferred time, optional message
- Success state with WhatsApp CTA and booking reference

→ Detailed plan written at start of Sprint 4.

---

## Sprint 5 — Country Landing Pages + SEO  *(OVERVIEW)*

**Goal:** Google Ads can run safely. Every page has perfect schema, sitemap, OG.

**Pages built:** `/countries/usa`, `/countries/uk`, `/countries/canada`, `/countries/australia`

**Highlights:**
- Country-specific copy: timezone-friendly schedule mention, locale testimonials, region-specific FAQs, currency-aware pricing display, `LocalBusiness` schema
- Each ≥ 60% unique content from siblings — no duplicate-content penalties
- Full schema sweep across the site:
  - `EducationalOrganization` on home + about
  - `Course` on every course page
  - `FAQPage` on FAQ + course pages
  - `BreadcrumbList` everywhere
  - `LocalBusiness` on country pages
- `next-sitemap` generating multilingual-ready sitemap
- `robots.ts` allow all in prod, disallow all in staging
- Open Graph image generation (static for v1, dynamic with `@vercel/og` if time allows)
- Lighthouse audit on home + 3 country pages → fix anything < 95
- Search Console + Bing Webmaster Tools setup, sitemap submitted

→ Detailed plan written at start of Sprint 5.

---

## Sprint 6 — Blog + Headless CMS  *(OVERVIEW)*

**Goal:** owner can publish blog content from an admin without redeploying.

**Backend:**
- Migrations + models: `Course`, `Teacher`, `BlogPost`, `BlogCategory`
- Public endpoints: `GET /api/v1/courses`, `GET /api/v1/blog`, `GET /api/v1/blog/{slug}`, `GET /api/v1/teachers`
- `Course` and `Teacher` migrated from `frontend/src/content/*.ts` to DB; static files become fallback only
- Outbound webhook: when content publishes, hit Next.js `/api/revalidate` so new content appears in seconds

**Frontend:**
- Blog index `/blog` with category filter, pagination, featured post hero
- Blog post `/blog/[slug]` with cover image, author byline, social share, related posts, table of contents for long posts
- ISR with 1-hour revalidate + on-demand revalidation from Laravel webhook
- Schema: `BlogPosting` per post

**Content seed:** 3–5 starter blog posts (real, useful — e.g. "How to Choose an Online Quran Teacher", "5 Ways to Help Your Child Memorize Quran", "Tajweed for Adults: Where to Begin")

→ Detailed plan written at start of Sprint 6.

---

## Sprint 7 — Admin Panel + Launch  *(OVERVIEW)*

**Goal:** owner can self-serve content + bookings. Site is launch-ready.

**Backend:**
- Filament 3 admin panel at `https://api.alrayan-academy.com/admin`
- Resources: Trial Bookings (read + status), Contact Messages (read + reply), Courses (CRUD), Teachers (CRUD), Blog Posts (CRUD), Users (admin invites)
- Roles via Spatie Permission: super-admin, editor
- 2FA on admin login (Filament plugin)
- Backup script + cron (Backblaze B2 daily)
- Sentry wired in

**Frontend:**
- Performance pass: image optimization, font preloading, third-party script audit, bundle analysis
- Accessibility audit (axe + manual keyboard test)
- 404 + error pages branded
- Cookie consent banner (only if GA4 enabled)
- Privacy Policy + Terms pages

**Launch checklist (see [DEPLOYMENT-GUIDE.md](../DEPLOYMENT-GUIDE.md)):**
- DNS cutover
- Search Console verification
- Sitemap submitted
- GA4 + Meta Pixel live
- UptimeRobot monitoring on
- Owner trained on admin panel (recorded walkthrough)
- Day-1 post-launch QA across mobile + desktop

→ Detailed plan written at start of Sprint 7.

---

## Backlog (post-launch, not in v1 scope)

These are explicitly deferred to keep v1 focused.

- Arabic RTL site (Phase 2)
- Stripe subscriptions
- Student dashboard
- Teacher booking calendar
- Live class recordings library
- Affiliate / referral program
- Multi-language blog
- Newsletter (ConvertKit / Mailerlite integration)
- A/B testing framework

Track these in [../../TODO.md](../../TODO.md) as they get raised.
