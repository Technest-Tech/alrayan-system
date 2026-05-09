# TODO — Open Questions & Assumptions

Living document. As decisions get made, items move from "Open" → "Resolved" with the answer noted.

---

## Open questions for the owner

### Brand & content
- [ ] **WhatsApp number** — is `+20 100 000 0000` (Egypt) the real support number, or should it be different (UK/US for those markets)?
- [ ] **Support email** — is `info@alrayan-academy.com` the right address? Need it to actually exist before Sprint 4 (forms email it).
- [ ] **Domain** — is `alrayan-academy.com` registered + accessible? Who is the registrar?
- [ ] **Logo** — Sprint 1 ships a placeholder geometric+wordmark. Is there an existing logo to use instead, or should we commission one before launch?
- [ ] **Real teacher names + photos** — currently planned as SVG-initial placeholders. When (which sprint) will real bios + photos be ready?
- [ ] **Real testimonials** — placeholders ship in Sprint 2. When can we replace with real student quotes (with permission)?
- [ ] **Sample lesson video** — Sprint 3 course pages include a "What a class looks like" slot. Embed a YouTube video? Use a screenshot? Skip until Phase 2?

### Business decisions
- [ ] **Pricing** — confirm tiers: Starter $30 (8 classes) / Growth $50 (16 classes) / Premium $70 (20 classes) + 20% sibling discount. These are spec defaults.
- [ ] **Free trial duration** — 1 free class? 30-min or 60-min?
- [ ] **Refund policy** — copy mentions "30-day money back" — confirm or change.
- [ ] **Class platform** — Zoom? Google Meet? Owner's own tool? Affects the trial booking confirmation email.

### Infrastructure
- [ ] **Vercel account** — does the owner have one? If not, who pays the Pro plan ($20/mo) once ad traffic kicks in?
- [ ] **Backend host** — Hostinger VPS KVM 2 (~$6/mo) or DigitalOcean Droplet ($12-24/mo)? Recommend KVM 2 for cost.
- [ ] **Email service** — Resend (recommended, $20/mo Pro after free tier) or Brevo (free tier sufficient for first ~9k emails/month)?
- [ ] **Analytics** — GA4 (free, requires cookie consent in EU) or Plausible (paid, no consent banner needed, simpler)? Recommend Plausible if the budget allows.
- [ ] **GitHub repo** — public or private? Default is private until launch.

### Phase 2 / future
- [ ] **Arabic version** — confirmed deferred to Phase 2. Anything that would force an architecture change now?
- [ ] **Stripe / payments** — when in the roadmap? Affects Sprint 6/7 design if soon.
- [ ] **Student portal** — when? Will live at `app.alrayan-academy.com`.

---

## Assumptions made (documented in case they're wrong)

| # | Assumption | Doc | If wrong, change... |
|---|---|---|---|
| A1 | Monorepo with `frontend/` + `backend/` siblings | [FILE-STRUCTURE.md](docs/FILE-STRUCTURE.md) | Confirmed by user 2026-05-09 |
| A2 | Laravel role: forms + minimal backend in v1, full CMS in Sprint 6 | [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Confirmed by user 2026-05-09 |
| A3 | Next.js App Router + ISR/SSG | [TECH-STACK.md](docs/TECH-STACK.md) | Confirmed by user 2026-05-09 |
| A4 | 7 sprints × 2 weeks each | [sprints/README.md](docs/sprints/README.md) | Confirmed by user 2026-05-09 |
| A5 | Email via Resend (with Brevo fallback) | [TECH-STACK.md](docs/TECH-STACK.md) | If owner prefers Mailgun/SES — swap driver in Laravel `config/mail.php`, no other code changes |
| A6 | Hosting: Vercel (frontend) + Hostinger VPS (backend) | [SERVER-SETUP.md](docs/SERVER-SETUP.md) | If shared Hostinger only — see "Hostinger-specific notes" in [DEPLOYMENT-GUIDE.md](docs/DEPLOYMENT-GUIDE.md#hostinger-specific-notes) |
| A7 | hCaptcha or Cloudflare Turnstile for form spam | [API-SPEC.md](docs/api/API-SPEC.md) | Default Turnstile (free, better UX). Swap if owner prefers reCAPTCHA |
| A8 | Filament 3 for admin panel (Sprint 7) | [TECH-STACK.md](docs/TECH-STACK.md) | If owner wants custom admin — adds ~2 weeks |
| A9 | English-only at launch; Arabic in Phase 2 | [ARCHITECTURE.md](docs/ARCHITECTURE.md) | If Arabic must ship at launch — adds ~3-4 weeks (RTL, translations, content writing) |
| A10 | Pricing: $30/$50/$70 + 20% sibling discount as per project brief | [DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) | Owner edits `frontend/src/content/pricing.ts` — see [CONTENT-EDITING-GUIDE.md](docs/CONTENT-EDITING-GUIDE.md#changing-prices) |
| A11 | 11 courses as listed in project brief | [sprints/sprint-03-course-pages.md](docs/sprints/sprint-03-course-pages.md) | Courses can be added/removed any time pre-launch with copy edits |

---

## Discovered during planning

(Empty — populate as work progresses.)

---

## Resolved

(Empty until items move out of "Open".)
