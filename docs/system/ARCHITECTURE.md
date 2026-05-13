# System Architecture

How the management system is wired into the existing monorepo, why it's safe to share the same codebase as the public site, and how data flows between them.

---

## High-level

```
                    ┌─────────────────────────────────────────────┐
                    │              End users                      │
                    │  Public visitors    Admin / Supervisor /    │
                    │  (marketing)        Teacher (operations)    │
                    └──────────┬──────────────────────┬───────────┘
                               │                      │
                               │ HTTPS                │ HTTPS (auth-cookie)
                               │                      │
                ┌──────────────▼──────┐   ┌───────────▼─────────────┐
                │  alrayan-academy.com│   │  app.alrayan-academy.com│
                │  Vercel Edge / ISR  │   │  Vercel (no ISR, SSR)   │
                │  Marketing routes   │   │  System routes          │
                │  group (marketing)  │   │  group (system)         │
                └──────────────┬──────┘   └───────────┬─────────────┘
                               │                      │
                               │ POST /api/v1/*       │ ALL /api/system/*
                               │ (forms only)         │ (Sanctum cookie)
                               │                      │
                          ┌────▼──────────────────────▼────┐
                          │  Laravel 11 (api.alrayan…)     │
                          │  ┌──────────────┬─────────────┐│
                          │  │ Public API   │ System API  ││
                          │  │ /api/v1/*    │ /api/system ││
                          │  │ (no auth /   │ (Sanctum +  ││
                          │  │  hCaptcha)   │  Spatie)    ││
                          │  └──────┬───────┴──────┬──────┘│
                          │         │              │       │
                          │  ┌──────▼──────────────▼──────┐│
                          │  │   Shared services layer    ││
                          │  │  Mail, Queue, Notifications││
                          │  └──────────┬─────────────────┘│
                          └─────────────┼──────────────────┘
                                        │
                  ┌─────────────────────┼─────────────────────┐
                  │                     │                     │
            ┌─────▼──────┐    ┌─────────▼─────────┐    ┌─────▼──────┐
            │   MySQL    │    │  External APIs    │    │  Storage   │
            │  - public_*│    │  Paymob (billing) │    │  S3 / local│
            │  - sys_*   │    │  Zoom (sessions)  │    │  exports,  │
            │            │    │  wassender (WA)   │    │  certs,    │
            │            │    │  Resend (email)   │    │  invoices  │
            └────────────┘    └───────────────────┘    └────────────┘
```

---

## Two surfaces, one codebase

The system shares the same Next.js app and Laravel app as the public site. The split is enforced at four levels:

| Level | Public site | System |
|---|---|---|
| **Hostname** | `alrayan-academy.com` | `app.alrayan-academy.com` |
| **Next.js route group** | `src/app/(marketing)` | `src/app/(system)` |
| **Next.js middleware** | Allows `(marketing)` paths | Rewrites `app.*` host to `(system)`, blocks `(system)` access from public host |
| **Laravel route file** | `routes/api.php` (`/api/v1/*`) | `routes/system.php` (`/api/system/*`) |
| **Laravel controllers** | `App\Http\Controllers\Api\*` | `App\Http\Controllers\System\*` |
| **Laravel models** | `App\Models\Public\*` (or root for legacy) | `App\Models\System\*` |
| **DB tables** | `users`, `trial_bookings`, `contact_messages`, `courses`, `blog_posts`, … | `sys_students`, `sys_teachers`, `sys_invoices`, `sys_sessions`, … |
| **Auth** | None (public) or hCaptcha rate-limited | Sanctum SPA cookie + Spatie permissions |

If a file's path doesn't include the surface marker (`(marketing)`, `(system)`, `Api\`, `System\`, `sys_`), it's a **shared primitive** (UI atoms, fonts, the `User` model, the `Course` model where it overlaps).

---

## Shared vs split — what crosses the boundary

| Concern | Shared | Reason |
|---|---|---|
| `User` model | ✅ Shared | Admins log into the system; the same user can later own a teacher profile. |
| `Course` model | ✅ Shared | Public site lists 11 marketing courses; system uses the same list when assigning students. |
| `BlogPost`, `Teacher` (public profile) | ✅ Shared (CMS in site Sprint 6) | Public bios surface real data already in MySQL. |
| Lead / `TrialBooking` | ✅ Shared with conversion | A `TrialBooking` from the public site becomes a `sys_lead` row when a supervisor picks it up. |
| Design tokens (colors, fonts) | ✅ Shared | One brand. |
| Layout shell (Navbar, Footer) | ❌ Site only | System has its own sidebar+topbar shell. |
| Floating WhatsApp button | ❌ Site only | Operators don't need it inside the system. |
| Sanctum auth | ❌ System only | Public site has no logged-in surface in v1. |
| Toast/dialog/sheet/table primitives | ✅ Shared (shadcn) | Same component library, same theme. |

The split rules are written down in [FILE-STRUCTURE.md](FILE-STRUCTURE.md) so the next dev can't accidentally couple the two.

---

## Roles & RBAC

Three first-class roles. Concrete permission lists live in [the Spatie config](FILE-STRUCTURE.md#backend-systeminternal); this is the conceptual map.

| Role | Sees | Can do |
|---|---|---|
| **Admin (Owner)** | Everything | All CRUD, financial actions, settings, audit log, payroll approval. |
| **Supervisor** | Configurable | Granular subset granted by Admin per supervisor — e.g. "manage students + leads, no financials". |
| **Teacher** | Their own dashboard only | View own schedule + students, submit session reports, request leave, view own salary statement. |

Implementation:
- One `users.role` enum column (`admin` / `supervisor` / `teacher`).
- Spatie Permission v6 for granular per-supervisor permissions (e.g. `students.view`, `students.edit`, `invoices.view`, `payroll.approve`).
- Admins implicitly have all permissions; teachers are scoped via policy to their own records only.

Detailed permission catalog: SYS-02 sprint plan ([sprints/sys-02-auth-rbac-dashboard.md](sprints/sys-02-auth-rbac-dashboard.md)).

---

## Authentication flow

```
Browser                  app.alrayan-academy.com (Next.js)         api.alrayan-academy.com (Laravel)
   │                                  │                                          │
   │ 1. GET /login                    │                                          │
   ├─────────────────────────────────►│                                          │
   │ 2. HTML (login form)             │                                          │
   │◄─────────────────────────────────┤                                          │
   │                                  │                                          │
   │ 3. POST /login (email,password)  │                                          │
   ├─────────────────────────────────►│ 4. POST /sanctum/csrf-cookie             │
   │                                  ├─────────────────────────────────────────►│
   │                                  │ 5. CSRF cookie                           │
   │                                  │◄─────────────────────────────────────────┤
   │                                  │ 6. POST /api/system/auth/login           │
   │                                  ├─────────────────────────────────────────►│
   │                                  │ 7. Set-Cookie (session, HttpOnly,        │
   │                                  │    Secure, SameSite=Lax)                 │
   │                                  │◄─────────────────────────────────────────┤
   │ 8. 302 → /                       │                                          │
   │◄─────────────────────────────────┤                                          │
   │                                  │                                          │
   │ 9. GET /students (with cookie)   │                                          │
   ├─────────────────────────────────►│ 10. fetch /api/system/students           │
   │                                  ├─────────────────────────────────────────►│
   │                                  │ 11. JSON                                 │
   │                                  │◄─────────────────────────────────────────┤
```

Key decisions:

- **Cookie-based, not bearer token.** Sanctum SPA mode. Cookies are HttpOnly + Secure + SameSite=Lax. No JWT in localStorage.
- **Cross-subdomain cookies.** `SESSION_DOMAIN=.alrayan-academy.com` so cookies set by `api.*` are read by `app.*`. Frontend → backend always over HTTPS.
- **CSRF on every state-changing request.** Next.js fetches `/sanctum/csrf-cookie` on first navigation; the `XSRF-TOKEN` cookie is then echoed in the `X-XSRF-TOKEN` header on POST/PUT/PATCH/DELETE.
- **Public API and System API have separate guards.** Public endpoints stay unauthenticated. The Sanctum middleware is only attached to `routes/system.php`.

---

## Data flow examples

### A trial booking becomes a CRM lead
1. Visitor submits trial form on the public site (Sprint 4 of the site).
2. Laravel saves a `trial_bookings` row + sends emails.
3. **Background job** `TrialBookingToLeadJob` runs and inserts a corresponding `sys_leads` row, status = `New`, source = `Website form`, with a foreign key to the original booking.
4. Supervisor opens the system dashboard — the new lead appears in the CRM pipeline with the trial details prefilled.
5. After contacting + booking the trial, supervisor clicks "Convert to Student" — system creates a `sys_students` row, copies contact info, and triggers the welcome WhatsApp.

### Auto monthly invoice generation
1. Cron `0 1 1 * *` (1 AM on the 1st of each month) runs `php artisan system:generate-monthly-invoices`.
2. Job iterates every `sys_students` with status = `Active`, computes price (sessions × duration × tier) minus discounts, applies wallet credit.
3. One `sys_invoices` row per student, status = `Sent`.
4. Each invoice queues a `SendInvoiceWhatsAppJob` → wassender pushes the payment link to the student's WhatsApp group.
5. On Paymob webhook → invoice flips to `Paid`, internal notification fires.

### Teacher logs a session report
1. Teacher opens their dashboard (Next.js, `(system)` route group, role guard = `teacher`).
2. Today's sessions render with "Submit Report" buttons.
3. Teacher fills the form (student perf, what was covered, homework). POST `/api/system/session-reports`.
4. Laravel persists `sys_session_reports` + clears the "missing report" alert.
5. If 24h passes without report → cron triggers wassender reminder to the teacher's group.

---

## Environments

| Env | Public site | System | Backend | Database |
|---|---|---|---|---|
| **Local** | http://localhost:3000 | http://app.localhost:3000 | http://localhost:8000 | MySQL local (single DB, prefixed tables) |
| **Staging** | staging.alrayan-academy.com | app-staging.alrayan-academy.com | api-staging.alrayan-academy.com | staging DB |
| **Production** | alrayan-academy.com | app.alrayan-academy.com | api.alrayan-academy.com | prod DB |

Same MySQL instance for public + system in every environment. Tables are partitioned by prefix (see [DATABASE.md](DATABASE.md)).

---

## Security boundaries

| Boundary | Rule |
|---|---|
| Public-site → System DB | No direct access. Marketing pages only call public API. The job that converts `trial_bookings` → `sys_leads` is the only writer crossing the boundary. |
| Teacher session → other teachers' data | Blocked by Laravel policies. Every `System\TeacherController` query is scoped to `auth()->id()`. |
| Supervisor without permission → restricted modules | Spatie middleware on every route. Unauthorized → 403 + audit log entry. |
| Browser → admin route | Sanctum middleware first, then role check, then permission check. |
| Browser → file downloads (invoices, payroll, exports) | Signed URLs, 5-minute expiry, regenerated per request. |
| Webhook from Paymob / wassender / Zoom | Verified by signature/HMAC; no auth cookie required, IP allowlisted where the provider publishes ranges. |

---

## Integrations

| Service | Used in | Direction | Auth |
|---|---|---|---|
| **Paymob** | Module 11 (Billing) | We send: payment link request. We receive: webhook on success/failure. | API key + HMAC signature on webhook |
| **Zoom** | Module 7 (Scheduling) | We send: create-meeting request per session. | OAuth Server-to-Server JWT |
| **wassender** | Modules 11, 15, 16 (WhatsApp) | We send: messages to groups. | API key |
| **Resend** | Modules 11, 15 (email + invoice PDFs) | We send: transactional email. Already in site stack. | API key |
| **Sentry** | All errors | We send: exceptions. | DSN |

Every integration sits behind a Laravel service class (`App\Services\Integrations\Paymob`, `…\Zoom`, `…\Wassender`) so swapping a provider later is a one-file change. Webhooks are HMAC-verified before any DB write.

---

## Background work — queues & schedulers

The system relies heavily on async work. Three queue tiers:

| Queue | Purpose | Example jobs |
|---|---|---|
| `default` | Most user-triggered side effects | Send welcome WhatsApp, generate invoice PDF |
| `notifications` | All wassender + email sends | Session reminder, payment reminder, report reminder |
| `reports` | Long-running exports + monthly cron | Auto monthly report PDF, payroll calculation |

Scheduler (`app/Console/Kernel.php`):
- `0 0 1 * *` — generate monthly invoices
- `0 1 1 * *` — calculate previous-month payroll
- Every minute — dispatch session reminders for sessions in the next reminder window
- Every 5 min — check for missing session reports
- Every hour — auto-suspend students who hit the non-payment threshold

Workers run as systemd services on the VPS (`alrayan-queue.service`, `alrayan-scheduler.service`). Configured in [SERVER-SETUP.md](../SERVER-SETUP.md) — system-specific additions appear in SYS-01.

---

## Phase 2 / future (not in 8-sprint scope)

- Student portal at `student.alrayan-academy.com` (separate route group `(student)`).
- Native mobile apps (React Native, reads same `/api/system` with bearer tokens via Sanctum personal access tokens).
- Multi-currency at the academy level (currently each student has one currency; financial reports convert to a base currency).
- Stripe / PayPal recurring as alternatives to Paymob.
- Auto WhatsApp group creation via wassender API (currently manual).

---

*Last updated: May 10, 2026*
