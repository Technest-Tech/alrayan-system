# Database — Management System

How the system shares one MySQL database with the public site without stepping on it. The contract:

1. Every system-owned table is named `sys_<resource>`.
2. Tables that already exist for the site (`users`, `courses`, `trial_bookings`, `contact_messages`, `blog_posts`, `teachers` if site CMS lands first) are **shared** — the system extends them with system-specific columns or pivot tables, never renames them.
3. All foreign keys cross the boundary explicitly. A `sys_students.lead_id` referencing `sys_leads.id` is normal; a `sys_students.trial_booking_id` referencing the site's `trial_bookings.id` is the documented exception.

---

## Table catalog

Sorted by module. Every table here is owned by the system unless marked **(shared)**.

### Module 1 — Auth & RBAC

| Table | Owner | Purpose |
|---|---|---|
| `users` | **(shared)** | Existing site users table; system adds nullable columns: `role`, `phone`, `whatsapp`, `last_login_at`, `is_active`. Linked via Spatie Permission. |
| `roles` | (Spatie) | `admin`, `supervisor`, `teacher` — seeded |
| `permissions` | (Spatie) | One row per permission string from `PermissionRegistry` |
| `model_has_roles` | (Spatie) | User ↔ role |
| `model_has_permissions` | (Spatie) | User ↔ direct permission (used for granular supervisor configs) |
| `role_has_permissions` | (Spatie) | Role ↔ permission |

### Module 2 — Leads / CRM

| Table | Notes |
|---|---|
| `sys_leads` | name, email, phone, whatsapp, country, course_interest, source, status, assigned_supervisor_id, lost_reason, trial_booking_id (nullable, FK to public `trial_bookings`), created_at |
| `sys_lead_follow_ups` | lead_id, scheduled_at, action, notes, completed_at, completed_by_user_id |

### Module 3 — Students

| Table | Notes |
|---|---|
| `sys_students` | profile fields, status enum, age_category, parent fields, currency, monthly_price, sessions_per_month, session_duration, custom_discount_pct, wallet_balance_minor, whatsapp_group_id (FK), assigned_teacher_id, lead_id (nullable), enrolled_at |
| `sys_student_timeline` | student_id, actor_user_id, event_type, payload (JSON: old/new), created_at — log every change |
| `sys_student_family_links` | student_id, sibling_student_id (symmetric link), discount_pct |
| `sys_student_notes` | student_id, author_user_id, body, created_at |

### Module 4 — Teachers

| Table | Notes |
|---|---|
| `sys_teachers` | user_id (FK users), qualifications, payment_method, payment_account_details (encrypted), per_minute_rate_30 (EGP minor), per_minute_rate_45, per_minute_rate_60, whatsapp_group_id (FK), is_active |
| `sys_teacher_availability` | teacher_id, day_of_week, start_time, end_time, timezone |
| `sys_teacher_leaves` | teacher_id, start_date, end_date, reason, status (pending/approved/rejected), reviewed_by_user_id |

### Module 5 — Courses

| Table | Notes |
|---|---|
| `courses` | **(shared)** — site already owns this. System reads name + description, ignores marketing fields. |

### Module 7 — Scheduling

| Table | Notes |
|---|---|
| `sys_schedule_patterns` | student_id, day_of_week, start_time (in student TZ), duration_min, valid_from, valid_to (nullable). Recurring rule. |
| `sys_sessions` | student_id, teacher_id, scheduled_start (UTC), scheduled_end (UTC), duration_min, zoom_meeting_id, zoom_join_url, status (scheduled/attended/absent/cancelled/rescheduled), cancelled_by, cancelled_reason, original_session_id (nullable, when this is a makeup) |

### Module 8 — Attendance & Module 9 — Reports

| Table | Notes |
|---|---|
| `sys_session_reports` | session_id (unique), teacher_id, student_id, covered_text, performance, homework_text, next_session_notes, submitted_at |
| `sys_makeup_requests` | original_session_id, requested_by_user_id, proposed_start_at, status (pending/approved/denied), reviewed_by, makeup_session_id (nullable) |

### Module 10 — Quality

| Table | Notes |
|---|---|
| `sys_quality_reviews` | teacher_id, period_year, period_month, reviewer_user_id, attendance_score, report_score, retention_score, punctuality_score, overall_score, notes |

### Module 11 — Billing & Invoicing

| Table | Notes |
|---|---|
| `sys_invoices` | student_id, invoice_number (unique, format `INV-2026-NNNNN`), type (advance/monthly), period_year, period_month (nullable for advance), currency, subtotal_minor, discount_minor, wallet_credit_minor, total_minor, status (draft/sent/paid/overdue/void), issued_at, due_at, paid_at |
| `sys_invoice_lines` | invoice_id, description, sessions_count, session_duration_min, unit_price_minor, line_total_minor |
| `sys_payments` | invoice_id, amount_minor, currency, method (paymob/bank/paypal/vodafone_cash/other), reference, paymob_transaction_id (nullable), paid_at, recorded_by_user_id |
| `sys_wallet_transactions` | student_id, amount_minor (positive=credit, negative=debit), currency, source (overpayment/manual/adjustment/invoice), source_id (polymorphic), note, created_at |
| `sys_paymob_payment_links` | invoice_id, payment_url, expires_at, paymob_order_id |

### Module 12 — Payroll & Module 13 — Bonuses

| Table | Notes |
|---|---|
| `sys_payrolls` | teacher_id, period_year, period_month, total_minutes, base_salary_minor (EGP), bonuses_minor, deductions_minor, net_salary_minor, status (pending/approved/transferred), approved_by_user_id, approved_at, transferred_at, transfer_reference |
| `sys_payroll_adjustments` | payroll_id, type (bonus/deduction), amount_minor, reason, added_by_user_id, created_at |

### Module 14 — Accounting

| Table | Notes |
|---|---|
| `sys_expenses` | category_id, amount_minor, currency, description, occurred_on, created_by_user_id |
| `sys_expense_categories` | name, slug, is_default |

(Revenue is derived from `sys_payments` + `sys_invoices`. P&L is computed; not stored.)

### Module 15 — Notifications

| Table | Notes |
|---|---|
| `sys_notifications` | user_id, type, title, body, link, read_at, created_at |
| `sys_message_templates` | key (unique, e.g. `session_reminder`, `payment_due`), channel (whatsapp/email), subject, body (with `{variables}`), is_active |
| `sys_wassender_logs` | template_key, recipient_phone, group_id, status, error, sent_at, payload (JSON) |

### Module 16 — WhatsApp Groups

| Table | Notes |
|---|---|
| `sys_whatsapp_groups` | type (student/teacher), invite_link, status (active/stopped), linked_student_id (nullable), linked_teacher_id (nullable), created_at |

### Module 17 — Certificates

| Table | Notes |
|---|---|
| `sys_certificates` | student_id, type (course_completion/hifz_milestone/ijazah), title, course_id, teacher_id, issued_on, pdf_path, certificate_number (unique) |

### Module 20 — Settings

| Table | Notes |
|---|---|
| `sys_settings` | key (unique), value (JSON), category, updated_by_user_id, updated_at — single bag for all configurable settings; typed accessors in `App\Services\System\Settings` |

### Module 21 — Audit

| Table | Notes |
|---|---|
| `sys_audit_logs` | actor_user_id, action, target_type, target_id, before (JSON), after (JSON), ip, user_agent, created_at |
| (`activity_log` from spatie/laravel-activitylog) | Renamed to `sys_activity_log` via package config — the system source of truth for model changes |

---

## Naming conventions

- **Snake case singular** for the resource, plural for the table — `sys_students`, `sys_teachers`, `sys_invoices`.
- **Money columns end in `_minor`** and store integer minor units (cents, piasters). E.g. `total_minor BIGINT NOT NULL`.
- **Datetimes are UTC** (`scheduled_start TIMESTAMP`). Display-time timezones are computed at the boundary (frontend/API Resource).
- **Booleans are `is_*` or `has_*`** — `is_active`, `has_paid`. Default value always set explicitly.
- **Foreign keys** are `<related>_id` and always `NOT NULL` unless intentionally optional, with `ON DELETE` chosen per case (RESTRICT for finance, CASCADE for child rows like timeline).

---

## Money & currency

- Each student has a `currency` (USD / EUR / CAD / GBP / EGP / AED / KWD / BHD / SAR).
- Invoices carry `currency` + `*_minor` integers. Never store floats for money.
- Payments must match the invoice currency. If the academy receives EGP for a USD invoice, that's two rows: payment in EGP + a wallet adjustment.
- Teachers are paid in **EGP only** — `sys_payrolls` has no currency column.
- Reports that aggregate across currencies show each currency as its own column. A "base currency" total (EGP by default) is computed from a `sys_settings` rate table (manual entry; we don't auto-fetch FX rates in v1).

---

## Migrations strategy

- All system migrations live under `database/migrations/` with timestamps **after** all existing site migrations. The first system migration is dated `2026_06_01_000001_*`.
- Migrations are split per table (one CREATE TABLE per file) so they're easy to skim, revert, and reorder.
- A `2026_06_01_999999_seed_system_baseline.php` migration runs at the very end and seeds:
  - default expense categories,
  - default message templates,
  - default supervisor permission set,
  - the academy admin user (read from `.env` so it's idempotent across envs).
- We never edit the public-site migrations to add system columns. Instead, we add a new migration that uses `Schema::table('users', …)` with `$table->string('role')->nullable()`. Order matters: this migration must come *after* the site's `users` table creation.

---

## Foreign key map (cross-boundary)

| From (system) | To (shared/site) | On delete |
|---|---|---|
| `sys_leads.trial_booking_id` | `trial_bookings.id` | `SET NULL` (history preserved) |
| `sys_students.lead_id` | `sys_leads.id` | `SET NULL` |
| `sys_students.assigned_teacher_id` | `sys_teachers.id` | `RESTRICT` |
| `sys_teachers.user_id` | `users.id` | `RESTRICT` |
| `sys_invoices.student_id` | `sys_students.id` | `RESTRICT` |
| `sys_payments.invoice_id` | `sys_invoices.id` | `RESTRICT` |
| `sys_sessions.student_id` | `sys_students.id` | `RESTRICT` |
| `sys_sessions.teacher_id` | `sys_teachers.id` | `RESTRICT` |
| `sys_session_reports.session_id` | `sys_sessions.id` | `CASCADE` |
| `sys_certificates.course_id` | `courses.id` | `RESTRICT` |
| `sys_expenses.category_id` | `sys_expense_categories.id` | `RESTRICT` |
| `sys_payrolls.teacher_id` | `sys_teachers.id` | `RESTRICT` |
| `sys_quality_reviews.teacher_id` | `sys_teachers.id` | `CASCADE` |

`RESTRICT` is the default for anything financial — we want to fail loudly rather than silently lose audit trail.

---

## Indexing checklist

Every list endpoint hits a few common patterns. Add these in the migration:

- `sys_students`: `(status, assigned_teacher_id)`, `(lead_id)`, full-text on `(name, email, phone)` for search.
- `sys_invoices`: `(student_id, status)`, `(status, due_at)`, `(period_year, period_month)`, `invoice_number` unique.
- `sys_sessions`: `(scheduled_start)`, `(teacher_id, scheduled_start)`, `(student_id, scheduled_start)`.
- `sys_payments`: `(invoice_id)`, `(paid_at)`.
- `sys_audit_logs`: `(actor_user_id, created_at)`, `(target_type, target_id, created_at)`.

Composite indexes are documented in each migration; we measure with `EXPLAIN` before adding more.

---

## Soft deletes

- Soft delete is enabled on: `sys_students`, `sys_teachers`, `sys_courses` extensions, `sys_invoices` (rare — usually voided instead), `sys_expenses`, `sys_certificates`.
- Hard delete only ever via Artisan command, never from the UI.
- Audit log writes the actor + reason for deletes.

---

## Backups

Site already documents `mysqldump` to Backblaze B2 daily. The system inherits this. Specific changes:

- `--single-transaction --quick` mandatory once `sys_audit_logs` grows.
- Retention: 30 days rolling daily, plus monthly snapshots kept for 12 months.
- Restore drill: every quarter, test restoring the latest snapshot to a sandbox DB and verify a sample student record + invoice resolves end-to-end.

Detailed steps land in [../SERVER-SETUP.md](../SERVER-SETUP.md) updates during SYS-01.

---

## Local dev seeding

`php artisan db:seed --class=System\\DemoDataSeeder` creates:

- 1 admin user (`admin@local`) + 1 supervisor + 3 teachers,
- 25 students across statuses (Trial / Active / Paused / Suspended / Cancelled),
- 8 leads in various pipeline stages,
- 90 days of past sessions with mixed attendance,
- last 3 months of invoices (some paid, some overdue),
- 3 expense categories with sample expenses.

Demo seeder is a no-op when `APP_ENV=production`.

---

*Last updated: May 10, 2026*
