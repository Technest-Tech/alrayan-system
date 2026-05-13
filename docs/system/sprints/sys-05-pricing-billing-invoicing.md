# SYS-05 — Pricing, Billing & Invoicing

**Modules covered:** 6 (Pricing & Subscription), 11 (Student Billing & Invoicing)
**Duration:** 2 weeks
**Status:** Detailed, ready to implement.
**Sprint goal:** the academy runs on auto-billing. Pro-rata works. Paymob is wired. Wallet credit auto-applies. Auto-suspension fires. The student lifecycle hooks completed in SYS-03 finally have their billing triggers — `Trial → Active` flips on the first paid advance invoice; `Paused → Active` requires a successful pro-rata payment; the auto-suspension cron monitors non-payers.

> **Prereqs** — SYS-04 has shipped. Students have schedules and sessions. The lifecycle state machine (SYS-03) has stub branches for the billing-triggered transitions; this sprint wires them up.

> **Out of scope** — payment reminder WhatsApp messages (SYS-07 — wassender wiring). Teacher payroll calculation from sessions (SYS-06). Accounting / P&L reports (SYS-08).

---

## Definition of Done

### Backend
- [ ] Five `sys_*` tables created: `sys_invoices`, `sys_invoice_lines`, `sys_payments`, `sys_wallet_transactions`, `sys_paymob_payment_links`
- [ ] All five have factories; `SystemDemoSeeder` extends to seed: 3 months of historical invoices for every Active demo student (90% paid, 5% overdue, 5% draft), wallet balances on a few of them, two Paymob payment-link rows, one auto-suspended demo student
- [ ] Models: `Invoice`, `InvoiceLine`, `Payment`, `WalletTransaction`, `PaymobPaymentLink` — each with ActivityLog watched fields
- [ ] Policies: `InvoicePolicy`, `PaymentPolicy`, `WalletPolicy` (admin all, supervisors gated by `invoices.*` perms, teachers no access)
- [ ] Pure services: `PriceCalculator`, `ProRataCalculator`, `InvoiceNumberer`, `WalletService`, `FamilyDiscountResolver` (already exists from SYS-03 but now used by `PriceCalculator`)
- [ ] Compound services: `InvoiceGenerator` (orchestrates Price + ProRata + Wallet), `PaymentRecorder`, `StudentBillingState` (reactivation totals, outstanding queries)
- [ ] Paymob integration: `PaymobClient` (create payment link, verify webhook HMAC), `PaymobWebhookController`, idempotent on `paymob_transaction_id`
- [ ] PDF generation: `InvoicePdfRenderer` produces a branded A4 PDF with academy logo, line items, totals, payment link, due date, currency, all bilingual (English primary)
- [ ] 24 endpoints under `/api/system/` (full table in [#endpoints](#endpoints))
- [ ] Crons:
  - `0 0 1 * *` — auto-generate monthly invoices for Active students
  - Hourly — auto-suspend students hitting the non-payment threshold
  - Hourly — flip past-due invoices to status `Overdue`
- [ ] Listeners:
  - `OnInvoicePaid` triggers `Trial → Active` (if pending), `Paused → Active`, `Suspended → Active` lifecycle transitions
  - `OnStudentStatusChanged` (paused/cancelled) voids any draft invoices for that student
- [ ] Pattern-change guard from SYS-04 implemented: `SchedulePatternService::replaceForward` blocks any change that increases `sessions_per_month` mid-month; reductions allowed but flagged for next-month effect

### Frontend
- [ ] `/billing/invoices` — DataTable with filters (status, currency, period, student, due-range), saved views, bulk export
- [ ] `/billing/invoices/[id]` — invoice detail page with line items, payments history, "Record payment" action, "Send WhatsApp link" (queued; wired in SYS-07), "Download PDF", "Void", "Resend Paymob link"
- [ ] `/billing/invoices/new` — manual invoice form (admin can choose student, type=advance|manual, lines, currency, due_at)
- [ ] `/billing/payments` — list of all payments with method/reference/refund-not-yet
- [ ] `/billing/overdue` — quick-access list with totals (per-currency totals at top)
- [ ] **Student profile Invoices tab** — list of invoices for the student + "Create advance invoice" CTA
- [ ] **Student profile Wallet tab** — current balance + transaction ledger + "Add credit" / "Adjust" actions
- [ ] **Settings → Pricing** — base session prices per duration (30/45/60), default sibling discount %, supported currencies, public-site display toggles
- [ ] **Settings → Billing** — invoice due window (days), auto-suspend after-N-months threshold, default invoice prefix, payment reminder schedule (template UI; actual sending in SYS-07)
- [ ] **Settings → Integrations → Paymob** — API key, integration ID, webhook URL display, test-connection button
- [ ] Lifecycle bar on student profile updated:
  - "Activate" (from Trial / Paused / Suspended) opens an inline dialog: "Generate {advance|reactivation} invoice now? Status will flip to Active when paid."
  - Direct admin override remains available with a confirm dialog (audit-logged with `admin_manual_override=true`)
- [ ] Outstanding/overdue dashboard widget on `/dashboard` shows real numbers per currency
- [ ] Mobile QA at 375px: invoice detail readable, "Record payment" sheet usable
- [ ] Lighthouse on `/billing/invoices` and the invoice-detail page ≥ 90 perf, ≥ 95 a11y
- [ ] `scripts/check-system-isolation.sh` still passes

### Quality
- [ ] Unit tests for `PriceCalculator`, `ProRataCalculator`, `WalletService`, `InvoiceNumberer`, `FamilyDiscountResolver` (already from SYS-03, extended)
- [ ] Feature tests for every endpoint (success, validation, permission, idempotency where applicable)
- [ ] Mocked feature tests for Paymob (webhook signature verification, idempotent webhook processing)
- [ ] PDF golden tests — render the demo invoices, snapshot-compare the rendered PDF text (skip visual diff)
- [ ] Cron tests with `Carbon::setTestNow()`
- [ ] Playwright covers the 9 acceptance flows below
- [ ] Coverage on services / models in this sprint ≥ 90%

### Acceptance flows (Playwright)

1. **Manual advance invoice for new student** — admin creates a Trial student (from SYS-03) → Schedule tab → set pattern → Invoices tab → "Create advance invoice" → pro-rata for remaining days in current month → invoice status `Sent` → student stays `Trial`.
2. **Paymob auto-confirmation** — fake Paymob webhook hits `/api/system/webhooks/paymob` with valid HMAC and `paid` status → invoice flips to `Paid` → student transitions Trial→Active → internal notification fires.
3. **Manual payment recording** — admin opens an invoice → "Record payment" → amount matching, method "Vodafone Cash", reference → save → invoice flips to `Paid` → wallet untouched (overpayment scenario tested separately).
4. **Overpayment to wallet** — admin records a payment of 100 USD against a 80 USD invoice → invoice `Paid` + wallet credited 20 USD → next month's auto-invoice shows `–USD 20` wallet credit applied.
5. **Wallet credit reduces auto-invoice** — student has 30 USD wallet; July 1 cron runs → invoice subtotal 50 USD → wallet credit 30 USD → total due 20 USD; wallet ledger shows the debit.
6. **Mid-month reduce sessions** — admin changes `sessions_per_month` from 8 to 4 mid-month → save succeeds → no current-month refund → next month's auto-invoice uses the new value.
7. **Mid-month increase blocked** — admin tries to change `sessions_per_month` from 4 to 8 mid-month → 422 with message "Increases take effect next month — schedule the change instead."
8. **Auto-suspend cron** — fast-forward demo student to 2 months unpaid → cron runs → student status flips to `Suspended` → teacher receives internal notification → all upcoming sessions auto-cancel (handled via the existing SYS-04 listener).
9. **Reactivation total computation** — admin clicks "Activate" on a Suspended student → dialog says "Outstanding: 3 invoices = USD 75; pro-rata for remaining 12 days of July = USD 16. Total: USD 91. Generate combined invoice?" → confirm → single invoice with 3 outstanding lines + 1 pro-rata line; payment of full amount triggers Suspended→Active.

---

## Story breakdown

### S5-01 — Migrations  *(0.5 day)*

Five new migrations dated `2026_07_27_*` (sprint 6 of system).

**`2026_07_27_000001_create_sys_invoices_table.php`**

```php
Schema::create('sys_invoices', function (Blueprint $t) {
    $t->id();
    $t->foreignId('student_id')->constrained('sys_students')->restrictOnDelete();
    $t->string('invoice_number', 32)->unique();          // INV-2026-00042 format
    $t->enum('type', ['advance', 'monthly', 'reactivation', 'manual']);
    $t->unsignedSmallInteger('period_year')->nullable();
    $t->unsignedTinyInteger('period_month')->nullable();
    $t->char('currency', 3);
    $t->bigInteger('subtotal_minor')->default(0);
    $t->bigInteger('discount_minor')->default(0);
    $t->bigInteger('wallet_credit_minor')->default(0);
    $t->bigInteger('total_minor');                       // = subtotal - discount - wallet_credit (computed at save)
    $t->enum('status', ['draft', 'sent', 'paid', 'overdue', 'void'])->default('draft');
    $t->timestamp('issued_at')->nullable();
    $t->timestamp('due_at');
    $t->timestamp('paid_at')->nullable();
    $t->timestamp('voided_at')->nullable();
    $t->string('voided_reason')->nullable();
    $t->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
    $t->json('snapshot')->nullable();                    // student name, course, teacher, schedule at issue time
    $t->softDeletes();
    $t->timestamps();
    $t->index(['student_id', 'status']);
    $t->index(['status', 'due_at']);
    $t->index(['period_year', 'period_month']);
});
```

> **Why a `snapshot` JSON column?** Invoice details (student name, course, teacher) at the moment of issue are *historical truth*. If the student changes course or teacher next month, the previous invoice should still display the old course on the PDF. We snapshot at `issued_at`.

**`2026_07_27_000002_create_sys_invoice_lines_table.php`**

```php
Schema::create('sys_invoice_lines', function (Blueprint $t) {
    $t->id();
    $t->foreignId('invoice_id')->constrained('sys_invoices')->cascadeOnDelete();
    $t->string('description');                           // "8 sessions × 30 min — June 2026"
    $t->enum('kind', ['monthly', 'pro_rata', 'outstanding', 'adjustment', 'discount']);
    $t->unsignedSmallInteger('quantity')->default(1);
    $t->unsignedSmallInteger('session_duration_min')->nullable();
    $t->bigInteger('unit_price_minor');
    $t->bigInteger('line_total_minor');                  // = unit_price × quantity (signed for discounts)
    $t->foreignId('source_invoice_id')->nullable()->constrained('sys_invoices')->nullOnDelete();   // for kind=outstanding lines
    $t->timestamps();
    $t->index(['invoice_id']);
});
```

**`2026_07_27_000003_create_sys_payments_table.php`**

```php
Schema::create('sys_payments', function (Blueprint $t) {
    $t->id();
    $t->foreignId('invoice_id')->constrained('sys_invoices')->restrictOnDelete();
    $t->bigInteger('amount_minor');
    $t->char('currency', 3);
    $t->enum('method', ['paymob', 'bank_transfer', 'paypal', 'vodafone_cash', 'instapay', 'wallet', 'other']);
    $t->string('reference', 200)->nullable();            // free-form: bank ref, PayPal txn id, etc.
    $t->string('paymob_transaction_id', 100)->nullable()->unique();    // idempotency for webhook
    $t->timestamp('paid_at');
    $t->foreignId('recorded_by_user_id')->nullable()->constrained('users')->nullOnDelete();
    $t->json('payload')->nullable();                     // raw webhook body / form fields
    $t->softDeletes();
    $t->timestamps();
    $t->index(['invoice_id', 'paid_at']);
    $t->index(['method', 'paid_at']);
});
```

**`2026_07_27_000004_create_sys_wallet_transactions_table.php`**

```php
Schema::create('sys_wallet_transactions', function (Blueprint $t) {
    $t->id();
    $t->foreignId('student_id')->constrained('sys_students')->restrictOnDelete();
    $t->bigInteger('amount_minor');                      // positive=credit, negative=debit
    $t->char('currency', 3);
    $t->enum('source', ['overpayment', 'manual_credit', 'manual_debit', 'invoice_credit', 'adjustment', 'refund']);
    $t->nullableMorphs('source_reference');              // e.g. invoice or payment
    $t->string('note')->nullable();
    $t->bigInteger('balance_after_minor');               // running balance snapshot (denormalized for fast reads)
    $t->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
    $t->timestamps();
    $t->index(['student_id', 'created_at']);
});
```

> **Running balance is denormalized.** `WalletService` computes the new balance, sets it on the row, and atomically updates `sys_students.wallet_balance_minor`. Both are kept in sync within the same transaction. The student-table column is an index; the ledger is the source of truth.

**`2026_07_27_000005_create_sys_paymob_payment_links_table.php`**

```php
Schema::create('sys_paymob_payment_links', function (Blueprint $t) {
    $t->id();
    $t->foreignId('invoice_id')->constrained('sys_invoices')->cascadeOnDelete();
    $t->string('paymob_order_id', 64)->nullable();
    $t->string('payment_url', 800);
    $t->timestamp('expires_at')->nullable();
    $t->boolean('is_active')->default(true);
    $t->timestamps();
    $t->index(['invoice_id', 'is_active']);
});
```

#### `sys_settings` keys added

```php
'invoice.prefix'                 => 'INV',
'invoice.due_days'               => 3,
'invoice.suspend_after_months'   => 2,
'invoice.send_on_create'         => true,             // auto-set status sent on create
'pricing.base_30'                => 2500,             // EGP minor per month per session = 25 EGP/session
'pricing.base_45'                => 3500,
'pricing.base_60'                => 5000,
'pricing.sibling_default_discount_pct' => 20,
'pricing.supported_currencies'   => ['USD','EUR','CAD','GBP','EGP','AED','KWD','BHD','SAR'],
'pricing.public_site_currency'   => 'USD',
'pricing.public_site_visible'    => true,
'paymob.api_key'                 => '',               // encrypted at rest via Setting cast
'paymob.integration_id'          => '',
'paymob.webhook_hmac_secret'     => '',
'paymob.public_iframe_id'        => '',
```

> **Settings encryption.** `Setting::value` for keys whose key matches `*.api_key|*.secret|*.token|*.password` is encrypted with `Crypt::encryptString` on write and decrypted on read. The `Setting` model has a custom cast that handles this transparently. Documented in [DATABASE.md](../DATABASE.md) update.

#### New permissions

Append to `PermissionRegistry::GROUPS`:

```php
'invoices' => ['view', 'create', 'create_advance', 'edit', 'void', 'record_payment', 'resend_link', 'download_pdf', 'export'],
'wallet'   => ['view', 'credit', 'debit', 'adjust'],
'payments' => ['view', 'refund'],   // refunds out of scope for v1, perm exists for future
```

(Replaces the placeholder permission list from SYS-02.) Run `php artisan system:perms:export` after the change.

---

### S5-02 — Models, factories, policies  *(1 day)*

#### Models

**`Invoice`**:

```php
class Invoice extends Model
{
    use SoftDeletes, LogsActivity;
    protected $table = 'sys_invoices';
    protected $guarded = [];
    protected $casts = [
        'snapshot' => 'array',
        'issued_at'=>'datetime', 'due_at'=>'datetime', 'paid_at'=>'datetime', 'voided_at'=>'datetime',
    ];

    public function student()  { return $this->belongsTo(Student::class); }
    public function lines()    { return $this->hasMany(InvoiceLine::class); }
    public function payments() { return $this->hasMany(Payment::class); }
    public function paymobLink(){ return $this->hasOne(PaymobPaymentLink::class)->where('is_active', true); }

    public function scopeOpen($q)     { return $q->whereIn('status', ['sent','overdue']); }
    public function scopeOverdue($q)  { return $q->where('status','overdue'); }

    public function isOverdueNow(): bool
    {
        return in_array($this->status, ['sent','overdue']) && $this->due_at && $this->due_at->isPast();
    }

    public function getActivitylogOptions(): LogOptions {
        return LogOptions::defaults()
            ->logOnly(['status','total_minor','paid_at','voided_at','voided_reason'])
            ->logOnlyDirty();
    }
}
```

**`Payment`**, **`InvoiceLine`**, **`WalletTransaction`**, **`PaymobPaymentLink`** follow the established pattern. `WalletTransaction` has a polymorphic relationship via `source_reference` so we can attach to invoices, payments, or null (manual adjustments).

#### Policies

`InvoicePolicy`:

```php
public function viewAny(User $u) { return $u->can('invoices.view'); }
public function view(User $u, Invoice $i)
{
    if ($u->role === 'admin') return true;
    if ($u->role === 'teacher') return false;            // teachers don't see invoices
    return $u->can('invoices.view');
}
public function create(User $u)        { return $u->can('invoices.create'); }
public function createAdvance(User $u) { return $u->can('invoices.create_advance'); }
public function void(User $u, Invoice $i)
{
    return $u->can('invoices.void') && $i->status !== 'paid';
}
public function recordPayment(User $u, Invoice $i)
{
    return $u->can('invoices.record_payment') && in_array($i->status, ['sent','overdue']);
}
```

`WalletPolicy`:

```php
public function view(User $u, Student $s)   { return $u->can('wallet.view'); }
public function credit(User $u, Student $s) { return $u->can('wallet.credit'); }
public function debit(User $u, Student $s)  { return $u->can('wallet.debit'); }
```

#### Factories

`InvoiceFactory` with named states: `monthly()`, `advance()`, `paid()`, `overdue()`, `void()`. `PaymentFactory` with `paymob()` and `manual()`. `WalletTransactionFactory` with `credit()` / `debit()`. The seeder uses these to generate 3 months of historical data.

---

### S5-03 — Pricing settings + base prices  *(0.5 day)*

The base prices feed both the public website (Module 6: "Admin controls base prices displayed on the public website from system settings") and the system's manual price suggestion when admin enrolls a student.

#### Endpoints

```
GET   /api/system/pricing             perm: settings.view
PUT   /api/system/pricing             perm: settings.edit
GET   /api/v1/pricing                 (PUBLIC)  — used by the marketing site
```

The public endpoint is the **only** part of this sprint that touches `routes/api.php` (the public site's route file). It serves `pricing.public_site_*` keys plus the three base session prices in the public-site display currency. The site's `PricingCards.tsx` (already built in site Sprint 4) is updated to fetch live prices instead of importing the static `pricing.ts` file. A documented exception in [FILE-STRUCTURE.md](../FILE-STRUCTURE.md) covers this single public-API surface owned by a system feature.

#### UI: `/settings/pricing/page.tsx`

```
┌──────────────────────────────────────────────────────────────────┐
│ Pricing                                                          │
│ Base prices and discount defaults.                               │
├──────────────────────────────────────────────────────────────────┤
│ Base prices (per month, USD by default)                          │
│   30 min sessions:  USD [____25] /mo for 8 sessions              │
│   45 min sessions:  USD [____35] /mo for 8 sessions              │
│   60 min sessions:  USD [____50] /mo for 8 sessions              │
│                                                                  │
│ Default sibling discount:  [__20] %                              │
│                                                                  │
│ Supported currencies (student billing):                          │
│   ☑ USD  ☑ EUR  ☑ CAD  ☑ GBP  ☑ EGP                             │
│   ☑ AED  ☑ KWD  ☑ BHD  ☑ SAR                                    │
│                                                                  │
│ Public website                                                   │
│   ☑ Show pricing on public website                               │
│   Display currency: [USD ▾]                                      │
└──────────────────────────────────────────────────────────────────┘
[ Cancel ]                                              [ Save changes ]
```

A change here writes one audit log entry per setting changed. Public-site cache is invalidated on save (next site visit shows the new prices via ISR revalidation — same mechanism used by the blog CMS in site Sprint 6).

---

### S5-04 — Pricing math: `PriceCalculator` + `ProRataCalculator`  *(1 day)*

Both pure, both unit-tested, both used everywhere downstream.

#### `App\Services\System\PriceCalculator`

```php
class PriceCalculator
{
    public function __construct(private FamilyDiscountResolver $family) {}

    /**
     * Compute the *gross* monthly price for a student.
     * = sessions_per_month × duration_unit_price × (1 - effective_discount)
     * Result is in the student's currency, minor units.
     */
    public function monthly(Student $s): int
    {
        // If admin set a custom monthly price, that's authoritative.
        if ($s->monthly_price_minor > 0) {
            return $this->applyDiscount($s, $s->monthly_price_minor);
        }
        // Otherwise compute from base + sessions.
        $base = $this->baseFor($s->session_duration_min, $s->currency);
        // Base is per 8 sessions; scale linearly.
        $scaled = (int) round($base * $s->sessions_per_month / 8);
        return $this->applyDiscount($s, $scaled);
    }

    private function applyDiscount(Student $s, int $price): int
    {
        $custom = (int) $s->custom_discount_pct;
        $family = $this->family->highestFor($s);
        $effective = max($custom, $family);              // best discount wins, not stacked
        return (int) floor($price * (100 - $effective) / 100);
    }

    public function baseFor(int $duration, string $currency): int
    {
        $key = 'pricing.base_' . $duration;
        $egpMinor = (int) Setting::get($key);            // base prices stored in EGP
        return CurrencyConverter::convert($egpMinor, from: 'EGP', to: $currency);
    }
}
```

> **Why max-not-stacked discounts?** Cleaner mental model for owners: "students get whichever discount is bigger, never both." If the academy ever wants compounding, it's a one-line change to `applyDiscount`.

#### `App\Services\System\ProRataCalculator`

```php
class ProRataCalculator
{
    /**
     * Pro-rata amount for the remaining days in $reference's month, starting today.
     * If $reference is null, uses now().
     */
    public function forCurrentMonth(int $monthlyPriceMinor, ?Carbon $reference = null, ?Carbon $startFrom = null): ProRataResult
    {
        $ref       = $reference ?? now();
        $start     = $startFrom ?? $ref;
        $endOfMonth= $ref->copy()->endOfMonth();
        $daysInMo  = $ref->daysInMonth;
        $remaining = $endOfMonth->diffInDaysFiltered(fn () => true, $start->copy()->subDay()) + 1;
        $remaining = max(0, min($daysInMo, $remaining));
        $amount    = (int) floor($monthlyPriceMinor * $remaining / $daysInMo);
        return new ProRataResult(
            monthlyPriceMinor: $monthlyPriceMinor,
            daysInMonth: $daysInMo,
            remainingDays: $remaining,
            amountMinor: $amount,
        );
    }
}
```

`ProRataResult` is a typed DTO so the UI can show "USD 16 = USD 50/month × 12/30 days remaining."

Unit tests cover edge cases: leap years, last day of month, future months, mocking `Carbon::setTestNow()`.

#### `App\Support\System\Currency\CurrencyConverter`

```php
class CurrencyConverter
{
    public static function convert(int $minor, string $from, string $to): int
    {
        if ($from === $to) return $minor;
        $rate = (float) Setting::get("pricing.fx.{$from}_to_{$to}", 0.0);
        if ($rate <= 0) {
            throw new \RuntimeException("FX rate not configured: {$from} → {$to}. Set in Settings → Pricing → FX rates.");
        }
        return (int) round($minor * $rate);
    }
}
```

FX rates are admin-managed in `sys_settings` keys `pricing.fx.USD_to_EGP`, etc. v1 ships a small UI panel under Settings → Pricing for the rates. We don't auto-fetch — owner stated the academy operates on stable manual rates.

---

### S5-05 — Wallet ledger  *(1 day)*

`App\Services\System\WalletService` is the only thing that writes to `sys_wallet_transactions`. Everything else (invoice generator, payment recorder) goes through it.

```php
class WalletService
{
    /**
     * Credit the student's wallet. Atomic.
     */
    public function credit(Student $s, int $amountMinor, string $source, ?Model $sourceRef = null, ?string $note = null): WalletTransaction
    {
        return $this->writeEntry($s, +abs($amountMinor), $source, $sourceRef, $note);
    }

    public function debit(Student $s, int $amountMinor, string $source, ?Model $sourceRef = null, ?string $note = null): WalletTransaction
    {
        return $this->writeEntry($s, -abs($amountMinor), $source, $sourceRef, $note);
    }

    private function writeEntry(Student $s, int $delta, string $source, ?Model $ref, ?string $note): WalletTransaction
    {
        return DB::transaction(function () use ($s, $delta, $source, $ref, $note) {
            $s = Student::lockForUpdate()->find($s->id);
            $newBalance = $s->wallet_balance_minor + $delta;
            $tx = WalletTransaction::create([
                'student_id'              => $s->id,
                'amount_minor'            => $delta,
                'currency'                => $s->currency,
                'source'                  => $source,
                'source_reference_type'   => $ref?->getMorphClass(),
                'source_reference_id'     => $ref?->getKey(),
                'note'                    => $note,
                'balance_after_minor'     => $newBalance,
                'actor_user_id'           => auth()->id(),
            ]);
            $s->update(['wallet_balance_minor' => $newBalance]);
            return $tx;
        });
    }

    /**
     * Apply available wallet credit to an invoice. Returns the amount applied.
     * Caps at min(invoice.total_remaining, wallet.balance).
     */
    public function applyToInvoice(Invoice $inv): int
    {
        $s = $inv->student;
        if ($s->wallet_balance_minor <= 0) return 0;
        if ($s->currency !== $inv->currency) return 0;       // only same-currency wallets apply
        $apply = min($s->wallet_balance_minor, $inv->total_minor);
        if ($apply <= 0) return 0;
        $this->debit($s, $apply, 'invoice_credit', $inv, "Applied to {$inv->invoice_number}");
        $inv->update([
            'wallet_credit_minor' => $inv->wallet_credit_minor + $apply,
            'total_minor'         => max(0, $inv->total_minor - $apply),
        ]);
        return $apply;
    }
}
```

Endpoints (under `/api/system`):

```
GET    /students/{id}/wallet                       perm: wallet.view
GET    /students/{id}/wallet/transactions          perm: wallet.view (paginated ledger)
POST   /students/{id}/wallet/credit                perm: wallet.credit  body: { amount_minor, note }
POST   /students/{id}/wallet/debit                 perm: wallet.debit
POST   /students/{id}/wallet/adjust                perm: wallet.adjust  body: { amount_minor (signed), note (required) }
```

Adjustments are the escape hatch — admin types a reason (mandatory). They appear in the ledger as `source=adjustment` rows.

---

### S5-06 — Invoice generation  *(1.5 days)*

`App\Services\System\InvoiceGenerator` is the only thing that creates `sys_invoices` rows.

#### Creating a monthly invoice

```php
public function generateMonthly(Student $s, int $year, int $month): Invoice
{
    $existing = Invoice::where('student_id', $s->id)
        ->where('type', 'monthly')
        ->where('period_year', $year)->where('period_month', $month)
        ->first();
    if ($existing) return $existing;                     // idempotent

    $price = app(PriceCalculator::class)->monthly($s);
    $sub   = $price;
    $disc  = 0;                                          // discounts already baked into price by PriceCalc
    return DB::transaction(function () use ($s, $year, $month, $price, $sub, $disc) {
        $inv = Invoice::create([
            'student_id'     => $s->id,
            'invoice_number' => app(InvoiceNumberer::class)->next($year),
            'type'           => 'monthly',
            'period_year'    => $year,
            'period_month'   => $month,
            'currency'       => $s->currency,
            'subtotal_minor' => $sub,
            'discount_minor' => $disc,
            'total_minor'    => $sub - $disc,
            'status'         => Setting::bool('invoice.send_on_create') ? 'sent' : 'draft',
            'issued_at'      => now(),
            'due_at'         => now()->addDays(Setting::int('invoice.due_days', 3)),
            'snapshot'       => $this->snapshot($s),
            'created_by_user_id' => auth()->id(),
        ]);
        InvoiceLine::create([
            'invoice_id' => $inv->id,
            'kind'       => 'monthly',
            'description'=> sprintf('%d sessions × %d min — %s %d', $s->sessions_per_month, $s->session_duration_min, Carbon::create($year,$month,1)->format('F'), $year),
            'quantity'   => $s->sessions_per_month,
            'session_duration_min' => $s->session_duration_min,
            'unit_price_minor'     => (int) floor($sub / $s->sessions_per_month),
            'line_total_minor'     => $sub,
        ]);
        // Apply wallet credit
        app(WalletService::class)->applyToInvoice($inv);
        // Dispatch Paymob link creation if enabled
        if (config('system.features.paymob') && $inv->total_minor > 0) {
            CreatePaymobPaymentLink::dispatch($inv);
        }
        event(new InvoiceCreated($inv));
        return $inv->fresh();
    });
}
```

#### Creating an advance / reactivation invoice

`generateAdvance(Student $s, ?Carbon $effectiveFrom = null): Invoice`:

- Calls `ProRataCalculator::forCurrentMonth(monthly, ref=now, startFrom=effectiveFrom ?? now)`.
- One pro-rata line: "Pro-rata: 12 of 30 days in July 2026".
- type = `advance`.
- Returns the invoice.

`generateReactivation(Student $s): Invoice`:

- Computes `StudentBillingState::outstandingFor($s)` — a list of unpaid Sent/Overdue invoices.
- Creates a new invoice of type `reactivation` with:
  - One `kind=outstanding` line per unpaid invoice (with `source_invoice_id` pointing back).
  - One `kind=pro_rata` line for the remaining days of the current month.
- The original outstanding invoices are **voided** with reason "Combined into reactivation invoice {new_number}". Their amounts now live as lines on the new one.
- This way payment history stays clean: one invoice → one payment.

#### Endpoints

```
POST /api/system/students/{id}/invoices/advance         perm: invoices.create_advance
POST /api/system/students/{id}/invoices/reactivation    perm: invoices.create
POST /api/system/invoices                               perm: invoices.create   (manual)
PATCH /api/system/invoices/{id}                         perm: invoices.edit     (only draft invoices)
POST /api/system/invoices/{id}/void                     perm: invoices.void     body: { reason }
POST /api/system/invoices/{id}/send                     perm: invoices.edit     (draft → sent)
GET  /api/system/invoices                               perm: invoices.view
GET  /api/system/invoices/{id}                          perm: policy
GET  /api/system/invoices/{id}/pdf                      perm: invoices.download_pdf  (signed URL)
GET  /api/system/students/{id}/invoices                 perm: invoices.view
GET  /api/system/students/{id}/billing-state            perm: invoices.view  (returns outstanding + pro-rata calc)
```

#### `InvoiceNumberer`

```php
class InvoiceNumberer
{
    public function next(int $year): string
    {
        return DB::transaction(function () use ($year) {
            $row = DB::table('sys_invoice_counters')->where('year', $year)->lockForUpdate()->first();
            $next = ($row->last ?? 0) + 1;
            DB::table('sys_invoice_counters')->updateOrInsert(['year' => $year], ['last' => $next]);
            return sprintf('%s-%d-%05d', Setting::get('invoice.prefix', 'INV'), $year, $next);
        });
    }
}
```

Adds a tiny migration `2026_07_27_000006_create_sys_invoice_counters_table.php` (just `year` + `last`). Single-row-per-year so concurrent invoice creation doesn't collide.

---

### S5-07 — Manual payment recording  *(0.5 day)*

```
POST /api/system/invoices/{id}/payments        perm: invoices.record_payment
body: { amount_minor, currency, method, reference?, paid_at? }
```

`PaymentRecorder` service:

```php
public function record(Invoice $inv, array $data): Payment
{
    abort_unless($data['currency'] === $inv->currency, 422, 'Payment currency must match invoice currency.');
    return DB::transaction(function () use ($inv, $data) {
        $p = Payment::create([
            'invoice_id' => $inv->id,
            'amount_minor'=> $data['amount_minor'],
            'currency'   => $data['currency'],
            'method'     => $data['method'],
            'reference'  => $data['reference'] ?? null,
            'paid_at'    => $data['paid_at'] ?? now(),
            'recorded_by_user_id' => auth()->id(),
        ]);
        $totalPaid = $inv->payments()->sum('amount_minor');
        if ($totalPaid >= $inv->total_minor) {
            $overpay = $totalPaid - $inv->total_minor;
            if ($overpay > 0) {
                app(WalletService::class)->credit($inv->student, $overpay, 'overpayment', $p, "From {$inv->invoice_number}");
            }
            $inv->update(['status' => 'paid', 'paid_at' => $p->paid_at]);
            event(new InvoicePaid($inv, $p));
        }
        return $p;
    });
}
```

> **Module 11 says "Full payment only (no partial payments)."** We enforce this in the FormRequest: `amount_minor === invoice.total_minor`. Partial payments are a deferred feature. Recording an explicit overpayment is allowed (drives the wallet flow).

---

### S5-08 — Paymob integration  *(2 days)*

#### Service: `App\Services\Integrations\Paymob\PaymobClient`

Uses the standard 3-step Paymob flow:

1. POST `https://accept.paymob.com/api/auth/tokens` with `api_key` → returns auth token.
2. POST `/ecommerce/orders` with the order data → returns Paymob order id.
3. POST `/acceptance/payment_keys` with the iframe-id → returns payment key.

The final URL is `https://accept.paymob.com/api/acceptance/iframes/{IFRAME_ID}?payment_token={KEY}`.

```php
public function createPaymentLink(Invoice $inv): PaymobPaymentLink
{
    $auth = $this->authenticate();
    $order = $this->createOrder($auth, $inv);
    $key = $this->createPaymentKey($auth, $order, $inv);
    return PaymobPaymentLink::create([
        'invoice_id'      => $inv->id,
        'paymob_order_id' => (string) $order['id'],
        'payment_url'     => "https://accept.paymob.com/api/acceptance/iframes/" . config('system.paymob.iframe_id') . "?payment_token={$key}",
        'expires_at'      => now()->addHours(24),
        'is_active'       => true,
    ]);
}
```

Token caching: 50-minute Redis cache to avoid auth-loop on every call.

A `FakePaymobClient` (`PAYMOB_ENABLED=false` in dev) returns a deterministic URL like `http://app.localhost/test-paymob-link/{invoice_id}` so the rest of the flow can be exercised without credentials.

#### Job: `CreatePaymobPaymentLink`

Dispatched from `InvoiceGenerator`. Idempotent — if an active link already exists, no-ops. On final retry failure, the invoice keeps no link and the UI shows "Paymob link unavailable — record payment manually" plus a "Retry link generation" button.

#### Webhook: `App\Http\Controllers\System\PaymobWebhookController`

Routed at `POST /api/system/webhooks/paymob` (NOT under Sanctum — public, but HMAC-verified):

```php
public function handle(Request $request)
{
    $sig = $request->query('hmac');
    abort_unless($sig && $this->verify($request, $sig), 401);

    $payload = $request->input('obj', $request->all());
    $txnId   = (string) ($payload['id'] ?? '');
    $orderId = (string) ($payload['order']['id'] ?? '');
    $isPaid  = (bool) ($payload['success'] ?? false);
    $amountMinor = (int) ($payload['amount_cents'] ?? 0);

    abort_unless($txnId && $orderId, 422);

    // Idempotency on paymob_transaction_id
    if (Payment::where('paymob_transaction_id', $txnId)->exists()) {
        return response()->json(['ok' => true, 'duplicate' => true]);
    }

    $link = PaymobPaymentLink::where('paymob_order_id', $orderId)->where('is_active', true)->first();
    abort_unless($link, 404);

    $inv = $link->invoice;
    if (!$isPaid) {
        return response()->json(['ok' => true, 'ignored' => 'failed_payment']);
    }

    $payment = app(PaymentRecorder::class)->record($inv, [
        'amount_minor' => $amountMinor,
        'currency'     => $inv->currency,
        'method'       => 'paymob',
        'paymob_transaction_id' => $txnId,
        'paid_at'      => now(),
        'reference'    => "Paymob #{$txnId}",
    ]);
    return response()->json(['ok' => true, 'payment_id' => $payment->id]);
}

private function verify(Request $r, string $sig): bool
{
    $secret = decrypt(Setting::raw('paymob.webhook_hmac_secret'));
    $concat = collect(['amount_cents','created_at','currency','error_occured','has_parent_transaction','id','integration_id','is_3d_secure','is_auth','is_capture','is_refunded','is_standalone_payment','is_voided','order.id','owner','pending','source_data.pan','source_data.sub_type','source_data.type','success'])
        ->map(fn ($k) => data_get($r->input('obj'), $k))
        ->implode('');
    return hash_hmac('sha512', $concat, $secret) === $sig;
}
```

The HMAC concatenation order is Paymob's specific spec — documented as a comment, link out to Paymob docs.

#### Settings panel

`/settings/integrations/paymob/page.tsx`:

```
┌──────────────────────────────────────────────────────────────────┐
│ Paymob                                                           │
│ Online payment integration. Webhook verified by HMAC.            │
├──────────────────────────────────────────────────────────────────┤
│ Enabled:               [ ⬤  ON  ]                                │
│ API key                [••••••••••••••••••••••••]  [Reveal][Update]│
│ Integration ID         [____1234567]                             │
│ Iframe ID              [____123456]                              │
│ Webhook HMAC secret    [••••••••••••]              [Reveal][Update]│
│ Webhook URL            https://api.alrayan-academy.com/api/system│
│                        /webhooks/paymob          [Copy]          │
│ Last successful link   2 hours ago (INV-2026-00042)              │
│ Last error             —                                         │
│                                                                  │
│ [ Test connection ]                                              │
└──────────────────────────────────────────────────────────────────┘
```

"Test connection" calls `POST /api/system/integrations/paymob/test` which runs `PaymobClient::authenticate()` and reports success / API error.

---

### S5-09 — Cron: monthly auto-generation  *(0.5 day)*

`app/Console/Commands/System/GenerateMonthlyInvoices.php`:

```php
public function handle(InvoiceGenerator $gen): int
{
    $now   = now();
    $year  = $now->year;
    $month = $now->month;
    $count = 0;

    Student::where('status', 'active')->cursor()->each(function ($s) use ($gen, $year, $month, &$count) {
        $inv = $gen->generateMonthly($s, $year, $month);
        if ($inv->wasRecentlyCreated) $count++;
    });

    $this->info("Created {$count} monthly invoices for {$year}-{$month}.");
    NotificationService::pushToAdmins('billing.monthly_run',
        "Monthly invoices generated: {$count}", null, '/billing/invoices?period=current');
    return self::SUCCESS;
}
```

Schedule: `$schedule->command('system:invoices:generate-monthly')->monthlyOn(1, '00:30');`

Idempotent — re-running creates no duplicates because `generateMonthly` checks for existing.

Manual run: `php artisan system:invoices:generate-monthly --student=42 --period=2026-07`.

---

### S5-10 — Cron: auto-suspend non-payers  *(0.5 day)*

`app/Console/Commands/System/AutoSuspendNonPayers.php`, runs hourly:

```php
public function handle(StudentLifecycle $lifecycle): int
{
    $months = (int) Setting::get('invoice.suspend_after_months', 2);
    $cutoff = now()->subMonthsNoOverflow($months);

    $suspended = 0;
    Student::where('status', 'active')->cursor()->each(function ($s) use (&$suspended, $cutoff, $lifecycle) {
        $oldest = $s->invoices()->whereIn('status', ['sent','overdue'])
            ->where('issued_at', '<=', $cutoff)
            ->oldest('issued_at')
            ->first();
        if (!$oldest) return;
        $lifecycle->transition($s, 'suspended', [
            'reason' => 'auto_non_payment',
            'oldest_unpaid' => $oldest->invoice_number,
            'months_overdue' => $oldest->issued_at->diffInMonths(now()),
        ]);
        // Existing SYS-04 listener `OnStudentStatusChanged` will cancel future sessions.
        // Existing SYS-04 listener notifies the teacher.
        NotificationService::pushToAdmins('student.auto_suspended',
            "{$s->name} auto-suspended for non-payment", null, "/students/{$s->id}");
        $suspended++;
    });

    $this->info("Auto-suspended {$suspended} students.");
    return self::SUCCESS;
}
```

> **Module 11 says "After X months of non-payment".** "Months" interpretation: the oldest unpaid invoice was issued ≥ X calendar months ago. We use `subMonthsNoOverflow` so March → January doesn't accidentally land on Feb 30.

---

### S5-11 — Cron: mark overdue  *(0.25 day)*

Tiny cron, runs hourly:

```php
public function handle(): int
{
    $count = Invoice::where('status', 'sent')
        ->where('due_at', '<', now())
        ->update(['status' => 'overdue']);
    return self::SUCCESS;
}
```

Triggers `InvoiceOverdue` event (used by SYS-07 to send WhatsApp reminders).

---

### S5-12 — Lifecycle integration  *(1 day)*

The state-machine transitions that SYS-03 left as TODOs are wired here.

#### `OnInvoicePaid` listener

```php
public function handle(InvoicePaid $event): void
{
    $inv = $event->invoice;
    $s   = $inv->student;
    $lifecycle = app(StudentLifecycle::class);

    if ($inv->type === 'advance' && $s->status === 'trial') {
        $lifecycle->transition($s, 'active', ['reason' => 'first_advance_paid', 'invoice' => $inv->invoice_number]);
    }
    if ($inv->type === 'advance' && $s->status === 'paused') {
        $lifecycle->transition($s, 'active', ['reason' => 'reactivation_paid', 'invoice' => $inv->invoice_number]);
    }
    if ($inv->type === 'reactivation' && $s->status === 'suspended') {
        $lifecycle->transition($s, 'active', ['reason' => 'all_outstanding_paid', 'invoice' => $inv->invoice_number]);
    }
    NotificationService::pushToAdmins('payment.received',
        "{$s->name} paid {$inv->invoice_number}", null, "/students/{$s->id}/invoices");
}
```

#### `OnStudentStatusChanged` extended

The SYS-03 listener already exists for timeline writes. SYS-05 adds an additional listener that, when a student transitions to `paused` or `cancelled`:

- Voids any **draft** invoices for that student (`Voided: student paused/cancelled`).
- Leaves `sent`/`overdue` invoices alone (those represent legitimate debt).
- Skips next-month auto-generation as long as status remains `paused`/`suspended`/`cancelled` (the cron's `where status = active` filter handles this implicitly).

#### Lifecycle bar UI updates

The lifecycle bar from SYS-03 is enhanced — clicking "Activate" on Paused/Suspended now calls a billing-aware endpoint:

```
POST /api/system/students/{id}/transition-prepare
body: { to: 'active' }
```

Returns:

```json
{
  "ok": true,
  "billing_required": true,
  "preview": {
    "outstanding": [{"number":"INV-2026-00018","amount_minor":2500}],
    "pro_rata": {"amount_minor":1666,"days_in_month":30,"remaining_days":12},
    "total_minor": 4166,
    "currency": "USD"
  }
}
```

The frontend renders the dialog described in acceptance flow #9, then calls `generateReactivation` on confirm (or `generateAdvance` for paused students). Status flips when the resulting invoice is paid — not at transition time.

---

### S5-13 — Mid-month session change guard  *(0.5 day)*

The SYS-04-deferred guard. Two changes:

1. `PATCH /api/system/students/{id}` rejects `sessions_per_month` increase mid-month:

```php
public function rules() {
    $current = $this->route('student');
    return [
        'sessions_per_month' => [
            'integer','min:1',
            function ($attr, $val, $fail) use ($current) {
                if ($val > $current->sessions_per_month && now()->day > 1) {
                    $fail("Cannot increase sessions mid-month. Schedule the change to take effect next month.");
                }
            },
        ],
    ];
}
```

2. `PUT /api/system/students/{id}/schedule-patterns` (from SYS-04) likewise — validates the count matches the student's `sessions_per_month` divided by 4 and won't accept patterns that would imply more sessions than the student is paying for.

A simple **pending changes** UX in v1 just shows a warning when admin tries to make a forbidden change, with a tooltip "Effective Aug 1, 2026" — actually scheduling a future change is deferred:

```
⚠ Changes to sessions/month are forbidden mid-month for increases.
Decreases are allowed but only take effect next month — no current-month refund.
```

If the owner needs scheduled future changes, that's its own backlog item.

---

### S5-14 — UI: invoice list, detail, create  *(2 days)*

#### `/billing/invoices/page.tsx`

```
┌────────────────────────────────────────────────────────────────────────┐
│ Invoices                                       [+ New invoice ▾]       │
│ 124 sent · 8 overdue · 312 paid · 4 void                               │
├────────────────────────────────────────────────────────────────────────┤
│ [Status ▾] [Currency ▾] [Period ▾] [Student ▾] [Due range ▾] [Saved ▾]│
├────────────────────────────────────────────────────────────────────────┤
│ ☐ Number          Student       Period   Due       Amount      Status  │
│ ☐ INV-2026-00042  Sarah Ahmed   Jul'26   Jul 4    USD 25.00   ● Sent   │
│ ☐ INV-2026-00043  Yusuf Khan    Jul'26   Jul 4    USD 60.00   ● Overdue│
│ ☐ INV-2026-00041  Aisha Rahman  Jul'26   Jul 1    GBP 30.00   ● Paid   │
│ …                                                                      │
└────────────────────────────────────────────────────────────────────────┘
[ Bulk: Export ▾ ]                          [‹] [1] [2] [3] [›]
```

Per-currency totals shown in a small strip above the table:

```
Open totals: USD 1,450 · EUR 320 · GBP 240 · EGP 14,500
```

`/billing/invoices/[id]/page.tsx`:

```
┌────────────────────────────────────────────────────────────────────────┐
│ INV-2026-00042                                       ● Sent  [⋮ Actions]│
│ Sarah Ahmed · Tajweed · Sh. Hassan                                     │
├────────────────────────────────────────────────────────────────────────┤
│ Issued    Jul 1, 2026         Due       Jul 4, 2026                    │
│ Period    July 2026           Currency  USD                            │
│                                                                        │
│ ┌──────────────────────────────────────────────────────────────────┐   │
│ │ 8 sessions × 30 min — July 2026                       USD 25.00 │   │
│ │ Sibling discount (20%)                                –USD  5.00│   │
│ │ Wallet credit applied                                 –USD  3.00│   │
│ │ ─────────────────────────────────────────────────────────────── │   │
│ │ Total                                                  USD 17.00│   │
│ └──────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│ Payment link (Paymob)                                                 │
│   https://accept.paymob.com/...    [ Copy ]   [ Resend to WhatsApp ]   │
│   Expires Jul 5, 2026                                                  │
│                                                                        │
│ Payments (0)                                                           │
│   No payments recorded.                                                │
│   [ Record payment ]                                                   │
│                                                                        │
│ Activity                                                               │
│   • Created Jul 1 00:32 by system (cron)                               │
│   • Sent Jul 1 00:32                                                   │
└────────────────────────────────────────────────────────────────────────┘
```

`[⋮ Actions]`: Resend Paymob link · Download PDF · Edit (draft only) · Void.

`/billing/invoices/new/page.tsx` is a small wizard:

```
Step 1: Pick student → Step 2: Type (Advance / Manual) → Step 3: Lines → Step 4: Review
```

Most invoice creation in production will be cron-driven or via the student-profile "Create advance invoice" CTA — but the manual form covers edge cases.

---

### S5-15 — Student profile Invoices + Wallet tabs  *(1 day)*

#### Invoices tab

Reuses the same DataTable component, scoped to student:

```
[+ Create advance invoice]    Outstanding: USD 25.00

INV-2026-00042   Jul'26   USD 25.00   ● Sent      [Open]
INV-2026-00018   Jun'26   USD 25.00   ● Paid      [Open]
INV-2026-00001   May'26   USD 25.00   ● Paid      [Open]
```

"+ Create advance invoice" opens a sheet with:

- Effective date (default today).
- Pro-rata preview: "USD 25/month × 12/30 days = USD 10".
- Optional manual override (admin can bump or reduce by entering a different total).
- Confirm.

#### Wallet tab

```
Current balance: USD 30.00                                  [+ Add credit] [Adjust]

Date         Type          Amount     Source                        Balance
Jul 1        Credit       +USD  3.00  Overpayment from INV-2026-…   USD 30.00
Jun 30       Debit        –USD  5.00  Applied to INV-2026-00018      USD 27.00
Jun 1        Credit       +USD 32.00  Overpayment from INV-2026-…   USD 32.00
```

"Add credit" / "Adjust" use sheets. Adjust requires a note (mandatory).

---

### S5-16 — Settings: Pricing + Billing + Paymob  *(0.5 day)*

Wired up earlier in S5-03 (Pricing) and S5-08 (Paymob). The Billing settings page is small:

```
┌──────────────────────────────────────────────────────────────────┐
│ Billing                                                          │
│ Invoice timing and auto-suspension thresholds.                   │
├──────────────────────────────────────────────────────────────────┤
│ Invoice prefix              [INV]                                │
│ Default due window          [3] days                             │
│ Auto-suspend after          [2] months unpaid                    │
│ Auto-send on creation       [⬤ ON]                               │
│                                                                  │
│ Payment reminder schedule (sent via WhatsApp — wired in SYS-07)  │
│   ☑ 3 days before due                                            │
│   ☑ 1 day before due                                             │
│   ☑ On due date                                                  │
│   ☑ 1 day after overdue                                          │
│   ☑ 3 days after overdue                                         │
│   ☑ 7 days after overdue                                         │
└──────────────────────────────────────────────────────────────────┘
```

The reminder schedule is just a toggle list now; SYS-07 reads these settings to drive the wassender sends.

---

### S5-17 — PDF + Excel export  *(1 day)*

#### PDF: `App\Services\System\InvoicePdfRenderer`

Uses `barryvdh/laravel-dompdf` (already in tech stack). Template at `resources/views/system/pdf/invoice.blade.php`:

- Academy logo + name + contact at top
- Invoice number, dates, period in a top-right box
- Bill-to: student name, parent name (if child), country
- Line items table
- Totals (subtotal, discount, wallet credit, total due)
- Payment options block (Paymob link + manual instructions read from `sys_settings` key `invoice.manual_payment_instructions`)
- Footer with academy footer text from settings

Generated on demand at `GET /api/system/invoices/{id}/pdf` — returns a signed S3 (Backblaze B2) URL that expires in 5 minutes. Files cached at `storage/app/system/invoices/{number}.pdf` so re-downloads are free.

#### Excel: `App\Exports\System\InvoicesExport`

Uses `maatwebsite/excel` (already in tech stack). One sheet with all invoice fields + a separate sheet with payments. Endpoint:

```
POST /api/system/invoices/export        body: { filter[*], format: 'xlsx'|'pdf' }
```

Returns a job-id; the export runs on the `reports` queue; on completion the user gets an internal notification with a signed download link. Large exports don't block the request.

---

### S5-18 — Tests  *(2 days)*

#### Unit

- `PriceCalculatorTest` — flat sessions × duration, custom price overrides base, discounts (custom vs family vs both — max wins), zero-priced trials.
- `ProRataCalculatorTest` — every day of a 30-day, 31-day, 28/29-day month, leap-year February, mid-day boundary.
- `InvoiceNumbererTest` — concurrency: spawn 10 parallel calls, verify no duplicates.
- `WalletServiceTest` — credit + debit + adjust + applyToInvoice, atomicity (locks held), running-balance correctness over 100 sequential mutations.
- `CurrencyConverterTest` — happy path, missing rate throws.
- `StudentBillingStateTest` — outstanding sums, multi-currency presentation.

#### Feature

- `InvoiceGenerationTest` — monthly idempotent, advance pro-rata, reactivation combines outstanding + pro-rata + voids originals.
- `PaymentRecorderTest` — exact match flips paid; overpayment credits wallet; partial payment rejected.
- `PaymobWebhookTest` — valid HMAC + paid → invoice paid; valid HMAC + duplicate txn → no double payment; invalid HMAC → 401; failed payment → ignored, invoice stays Sent.
- `PaymentMethodTest` — every method enum value accepted; non-enum returns 422.
- `LifecycleIntegrationTest` — full Trial→Active path; Paused→Active path; Suspended→Active reactivation flow.
- `MidMonthGuardTest` — increase blocked; decrease allowed; pattern PUT validates count.
- `MonthlyCronTest` — Carbon-mocked first-of-month, 5 active students get 5 invoices; second run creates 0.
- `AutoSuspendCronTest` — 2-months-overdue student suspended; 1-month-overdue not.
- `OverdueCronTest` — past-due Sent invoices flip to Overdue.

#### PDF golden tests

`tests/Feature/System/Pdf/InvoicePdfTest.php` — render demo invoices, assert the rendered PDF text contains expected fields (invoice number, totals, due date). Don't check pixel-perfect layout — fragile.

#### Playwright

`frontend/e2e/system/billing.spec.ts` — 9 acceptance flows.

---

### S5-19 — Deploy + smoke pass  *(0.5 day)*

- Run migrations on staging.
- Run `php artisan db:seed --class=System\\SystemDemoSeeder` — extends seeded data with 3 months of demo invoices.
- Configure Paymob (sandbox credentials) in Settings → Integrations → Paymob.
- Configure FX rates in Settings → Pricing for USD/EUR/EGP.
- Owner walks through the 9 acceptance flows live.
- Confirm public site at `alrayan-academy.com/pricing` reads from the new live endpoint and reflects changes within ~60s of saving.
- Confirm cron entries appear in `/horizon` (or via `php artisan schedule:list`).
- Lighthouse on `/billing/invoices` → ≥ 90 perf, ≥ 95 a11y.

---

## Endpoints {#endpoints}

| Method | Path | Permission |
|---|---|---|
| GET    | `/api/system/invoices`                                        | `invoices.view` |
| GET    | `/api/system/invoices/{id}`                                   | policy |
| POST   | `/api/system/invoices`                                        | `invoices.create` |
| PATCH  | `/api/system/invoices/{id}`                                   | `invoices.edit` (draft only) |
| POST   | `/api/system/invoices/{id}/send`                              | `invoices.edit` |
| POST   | `/api/system/invoices/{id}/void`                              | `invoices.void` |
| POST   | `/api/system/invoices/{id}/payments`                          | `invoices.record_payment` |
| GET    | `/api/system/invoices/{id}/pdf`                               | `invoices.download_pdf` |
| POST   | `/api/system/invoices/{id}/resend-paymob-link`                | `invoices.resend_link` |
| POST   | `/api/system/invoices/export`                                 | `invoices.export` |
| GET    | `/api/system/students/{id}/invoices`                          | `invoices.view` |
| GET    | `/api/system/students/{id}/billing-state`                     | `invoices.view` |
| POST   | `/api/system/students/{id}/invoices/advance`                  | `invoices.create_advance` |
| POST   | `/api/system/students/{id}/invoices/reactivation`             | `invoices.create` |
| POST   | `/api/system/students/{id}/transition-prepare`                | `students.change_status` |
| GET    | `/api/system/students/{id}/wallet`                            | `wallet.view` |
| GET    | `/api/system/students/{id}/wallet/transactions`               | `wallet.view` |
| POST   | `/api/system/students/{id}/wallet/credit`                     | `wallet.credit` |
| POST   | `/api/system/students/{id}/wallet/debit`                      | `wallet.debit` |
| POST   | `/api/system/students/{id}/wallet/adjust`                     | `wallet.adjust` |
| GET    | `/api/system/payments`                                        | `payments.view` |
| POST   | `/api/system/integrations/paymob/test`                        | `settings.edit` |
| POST   | `/api/system/webhooks/paymob`                                 | (public, HMAC) |
| GET    | `/api/v1/pricing`                                             | (public) |

---

## File deliverables checklist

```
backend/
├── app/
│   ├── Console/Commands/System/
│   │   ├── GenerateMonthlyInvoices.php
│   │   ├── AutoSuspendNonPayers.php
│   │   └── MarkInvoicesOverdue.php
│   ├── Http/
│   │   ├── Controllers/System/
│   │   │   ├── InvoiceController.php
│   │   │   ├── PaymentController.php
│   │   │   ├── WalletController.php
│   │   │   ├── BillingExportController.php
│   │   │   ├── PaymobIntegrationController.php
│   │   │   ├── PaymobWebhookController.php
│   │   │   └── PricingSettingsController.php
│   │   ├── Controllers/Api/PublicPricingController.php   (NEW — site reads pricing)
│   │   ├── Requests/System/Invoice/{Store,Update,Void,Send,Export}Request.php
│   │   ├── Requests/System/Payment/RecordRequest.php
│   │   ├── Requests/System/Wallet/{Credit,Debit,Adjust}Request.php
│   │   └── Resources/System/{Invoice,InvoiceLine,Payment,WalletTransaction,PaymobLink}Resource.php
│   ├── Models/System/
│   │   ├── Invoice.php
│   │   ├── InvoiceLine.php
│   │   ├── Payment.php
│   │   ├── WalletTransaction.php
│   │   └── PaymobPaymentLink.php
│   ├── Policies/System/
│   │   ├── InvoicePolicy.php
│   │   ├── PaymentPolicy.php
│   │   └── WalletPolicy.php
│   ├── Jobs/System/
│   │   ├── CreatePaymobPaymentLink.php
│   │   ├── RegeneratePaymobPaymentLink.php
│   │   ├── GenerateInvoicePdf.php
│   │   └── BuildBillingExport.php
│   ├── Listeners/System/
│   │   ├── OnInvoicePaid.php
│   │   ├── OnInvoiceOverdue.php
│   │   ├── VoidDraftsOnStudentPause.php
│   │   └── ApplyWalletCreditOnInvoiceCreated.php
│   ├── Events/System/
│   │   ├── InvoiceCreated.php
│   │   ├── InvoicePaid.php
│   │   ├── InvoiceOverdue.php
│   │   ├── InvoiceVoided.php
│   │   └── PaymentRecorded.php
│   ├── Services/System/
│   │   ├── PriceCalculator.php
│   │   ├── ProRataCalculator.php
│   │   ├── InvoiceGenerator.php
│   │   ├── InvoiceNumberer.php
│   │   ├── PaymentRecorder.php
│   │   ├── WalletService.php
│   │   ├── StudentBillingState.php
│   │   └── InvoicePdfRenderer.php
│   ├── Services/Integrations/Paymob/
│   │   ├── PaymobClient.php
│   │   ├── FakePaymobClient.php
│   │   ├── PaymobHmacVerifier.php
│   │   └── PaymobServiceProvider.php
│   ├── Support/System/Currency/
│   │   ├── CurrencyConverter.php
│   │   └── SupportedCurrencies.php
│   └── Exports/System/
│       ├── InvoicesExport.php
│       └── PaymentsExport.php
├── database/migrations/
│   ├── 2026_07_27_000001_create_sys_invoices_table.php
│   ├── 2026_07_27_000002_create_sys_invoice_lines_table.php
│   ├── 2026_07_27_000003_create_sys_payments_table.php
│   ├── 2026_07_27_000004_create_sys_wallet_transactions_table.php
│   ├── 2026_07_27_000005_create_sys_paymob_payment_links_table.php
│   ├── 2026_07_27_000006_create_sys_invoice_counters_table.php
│   └── 2026_07_27_000007_seed_pricing_and_billing_settings.php
├── database/factories/System/
│   ├── InvoiceFactory.php
│   ├── InvoiceLineFactory.php
│   ├── PaymentFactory.php
│   ├── WalletTransactionFactory.php
│   └── PaymobPaymentLinkFactory.php
├── resources/views/system/pdf/
│   └── invoice.blade.php
└── routes/
    ├── api.php           (UPDATED — adds /api/v1/pricing)
    └── system.php        (UPDATED — adds the 23 system endpoints + webhook)

frontend/
├── src/app/(system)/
│   ├── billing/
│   │   ├── invoices/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── new/page.tsx
│   │   ├── payments/page.tsx
│   │   └── overdue/page.tsx
│   ├── students/[id]/page.tsx                     (UPDATED — Invoices, Wallet tabs filled in)
│   └── settings/
│       ├── pricing/page.tsx                       (FILLED IN)
│       ├── billing/page.tsx                       (FILLED IN)
│       └── integrations/paymob/page.tsx           (FILLED IN)
├── src/components/system/
│   ├── billing/
│   │   ├── InvoiceTable.tsx
│   │   ├── InvoiceDetail.tsx
│   │   ├── InvoiceLineItems.tsx
│   │   ├── CreateAdvanceInvoiceSheet.tsx
│   │   ├── ManualInvoiceWizard.tsx
│   │   ├── RecordPaymentSheet.tsx
│   │   ├── VoidInvoiceDialog.tsx
│   │   ├── PaymobLinkPanel.tsx
│   │   └── ProRataPreview.tsx
│   ├── wallet/
│   │   ├── WalletPanel.tsx
│   │   ├── WalletLedgerTable.tsx
│   │   └── WalletAdjustSheet.tsx
│   ├── settings/
│   │   ├── PricingSettings.tsx
│   │   ├── BillingSettings.tsx
│   │   └── PaymobSettings.tsx
│   └── students/
│       └── ReactivationPreviewDialog.tsx
├── src/hooks/system/
│   ├── useInvoices.ts
│   ├── useInvoice.ts
│   ├── useStudentInvoices.ts
│   ├── useStudentBillingState.ts
│   ├── useCreateInvoice.ts
│   ├── useRecordPayment.ts
│   ├── useWallet.ts
│   ├── usePricingSettings.ts
│   └── useBillingSettings.ts
└── src/types/system/
    ├── invoice.ts
    ├── payment.ts
    ├── wallet.ts
    └── paymob.ts

docs/system/sprints/sys-05-pricing-billing-invoicing.md   (THIS FILE)
```

---

## Risks & open questions

- **Paymob credential availability.** If owner doesn't have Paymob credentials by sprint start, run with `PAYMOB_ENABLED=false` and the FakePaymobClient. The cron + invoicing flow still works; only the auto-payment-link generation is disabled. Document in TODO.md and revisit.
- **HMAC concatenation.** Paymob's HMAC field order is non-obvious and historically has changed. We pin to the documented v1 order and add a TODO check: when Paymob revs their docs, update `PaymobHmacVerifier::FIELDS` constant. Verifier is one constant array — easy to fix.
- **FX rate management.** v1 ships manual rates. The first month of operation may surface inconsistency (a student paid USD 25 last month, currency rate changed today, this month's invoice is USD 26 in EGP terms). Owner reviews rates monthly. If volume grows, switch to ECB / OXR API in a follow-up sprint.
- **Refunds out of scope.** A `refund` enum value exists on `wallet_transactions.source` and a `payments.refund` permission is reserved, but no UI / endpoint ships in v1. Spec doesn't mention refunds.
- **Concurrent invoice numbering.** `InvoiceNumberer` uses a row lock on `sys_invoice_counters`. Tested with 10 parallel jobs — no duplicates. If we ever shard MySQL, this becomes a problem; revisit then.
- **Invoice mutation after sending.** Sent invoices are immutable except via Void. Editing a Sent invoice changes financial history — never silently mutate. UI hides the "Edit" button on non-draft invoices.
- **Student timezone vs. invoice period.** Monthly billing runs at server midnight UTC. A student in Hawaii whose local time is still the previous month gets a "next month" invoice on what feels like the last day of the prior month. Acceptable for v1 — billing periods follow academy timezone (`Setting::get('default_timezone')`), not student timezone.
- **Site Pricing fetch timing.** The site's `PricingCards` was wired to import a static TS file (Sprint 4). We now switch to a fetch-at-build-time + ISR every-hour pattern, plus on-demand revalidate when settings save. If the public site Sprint 6 (Blog CMS) hasn't shipped yet, the on-demand revalidate hook may not exist — the hourly ISR is the fallback. Documented in [../../sprints/sprint-04-conversion-backend.md](../../sprints/sprint-04-conversion-backend.md) update.

---

## Sprint review demo script

(~15 minutes)

1. Open `/billing/invoices` — see 3 months of seeded invoices, status counts in header, per-currency open totals.
2. Filter by `Status = Overdue` → see 8 rows, including the demo auto-suspended student's last invoice.
3. Click into one Sent invoice → show line items, Paymob link, "Record payment" CTA.
4. Record a manual payment matching the total → invoice flips to Paid → student profile (if Trial) flips to Active. Show timeline + audit log.
5. Open a different student → Invoices tab → "+ Create advance invoice" → pro-rata preview shows current calculation → confirm → invoice created → status remains Trial until paid.
6. Use the FakePaymob endpoint (or Postman → real Paymob sandbox) → simulate webhook → invoice flips Paid → student transitions Trial→Active.
7. Trigger a 100 USD payment against an 80 USD invoice → wallet credited 20 USD → next month auto-invoice (run cron manually) shows the 20 USD wallet credit applied.
8. Mid-month, try to increase a student's `sessions_per_month` from 4 to 8 → 422 message; reduce from 8 to 4 → succeeds with "applies next month" notice. Run cron for next month → new sessions/month reflected.
9. Fast-forward a demo student to 2 months unpaid via Tinker → run auto-suspend cron → status flips to Suspended, sessions cancelled (SYS-04 listener), teacher gets notification.
10. From the Suspended student's profile, click "Activate" → reactivation preview dialog shows outstanding + pro-rata totals → confirm → reactivation invoice created → record payment → status flips to Active.
11. Edit Settings → Pricing → change base 30-min from USD 25 to USD 28 → save → public site `/pricing` reflects the change within 60 seconds.
12. Confirm Lighthouse + audit log + activity log entries for every action.

---

*Last updated: May 10, 2026*
