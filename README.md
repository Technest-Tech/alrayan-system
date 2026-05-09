# Alrayan Academy — Website Monorepo

Production website for [Alrayan Academy](https://alrayan-academy.com) (الريان) — premium online Quran, Arabic, and Islamic studies for English-speaking students in the USA, UK, Canada, Australia, and Europe.

```
site/
├── frontend/   # Next.js 15 + Tailwind + TypeScript    → Vercel
├── backend/    # Laravel 11 REST API + MySQL           → VPS (Hostinger / DO)
└── docs/       # Full project documentation (start here)
```

---

## Start here

📚 **[docs/README.md](docs/README.md)** — index of all documentation.

🗺 **[docs/sprints/README.md](docs/sprints/README.md)** — sprint roadmap. Sprint 1 is fully detailed; sprints 2–7 have overviews and will be expanded just before each one starts.

📝 **[TODO.md](TODO.md)** — open questions and assumptions.

---

## Quick start (after Sprint 1 ships)

```bash
# Frontend
cd frontend
pnpm install
pnpm dev          # http://localhost:3000

# Backend
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve # http://localhost:8000
```

---

## Tech at a glance

- **Next.js 15** (App Router, ISR/SSG) + TypeScript + Tailwind + shadcn/ui
- **Laravel 11** + MySQL 8 + Sanctum + Filament (admin in Sprint 7)
- **Resend** for transactional email · **Cloudflare** for DNS · **Sentry** for errors
- **pnpm 9** · **PHP 8.3** · **Node 20**

Full version matrix: [docs/TECH-STACK.md](docs/TECH-STACK.md).
