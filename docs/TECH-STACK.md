# Tech Stack

All versions pinned to current LTS / latest-stable as of 2026-05.

## Frontend (`site/frontend/`)

| Item | Version | Why |
|---|---|---|
| **Next.js** | 15.x | App Router, RSC, ISR, Image optimization, top-tier SEO |
| **React** | 19.x | Pairs with Next 15 |
| **TypeScript** | 5.5+ | Type safety, better DX, fewer runtime bugs |
| **Tailwind CSS** | 3.4+ | Fast styling with the locked design tokens; no fighting CSS |
| **shadcn/ui** | latest | Headless, copy-paste components — we own the code, not a dependency |
| **Lucide React** | latest | Icon set — clean, tree-shakable |
| **next-intl** | 3.x | i18n (Phase 2 Arabic) — set up routing now, populate later |
| **react-hook-form + zod** | latest | Trial booking + contact forms with validation |
| **next-sitemap** | 4.x | Auto-generated `sitemap.xml` and `robots.txt` |
| **@vercel/analytics** | latest | Privacy-friendly analytics |
| **Plausible** (optional) | — | Self-hosted analytics alternative if owner prefers no Google/Vercel |
| **pnpm** | 9.x | Faster installs than npm, strict node_modules |

### Fonts (Google Fonts via `next/font`)
- Cormorant Garamond (display)
- Fraunces (headings)
- Inter (body/UI)
- Amiri (Arabic ayat)

### What we are NOT using
- Redux / Zustand — server components + URL state cover everything
- Framer Motion (initially) — keep bundle small; add later only if needed
- A separate component library (MUI/Chakra) — Tailwind + shadcn covers it

---

## Backend (`site/backend/`)

| Item | Version | Why |
|---|---|---|
| **PHP** | 8.3+ | Required by Laravel 11 |
| **Laravel** | 11.x | Latest LTS, mature, easy to hire for |
| **MySQL** | 8.0+ | Owner is on Hostinger; MySQL is the path of least resistance |
| **Laravel Sanctum** | bundled | Cookie-based admin auth |
| **Laravel Mail (Resend driver)** | 11.x + `resend/resend-laravel` | Reliable transactional email |
| **Filament** | 3.x | Admin panel (Sprint 7) — saves weeks of CRUD work |
| **Spatie Permission** | 6.x | Roles for admin (Sprint 7) |
| **Spatie Translatable** | 6.x | Arabic content storage (Phase 2) |
| **Composer** | 2.x | Standard |

---

## Infrastructure

| Item | Choice | Why |
|---|---|---|
| **Frontend host** | Vercel (Hobby → Pro when ad budget kicks in) | Edge CDN, zero-config Next.js, free SSL |
| **Backend host** | Hostinger VPS (KVM 2) **or** DigitalOcean Droplet ($12/mo) | PHP/MySQL friendly, full control |
| **DNS** | Cloudflare (free tier) | DDoS protection, fast DNS, easy CNAMEs |
| **SSL** | Let's Encrypt (Certbot) on backend, Vercel auto on frontend | Free, automated renewal |
| **Email** | Resend ($20/mo Pro) — fallback to Brevo (free tier) | High deliverability, good DX |
| **Error tracking** | Sentry (free tier covers our volume initially) | Catches frontend + backend errors |
| **Uptime** | UptimeRobot (free) | 5-min interval pings |
| **CI/CD** | GitHub Actions | Lint + typecheck on PR; auto-deploy backend on merge to `main` |

---

## Local dev requirements

- Node 20.x + pnpm 9
- PHP 8.3 + Composer 2
- MySQL 8 (Docker recommended — `docker run -p 3306:3306 mysql:8`)
- Git

See [SERVER-SETUP.md](SERVER-SETUP.md) for production setup steps.
