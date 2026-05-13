# Alrayan Academy — Management System Documentation

The internal **operations system** for Alrayan Academy: students, teachers, scheduling, billing, payroll, CRM, accounting, and reporting.

It lives **inside the same monorepo** as the public website (`site/frontend/` and `site/backend/`) but is fully isolated by route group, route namespace, and database table prefix so the two never collide.

> **Public site** → `alrayan-academy.com` (marketing, course pages, blog) — see [`../README.md`](../README.md)
> **Management system** → `app.alrayan-academy.com` (admin/supervisor/teacher dashboards) — this folder

---

## Doc Map

| Doc | Purpose |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | High-level design, subdomain split, RBAC, security boundaries, integrations |
| [FILE-STRUCTURE.md](FILE-STRUCTURE.md) | Full folder tree for system code under `frontend/` and `backend/` — the no-conflict contract |
| [TECH-STACK.md](TECH-STACK.md) | Additional libraries on top of the site stack (TanStack, calendar, charts, queues, etc.) |
| [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) | Admin design tokens, layout grids, component patterns, density rules |
| [DATABASE.md](DATABASE.md) | Migration strategy, `sys_` table prefix, shared vs system-only tables |
| [sprints/README.md](sprints/README.md) | 8-sprint roadmap (~16 weeks), module→sprint mapping |
| [../system-requirments.md](../../system-requirments.md) | Source of truth — the 21-module spec |

---

## TL;DR

- **Stack:** Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui — same project as the site, separate route group.
- **Backend:** Same Laravel 11 app — separate route file, controller namespace, model namespace, and DB prefix.
- **Auth:** Laravel Sanctum SPA (cookie-based) with three roles — Admin, Supervisor, Teacher.
- **Hosting:** Frontend on Vercel (subdomain `app.alrayan-academy.com`); Backend reuses `api.alrayan-academy.com` with `/api/system/*` namespace.
- **Sprints:** 8 × 2 weeks ≈ **16 weeks** to v1.
- **Starts after:** Site Sprint 4 (forms backend) ships — system reuses the Laravel scaffolding.

---

## Why one project, not two

| Concern | One-project win |
|---|---|
| Shared design system | Tokens, components, fonts live in one place. |
| Shared API layer | One Laravel app, one MySQL DB, one auth system. |
| Lead → Student handoff | A trial booking from the public site becomes a CRM lead in the system without crossing services. |
| Deployment surface | One backend host, one DB to back up. |
| Future hires | One repo to onboard into. |

The risk — code or runtime collisions between marketing and operations — is solved by the conventions in [FILE-STRUCTURE.md](FILE-STRUCTURE.md), [ARCHITECTURE.md](ARCHITECTURE.md), and [DATABASE.md](DATABASE.md).

---

## Current phase

**Foundation docs are written. Sprint plans:**

- **SYS-01** — Foundation, subdomain routing, design system → **DETAILED**
- **SYS-02** — Auth, RBAC, user management, dashboard shell → **DETAILED**
- **SYS-03** — Students, Teachers & Courses → **DETAILED**
- **SYS-04** — Scheduling, Sessions, Attendance & Reports → **DETAILED**
- **SYS-05** — Pricing, Billing & Invoicing → **DETAILED**
- **SYS-06** — Payroll, Bonuses & Quality → **DETAILED**
- **SYS-07** — Leads/CRM, Notifications & WhatsApp → **DETAILED**
- **SYS-08** — Accounting, Certificates, Settings, Audit & Launch → **DETAILED**

All 8 sprints fully planned. Ready to implement.

See [sprints/README.md](sprints/README.md) for the full roadmap.

---

## Quick start (after SYS-01 ships)

```bash
# Frontend (system runs on the same Next.js app as the site)
cd site/frontend
pnpm install
pnpm dev                                # http://localhost:3000  (site)
                                        # http://app.localhost:3000  (system)

# Backend
cd site/backend
composer install
php artisan migrate                     # creates sys_* tables
php artisan db:seed --class=SystemSeeder
php artisan serve                       # http://localhost:8000
```

> Add `127.0.0.1 app.localhost` to your `/etc/hosts` so the subdomain resolves locally. macOS/Linux already alias `*.localhost`, so usually nothing to do.

---

*Last updated: May 10, 2026*
