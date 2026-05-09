# Architecture

## High-level

```
┌─────────────────────────────────────────────────────────────────┐
│                          Visitors                               │
│  (USA, UK, Canada, AU, EU — Google Ads + Meta Ads + organic)    │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS
                ┌──────────────▼──────────────┐
                │   Vercel Edge (CDN + ISR)   │
                │  alrayan-academy.com        │
                └──────────────┬──────────────┘
                               │
                ┌──────────────▼──────────────┐
                │   Next.js 15 (App Router)   │
                │   - Static pages (SSG)      │
                │   - ISR for blog/courses    │
                │   - Server Components       │
                │   - i18n-ready (en first)   │
                └──────┬──────────────┬───────┘
                       │              │
       Form submit, blog│              │WhatsApp click
       fetch (server)   │              │(direct → wa.me link)
                       │              │
                ┌──────▼──────────────▼───┐
                │  Laravel 11 REST API    │
                │  api.alrayan-academy.com│
                │  - Auth (Sanctum)       │
                │  - Trial bookings       │
                │  - Contact submissions  │
                │  - Blog CMS (Sprint 6)  │
                │  - Admin panel (Filament│
                │    or custom, Sprint 7) │
                └──────────┬──────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼─────┐ ┌────▼────┐ ┌────▼────┐
       │  MySQL 8   │ │  SMTP   │ │ Storage │
       │  (Hostinger│ │ (Resend │ │ (S3 or  │
       │   or DO)   │ │  / SES) │ │  local) │
       └────────────┘ └─────────┘ └─────────┘
```

---

## Why this split

| Concern | Solution | Why |
|---|---|---|
| SEO + speed for ad landing pages | Next.js SSG + ISR on Vercel Edge | Sub-second TTFB worldwide, perfect Lighthouse scores, low ad spend waste |
| Form submissions, admin, future CMS | Laravel REST API | Mature ecosystem, easy admin (Filament), owner can hire any PHP dev later |
| Content editing without redeploys | ISR — Next.js revalidates pages from Laravel on-demand | Owner edits a blog post in admin → site updates within seconds, no rebuild |
| Auth (admin only at first) | Laravel Sanctum (cookie-based for admin panel) | Simple, secure, no extra service |

**Public pages need no auth.** Only admin and form submissions hit Laravel.

---

## Data flow examples

### Visitor books a free trial
1. Visitor fills form on `/contact` (Next.js client component)
2. `POST /api/v1/trial-bookings` → Laravel
3. Laravel validates, stores in MySQL, sends 2 emails (admin notification + visitor confirmation)
4. Returns `{ success: true, ref: "TB-2026-0042" }`
5. Next.js shows success state + WhatsApp deep link

### Owner publishes a blog post (Sprint 6)
1. Owner logs into `/admin` (Filament panel)
2. Creates post → Laravel saves, fires `BlogPostPublished` event
3. Event hits Next.js webhook `/api/revalidate?path=/blog/[slug]&secret=...`
4. Next.js revalidates that page + `/blog` index — visitors see it within ~5s

### Course page loads (Sprint 3)
1. Build time: Next.js calls `GET /api/v1/courses` → generates 11 static pages
2. Runtime: page served from Vercel Edge CDN — zero backend hits
3. Re-validates every 1 hour OR on-demand when admin updates a course

---

## Environments

| Env | Frontend URL | Backend URL | Database |
|---|---|---|---|
| Local | http://localhost:3000 | http://localhost:8000 | MySQL local |
| Staging | staging.alrayan-academy.com | api-staging.alrayan-academy.com | MySQL staging |
| Production | alrayan-academy.com | api.alrayan-academy.com | MySQL prod |

---

## Security boundaries

- **Public API endpoints** (`POST /trial-bookings`, `POST /contacts`): rate-limited (Laravel `throttle` middleware: 5/min per IP), CSRF-exempt, hCaptcha on form
- **Admin endpoints** (`/admin/*`): Sanctum cookie auth, IP allowlist optional, 2FA in Sprint 7
- **CORS:** Laravel allows only `alrayan-academy.com` and `staging.alrayan-academy.com`
- **Secrets:** never committed; `.env` files git-ignored; Vercel + server use platform-native secret managers

---

## Phase 2 (post-launch)

- Arabic RTL version (Next.js `[locale]` segment, Laravel translatable models via `spatie/laravel-translatable`)
- Student/teacher portal (separate Next.js subdomain `app.alrayan-academy.com`)
- Stripe integration for subscriptions
- LMS lite (class scheduling, recordings)

These are **not** in the 7-sprint scope below. Documented here so architecture decisions don't paint us into a corner.
