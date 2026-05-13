# SYS-08 — Accounting, Certificates, Settings, Audit & Launch

**Modules covered:** 14 (Accounting & Financial Reports), 17 (Certificates), 18 (Admin Dashboard — final polish), 20 (System Settings — final), 21 (Data & Administration)
**Duration:** 2 weeks
**Status:** Detailed, ready to implement.
**Sprint goal:** the academy gets full financial visibility — revenue, expenses, P&L, collection, cancellation, trial analytics. Certificates issue with branded PDFs. The audit log surfaces every action. Settings cover every remaining configurable. The admin dashboard hits its final polish — real KPIs, real charts, real-time. By end of sprint: the system is launched.

> **Prereqs** — SYS-07 has shipped. Every module is functional in isolation; SYS-08 ties them together and polishes for production.

> **Out of scope** — multi-currency P&L aggregation with auto-fetched FX rates (we ship with manual rates from SYS-05). Forecasting / budgets. Tax reports / VAT compliance. Real-time websocket dashboard.

---

## Definition of Done

### Backend
- [x] Three `sys_*` tables created: `sys_expenses`, `sys_expense_categories`, `sys_certificates`
- [x] One supporting table: `sys_monthly_reports` (snapshots of the auto-generated monthly summary)
- [x] Models: `Expense`, `ExpenseCategory`, `Certificate`, `MonthlyReport` — ActivityLog watched fields
- [x] Policies: `ExpensePolicy`, `CertificatePolicy`, `AuditLogPolicy` (admin all; supervisors gated on `accounting.view` / `certificates.view` / `audit.view`)
- [x] Compound services: `RevenueAggregator`, `ProfitLossCalculator`, `CollectionReportBuilder`, `CancellationReportBuilder`, `TrialAnalyticsBuilder`, `MonthlyReportGenerator`, `CertificateRenderer`, `CertificateNumberer`
- [x] 35+ endpoints under `/api/system/` (full table in [#endpoints](#endpoints))
- [x] Cron `0 4 1 * *` runs `MonthlyReportGenerator` for the previous month; added to `routes/console.php`
- [ ] Settings → Academy info logo upload (field exists; media-library integration pending)
- [ ] Sentry SDK installed and capturing both PHP + Next.js errors with environment tags

### Frontend
- [x] `/accounting/revenue` — revenue dashboard: totals by currency + monthly breakdown + by-course table
- [x] `/accounting/expenses` — filterable list with CRUD links
- [x] `/accounting/expenses/new` + `/accounting/expenses/[id]` — create / edit / delete
- [x] `/accounting/profit-loss` — P&L statement for selected year; monthly columns + totals row
- [x] `/accounting/collection` — KPI tiles (rate, avg delay, outstanding) + monthly trend table
- [x] `/accounting/cancellations` — reasons bars + by-teacher table + monthly rate table
- [x] `/accounting/trials` — conversion funnel metrics + best teacher + monthly trend table
- [x] `/accounting/monthly-report` — list with PDF / Excel / Regenerate per report
- [x] `/accounting/exports` — export hub: queue any export kind, inline queued feedback
- [x] `/certificates` — list + filter by type + status badges + "+ Issue" CTA
- [x] `/certificates/new` — issue form with live PDF preview (iframe) before save
- [x] `/certificates/[id]` — read-only view + Download PDF + Revoke button
- [ ] Student profile **Certificates** tab — student's own issued certificates (deferred)
- [x] `/audit-log` — UNION audit+activity feed, filters, diff drawer, pagination, Export
- [x] **Settings → Academy info** — name, email, phone, WhatsApp, address, timezone, footer
- [x] **Settings → Expense categories** — CRUD list; defaults marked; deactivate button
- [x] **Settings → FX rates** — inline rate editing table with staleness warnings
- [x] **Settings → Backups** — last backup time + "Run backup now" button
- [x] **Admin dashboard final polish** — 8 real KPI cards + 4 chart panels (revenue, student growth, expenses, cancellations) + alerts + recent activity
- [x] Dashboard KPIs cached 5 min in Redis (`DashboardService` — `dashboard:{user_id}` key)
- [ ] Mobile QA at 375px on every accounting page
- [ ] Lighthouse on `/dashboard`, `/accounting/revenue`, `/audit-log` ≥ 90 perf, ≥ 95 a11y
- [ ] `scripts/check-system-isolation.sh` still passes

### Launch readiness
- [ ] DNS cutover: `app.alrayan-academy.com` → Vercel prod project; `app-staging.*` already in place
- [ ] Production environment variables checked: all integration keys filled (Paymob, Zoom, wassender), Sentry DSN, Resend, B2 bucket
- [ ] Queue workers running as systemd services on the VPS: `default`, `notifications`, `reports`
- [ ] Horizon dashboard accessible at `api.alrayan-academy.com/horizon` (admin-only)
- [ ] Scheduled tasks visible via `php artisan schedule:list`; cron runs `schedule:run` every minute
- [ ] Backups: daily mysqldump to Backblaze B2 verified; restore-drill on a sandbox DB
- [ ] UptimeRobot pings on `app.*`, `api.*`, `alrayan-academy.com` every 5 min; webhook to email + WhatsApp on outage
- [ ] Sentry receiving errors from frontend + backend in production
- [ ] Owner training: 45-min recorded walkthrough covering daily / weekly / monthly admin tasks
- [ ] Day-1 smoke: every flow exercised end-to-end on production with real owner credentials

### Quality
- [ ] Unit tests for `RevenueAggregator`, `ProfitLossCalculator`, `CollectionReportBuilder`, `CancellationReportBuilder`, `TrialAnalyticsBuilder`, `CertificateNumberer`
- [ ] Feature tests for every endpoint
- [ ] PDF golden tests for `CertificateRenderer` and `MonthlyReportGenerator`
- [ ] Cron test for `MonthlyReportGenerator` with `Carbon::setTestNow()`
- [ ] Playwright covers the 8 acceptance flows below
- [ ] Smoke test in production after cutover

### Acceptance flows (Playwright)

1. **P&L for a custom range** — admin picks Jan–Jun 2026 → P&L renders with revenue minus (salaries + bonuses + expenses) per month → totals row at the bottom matches the sum of months.
2. **Add expense** — admin clicks "+ Add expense" → category Hosting & Domain, EGP 850, date today, currency EGP, description "Hostinger renewal" → save → appears in list → P&L includes it.
3. **Create custom expense category** — admin opens Settings → Expense categories → "+ Add category" → "Conferences" → save → new option appears in expense form.
4. **Issue certificate** — admin opens `/certificates/new` → pick Sarah Ahmed → type "Quran memorization milestone" → description "Completed Juz Amma" → PDF preview shows → confirm → certificate record created with auto-generated number → student profile Certificates tab shows it.
5. **Cancellation report shows reasons** — admin cancels a student with reason "Schedule" → opens `/accounting/cancellations` → "Schedule" bar increments; chart updates.
6. **Audit log search** — admin opens `/audit-log` → filter user=Sarah + action=`students.created` + last 30 days → exactly one row → click → drawer shows before/after diff.
7. **Monthly report download** — fast-forward to 1st of next month → run cron → admin opens `/accounting/monthly-report` → previous month listed → click "Download PDF" → PDF opens with revenue, expenses, P&L, KPIs.
8. **Dashboard KPIs render real numbers** — open `/dashboard` → 8 KPI cards show real counts that match `/students` filtered views; charts render with 12-month data.

---

## Story breakdown

### S8-01 — Migrations  *(0.5 day)*

Four migrations dated `2026_09_07_*`.

**`2026_09_07_000001_create_sys_expense_categories_table.php`**

```php
Schema::create('sys_expense_categories', function (Blueprint $t) {
    $t->id();
    $t->string('name');
    $t->string('slug')->unique();
    $t->boolean('is_default')->default(false);            // ships seeded; can't delete defaults
    $t->boolean('is_active')->default(true);
    $t->timestamps();
});
```

**`2026_09_07_000002_create_sys_expenses_table.php`**

```php
Schema::create('sys_expenses', function (Blueprint $t) {
    $t->id();
    $t->foreignId('category_id')->constrained('sys_expense_categories')->restrictOnDelete();
    $t->bigInteger('amount_minor');
    $t->char('currency', 3);
    $t->string('description');
    $t->date('occurred_on');
    $t->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
    $t->json('attachments')->nullable();                  // media-library refs to receipts
    $t->softDeletes();
    $t->timestamps();
    $t->index(['occurred_on']);
    $t->index(['category_id', 'occurred_on']);
});
```

**`2026_09_07_000003_create_sys_certificates_table.php`**

```php
Schema::create('sys_certificates', function (Blueprint $t) {
    $t->id();
    $t->string('certificate_number', 32)->unique();       // CRT-2026-00042 format
    $t->foreignId('student_id')->constrained('sys_students')->restrictOnDelete();
    $t->foreignId('course_id')->nullable()->constrained('courses')->nullOnDelete();
    $t->foreignId('teacher_id')->nullable()->constrained('sys_teachers')->nullOnDelete();
    $t->enum('type', ['course_completion', 'hifz_milestone', 'ijazah', 'other']);
    $t->string('title');                                  // "Completed Juz Amma"
    $t->text('description')->nullable();                  // free-form body
    $t->date('issued_on');
    $t->string('pdf_path', 500)->nullable();
    $t->foreignId('issued_by_user_id')->nullable()->constrained('users')->nullOnDelete();
    $t->softDeletes();
    $t->timestamps();
    $t->index(['student_id', 'issued_on']);
    $t->index(['type', 'issued_on']);
});
```

**`2026_09_07_000004_create_sys_monthly_reports_table.php`**

```php
Schema::create('sys_monthly_reports', function (Blueprint $t) {
    $t->id();
    $t->unsignedSmallInteger('period_year');
    $t->unsignedTinyInteger('period_month');
    $t->json('summary');                                  // KPIs snapshot
    $t->string('pdf_path', 500)->nullable();
    $t->string('xlsx_path', 500)->nullable();
    $t->timestamp('generated_at');
    $t->foreignId('generated_by_user_id')->nullable()->constrained('users')->nullOnDelete();   // null = cron
    $t->timestamps();
    $t->unique(['period_year', 'period_month']);
});
```

#### `sys_settings` keys added

```php
'academy.name'              => 'Alrayan Academy',
'academy.logo_path'         => null,                      // media-library
'academy.support_email'     => '',
'academy.support_phone'     => '',
'academy.support_whatsapp'  => '',
'academy.address'           => '',
'academy.default_timezone'  => 'Africa/Cairo',
'academy.footer_text'       => 'Thank you for choosing Alrayan Academy.',
'certificate.prefix'        => 'CRT',
'reports.base_currency'     => 'EGP',                     // for cross-currency aggregation
'sentry.dsn'                => '',
'sentry.environment'        => 'production',
```

#### Permissions (final list)

```php
'accounting'    => ['view', 'view_pnl', 'export'],
'expenses'      => ['view', 'create', 'edit', 'delete', 'manage_categories'],
'certificates'  => ['view', 'view_any', 'issue', 'edit', 'revoke'],
'audit'         => ['view'],
'settings'      => ['view', 'edit', 'edit_academy', 'edit_fx_rates', 'edit_expense_categories', 'manage_backups'],
```

#### Default expense categories (seeded)

| slug | name |
|---|---|
| `advertising_marketing` | Advertising / Marketing |
| `hosting_domain` | Hosting & Domain |
| `zoom_subscription` | Zoom subscription |
| `wassender_subscription` | wassender subscription |
| `tools_software` | Tools & Software |
| `office_supplies` | Office supplies |
| `professional_services` | Professional services |
| `other` | Other |

Seeded via baseline migration with `is_default=true`. Defaults cannot be deleted (but can be deactivated).

---

### S8-02 — Models, factories, policies  *(0.5 day)*

#### Models

**`Expense`**:

```php
class Expense extends Model
{
    use SoftDeletes, LogsActivity;
    protected $table = 'sys_expenses';
    protected $guarded = [];
    protected $casts = ['occurred_on' => 'date', 'attachments' => 'array'];

    public function category() { return $this->belongsTo(ExpenseCategory::class); }

    public function getActivitylogOptions(): LogOptions {
        return LogOptions::defaults()
            ->logOnly(['category_id','amount_minor','currency','occurred_on','description'])
            ->logOnlyDirty();
    }
}
```

**`Certificate`**:

```php
class Certificate extends Model
{
    use SoftDeletes, LogsActivity;
    protected $table = 'sys_certificates';
    protected $guarded = [];
    protected $casts = ['issued_on' => 'date'];

    public function student() { return $this->belongsTo(Student::class); }
    public function course()  { return $this->belongsTo(Course::class); }
    public function teacher() { return $this->belongsTo(Teacher::class); }
}
```

**`MonthlyReport`** stores the snapshot but is read-mostly — admin can regenerate, never edit by hand.

#### Policies

`ExpensePolicy` — admin all; supervisors gated by `expenses.*` perms.
`CertificatePolicy` — admin all; supervisors `certificates.view_any` / `certificates.issue`; teachers can view certificates for their assigned students only.
`AuditLogPolicy` — `audit.view` perm (admin only by default).

#### Factories

`ExpenseFactory`, `ExpenseCategoryFactory`, `CertificateFactory`, `MonthlyReportFactory`. `SystemDemoSeeder` extends to seed: 60 days of expenses across categories, 5 issued certificates, 3 historical monthly reports.

---

### S8-03 — Expenses CRUD + categories  *(1 day)*

#### Endpoints

```
GET    /api/system/expenses                    perm: expenses.view
GET    /api/system/expenses/{id}               perm: expenses.view
POST   /api/system/expenses                    perm: expenses.create
PATCH  /api/system/expenses/{id}               perm: expenses.edit
DELETE /api/system/expenses/{id}               perm: expenses.delete
POST   /api/system/expenses/import             perm: expenses.create   (CSV import — optional)
GET    /api/system/expense-categories          perm: expenses.view
POST   /api/system/expense-categories          perm: expenses.manage_categories
PATCH  /api/system/expense-categories/{id}     perm: expenses.manage_categories
POST   /api/system/expense-categories/{id}/deactivate    perm: expenses.manage_categories
```

#### UI

`/accounting/expenses/page.tsx`:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Expenses                                              [+ Add expense]    │
│ 24 this month · EGP 12,400 total                                         │
├──────────────────────────────────────────────────────────────────────────┤
│ [Category ▾]  [Date range ▾]  [Currency ▾]  [ Search…             ⌘K ]   │
├──────────────────────────────────────────────────────────────────────────┤
│ Date          Category            Description           Amount           │
│ Sep 5, 2026   Hosting & Domain    Hostinger renewal     EGP   850.00     │
│ Sep 3, 2026   Advertising         FB Ads — July         USD   220.00     │
│ Sep 1, 2026   wassender           Monthly fee           USD    49.00     │
│ …                                                                        │
└──────────────────────────────────────────────────────────────────────────┘
```

"+ Add expense" sheet: category select (filterable combobox), amount + currency, occurred date, description, optional file upload (receipt). Save audit-logs.

Category management lives under Settings → Expense categories (not on the expenses page) so it's not a daily-action surface.

---

### S8-04 — Revenue aggregation  *(0.5 day)*

`App\Services\System\RevenueAggregator`:

```php
class RevenueAggregator
{
    /** Returns total received payments grouped by currency in the period. */
    public function totalReceived(Carbon $from, Carbon $to): Collection
    {
        return Payment::whereBetween('paid_at', [$from, $to])
            ->selectRaw('currency, SUM(amount_minor) as total_minor')
            ->groupBy('currency')->get();
    }

    public function byCourse(Carbon $from, Carbon $to): Collection
    {
        return Payment::query()
            ->join('sys_invoices', 'sys_payments.invoice_id', '=', 'sys_invoices.id')
            ->join('sys_students', 'sys_invoices.student_id', '=', 'sys_students.id')
            ->whereBetween('sys_payments.paid_at', [$from, $to])
            ->selectRaw('sys_students.course_id, sys_payments.currency, SUM(sys_payments.amount_minor) as total_minor, COUNT(*) as payment_count')
            ->groupBy('sys_students.course_id', 'sys_payments.currency')->get();
    }

    public function byMonth(Carbon $from, Carbon $to, string $baseCurrency = 'EGP'): Collection
    {
        // Returns one row per (year, month, currency) plus a converted-to-base column.
        // Conversion uses sys_settings FX rates (CurrencyConverter from SYS-05).
        // ...
    }
}
```

Cached in Redis for 5 minutes per range — expensive otherwise on large data.

#### `/accounting/revenue/page.tsx`

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Revenue                                          [Last 12 months ▾]      │
├──────────────────────────────────────────────────────────────────────────┤
│ Totals by currency                                                       │
│   USD  18,450.00  (215 payments)                                         │
│   EGP  82,300.00  (4 payments)                                           │
│   GBP   1,420.00  (38 payments)                                          │
│   In EGP base (at current FX): EGP 1,124,500                             │
├──────────────────────────────────────────────────────────────────────────┤
│ Monthly trend  [Recharts area chart, stacked by currency]                │
├──────────────────────────────────────────────────────────────────────────┤
│ By course                                                                │
│   Tajweed              USD  8,400 / EGP  ... (135 payments)              │
│   Hifz                 USD  6,200 / EGP  ... (62 payments)               │
│   …                                                                      │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### S8-05 — Profit & Loss  *(1 day)*

`App\Services\System\ProfitLossCalculator`:

```php
public function statement(Carbon $from, Carbon $to, string $baseCurrency = 'EGP'): ProfitLossStatement
{
    $revenue  = $this->revenueInBase($from, $to, $baseCurrency);
    $salaries = $this->salariesInBase($from, $to);          // sys_payrolls.transferred between
    $bonuses  = $this->bonusesInBase($from, $to);
    $expenses = $this->expensesInBase($from, $to, $baseCurrency);

    $totalCosts = $salaries + $bonuses + $expenses;
    return new ProfitLossStatement(
        from: $from, to: $to, baseCurrency: $baseCurrency,
        revenue: $revenue,
        salaries: $salaries,
        bonuses: $bonuses,
        expenses: $expenses,
        totalCosts: $totalCosts,
        netProfit: $revenue - $totalCosts,
    );
}

public function byMonth(Carbon $from, Carbon $to, string $baseCurrency = 'EGP'): Collection
{
    // One row per (year, month) with the above columns.
}
```

> **Cross-currency conversion.** All values converted to `reports.base_currency` (default EGP) via `CurrencyConverter::convert` (from SYS-05). The rate snapshot used is **today's rate** for historical-period queries — explicitly not the rate on the day of the transaction. Module 14 didn't pin this; we pick "current rate for reporting" because it makes year-over-year comparable. Documented in the report header so owner understands.

#### `/accounting/profit-loss/page.tsx`

Table view: one row per category, one column per month + a total column.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Profit & Loss                                  [Year 2026 ▾]  Base: EGP  │
├─────────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬────────────────┤
│         │ Jan  │ Feb  │ Mar  │ Apr  │ May  │ Jun  │ Jul  │ Total          │
├─────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼────────────────┤
│ Revenue │ 94k  │ 102k │ 108k │ 115k │ 122k │ 128k │ 135k │ 804k EGP       │
│ Salaries│ 32k  │ 35k  │ 38k  │ 40k  │ 41k  │ 43k  │ 45k  │ 274k           │
│ Bonuses │  2k  │  1k  │  3k  │  2k  │  1k  │  4k  │  2k  │ 15k            │
│ Expenses│  8k  │  7k  │ 12k  │  9k  │ 10k  │  8k  │  9k  │ 63k            │
├─────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼────────────────┤
│ Profit  │ 52k  │ 59k  │ 55k  │ 64k  │ 70k  │ 73k  │ 79k  │ 452k           │
└─────────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴────────────────┘
```

Each cell click drills into the underlying records (e.g. click "Salaries Jul" → goes to `/payroll/2026-07`).

Endpoint:

```
GET /api/system/accounting/profit-loss?from=YYYY-MM-DD&to=YYYY-MM-DD&base=EGP   perm: accounting.view_pnl
```

---

### S8-06 — Collection report  *(0.5 day)*

`App\Services\System\CollectionReportBuilder`:

```php
public function build(Carbon $from, Carbon $to): CollectionReport
{
    $issued = Invoice::whereBetween('issued_at', [$from, $to])->where('type','monthly')->get();
    $onTime = $issued->where(fn($i) => $i->status === 'paid' && $i->paid_at <= $i->due_at)->count();
    $late   = $issued->where(fn($i) => $i->status === 'paid' && $i->paid_at > $i->due_at)->count();
    $unpaid = $issued->whereIn('status', ['sent','overdue'])->count();
    $avgDaysDelay = $issued->where('status','paid')
        ->map(fn($i) => max(0, $i->paid_at->diffInDays($i->due_at, false) * -1))
        ->avg();

    return new CollectionReport(
        totalIssued: $issued->count(),
        paidOnTime: $onTime,
        paidLate: $late,
        unpaid: $unpaid,
        collectionRate: $issued->count() === 0 ? 100 : (int) round(100 * ($onTime + $late) / $issued->count()),
        averageDaysDelay: (float) ($avgDaysDelay ?? 0),
        outstandingMinorByCurrency: $this->outstandingByCurrency(),
    );
}
```

UI: chart of collection-rate trend (line) + KPI tiles (rate %, avg delay, outstanding totals) + top-overdue students table.

Endpoint: `GET /api/system/accounting/collection?from=…&to=…`

---

### S8-07 — Cancellation report  *(0.5 day)*

`App\Services\System\CancellationReportBuilder`:

```php
public function build(Carbon $from, Carbon $to): CancellationReport
{
    $cancelled = Student::onlyTrashed()                  // soft-deleted = cancelled? No — cancelled stays in main table
        ->orWhere('status','cancelled')
        ->whereBetween('cancelled_at', [$from, $to])->get();

    return new CancellationReport(
        totalCancelled:       $cancelled->count(),
        byReason:             $cancelled->groupBy('cancellation_reason')->map->count(),
        byTeacher:            $cancelled->groupBy('assigned_teacher_id')->map->count(),
        monthlyCount:         $cancelled->groupBy(fn($s) => $s->cancelled_at->format('Y-m'))->map->count(),
        rate:                 $this->monthlyRate($cancelled, $from, $to),
    );
}
```

UI: monthly cancellation-rate line chart, reasons horizontal bars, students-lost-per-teacher table.

---

### S8-08 — Trial analytics  *(0.5 day)*

Different from SYS-07's lead analytics — that focused on the pipeline. This zooms into trials specifically.

`App\Services\System\TrialAnalyticsBuilder`:

```php
public function build(Carbon $from, Carbon $to): TrialAnalytics
{
    $trials = Lead::query()
        ->whereIn('status', ['trial_booked','trial_completed','enrolled','lost'])
        ->whereBetween('updated_at', [$from, $to])->get();

    $booked    = $trials->whereIn('status', ['trial_booked','trial_completed','enrolled','lost'])->count();
    $completed = $trials->whereIn('status', ['trial_completed','enrolled'])->count();
    $enrolled  = $trials->where('status', 'enrolled')->count();
    $bestTeacher = $this->bestConvertingTeacher($from, $to);

    return new TrialAnalytics(
        totalBooked:     $booked,
        completed:       $completed,
        enrolled:        $enrolled,
        notConverted:   $booked - $enrolled,
        conversionRate:  $booked === 0 ? 0 : (int) round(100 * $enrolled / $booked),
        monthlyTrend:    $this->trend($trials),
        bestTeacher:     $bestTeacher,
    );
}
```

The "best converting teacher" looks at trial sessions (sessions where the student was Trial at the time of the session) and finds which teacher had the highest conversion-to-Active rate.

UI: funnel + per-teacher table + monthly trend line.

---

### S8-09 — Auto monthly report  *(1 day)*

`App\Services\System\MonthlyReportGenerator`:

```php
public function generate(int $year, int $month, ?User $by = null): MonthlyReport
{
    $existing = MonthlyReport::where('period_year', $year)->where('period_month', $month)->first();
    if ($existing && !$by) return $existing;             // cron idempotent; manual regenerates

    $from = Carbon::create($year, $month, 1)->startOfMonth();
    $to   = $from->copy()->endOfMonth();

    $summary = [
        'period'           => sprintf('%d-%02d', $year, $month),
        'revenue'          => app(RevenueAggregator::class)->totalReceived($from, $to)->toArray(),
        'pnl'              => app(ProfitLossCalculator::class)->statement($from, $to),
        'collection'       => app(CollectionReportBuilder::class)->build($from, $to),
        'cancellations'    => app(CancellationReportBuilder::class)->build($from, $to),
        'trials'           => app(TrialAnalyticsBuilder::class)->build($from, $to),
        'student_growth'   => [
            'start_active' => Student::countActiveAt($from),
            'end_active'   => Student::countActiveAt($to),
            'new'          => Student::newBetween($from, $to),
            'cancelled'    => Student::cancelledBetween($from, $to),
        ],
        'teacher_stats'    => [
            'active' => Teacher::active()->count(),
            'leaves' => TeacherLeave::approved()->between($from, $to)->count(),
        ],
    ];

    $pdfPath  = $this->renderPdf($summary);              // signed B2 URL
    $xlsxPath = $this->renderXlsx($summary);

    return MonthlyReport::updateOrCreate(
        ['period_year' => $year, 'period_month' => $month],
        ['summary' => $summary, 'pdf_path' => $pdfPath, 'xlsx_path' => $xlsxPath,
         'generated_at' => now(), 'generated_by_user_id' => $by?->id]
    );
}
```

Cron `0 4 1 * *` (4 AM on the 1st) generates the previous month. Idempotent.

#### `/accounting/monthly-report/page.tsx`

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Monthly reports                                                          │
│ Auto-generated on the 1st of each month.                                 │
├──────────────────────────────────────────────────────────────────────────┤
│ Period       Generated         Revenue (EGP)  Net profit    Actions      │
│ Aug 2026     Sep 1 04:00       1,124,500      452,200       [PDF][Excel] │
│ Jul 2026     Aug 1 04:00         986,400      398,150       [PDF][Excel] │
│ Jun 2026     Jul 1 04:00         902,180      365,400       [PDF][Excel] │
│ …                                                                        │
│                                                                          │
│ [ Regenerate Aug 2026 ]   admin only                                    │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### S8-10 — Certificates  *(1.5 days)*

#### Endpoints

```
GET    /api/system/certificates                       perm: certificates.view_any
GET    /api/system/certificates/{id}                  perm: policy
POST   /api/system/certificates                       perm: certificates.issue
POST   /api/system/certificates/preview               perm: certificates.issue   (renders PDF without persisting)
PATCH  /api/system/certificates/{id}                  perm: certificates.edit
POST   /api/system/certificates/{id}/revoke           perm: certificates.revoke
GET    /api/system/certificates/{id}/pdf              perm: policy
GET    /api/system/students/{id}/certificates         perm: students.view
```

#### `App\Services\System\CertificateRenderer`

Reuses the DOMPDF + blade pattern from SYS-05. Template at `resources/views/system/pdf/certificate.blade.php`:

- A4 landscape, 1-page
- Academy logo at top center
- Decorative gold border + Islamic geometric corners
- "Certificate of {type}" headline (Fraunces 48pt)
- "Awarded to {student_name}" (Cormorant 36pt)
- Body text (auto from title + description fields)
- Date issued + certificate number
- Signature lines: "Director" and "{teacher_name}"
- Academy footer with contact info from settings

The renderer fetches academy branding from `sys_settings` so a logo change ripples to certificates immediately.

#### `CertificateNumberer`

Same pattern as `InvoiceNumberer` (SYS-05) — row-locked counter per year:

```
CRT-2026-00042
```

Migration `2026_09_07_000005_create_sys_certificate_counters_table.php` (tiny — `year` + `last`).

#### UI

`/certificates/new/page.tsx` — full-page form:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Issue certificate                                                        │
├──────────────────────────────────────────────────────────────────────────┤
│ Student:        [Sarah Ahmed                              ▾]             │
│ Type:           ( ) Course completion                                    │
│                 (●) Hifz / memorization milestone                        │
│                 ( ) Ijazah                                               │
│                 ( ) Other                                                │
│ Title:          [Completed Juz Amma                                ]     │
│ Description:    [ Achieved memorization of Juz 30 (Surah An-Naba …)]     │
│ Course:         [Quran Memorization (Hifz)                         ▾]    │
│ Teacher:        [Sh. Hassan                                        ▾]    │
│ Issued on:      [Sep 7, 2026 ▾]                                          │
│                                                                          │
│ [ Live PDF preview, A4 landscape ]                                       │
│                                                                          │
│                                       [ Cancel ]  [ Issue + Save PDF ]   │
└──────────────────────────────────────────────────────────────────────────┘
```

Live preview hits `POST /certificates/preview` which renders to a `data:application/pdf` URL the browser embeds in an `<iframe>` — no server-side persistence until "Issue + Save PDF".

On save: the PDF is rendered, uploaded to B2 with a `sys_certificates.pdf_path`, certificate-number generated, audit-logged. The student profile **Certificates** tab shows the new row.

---

### S8-11 — Audit log UI  *(1 day)*

`/audit-log/page.tsx` — single-pane combining `sys_audit_logs` (deliberate actions) and `sys_activity_log` (Spatie's model-change diffs). The merge is done at the query layer with a UNION pattern:

```
GET /api/system/audit-log?actor=&action=&target=&from=&to=&q=
```

Returns a paginated, sorted feed where each row has:
- `at` (timestamp)
- `actor` (user or system)
- `source` (`audit` or `activity`)
- `action` (`students.created`, `payment.recorded`, etc.)
- `target_type` (`Student`, `Invoice`, …)
- `target_id`
- `target_label` (e.g. student name — denormalized for fast display)
- `diff` (`{old: {...}, new: {...}}` for activity rows; arbitrary payload for audit rows)

UI:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Audit log                                                                │
│ Every action recorded.                                                   │
├──────────────────────────────────────────────────────────────────────────┤
│ [Actor ▾] [Action ▾] [Target type ▾] [Date range ▾]  [Search…       ⌘K ] │
├──────────────────────────────────────────────────────────────────────────┤
│ At            Actor       Action               Target            Source  │
│ 2h ago        Sarah       students.created     Yusuf Khan        audit   │
│ 3h ago        Sarah       Student.updated      Yusuf Khan        activity│
│ 5h ago        System cron payroll.generated    Sh. Hassan        audit   │
│ 1d ago        Omar        auth.login_success   —                 audit   │
└──────────────────────────────────────────────────────────────────────────┘
```

Click a row → drawer with full diff (before/after JSON-pretty-printed). Long fields collapse with "show more".

Export: `POST /api/system/audit-log/export` queues an Excel export with the current filters.

---

### S8-12 — Academy info + FX rates + categories UI  *(0.5 day)*

Three settings pages, all small but visible.

#### Settings → Academy info

```
┌──────────────────────────────────────────────────────────────────┐
│ Academy info                                                     │
│ Used on certificates, invoices, and emails.                      │
├──────────────────────────────────────────────────────────────────┤
│ Name:               [ Alrayan Academy                       ]    │
│ Logo:               [Upload]  (current: alrayan-logo.svg)        │
│ Support email:      [ info@alrayan-academy.com              ]    │
│ Support phone:      [ +20 100 000 0000                      ]    │
│ Support WhatsApp:   [ +20 100 000 0000                      ]    │
│ Address:            [                                       ]    │
│ Default timezone:   [ Africa/Cairo                        ▾ ]    │
│ Footer text         [                                       ]    │
│ (invoices/certs):                                                │
└──────────────────────────────────────────────────────────────────┘
[Cancel]                                              [Save settings]
```

Logo upload uses `spatie/laravel-medialibrary`. The `academy.logo_path` setting stores the media-library ID.

#### Settings → FX rates

```
┌──────────────────────────────────────────────────────────────────┐
│ FX rates                                                         │
│ Manual conversion rates used for financial reports.              │
├──────────────────────────────────────────────────────────────────┤
│ From → To       Rate         Updated           Notes             │
│ USD → EGP       48.50        Sep 1, 2026       [Edit]            │
│ EUR → EGP       52.10        Sep 1, 2026       [Edit]            │
│ GBP → EGP       61.20        Sep 1, 2026       [Edit]            │
│ CAD → EGP       35.80        Aug 2, 2026  ⚠   [Edit]             │
│ …                                                                │
├──────────────────────────────────────────────────────────────────┤
│ ⚠ CAD → EGP rate is 36 days old. Reports may be inaccurate.      │
└──────────────────────────────────────────────────────────────────┘
```

Staleness threshold (30 days) configurable; warning surfaces on every rate older.

#### Settings → Expense categories

Simple CRUD list. Defaults can be deactivated but not deleted; custom categories can be deleted unless referenced by expenses (RESTRICT FK).

---

### S8-13 — Admin dashboard final polish  *(1.5 days)*

Replace every placeholder from SYS-02 with real data.

#### `App\Services\System\DashboardService::summary(User $user)`

Returns a single JSON shape with everything the dashboard needs in one round-trip. Cached 5 min in Redis (`dashboard:{user_id}` key).

```php
return [
    'kpis' => [
        'active_students'        => Student::active()->count(),
        'active_students_delta'  => $this->deltaSince($lastMonth, 'active'),
        'trial_students'         => Student::trial()->count(),
        'paused_students'        => Student::paused()->count(),
        'suspended_students'     => Student::suspended()->count(),
        'today_sessions'         => Session::today(Setting::get('academy.default_timezone'))->count(),
        'month_revenue'          => $this->revenueByCurrencyForCurrentMonth(),
        'month_net_profit_base'  => app(ProfitLossCalculator::class)->statement(...)->netProfit,
        'outstanding'            => $this->outstandingByCurrency(),
        'collection_rate'        => app(CollectionReportBuilder::class)->build(...)->collectionRate,
        'conversion_rate_30d'    => app(ConversionAnalytics::class)->funnel(...)->conversionRate(),
    ],
    'charts' => [
        'revenue_12m'            => $this->revenueByMonth(12),
        'student_growth_12m'     => $this->studentGrowthByMonth(12),
        'expenses_breakdown_30d' => $this->expensesByCategory(30),
        'cancellation_reasons'   => $this->cancellationReasons(90),
    ],
    'alerts'         => Notification::unreadFor($user)->limit(10)->get(),
    'recent_activity'=> $this->recentActivityFor($user, 10),
];
```

Endpoint already exists from SYS-02 (`/api/system/dashboard`); this sprint fills in every field.

#### UI updates

`/dashboard/page.tsx` gets:

- 4 KPI cards in row 1 (Active / Trial / Paused / Suspended) — already there, just real numbers
- 4 KPI cards in row 2 (Today's sessions / Revenue this month / Outstanding / Conversion 30d) — already there
- **Revenue trend chart** — 12-month area, stacked by currency (Recharts) — NEW
- **Student growth chart** — 12-month line + bars for new vs cancelled — NEW
- **Expenses breakdown donut** — last 30 days by category — NEW
- **Cancellation reasons** — last 90 days horizontal bars — NEW
- **Alerts panel** — pulled from `sys_notifications` (already from SYS-02; now with real volume)
- **Recent activity feed** — real entries from audit + activity logs

Charts respect dark mode via the `next-themes` integration; series colors match the SYS-01 design system.

---

### S8-14 — Cross-module exports  *(0.5 day)*

Final consolidation. We've shipped exports module-by-module; SYS-08 adds a single "Reports" hub:

`/accounting/exports/page.tsx`:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Exports                                                                  │
│ Generate spreadsheets and PDFs for any report. Large exports run async   │
│ — you'll get a notification when ready.                                  │
├──────────────────────────────────────────────────────────────────────────┤
│ Students roster              [Excel] [PDF]                               │
│ Teachers roster              [Excel] [PDF]                               │
│ Invoices (all-time)          [Excel]                                     │
│ Invoices (range)             [Excel]                                     │
│ Payroll (range)              [Excel]                                     │
│ Attendance summary           [Excel]                                     │
│ Cancellation report          [Excel] [PDF]                               │
│ Trial analytics              [Excel] [PDF]                               │
│ P&L statement                [Excel] [PDF]                               │
│ Audit log                    [Excel]                                     │
└──────────────────────────────────────────────────────────────────────────┘
```

Each button opens a small dialog: pick range, format. Submit queues a `BuildExport` job (one universal class with a `kind` argument); on completion the user gets an internal notification with a signed B2 download link.

A "Recent exports" panel below lists the last 10 with download buttons.

---

### S8-15 — Sentry + monitoring  *(0.5 day)*

#### Backend

```bash
composer require sentry/sentry-laravel
php artisan sentry:publish --dsn=$SENTRY_DSN
```

`config/sentry.php` — environment from `sys_settings`, sample rate 0.1 in prod, 1.0 in staging. PII scrubbing on by default (strip emails / phones from breadcrumbs).

#### Frontend

```bash
pnpm add @sentry/nextjs
```

`sentry.client.config.ts` + `sentry.server.config.ts` — DSN from `NEXT_PUBLIC_SENTRY_DSN`. Sentry is only initialized on `(system)` routes — we don't want every marketing-site error counting against our quota:

```ts
if (typeof window !== 'undefined' && window.location.hostname.startsWith('app.')) {
  Sentry.init({ ... })
}
```

#### Alerts

Sentry project → alert rules:
- Any error in production → Slack/email immediate
- Error rate > 50/hour → page on-call
- Performance regression > 30% → daily digest

---

### S8-16 — Launch checklist + owner training  *(1 day)*

A separate `docs/system/LAUNCH-CHECKLIST.md` (new file, mirrors site's existing `DEPLOYMENT-GUIDE.md`). Items:

- [ ] Confirm DNS for `app.alrayan-academy.com`, `app-staging.alrayan-academy.com` — both green on UptimeRobot
- [ ] Verify all production env vars set
- [ ] Run final `php artisan migrate --force` on production
- [ ] Seed default expense categories + message templates (idempotent — re-run safe)
- [ ] Create the owner's admin user via Tinker (or `php artisan system:user:create-admin`)
- [ ] Verify queue workers running: `systemctl status alrayan-queue-default alrayan-queue-notifications alrayan-queue-reports`
- [ ] Verify Horizon running: `systemctl status alrayan-horizon`
- [ ] Verify scheduler cron in `crontab -l`
- [ ] Verify backups: trigger manual backup, restore-drill on a sandbox DB
- [ ] Run a single end-to-end smoke flow as the owner on production: log in → create student → invoice → pay → see KPIs
- [ ] Submit `sitemap.xml` to Search Console (system routes excluded — they're behind auth + on a subdomain)
- [ ] Sentry receiving from prod (trigger a test error)
- [ ] UptimeRobot pings: every 5 minutes on the 3 hosts, alert webhook configured
- [ ] Owner training video recorded (45 min, screen + voice, cloud-uploaded)
- [ ] Owner has bookmarks for: `/dashboard`, `/leads`, `/students`, `/billing/invoices`, `/payroll`, `/accounting/profit-loss`
- [ ] Owner trained on: invoicing workflow, payroll workflow, lead pipeline, audit log

#### Recorded training agenda

| Section | Duration |
|---|---|
| Tour: dashboard + nav | 5 min |
| Daily workflow: handling new leads + follow-ups | 8 min |
| Weekly workflow: reviewing missing reports + absences | 5 min |
| Monthly workflow: generating monthly invoices + payroll + report | 10 min |
| Issuing a certificate | 3 min |
| Settings: pricing, billing, templates, FX rates | 8 min |
| Where to find data: audit log, exports | 4 min |
| Wrap: support contacts + how to file a bug | 2 min |

Video stored in B2 + linked from the system's `/dashboard` welcome message (one-time onboarding card the owner can dismiss).

---

### S8-17 — Tests  *(1.5 days)*

#### Unit

- `RevenueAggregatorTest` — multi-currency totals; empty range returns 0s.
- `ProfitLossCalculatorTest` — happy path + zero-revenue + zero-cost + negative profit; cross-currency conversion via rate snapshot.
- `CollectionReportBuilderTest` — collection rate boundary cases.
- `CancellationReportBuilderTest` — bucketing by reason + by teacher.
- `TrialAnalyticsBuilderTest` — best-converting-teacher tie-breaking, empty range.
- `CertificateNumbererTest` — concurrent generation, no duplicates.
- `MonthlyReportGeneratorTest` — idempotency, range correctness, snapshot completeness.

#### Feature

- `ExpensesEndpointsTest` — full CRUD, category constraints, currency validation.
- `CertificateEndpointsTest` — issue + preview + download + revoke; teacher-self-policy.
- `AuditLogEndpointTest` — filter combinations; result paging.
- `DashboardEndpointTest` — admin sees full payload; supervisor sees scoped; cache hit/miss.
- `MonthlyReportCronTest` — Carbon-mocked 1st-of-month, generates last month, second run no-op.
- `SettingsAcademyTest` — logo upload, save, retrieve.

#### PDF golden tests

- `CertificatePdfTest` — render each of the 4 types (course / hifz / ijazah / other), assert key strings present in extracted PDF text.
- `MonthlyReportPdfTest` — assert revenue/expense/profit numbers appear in the PDF.

#### Playwright

`frontend/e2e/system/accounting-launch.spec.ts` — 8 acceptance flows.

---

### S8-18 — Deploy + smoke + owner training  *(1 day)*

Order of operations on launch day:

1. Final code merge to `main` — all SYS-08 changes.
2. CI runs full system test suite — including the isolation script.
3. Deploy backend to prod VPS (rolling): migrations + asset compile + queue restart + horizon restart.
4. Deploy frontend to Vercel (auto on merge); confirm `app.alrayan-academy.com` reachable.
5. Configure final production secrets (Paymob LIVE, Zoom LIVE, wassender LIVE, Sentry DSN, B2 bucket).
6. Run baseline seeders (expense categories, message templates, RBAC roles — all idempotent from earlier sprints).
7. Create academy admin user.
8. Owner walks the smoke checklist end-to-end with screen-share.
9. Record the 45-min training video.
10. Send launch email to internal team.
11. Sprint demo and owner sign-off.

---

## Endpoints {#endpoints}

| Method | Path | Permission |
|---|---|---|
| GET    | `/api/system/accounting/revenue`                              | `accounting.view` |
| GET    | `/api/system/accounting/profit-loss`                          | `accounting.view_pnl` |
| GET    | `/api/system/accounting/collection`                           | `accounting.view` |
| GET    | `/api/system/accounting/cancellations`                        | `accounting.view` |
| GET    | `/api/system/accounting/trials`                               | `accounting.view` |
| GET    | `/api/system/expenses`                                        | `expenses.view` |
| GET    | `/api/system/expenses/{id}`                                   | `expenses.view` |
| POST   | `/api/system/expenses`                                        | `expenses.create` |
| PATCH  | `/api/system/expenses/{id}`                                   | `expenses.edit` |
| DELETE | `/api/system/expenses/{id}`                                   | `expenses.delete` |
| GET    | `/api/system/expense-categories`                              | `expenses.view` |
| POST   | `/api/system/expense-categories`                              | `expenses.manage_categories` |
| PATCH  | `/api/system/expense-categories/{id}`                         | `expenses.manage_categories` |
| GET    | `/api/system/monthly-reports`                                 | `accounting.view_pnl` |
| GET    | `/api/system/monthly-reports/{id}/pdf`                        | `accounting.view_pnl` |
| GET    | `/api/system/monthly-reports/{id}/xlsx`                       | `accounting.view_pnl` |
| POST   | `/api/system/monthly-reports/regenerate`                      | `accounting.export` |
| GET    | `/api/system/certificates`                                    | `certificates.view_any` |
| GET    | `/api/system/certificates/{id}`                               | policy |
| POST   | `/api/system/certificates`                                    | `certificates.issue` |
| POST   | `/api/system/certificates/preview`                            | `certificates.issue` |
| PATCH  | `/api/system/certificates/{id}`                               | `certificates.edit` |
| POST   | `/api/system/certificates/{id}/revoke`                        | `certificates.revoke` |
| GET    | `/api/system/certificates/{id}/pdf`                           | policy |
| GET    | `/api/system/students/{id}/certificates`                      | `students.view` |
| GET    | `/api/system/audit-log`                                       | `audit.view` |
| GET    | `/api/system/audit-log/{id}`                                  | `audit.view` |
| POST   | `/api/system/audit-log/export`                                | `audit.view` |
| GET    | `/api/system/exports`                                         | `accounting.export` |
| POST   | `/api/system/exports`                                         | `accounting.export` |
| GET    | `/api/system/settings/academy`                                | `settings.view` |
| PUT    | `/api/system/settings/academy`                                | `settings.edit_academy` |
| POST   | `/api/system/settings/academy/logo`                           | `settings.edit_academy` |
| GET    | `/api/system/settings/fx-rates`                               | `settings.view` |
| PUT    | `/api/system/settings/fx-rates`                               | `settings.edit_fx_rates` |
| POST   | `/api/system/settings/backups/run-now`                        | `settings.manage_backups` |
| GET    | `/api/system/dashboard`                                       | (any auth) |

---

## File deliverables checklist

```
backend/
├── app/
│   ├── Console/Commands/System/
│   │   └── GenerateMonthlyReport.php
│   ├── Http/Controllers/System/
│   │   ├── AccountingController.php
│   │   ├── ExpenseController.php
│   │   ├── ExpenseCategoryController.php
│   │   ├── MonthlyReportController.php
│   │   ├── CertificateController.php
│   │   ├── AuditLogController.php
│   │   ├── ExportController.php
│   │   ├── DashboardController.php                       (UPDATED — real data)
│   │   ├── AcademyInfoController.php
│   │   ├── FxRatesController.php
│   │   └── BackupsController.php
│   ├── Http/Requests/System/
│   │   ├── Expense/{Store,Update}Request.php
│   │   ├── Certificate/{Store,Preview,Update,Revoke}Request.php
│   │   ├── AcademyInfo/UpdateRequest.php
│   │   └── FxRates/UpdateRequest.php
│   ├── Http/Resources/System/
│   │   ├── ExpenseResource.php
│   │   ├── CertificateResource.php
│   │   ├── MonthlyReportResource.php
│   │   ├── AuditLogEntryResource.php
│   │   └── DashboardResource.php
│   ├── Models/System/
│   │   ├── Expense.php
│   │   ├── ExpenseCategory.php
│   │   ├── Certificate.php
│   │   └── MonthlyReport.php
│   ├── Policies/System/
│   │   ├── ExpensePolicy.php
│   │   ├── CertificatePolicy.php
│   │   └── AuditLogPolicy.php
│   ├── Services/System/
│   │   ├── RevenueAggregator.php
│   │   ├── ProfitLossCalculator.php
│   │   ├── CollectionReportBuilder.php
│   │   ├── CancellationReportBuilder.php
│   │   ├── TrialAnalyticsBuilder.php
│   │   ├── MonthlyReportGenerator.php
│   │   ├── DashboardService.php
│   │   ├── CertificateRenderer.php
│   │   └── CertificateNumberer.php
│   ├── Jobs/System/
│   │   ├── BuildExport.php                              (universal export job)
│   │   └── GenerateMonthlyReportArtifacts.php
│   └── Exports/System/
│       ├── StudentsExport.php
│       ├── TeachersExport.php
│       ├── AttendanceExport.php
│       ├── CancellationExport.php
│       ├── TrialAnalyticsExport.php
│       ├── ProfitLossExport.php
│       └── AuditLogExport.php
├── database/migrations/
│   ├── 2026_09_07_000001_create_sys_expense_categories_table.php
│   ├── 2026_09_07_000002_create_sys_expenses_table.php
│   ├── 2026_09_07_000003_create_sys_certificates_table.php
│   ├── 2026_09_07_000004_create_sys_monthly_reports_table.php
│   ├── 2026_09_07_000005_create_sys_certificate_counters_table.php
│   └── 2026_09_07_000006_seed_academy_and_default_categories.php
├── database/factories/System/
│   ├── ExpenseFactory.php / ExpenseCategoryFactory.php
│   ├── CertificateFactory.php
│   └── MonthlyReportFactory.php
├── database/seeders/System/
│   └── DefaultExpenseCategoriesSeeder.php
├── resources/views/system/pdf/
│   ├── certificate.blade.php
│   └── monthly-report.blade.php
├── config/
│   ├── sentry.php                                       (NEW)
│   └── system.php                                       (UPDATED — adds backup config)
└── routes/system.php                                    (UPDATED — adds 35+ endpoints)

frontend/
├── src/app/(system)/
│   ├── accounting/
│   │   ├── revenue/page.tsx
│   │   ├── expenses/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── profit-loss/page.tsx
│   │   ├── collection/page.tsx
│   │   ├── cancellations/page.tsx
│   │   ├── trials/page.tsx
│   │   ├── monthly-report/page.tsx
│   │   └── exports/page.tsx
│   ├── certificates/
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   └── [id]/page.tsx
│   ├── audit-log/page.tsx
│   ├── students/[id]/page.tsx                           (UPDATED — Certificates tab)
│   ├── dashboard/page.tsx                               (UPDATED — real data)
│   └── settings/
│       ├── academy/page.tsx
│       ├── fx-rates/page.tsx
│       ├── expense-categories/page.tsx
│       └── backups/page.tsx
├── src/components/system/
│   ├── accounting/
│   │   ├── RevenueChart.tsx
│   │   ├── RevenueTable.tsx
│   │   ├── ExpenseTable.tsx
│   │   ├── ExpenseSheet.tsx
│   │   ├── ProfitLossStatement.tsx
│   │   ├── CollectionTrendChart.tsx
│   │   ├── CancellationReasonsChart.tsx
│   │   ├── TrialFunnelChart.tsx
│   │   ├── MonthlyReportList.tsx
│   │   └── ExportsList.tsx
│   ├── certificates/
│   │   ├── CertificateForm.tsx
│   │   ├── CertificatePreview.tsx
│   │   ├── CertificateTable.tsx
│   │   └── CertificateTypeBadge.tsx
│   ├── audit/
│   │   ├── AuditLogTable.tsx
│   │   ├── AuditLogDrawer.tsx
│   │   └── DiffViewer.tsx
│   ├── dashboard/
│   │   ├── RevenueTrend.tsx                             (NEW — 12-month area chart)
│   │   ├── StudentGrowth.tsx                            (NEW — 12-month line+bars)
│   │   ├── ExpensesBreakdown.tsx                        (NEW — donut)
│   │   ├── CancellationReasonsBars.tsx                  (NEW)
│   │   └── OnboardingCard.tsx                           (one-time welcome card)
│   └── settings/
│       ├── AcademyInfoForm.tsx
│       ├── LogoUploader.tsx
│       ├── FxRatesEditor.tsx
│       ├── ExpenseCategoriesManager.tsx
│       └── BackupsPanel.tsx
├── src/hooks/system/
│   ├── useDashboard.ts                                  (UPDATED — full payload)
│   ├── useRevenue.ts
│   ├── useProfitLoss.ts
│   ├── useCollection.ts
│   ├── useCancellations.ts
│   ├── useTrials.ts
│   ├── useExpenses.ts
│   ├── useCertificates.ts
│   ├── useAuditLog.ts
│   ├── useAcademy.ts
│   ├── useFxRates.ts
│   └── useExports.ts
├── src/types/system/
│   ├── expense.ts
│   ├── certificate.ts
│   ├── monthlyReport.ts
│   ├── pnl.ts
│   └── auditLog.ts
└── sentry.{client,server,edge}.config.ts                (NEW)

docs/system/sprints/sys-08-accounting-certificates-launch.md  (THIS FILE)
docs/system/LAUNCH-CHECKLIST.md                                (NEW)
```

---

## Risks & open questions

- **Cross-currency P&L precision.** We convert with "today's rate" rather than transaction-day rate. For an academy whose Egyptian pound has shifted 20% in a year, the year-over-year comparison won't reflect reality at the time of the transaction. This is an explicit v1 trade-off — call it out in the P&L report header. Future: store rate snapshots per-transaction. Not in this sprint.
- **Cancellation report retention.** Cancelled students remain in `sys_students` with `status='cancelled'` — not soft-deleted. The report iterates over them via the `cancelled_at` index. As the academy grows, this scales fine. If we ever archive cancelled students out (5-year-old data), the report needs to read from the archive too.
- **Certificate revocation.** The spec doesn't address revocation. We support it via `Certificate::revoked_at` + a soft-delete; the PDF still exists in B2 but a re-issue creates a new certificate number. Owner has the option in the UI.
- **Audit log volume.** After a year of operation `sys_audit_logs` and `sys_activity_log` together could hit millions of rows. The combined query needs strict pagination + indexes (already in place from SYS-02). If performance degrades, rotate to monthly partitions or archive older entries to S3/B2 cold storage. Note in the launch doc.
- **Sentry sample rate.** We start at 10% sample rate in production. If error volume is low, bump to 100%. If volume spikes (e.g. a buggy release), drop to 1%. Configurable via `sys_settings.sentry.sample_rate`.
- **Logo file format.** Certificates use a vector logo for sharpness on PDF. The settings UI accepts SVG + PNG; PDF rendering converts PNG to embedded raster (still works, just larger files). Recommend SVG in the help text.
- **Default expense categories deletion.** Defaults can be deactivated, not deleted, to preserve historical FK integrity. Custom categories can be deleted if no expenses reference them (DB RESTRICT). UI shows "in use by N expenses" tooltip on the delete button.
- **Owner login on launch day.** First-time admin user must be created via Tinker or seeded from `.env`. Document the exact command in `LAUNCH-CHECKLIST.md` to avoid a "who can log in?" panic at go-live.

---

## Sprint review demo script

(~20 minutes — the longest, since this is the launch demo)

1. **Dashboard** — open `/dashboard` → show 8 real KPIs, 4 real charts, alerts panel populated, recent activity. Compare values against the database for sanity.
2. **Accounting** — open `/accounting/profit-loss` → pick year 2026 → show monthly columns, total row, drill into July salaries → lands on `/payroll/2026-07`.
3. **Revenue** — open `/accounting/revenue` → 12-month trend, per-currency totals, per-course breakdown.
4. **Collection** — open `/accounting/collection` → show collection rate trend, top-overdue students table.
5. **Cancellations** — open `/accounting/cancellations` → reasons bars, per-teacher table.
6. **Trial analytics** — open `/accounting/trials` → conversion funnel, best converting teacher.
7. **Monthly report** — open `/accounting/monthly-report` → download the latest as PDF and Excel; show contents.
8. **Expenses** — add a new expense, change a category, deactivate an unused category.
9. **Issue certificate** — pick a hifz student → fill form → live preview → confirm → student profile shows the new certificate.
10. **Audit log** — search by user + action → show diff drawer with before/after JSON.
11. **Settings tour** — academy info upload + save, FX rate edit, expense category management.
12. **Exports** — queue an audit-log export → notification arrives in 30s → download.
13. **Launch readiness** — show production env config, queue worker statuses (systemd), Sentry receiving an intentional test error.
14. **Owner training video** — quick preview of the recorded walkthrough.
15. **Final sign-off** — owner clicks through the day-1 smoke checklist live.

---

*Last updated: May 11, 2026 — backend fully implemented; frontend: all pages implemented except student profile Certificates tab. Deferred: Sentry install, tests, mobile QA, Lighthouse, student-profile certificates tab.*
