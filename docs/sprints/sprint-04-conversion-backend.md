# Sprint 4 — Conversion Pages + Backend  *(OVERVIEW)*

> Detailed plan will be written at the start of Sprint 4.

**Duration:** 2 weeks
**Status:** Overview only

---

## Goal

The "money pages" (pricing, FAQ, contact) ship, and forms actually deliver email end-to-end with a real Laravel backend.

## Pages

- `/pricing`
- `/faq`
- `/contact`

## Backend deliverables

### Models + migrations
- `TrialBooking` — name, email, country, phone, age_group, course_interest, preferred_time, timezone, message, source, reference, status (`new` / `contacted` / `converted` / `lost`), submitted_at
- `ContactMessage` — name, email, subject, message, reference, status

### Endpoints
- `POST /api/v1/trial-bookings` — create + queue 2 emails
- `POST /api/v1/contacts` — create + queue 2 emails
- `GET /api/v1/up` (already from Sprint 1, just verify)

### Services + helpers
- `BookingReferenceGenerator` — `TB-2026-NNNN` / `CT-2026-NNNN`
- `HCaptchaVerifier` — middleware verifying token via Cloudflare Turnstile or hCaptcha API
- Rate limiter `form` — 5/min per IP

### Mailables
- `TrialBookingAdminNotification` (sent to `info@alrayan-academy.com`)
- `TrialBookingConfirmation` (sent to visitor)
- `ContactReceived` (sent to admin) + `ContactConfirmation` (sent to visitor)
- All Blade templates branded (navy header, gold divider, footer with WhatsApp + email)

### Infrastructure
- Configure Resend driver in `config/mail.php`
- Set up Resend account + verify `alrayan-academy.com` domain (SPF, DKIM, DMARC records via Cloudflare)
- Queue worker as systemd service (see [SERVER-SETUP.md](../SERVER-SETUP.md#queue-worker-sprint-4))
- CORS for production + staging frontend origins

### Tests
- Feature tests: validation, success path, rate limiting, hCaptcha bypass in test env
- At least 6 tests passing per endpoint

## Frontend deliverables

### `/pricing`
- 3 tier cards (Starter $30 / Growth $50 / Premium $70) with "Most Popular" gold ribbon on Growth
- Sibling/family discount callout (20%)
- Pricing FAQ (~6 Q/A)
- Comparison table (mobile: stacked)
- CTA banner

### `/faq`
- Categorized accordion (General / Classes / Teachers / Pricing / Technical)
- `FAQPage` schema
- Search input (client-side filter, no backend needed)
- "Still have questions?" CTA → contact

### `/contact`
- Two-column layout: form left, contact info + WhatsApp + map (optional) right
- `TrialBookingForm` component (react-hook-form + zod)
- Fields: name, email, country (select), phone (optional), age group (radio: Kid 5-8 / Kid 9-12 / Teen / Adult), course interest (select), preferred time (select), timezone (auto-detect + override), message (optional textarea)
- hCaptcha widget (or Cloudflare Turnstile — better UX, free)
- Loading state, success state with booking reference + WhatsApp deep link, error state
- Optional `ContactForm` (simple) variant linked from a small "Just have a question?" toggle

### Components built
- `PricingCards`, `PricingComparison`, `PricingFAQ`
- `FAQAccordion` with category filter + client search
- `TrialBookingForm`, `ContactForm`, `FormField`, `SuccessState`

## Out of scope
- Country landing pages (Sprint 5)
- Blog (Sprint 6)
- Admin dashboard for viewing bookings (Sprint 7) — for now, owner reads emails

## Definition of Done

- All 3 pages live on staging
- Submitting a trial booking from staging:
  - Saves a row in DB
  - Triggers 2 emails (admin + visitor) — both arrive in inbox
  - Returns reference number to UI
  - WhatsApp link generated with prefilled message including reference
- Rate limit kicks in on 6th submission within 1 min
- All Laravel tests pass in CI
- Lighthouse ≥ 90 mobile on all 3 pages
- Owner submits a real trial booking and receives the email
