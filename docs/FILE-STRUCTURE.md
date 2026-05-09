# File Structure

## Top-level (monorepo)

```
site/
├── frontend/                  # Next.js 15 app
├── backend/                   # Laravel 11 API
├── docs/                      # All documentation (this folder)
├── .github/
│   └── workflows/
│       ├── frontend-ci.yml
│       └── backend-deploy.yml
├── .gitignore
├── README.md                  # Top-level: how to run both
└── TODO.md                    # Open questions, assumptions
```

---

## Frontend (`site/frontend/`)

```
frontend/
├── public/
│   ├── favicon.ico
│   ├── favicon-32.png
│   ├── apple-touch-icon.png
│   ├── og-default.jpg          # 1200×630 social share
│   ├── logo/
│   │   ├── alrayan-mark.svg    # Just the icon
│   │   ├── alrayan-full.svg    # Icon + wordmark (navy + gold)
│   │   └── alrayan-white.svg   # For dark backgrounds
│   └── images/
│       ├── hero/
│       ├── teachers/           # SVG initial-circle placeholders
│       └── courses/            # Course illustrations / icons
│
├── src/
│   ├── app/                    # App Router
│   │   ├── (marketing)/        # Group for public marketing pages
│   │   │   ├── layout.tsx      # Navbar + Footer + WhatsApp button
│   │   │   ├── page.tsx        # / (home)
│   │   │   ├── about/page.tsx
│   │   │   ├── pricing/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   ├── faq/page.tsx
│   │   │   ├── courses/
│   │   │   │   ├── page.tsx               # Courses index (optional)
│   │   │   │   └── [slug]/page.tsx        # Dynamic course page
│   │   │   ├── countries/
│   │   │   │   └── [country]/page.tsx     # USA/UK/CA/AU landing
│   │   │   └── blog/
│   │   │       ├── page.tsx
│   │   │       └── [slug]/page.tsx
│   │   ├── api/
│   │   │   ├── revalidate/route.ts        # On-demand ISR webhook
│   │   │   └── proxy/                     # (Optional) BFF for forms
│   │   ├── layout.tsx                     # Root layout — fonts, html
│   │   ├── not-found.tsx
│   │   ├── robots.ts                      # Generates /robots.txt
│   │   └── sitemap.ts                     # Generates /sitemap.xml
│   │
│   ├── components/
│   │   ├── ui/                 # shadcn primitives (button, input, card)
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── WhatsAppButton.tsx
│   │   │   └── Container.tsx
│   │   ├── home/
│   │   │   ├── Hero.tsx
│   │   │   ├── TrustBadges.tsx
│   │   │   ├── CoursesGrid.tsx
│   │   │   ├── StatsCounters.tsx
│   │   │   ├── Testimonials.tsx
│   │   │   ├── TeachersStrip.tsx
│   │   │   └── CTASection.tsx
│   │   ├── course/
│   │   │   ├── CourseHero.tsx
│   │   │   ├── CourseCurriculum.tsx
│   │   │   └── CourseFAQ.tsx
│   │   ├── pricing/
│   │   │   └── PricingCards.tsx
│   │   ├── forms/
│   │   │   ├── TrialBookingForm.tsx
│   │   │   └── ContactForm.tsx
│   │   └── seo/
│   │       ├── JsonLd.tsx
│   │       └── OpenGraph.tsx
│   │
│   ├── content/                # Static content (MDX/TS) until CMS lands
│   │   ├── courses.ts          # All 11 courses — title, slug, copy, FAQs
│   │   ├── teachers.ts         # Teacher profiles
│   │   ├── testimonials.ts
│   │   ├── pricing.ts
│   │   ├── faq.ts
│   │   └── countries.ts        # USA/UK/CA/AU page copy
│   │
│   ├── lib/
│   │   ├── api.ts              # Typed fetch wrappers for Laravel
│   │   ├── seo.ts              # generateMetadata helpers
│   │   ├── schema.ts           # Schema.org JSON-LD builders
│   │   └── utils.ts            # cn(), formatters
│   │
│   ├── styles/
│   │   ├── globals.css         # Tailwind directives + CSS vars
│   │   └── fonts.ts            # next/font setup
│   │
│   ├── config/
│   │   ├── site.ts             # name, url, contact, whatsapp, social
│   │   └── nav.ts              # Header + footer link structure
│   │
│   └── types/
│       └── index.ts            # Shared TS types (Course, Teacher, etc.)
│
├── .env.example
├── .env.local                  # gitignored
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.js
├── package.json
├── pnpm-lock.yaml
└── README.md
```

### Key conventions
- Group routes under `(marketing)` — keeps marketing layout (navbar/footer) isolated from a future `(app)` group for the student portal
- All static copy in `src/content/*.ts` so a developer (or owner with help) can edit prices, course descriptions, teacher bios in one place
- `src/config/site.ts` holds **every** owner-editable value (WhatsApp number, email, prices, social links) — see [CONTENT-EDITING-GUIDE.md](CONTENT-EDITING-GUIDE.md)

---

## Backend (`site/backend/`)

Standard Laravel 11 layout. Key additions only:

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Api/
│   │   │   │   └── V1/
│   │   │   │       ├── TrialBookingController.php
│   │   │   │       ├── ContactController.php
│   │   │   │       ├── CourseController.php       # Sprint 6
│   │   │   │       ├── BlogPostController.php     # Sprint 6
│   │   │   │       └── RevalidateController.php   # Calls Next.js webhook
│   │   │   └── Auth/
│   │   │       └── AdminLoginController.php       # Sprint 7
│   │   ├── Requests/
│   │   │   ├── StoreTrialBookingRequest.php
│   │   │   └── StoreContactRequest.php
│   │   ├── Resources/
│   │   │   └── (typed JSON responses)
│   │   └── Middleware/
│   │       └── EnsureCors.php
│   ├── Models/
│   │   ├── TrialBooking.php
│   │   ├── ContactMessage.php
│   │   ├── User.php           # Admin only initially
│   │   ├── Course.php         # Sprint 6
│   │   ├── Teacher.php        # Sprint 6
│   │   └── BlogPost.php       # Sprint 6
│   ├── Mail/
│   │   ├── TrialBookingAdminNotification.php
│   │   ├── TrialBookingConfirmation.php
│   │   └── ContactReceived.php
│   ├── Services/
│   │   ├── NextRevalidationService.php
│   │   └── BookingReferenceGenerator.php
│   └── Filament/              # Sprint 7 — admin panel
│       └── Resources/
│
├── routes/
│   ├── api.php                # /api/v1/*
│   ├── web.php                # Filament admin
│   └── console.php
│
├── database/
│   ├── migrations/
│   │   ├── 2026_05_create_trial_bookings_table.php
│   │   ├── 2026_05_create_contact_messages_table.php
│   │   ├── 2026_05_create_courses_table.php       # Sprint 6
│   │   ├── 2026_05_create_teachers_table.php      # Sprint 6
│   │   └── 2026_05_create_blog_posts_table.php    # Sprint 6
│   ├── seeders/
│   │   ├── DatabaseSeeder.php
│   │   ├── CourseSeeder.php
│   │   └── TeacherSeeder.php
│   └── factories/
│
├── resources/
│   └── views/
│       └── emails/            # Blade templates for transactional mail
│
├── config/
│   └── (Laravel defaults + cors.php customized)
│
├── tests/
│   ├── Feature/
│   │   ├── TrialBookingTest.php
│   │   └── ContactTest.php
│   └── Unit/
│
├── .env.example
├── composer.json
├── artisan
└── README.md
```

---

## What lives where (decision matrix)

| Type of content | Where | Why |
|---|---|---|
| Page copy (hero, sections) | `frontend/src/content/*.ts` | Co-located with components, type-safe, fast builds |
| Course listings (Sprint 1–5) | `frontend/src/content/courses.ts` | Static, rarely changes |
| Course listings (Sprint 6+) | `backend/database` (Course model) | Owner can edit via admin |
| Blog posts | `backend/database` (BlogPost model) — Sprint 6 | Owner adds posts often |
| Teacher profiles | `frontend/src/content/teachers.ts` initially → DB in Sprint 6 | Same migration path |
| Trial bookings | `backend/database` (TrialBooking model) | Need persistence + admin view |
| Prices | `frontend/src/config/site.ts` | One file, deploy on change (rare) |
| Contact info, WhatsApp | `frontend/src/config/site.ts` | Same |
