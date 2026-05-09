# Sprint 7 — Admin Panel + Launch  *(OVERVIEW)*

> Detailed plan will be written at the start of Sprint 7.

**Duration:** 2 weeks
**Status:** Overview only

---

## Goal

Owner can self-serve everything (bookings, courses, blog, teachers). Site is launch-ready: optimized, monitored, backed up, legal pages in place. Cutover to production happens at the end of this sprint.

## Backend deliverables

### Filament 3 admin panel
Install at `https://api.alrayan-academy.com/admin`. Resources:
- **Trial Bookings** — list (filter by status, country, course), view detail, change status, internal notes
- **Contact Messages** — list, view, mark read, reply via mailto link
- **Courses** — full CRUD with rich text editor (TipTap)
- **Teachers** — full CRUD with image upload
- **Blog Posts** — full CRUD with TipTap, cover upload, category multi-select, publish/unpublish, schedule publish
- **Blog Categories** — CRUD
- **Users (Admins)** — invite, change role, reset password, force 2FA

### Auth + roles
- Spatie Permission: roles `super-admin`, `editor`
- 2FA via Filament 2FA plugin (mandatory for super-admin, optional for editor)
- Password reset flow tested
- Login throttling (5 attempts / 15 min)

### Operations
- Backup script (`/usr/local/bin/alrayan-backup.sh`):
  - `mysqldump` → gzip → upload to Backblaze B2
  - rsync `storage/app/public` → B2
  - 30-day retention
  - Cron daily at 03:00 UTC
- Sentry installed in Laravel (DSN in `.env`)
- Log rotation verified
- Health endpoint extended: returns DB connectivity + queue worker status

## Frontend deliverables

### Performance pass
- Bundle analyzer (`@next/bundle-analyzer`) — report on home + 1 course + 1 country
- Verify no third-party scripts (other than GTM if owner wants GA4)
- Image audit: every `<Image>` has explicit width/height, lazy loading below the fold, AVIF/WebP via Next defaults
- Font preloading verified (no FOIT)
- Vercel Speed Insights on
- Target: LCP < 2.0s, INP < 200ms, CLS < 0.1 on PSI mobile for top 5 pages

### Accessibility audit
- `axe` CLI run on every page → fix any "serious" or "critical" issues
- Manual keyboard test: tab through every page → fix focus traps
- Color contrast: every text-on-background combo passes AA, primary CTAs pass AAA
- Screen reader test (VoiceOver) on home + contact form

### Branded error pages
- `/not-found.tsx` — branded 404 with helpful links + WhatsApp
- `/error.tsx` — branded 500 with retry + contact options

### Legal pages
- `/privacy` — privacy policy (template + Alrayan-specific data handling: form submissions, GA4, hCaptcha)
- `/terms` — terms of service
- Cookie consent banner — only if GA4/Meta Pixel used; uses `react-cookie-consent`

### Final SEO sweep
- Re-run [SEO-CHECKLIST.md](../SEO-CHECKLIST.md) end-to-end
- Submit updated sitemap to Search Console + Bing
- Verify Meta Pixel firing
- Verify GA4 events: page_view, generate_lead (on form submit)

## Launch tasks (production cutover)

1. **Pre-cutover (1 week before)**
   - [ ] Owner walkthrough recorded (admin panel tutorial)
   - [ ] All staging content reviewed and approved
   - [ ] Final domain DNS records prepared in Cloudflare (lower TTL to 300s)
   - [ ] Backup of current site (if any) taken

2. **Cutover day**
   - [ ] Promote staging deploy to production on Vercel (instant)
   - [ ] Update DNS A/CNAME records → propagation < 10 min with low TTL
   - [ ] Verify SSL (Vercel auto-issues)
   - [ ] Run full smoke test (see [DEPLOYMENT-GUIDE.md](../DEPLOYMENT-GUIDE.md#post-deploy-smoke-test))
   - [ ] Submit production sitemap to Search Console
   - [ ] Switch UptimeRobot monitors from staging to production
   - [ ] Restore TTL to 3600s

3. **Day 1 post-launch**
   - [ ] Mobile QA across iPhone Safari + Android Chrome
   - [ ] Submit a real trial booking — confirm email arrives
   - [ ] Check Sentry — zero new errors
   - [ ] Check Vercel logs — no 500s
   - [ ] Check Search Console — pages showing as indexable
   - [ ] Owner posts launch on social

4. **Week 1 post-launch**
   - [ ] Monitor Search Console daily — fix any coverage issues
   - [ ] Review form submissions — quality check
   - [ ] Daily Lighthouse on home — no regressions
   - [ ] Address any owner-reported issues within 24h

## Out of scope (post-launch backlog)

- Arabic RTL site
- Stripe subscriptions
- Student/teacher portal
- Affiliate program
- Live chat (beyond WhatsApp button)

## Definition of Done

- Admin panel fully functional, owner has logged in and made one edit successfully
- Backups running daily, latest backup verified restorable
- Sentry catching nothing on staging (clean baseline)
- All accessibility "serious"/"critical" issues fixed
- Privacy + Terms pages live
- DNS cut over to production
- First real trial booking received and confirmed
- Project handoff doc written (where logs live, how to deploy, who to contact)
