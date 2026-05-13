# System Sprint Roadmap

8 sprints × 2 weeks ≈ **16 weeks** to v1.

> **Process** — same as the public site. All 8 sprints (**SYS-01** through **SYS-08**) are fully detailed.

> **Timing** — system sprints start after the **public site reaches Sprint 4 (Conversion + Backend)**. By that point Laravel has Sanctum + queue + email plumbing wired up, and the system layers on top.

---

## Module → Sprint matrix

The 21 modules from [../../../system-requirments.md](../../../system-requirments.md) map to sprints as follows.

| # | Module | Sprint |
|---|---|---|
| 1 | Authentication & RBAC | **SYS-02** |
| 2 | Leads / CRM | SYS-07 |
| 3 | Student Management | **SYS-03** |
| 4 | Teacher Management | **SYS-03** |
| 5 | Courses | **SYS-03** |
| 6 | Pricing & Subscription | SYS-05 |
| 7 | Scheduling | SYS-04 |
| 8 | Attendance | SYS-04 |
| 9 | Session Reports | SYS-04 |
| 10 | Quality Management | SYS-06 |
| 11 | Student Billing & Invoicing | SYS-05 |
| 12 | Teacher Payroll | SYS-06 |
| 13 | Teacher Rewards / Bonuses | SYS-06 |
| 14 | Accounting & Financial Reports | SYS-08 |
| 15 | Notifications & Reminders | SYS-07 |
| 16 | WhatsApp Groups | SYS-07 |
| 17 | Certificates | SYS-08 |
| 18 | Admin Dashboard | **SYS-02** (shell) → SYS-08 (final polish) |
| 19 | Teacher Dashboard | SYS-04 (initial) → SYS-06 (salary) |
| 20 | System Settings | SYS-08 |
| 21 | Data & Administration | SYS-08 |

---

## Sprint summary

| # | Title | Modules | Duration | Status |
|---|---|---|---|---|
| **SYS-01** | [Foundation, Subdomain & Design System](sys-01-foundation.md) | — (infrastructure) | 2 weeks | **DETAILED** |
| **SYS-02** | [Auth, RBAC & Dashboard Shell](sys-02-auth-rbac-dashboard.md) | 1, 18 (shell) | 2 weeks | **DETAILED** |
| **SYS-03** | [Students, Teachers & Courses](sys-03-students-teachers-courses.md) | 3, 4, 5 | 2 weeks | **DETAILED** |
| **SYS-04** | [Scheduling, Sessions, Attendance & Reports](sys-04-scheduling-sessions-attendance-reports.md) | 7, 8, 9, 19 (start) | 2 weeks | **DETAILED** |
| **SYS-05** | [Pricing, Billing & Invoicing](sys-05-pricing-billing-invoicing.md) | 6, 11 | 2 weeks | **DETAILED** |
| **SYS-06** | [Payroll, Bonuses & Quality](sys-06-payroll-bonuses-quality.md) | 10, 12, 13, 19 (salary) | 2 weeks | **DETAILED** |
| **SYS-07** | [Leads/CRM, Notifications & WhatsApp](sys-07-crm-notifications-whatsapp.md) | 2, 15, 16 | 2 weeks | **DETAILED** |
| **SYS-08** | [Accounting, Certificates, Settings, Audit & Launch](sys-08-accounting-certificates-launch.md) | 14, 17, 18 (polish), 20, 21 | 2 weeks | **DETAILED** |

---

## Definition of done — every sprint

Every sprint must end with:

1. ✅ All scoped pages/features deployed to **staging** at `app-staging.alrayan-academy.com`
2. ✅ Lighthouse Performance ≥ 80 / Accessibility ≥ 95 on every new page (system targets are different from marketing)
3. ✅ TypeScript: no `any`, no errors
4. ✅ ESLint + Prettier pass; PHP CS Fixer / Pint pass
5. ✅ Feature tests for every new endpoint; unit tests for every new pure service (price calculator, pro-rata, payroll, etc.)
6. ✅ `scripts/check-system-isolation.sh` passes (no public ↔ system code coupling)
7. ✅ Demo recording or screenshots reviewed by owner
8. ✅ Owner sign-off → merge to `main`

System-specific extras:

- Every CRUD endpoint must respect role + permission (Spatie middleware).
- Every list endpoint must support filter, sort, paginate via `spatie/laravel-query-builder`.
- Every state-change action writes an audit log entry (`sys_audit_logs` + `sys_activity_log`).
- Every WhatsApp/email send goes through the queue (no synchronous external calls in request flows).

---

## SYS-01 — Foundation, Subdomain & Design System  *(DETAILED)*

**Goal:** the system shell loads at `app.alrayan-academy.com`, looks like a polished admin tool, and is wired to a Laravel app that knows about a `system` guard. Empty pages are clickable; nothing functional yet.

**Highlights:**
- DNS + Vercel project configured for `app.alrayan-academy.com` + staging subdomain.
- Next.js `middleware.ts` rewrites the host to the `(system)` route group.
- Laravel: `routes/system.php` registered, `system` guard added, Spatie Permission installed and migrated, base controller + middleware in place.
- System app shell: sidebar (collapsible), topbar (search shell, command palette stub, notification bell stub, user menu stub), breadcrumbs, page header.
- shadcn admin primitives wired: `DataTable`, `PageHeader`, `EmptyState`, `ConfirmDialog`, `Sheet`, `Drawer`, `Toast`.
- Dark mode toggle.
- `scripts/check-system-isolation.sh` enforces no cross-coupling.
- `/api/system/health` and `/api/system/version` endpoints live behind the system guard (placeholder auth: returns 401 when no cookie).

→ Full plan: [sys-01-foundation.md](sys-01-foundation.md)

---

## SYS-02 — Auth, RBAC & Dashboard Shell  *(DETAILED)*

**Goal:** real users can log in. Admin can create supervisors and teachers. The dashboard renders KPI cards and an alerts panel (with placeholder data — real data lands in later sprints).

**Highlights:**
- Login / logout / forgot-password / reset-password flows.
- Sanctum SPA cookie auth, cross-subdomain cookies between `app.*` and `api.*`.
- Spatie roles + permissions seeded; `PermissionRegistry` enumerates every permission string.
- User management UI under Settings → Users: invite admin/supervisor, set granular permissions per supervisor, deactivate accounts.
- Role-based home: admin → admin dashboard, supervisor → admin dashboard scoped, teacher → teacher dashboard.
- Dashboard shell: KPI cards, alerts panel (stubbed data), quick actions.
- Notification bell wired to `sys_notifications` table (empty until SYS-07 publishes events).
- Audit log writes on every login, login failure, role change, permission change.
- E2E test: login → see dashboard → logout. Feature tests cover RBAC denials.

→ Full plan: [sys-02-auth-rbac-dashboard.md](sys-02-auth-rbac-dashboard.md)

---

## SYS-03 — Students, Teachers & Courses  *(DETAILED)*

**Modules:** 3, 4, 5

**Goal:** the three core entities exist as fully-featured CRUD modules with profile pages, lifecycle state machine, family/sibling linking, teacher availability + leave management, and internal notes. Every change is audit-logged.

**Highlights:**
- `sys_students`, `sys_teachers`, `sys_teacher_availability`, `sys_teacher_leaves`, `sys_student_timeline`, `sys_student_family_links`, `sys_student_notes`, `sys_teacher_notes`.
- Student lifecycle state machine (Trial / Active / Paused / Suspended / Cancelled) with transition guards + cancellation reason picker.
- Student profile full page: header with lifecycle bar, tabs (Profile, Sessions, Reports, Invoices, Wallet, Family, Timeline, Notes).
- Teacher profile full page: header, tabs (Profile, Availability, Leave, Students, Schedule, Reports, Salary, Notes).
- Family/sibling linker with auto-applied discount tiers (`FamilyDiscountResolver`).
- Course list re-using shared `courses` table; system view adds an "Active students per course" column + active-for-system toggle.
- Filters + saved views (per-user and shared) on student + teacher tables, URL-synchronized.
- Teacher availability: 7×24 paint grid; leave request → admin approval workflow on a calendar.
- Internal notes (own-edit / admin-edit-any) on each student and teacher.

→ Full plan: [sys-03-students-teachers-courses.md](sys-03-students-teachers-courses.md)

---

## SYS-04 — Scheduling, Sessions, Attendance & Reports  *(DETAILED)*

**Modules:** 7, 8, 9 + Module 19 (initial teacher dashboard)

**Goal:** every active student has a recurring weekly schedule. Each session has a real Zoom link. Conflicts are detected before they happen. Teachers see Today / Upcoming / Students / Reports on their dashboard, mark attendance, and submit session reports. Makeup sessions follow an approval flow. Teacher leaves auto-flag affected sessions.

**Highlights:**
- `sys_schedule_patterns`, `sys_sessions`, `sys_session_reports`, `sys_makeup_requests`.
- Recurring weekly schedule per student with full timezone + DST awareness (`RecurrenceCalculator`).
- `SessionMaterializer` cron that idempotently rolls 14 days of concrete sessions from patterns.
- Zoom Server-to-Server JWT integration: meeting per session, `FakeZoomClient` for tests/dev.
- `ScheduleConflictDetector` (pure, unit-tested) covers double-booking, leave windows, availability gaps.
- Calendar UI (day / week / month) on FullCalendar with drag-to-reschedule + inline conflict modal.
- Session drawer with reschedule, cancel, attendance marking, makeup-request flow, and inline report submission.
- Attendance marker (4 states + cancelled-by + reason) with bulk-mark on `/attendance`.
- Session-report form: live char counter, `localStorage` autosave, edit-own/edit-any policy.
- Missing-report cron (every 15 min) writes admin notifications + teacher-dashboard banners.
- Teacher dashboard wired up: Today / Upcoming / Students / Reports / Leave (Salary placeholder for SYS-06).
- Teacher leave approval auto-flags affected sessions to `pending_substitute` and notifies admins.

→ Full plan: [sys-04-scheduling-sessions-attendance-reports.md](sys-04-scheduling-sessions-attendance-reports.md)

---

## SYS-05 — Pricing, Billing & Invoicing  *(DETAILED)*

**Modules:** 6, 11

**Goal:** the academy runs on auto-billing. Pro-rata works. Paymob is wired. Wallet credit auto-applies. Auto-suspension fires. The student lifecycle hooks from SYS-03 finally trigger on real payments — `Trial → Active`, `Paused → Active`, `Suspended → Active`.

**Highlights:**
- `sys_invoices`, `sys_invoice_lines`, `sys_payments`, `sys_wallet_transactions`, `sys_paymob_payment_links`, `sys_invoice_counters`.
- Pure services: `PriceCalculator`, `ProRataCalculator`, `WalletService`, `InvoiceNumberer`, `CurrencyConverter`. All unit-tested with 90% coverage target.
- Compound services: `InvoiceGenerator` (monthly + advance + reactivation), `PaymentRecorder`, `StudentBillingState`.
- Reactivation flow combines outstanding invoices + pro-rata into a single new invoice; voids originals; payment of full amount triggers `Suspended → Active`.
- Paymob integration: 3-step token flow, idempotent webhook with HMAC sha512 verification, `FakePaymobClient` for tests/dev.
- Wallet ledger with running balance snapshot + atomic credit/debit/adjust/applyToInvoice.
- Crons: monthly auto-generation (1st of month), hourly auto-suspend, hourly mark-overdue.
- PDF generator (DOMPDF) with academy branding, served via signed URLs cached at Backblaze B2.
- Excel export on the `reports` queue with notification on completion.
- Live public-site pricing endpoint (`/api/v1/pricing`) feeds the marketing pages — owner edits → site reflects within 60s.
- Mid-month session-change guard (the SYS-04-deferred check): increases blocked, decreases allowed but only effective next month.
- 24 system endpoints + 1 public endpoint + 1 webhook.

→ Full plan: [sys-05-pricing-billing-invoicing.md](sys-05-pricing-billing-invoicing.md)

---

## SYS-06 — Payroll, Bonuses & Quality  *(DETAILED)*

**Modules:** 10, 12, 13 + Module 19 (salary tab)

**Goal:** payroll auto-calculates on the 1st of each month from attended sessions. Admin reviews, approves, marks transferred. Bonuses + deductions live as adjustments. Quality scores compute automatically from attendance / report-submission / retention / punctuality and feed bonus recommendations. Teachers see their salary statement on the dashboard.

**Highlights:**
- `sys_payrolls`, `sys_payroll_adjustments`, `sys_quality_reviews`.
- Pure services: `PayrollCalculator` (snaps non-standard durations), `QualityScorer` (4 component scores + weighted overall), `BonusRecommender`.
- Compound services: `PayrollGenerator` (idempotent), `PayrollApprover` (Pending → Approved → Transferred state machine), `SalaryStatementBuilder`.
- Cron `0 1 1 * *` generates previous-month payrolls; auto-adds a single "late report" deduction when applicable.
- Weekly quality cron recomputes scores over trailing 30 days; flags underperforming teachers above the configured threshold.
- Adjustments UI: bonuses + deductions with categorized types + reason field; recompute on save.
- Approval workflow with bulk-approve and bulk-transfer (CSV-paste references); audit-logged at every step.
- Quality dashboard: per-teacher leaderboard, component breakdowns, trend sparklines, "Apply recommended bonus" CTA.
- Teacher dashboard salary tab: current statement + 12-month history + downloadable PDF salary slip (signed B2 URL).
- Excel export (summary + adjustments sheets) on the `reports` queue.
- Underperforming alert on the admin dashboard alerts panel.
- 19 system endpoints.

→ Full plan: [sys-06-payroll-bonuses-quality.md](sys-06-payroll-bonuses-quality.md)

---

## SYS-07 — Leads/CRM, Notifications & WhatsApp  *(DETAILED)*

**Modules:** 2, 15, 16

**Goal:** the academy stops missing leads or reminders. Every external touch goes through wassender. Every prior sprint's queued event finally has a wire. The lead pipeline is the supervisor's daily home.

**Highlights:**
- `sys_leads`, `sys_lead_follow_ups`, `sys_whatsapp_groups`, `sys_message_templates`, `sys_wassender_logs`.
- Real FK constraints installed on `sys_students.whatsapp_group_id` / `sys_teachers.whatsapp_group_id`; SYS-03's text placeholder data migrated into proper group rows.
- wassender integration: `WassenderClient` + `FakeWassenderClient` + `WassenderDispatcher` as the single fanout point; retry + dead-letter on `notifications` queue.
- Pure services: `MessageTemplateRenderer` (variable substitution + safe-strip), `LeadPipelineService` (state-machine guards), `ConversionAnalytics`.
- CRM Kanban with dnd-kit (drag 6 columns) + table-view toggle + URL-synchronized filters.
- Lead detail with follow-up scheduler, internal notes, "Convert to student" sheet that pre-fills SYS-03 student form.
- Trial booking from public site → background listener → `sys_leads` row + admin notification (idempotent).
- Lead analytics: funnel + per-source + per-supervisor + daily trend (Recharts).
- Message template editor with live preview using example variable values.
- Crons (every-minute / every-5-min / every-15-min): session reminders, payment reminders, report reminders, lead follow-up sweep.
- Listeners: invoice-created → payment link to student group; invoice-paid → confirmation; student-paused/suspended → teacher group; teacher-leave-approved → admin; trial→active first time → welcome message.
- All 12 internal notification types from Module 15 finally wired with dedupe windows.
- Per-user notification preferences (mute by type).
- Delivery log UI with rendered-message preview + retry button.
- 28 system endpoints.

→ Full plan: [sys-07-crm-notifications-whatsapp.md](sys-07-crm-notifications-whatsapp.md)

---

## SYS-08 — Accounting, Certificates, Settings, Audit & Launch  *(DETAILED)*

**Modules:** 14, 17, 18 (polish), 20, 21

**Goal:** full financial visibility, certificates, audit log, settings completeness, dashboard polish — and v1 is launched.

**Highlights:**
- `sys_expenses`, `sys_expense_categories`, `sys_certificates`, `sys_monthly_reports`, `sys_certificate_counters`.
- Compound services: `RevenueAggregator`, `ProfitLossCalculator`, `CollectionReportBuilder`, `CancellationReportBuilder`, `TrialAnalyticsBuilder`, `MonthlyReportGenerator`, `DashboardService`, `CertificateRenderer`, `CertificateNumberer`.
- Accounting screens: revenue (per-currency + per-course), P&L (monthly columns + totals), collection (rate trend + top-overdue), cancellation (reasons + per-teacher), trial analytics (funnel + best converting teacher).
- Auto monthly report cron (4 AM on the 1st) snapshots + persists PDF + Excel; signed B2 URLs.
- Certificates: 4 types (course / hifz / ijazah / other), branded landscape A4 PDF, live preview before issue, sequential numbering `CRT-YYYY-NNNNN`.
- Audit log UI unifies `sys_audit_logs` (deliberate actions) + `sys_activity_log` (model diffs); filterable; export to Excel.
- Settings completeness: academy info + logo upload, FX rates editor with staleness warning, expense categories CRUD, manual-backup button.
- Final dashboard polish: 8 real KPI cards + 4 charts (revenue trend / student growth / expenses donut / cancellation reasons) + real activity feed; 5-min Redis cache.
- Cross-module exports hub: students, teachers, invoices, payroll, attendance, cancellation, trial, P&L, audit log.
- Sentry SDK on both frontend + backend (PII-scrubbed); 10% sample rate in prod, 100% in staging.
- Launch checklist + 45-min recorded owner training; UptimeRobot + queue worker + cron health checks.
- 35+ system endpoints.

→ Full plan: [sys-08-accounting-certificates-launch.md](sys-08-accounting-certificates-launch.md)

---

## Backlog (post-v1, deferred)

These appear in [../../../system-requirments.md](../../../system-requirments.md) under "Deferred Features":

- CMS for public site content (already in site Sprint 7 via Filament).
- Learning materials management (uploads, curriculum library).
- Curriculum progress tracking (which Surah / Juz).
- Coupon / discount codes for marketing campaigns.
- Referral system (student brings student).
- Student portal at `student.alrayan-academy.com`.
- Student change requests (schedule / teacher change via system).
- Communication log per student.
- Campaign ROI tracking in CRM.
- Recurring auto-payment via Stripe / PayPal.
- Broadcast messages (send to all students / teachers).
- Auto WhatsApp group creation via wassender API.

These are tracked in [../../../TODO.md](../../../TODO.md) once raised.

---

*Last updated: May 10, 2026*
