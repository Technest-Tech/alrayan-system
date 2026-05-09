# Alrayan Academy — Project Documentation

Premium production website for Alrayan Academy (الريان), an online Quran, Arabic, and Islamic studies academy targeting English-speaking Muslim families in the USA, UK, Canada, Australia, and Europe.

---

## Doc Map

| Doc | Purpose |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design, data flow, frontend ↔ backend contract |
| [TECH-STACK.md](TECH-STACK.md) | Versions, libraries, why each was chosen |
| [FILE-STRUCTURE.md](FILE-STRUCTURE.md) | Full folder tree for `frontend/` and `backend/` |
| [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) | Locked color/type/spacing tokens |
| [SERVER-SETUP.md](SERVER-SETUP.md) | Hosting, DNS, SSL, env vars, CI |
| [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) | Step-by-step deploy for frontend + backend |
| [SEO-CHECKLIST.md](SEO-CHECKLIST.md) | Pre- and post-launch SEO tasks |
| [CONTENT-EDITING-GUIDE.md](CONTENT-EDITING-GUIDE.md) | Where to update prices, WhatsApp, teachers, copy |
| [api/API-SPEC.md](api/API-SPEC.md) | REST endpoints, request/response shapes |
| [sprints/README.md](sprints/README.md) | Sprint roadmap (7 sprints) |
| [../TODO.md](../TODO.md) | Open questions and assumptions |

---

## TL;DR

- **Frontend:** Next.js 15 (App Router, ISR/SSG) + TypeScript + Tailwind CSS — deployed to **Vercel**
- **Backend:** Laravel 11 (REST API, Sanctum auth) — deployed to **Hostinger VPS** or **DigitalOcean Droplet**
- **Database:** MySQL 8
- **Repo:** Monorepo — `site/frontend/` and `site/backend/`
- **Sprint cadence:** 2 weeks per sprint, **7 sprints total** (~14 weeks)

---

## Current Phase

**Sprint 1 (Foundation & Design System)** is fully detailed. Sprints 2–7 have overviews only — each one will be expanded into a full plan before its implementation begins.

See [sprints/README.md](sprints/README.md) for the roadmap.

---

## Quick start (after Sprint 1 is built)

```bash
# Frontend
cd site/frontend
pnpm install
pnpm dev          # http://localhost:3000

# Backend
cd site/backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve # http://localhost:8000
```
