# Tech Stack — Management System

The system reuses the entire site stack ([../TECH-STACK.md](../TECH-STACK.md)) and **adds** the libraries below. Versions are pinned to current-stable as of 2026-05.

---

## Frontend additions

| Item | Version | Why |
|---|---|---|
| **TanStack Query** | 5.x | Server-state cache for `/api/system/*` calls. Optimistic updates, retry, dedup, infinite tables. |
| **TanStack Table** | 8.x | Headless table primitive. Sort, filter, pagination, column resizing, row selection. The system has dozens of tables — owning the implementation matters. |
| **TanStack Virtual** | 3.x | Row virtualization for >1k row tables (audit log, delivery log). |
| **FullCalendar** | 6.x | Calendar UI for scheduling (Module 7). React adapter, drag-and-drop, conflict highlighting. |
| **dnd-kit** | 6.x | Drag-and-drop for the lead pipeline (Module 2 Kanban). |
| **Recharts** | 2.x | Charts on the dashboard + accounting (revenue, expenses, P&L, conversion funnel). |
| **date-fns** | 3.x | Date math + i18n-aware formatting. Picked over moment/dayjs for tree-shake size. |
| **date-fns-tz** | 3.x | Timezone conversions for student session times. |
| **react-day-picker** | 9.x | Date / range pickers used in scheduling, leave, reports. |
| **libphonenumber-js** | 1.x | E.164 validation for student/teacher phone + WhatsApp numbers. |
| **react-international-phone** | 4.x | Country-flag phone input UI. |
| **@hookform/resolvers + zod** | latest | Already in site stack — used heavily in system forms. |
| **sonner** | 1.x | Toast notifications. Lightweight, accessible. |
| **cmdk** | 1.x | Command palette (`⌘K`) for quick navigation. |
| **react-pdf** *(viewer only)* | 9.x | Preview generated invoices/certificates inline. PDFs are generated server-side. |
| **xlsx (SheetJS)** *(read only)* | latest | Importing student/teacher lists from Excel. Exports happen on the backend. |
| **next-themes** | 0.4.x | Light/dark mode toggle (system supports both, see [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md)). |
| **iron-session** *(optional)* | 8.x | If we need server-only session reads in Next.js for SSR-protected routes — Sanctum cookies are usually enough. |

### Dev dependencies

| Item | Why |
|---|---|
| `@playwright/test` | E2E for critical flows (login, create student, generate invoice). |
| `msw` | Mock the system API in Storybook + dev. |
| `@storybook/nextjs` *(optional)* | Component library for the 60+ system components. |

### Already in site stack and reused as-is

shadcn/ui primitives, Tailwind, react-hook-form, zod, lucide-react, clsx, tailwind-merge, next/font, next-intl (kept for Phase 2 RTL).

---

## Backend additions

| Package | Version | Why |
|---|---|---|
| **spatie/laravel-permission** | 6.x | Role + permission engine. Already in the site Sprint 7 plan; we use it from SYS-02. |
| **spatie/laravel-activitylog** | 4.x | Audit log (Module 21). Auto-tracks model changes with old→new diffs. |
| **spatie/laravel-medialibrary** | 11.x | Teacher photos, student docs, certificate templates. |
| **spatie/laravel-data** | 4.x | Typed DTOs between controller, service, and queue jobs. Saves writing FormRequests + Resources by hand. |
| **spatie/laravel-query-builder** | 5.x | Filter / sort / include parameters on every list endpoint with one trait. |
| **spatie/laravel-pdf** *(or barryvdh/laravel-dompdf)* | latest | Invoice + certificate + monthly-report PDFs. |
| **maatwebsite/excel** | 3.x | Excel exports across the system (invoices, payroll, audit log). |
| **laravel/horizon** | 5.x | Queue dashboard + tunable concurrency on the `notifications` and `reports` queues. |
| **laravel/telescope** *(local only)* | 5.x | Local debugging. Disabled in prod. |
| **predis/predis** | 2.x | Redis client. Used for queues + cache. |
| **firebase/php-jwt** | 6.x | Zoom Server-to-Server JWT signing. |
| **guzzlehttp/guzzle** | 7.x | HTTP client for Paymob, Zoom, wassender. Already shipped with Laravel. |
| **moneyphp/money** | 4.x | Multi-currency math without floats. Critical for billing. |
| **propaganistas/laravel-phone** | 5.x | E.164 phone validation rule (matches frontend). |
| **lcobucci/clock** | 3.x | Mockable clock for tests of pro-rata + payroll. |

### Caching + Redis

| Use | Backend | Notes |
|---|---|---|
| Sessions | Redis | Sanctum SPA — fast read on every request. |
| Queues | Redis | Horizon-managed. Three named queues: `default`, `notifications`, `reports`. |
| Cache | Redis | Permission cache (Spatie), dashboard KPI cache (5-min TTL), conversion cache. |

### What we are NOT adding

- **Filament 3** — the site Sprint 7 plan still includes Filament for blog CMS, but the management system is **shadcn/Next.js**, not Filament. We do not build the same screens twice.
- **Inertia / Livewire** — sticking with REST + TanStack Query.
- **Sentry SDK** — already in site stack; we just reuse the DSN.
- **Vapor / Forge** — staying on Hostinger/DO VPS as in [../SERVER-SETUP.md](../SERVER-SETUP.md).

---

## Infrastructure additions

| Concern | Choice | Why |
|---|---|---|
| **Redis** | DigitalOcean Managed Redis (or self-hosted on the VPS) — `$15/mo` | Sessions, queues, cache. Required by Horizon and Sanctum at scale. |
| **Object storage** | Backblaze B2 — `~$5/month for 1TB` | Invoice PDFs, certificate PDFs, exports, teacher photos. S3-compatible. |
| **Queue workers** | systemd services on the VPS | One worker per queue: `default` (4 procs), `notifications` (2 procs), `reports` (1 proc). |
| **Scheduler** | `cron` → `php artisan schedule:run` every minute | Standard Laravel. |
| **DNS** | Add `app.alrayan-academy.com` CNAME → Vercel | Done in SYS-01. |
| **SSL** | Vercel auto for `app.*`; Let's Encrypt for `api.*` already configured | No new work. |

Cost delta vs the site-only stack: ~**$25–35/month** for Redis + B2 + Vercel Pro upgrade (only if free tier is exhausted).

---

## Versioning policy

- The system follows the same `pnpm.lockfile` and `composer.lock` as the site. One repo, one set of locked versions.
- Major upgrades (Next 16, Laravel 12) are deferred until both surfaces can adopt at once.
- Breaking changes to `/api/system/*` ship under a versioned prefix (`/api/system/v2/...`) — but we don't expect to need this in v1.

---

*Last updated: May 10, 2026*
