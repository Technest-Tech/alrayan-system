# SYS-06 — Payroll, Bonuses & Quality

**Modules covered:** 10 (Quality Management), 12 (Teacher Payroll), 13 (Teacher Rewards / Bonuses) + Module 19 (Teacher Salary tab)
**Duration:** 2 weeks
**Status:** Detailed, ready to implement.
**Sprint goal:** payroll auto-calculates on the 1st of each month from attended sessions. Admin reviews, approves, marks transferred. Bonuses + deductions live as adjustments. Quality scores compute automatically from attendance / report-submission / retention / punctuality and feed bonus recommendations. Teachers see their salary statement on the dashboard.

> **Prereqs** — SYS-05 has shipped. Billing is live. Sessions (SYS-04) generate the attended-minutes data the payroll calculator consumes.

> **Out of scope** — paid time off, advances against future salary, multi-currency teacher payments (teachers are paid in EGP only per the spec). Tax / labor compliance — not modeled.

---

## Definition of Done

### Backend
- [ ] Three `sys_*` tables created: `sys_payrolls`, `sys_payroll_adjustments`, `sys_quality_reviews`
- [ ] Models: `Payroll`, `PayrollAdjustment`, `QualityReview` — ActivityLog watched fields
- [ ] Policies: `PayrollPolicy` (admin all; teacher view-own only; supervisor perm-gated), `QualityReviewPolicy`
- [ ] Pure services: `PayrollCalculator`, `QualityScorer` (4 component scores → overall), `BonusRecommender`
- [ ] Compound services: `PayrollGenerator`, `PayrollApprover`, `SalaryStatementBuilder` (teacher-facing snapshot)
- [ ] 18 endpoints under `/api/system/` (full table in [#endpoints](#endpoints))
- [ ] Cron `0 1 1 * *` (1 AM on the 1st) generates previous-month payroll for every Active or recently-active teacher; idempotent
- [ ] Cron weekly recomputes quality scores for the trailing 30 days
- [ ] Listener `OnPayrollApproved` writes an internal notification to the teacher
- [ ] Listener `OnUnderperformingTeacher` writes admin notification when a quality score crosses the configured threshold
- [ ] Excel + PDF exports for payroll summary (academy-wide month) and salary slip (per teacher per month)

### Frontend
- [ ] `/payroll` — monthly payroll summary: all teachers, their net salary, status, bulk-approve, bulk-transfer
- [ ] `/payroll/[month]` — alias for `/payroll?period=YYYY-MM`, with month picker at the top
- [ ] `/payroll/teacher/[id]` — per-teacher payroll detail page: history archive + current month detail panel
- [ ] **Bonus / deduction sheet** — add adjustment with type, amount, reason, audit-logged on save
- [ ] **Approve / reject / transfer dialog** with optional note + transfer reference field
- [ ] `/quality` — teacher quality dashboard: leaderboard, scores per component, trend chart
- [ ] `/quality/[teacherId]` — per-teacher quality detail: monthly review history, current scores, bonus recommendation banner
- [ ] **Monthly quality review form** — admin / supervisor scores attendance / reports / retention / punctuality with sliders + notes; submit creates a `sys_quality_reviews` row
- [ ] Teacher profile: **Salary** tab + **Quality** tab filled in (placeholders since SYS-03)
- [ ] **Teacher dashboard `/teacher/salary`** — current month statement (sessions, minutes, base, bonuses, deductions, net, status) + history archive
- [ ] Underperforming-teacher alert appears on `/dashboard` alerts panel
- [ ] Settings → Pricing → **Per-minute rate hints** explainer (helps admin understand the base inputs to payroll math)
- [ ] Mobile QA at 375px: payroll summary collapses to card list; salary tab on teacher dashboard works one-handed
- [ ] Lighthouse on `/payroll` and `/teacher/salary` ≥ 90 perf, ≥ 95 a11y
- [ ] `scripts/check-system-isolation.sh` still passes

### Quality
- [ ] Unit tests for `PayrollCalculator`, `QualityScorer`, `BonusRecommender`
- [ ] Feature tests for every endpoint (success, validation, permission, idempotency)
- [ ] Cron tests with `Carbon::setTestNow()`
- [ ] PDF golden tests on salary slip
- [ ] Playwright covers the 7 acceptance flows below
- [ ] Coverage on services in this sprint ≥ 90%

### Acceptance flows (Playwright)

1. **Auto-generate payroll** — fast-forward to 1st of next month → cron runs → every active teacher has a `Pending` payroll row → totals match attended-minutes × rate.
2. **Add bonus** — admin opens a payroll → "+ Adjustment" → type=Bonus, EGP 200, reason "Excellent retention this month" → net salary increases by 200 → audit log entry.
3. **Add deduction** — admin adds a deduction EGP 50, reason "Late report on Jul 14" → net salary decreases → teacher's salary statement reflects within a refresh.
4. **Approval workflow** — admin clicks "Approve" → status flips to Approved, button changes to "Mark transferred" → admin clicks → required transfer reference field → confirm → status flips to Transferred → teacher receives notification.
5. **Quality score auto-compute** — Tinker-trigger the weekly cron → quality dashboard shows real numbers for each teacher → click a teacher → component breakdown.
6. **Submit monthly review** — admin opens monthly review form for Sh. Hassan → slider scores (90/85/95/88) + notes → submit → `sys_quality_reviews` row created → score history updates.
7. **Underperforming alert** — set a teacher's score to 60 (manually via the form) → admin notification appears → dashboard alerts panel shows the alert.

---

## Story breakdown

### S6-01 — Migrations  *(0.5 day)*

Three new migrations dated `2026_08_10_*`.

**`2026_08_10_000001_create_sys_payrolls_table.php`**

```php
Schema::create('sys_payrolls', function (Blueprint $t) {
    $t->id();
    $t->foreignId('teacher_id')->constrained('sys_teachers')->restrictOnDelete();
    $t->unsignedSmallInteger('period_year');
    $t->unsignedTinyInteger('period_month');
    $t->unsignedInteger('total_sessions');
    $t->unsignedInteger('total_minutes');
    $t->json('breakdown_by_duration');                 // {"30":120,"45":45,"60":600} — minutes per duration
    $t->bigInteger('base_salary_minor');               // EGP minor (piasters)
    $t->bigInteger('bonuses_minor')->default(0);
    $t->bigInteger('deductions_minor')->default(0);
    $t->bigInteger('net_salary_minor');                // = base + bonuses - deductions
    $t->enum('status', ['pending', 'approved', 'rejected', 'transferred'])->default('pending');
    $t->foreignId('approved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
    $t->timestamp('approved_at')->nullable();
    $t->timestamp('rejected_at')->nullable();
    $t->text('rejection_reason')->nullable();
    $t->timestamp('transferred_at')->nullable();
    $t->string('transfer_reference', 200)->nullable();
    $t->foreignId('transferred_by_user_id')->nullable()->constrained('users')->nullOnDelete();
    $t->json('snapshot')->nullable();                  // teacher rates at time of run
    $t->softDeletes();
    $t->timestamps();
    $t->unique(['teacher_id', 'period_year', 'period_month']);
    $t->index(['status', 'period_year', 'period_month']);
});
```

> **Why a `snapshot` JSON column?** Per-minute rates can change month to month. The snapshot records the rates that were in effect when payroll was calculated, so a re-run produces the same number.

**`2026_08_10_000002_create_sys_payroll_adjustments_table.php`**

```php
Schema::create('sys_payroll_adjustments', function (Blueprint $t) {
    $t->id();
    $t->foreignId('payroll_id')->constrained('sys_payrolls')->cascadeOnDelete();
    $t->enum('type', ['bonus', 'deduction']);
    $t->enum('category', [
        // bonus categories
        'performance', 'retention', 'reports_consistency', 'tenure', 'other_bonus',
        // deduction categories
        'unauthorized_absence', 'late_report', 'late_arrival', 'quality_issue', 'other_deduction',
    ]);
    $t->bigInteger('amount_minor');                    // always positive; sign comes from `type`
    $t->text('reason');
    $t->foreignId('added_by_user_id')->constrained('users')->restrictOnDelete();
    $t->softDeletes();
    $t->timestamps();
    $t->index(['payroll_id', 'type']);
});
```

**`2026_08_10_000003_create_sys_quality_reviews_table.php`**

```php
Schema::create('sys_quality_reviews', function (Blueprint $t) {
    $t->id();
    $t->foreignId('teacher_id')->constrained('sys_teachers')->cascadeOnDelete();
    $t->unsignedSmallInteger('period_year');
    $t->unsignedTinyInteger('period_month');
    $t->foreignId('reviewer_user_id')->nullable()->constrained('users')->nullOnDelete();
    $t->enum('source', ['manual', 'auto'])->default('manual');
    $t->unsignedTinyInteger('attendance_score');       // 0–100
    $t->unsignedTinyInteger('reports_score');          // 0–100
    $t->unsignedTinyInteger('retention_score');        // 0–100
    $t->unsignedTinyInteger('punctuality_score');      // 0–100
    $t->unsignedTinyInteger('overall_score');          // weighted avg, computed at save
    $t->json('inputs')->nullable();                    // {sessions, attended, reports_submitted, lost_students, ...}
    $t->text('notes')->nullable();
    $t->bigInteger('bonus_recommendation_minor')->default(0);
    $t->timestamps();
    $t->index(['teacher_id', 'period_year', 'period_month']);
    $t->index(['overall_score']);
});
```

#### `sys_settings` keys added

```php
'payroll.run_day_of_month'              => 1,        // when monthly cron fires
'payroll.run_hour'                      => 1,
'quality.weight.attendance'             => 30,       // weights sum to 100
'quality.weight.reports'                => 30,
'quality.weight.retention'              => 25,
'quality.weight.punctuality'            => 15,
'quality.underperforming_threshold'     => 70,       // below this triggers alert
'quality.bonus_recommendation_threshold'=> 90,       // above this recommends a bonus
'quality.recommended_bonus_minor'       => 50000,    // EGP 500 default
'payroll.late_report_deduction_minor'   => 5000,     // EGP 50 — admin can ignore
```

#### Permissions

The `payroll.*` permissions defined in SYS-02 are reused. We firm up the list:

```php
'payroll' => ['view', 'view_any', 'approve', 'reject', 'mark_transferred', 'adjust', 'export'],
'quality' => ['view', 'view_any', 'review', 'view_own'],
```

Teachers automatically get `payroll.view` and `quality.view_own` (scoped via policy to self). Admin gets all; supervisor permissions vary.

---

### S6-02 — Models, factories, policies  *(0.5 day)*

#### Models

**`Payroll`**:

```php
class Payroll extends Model
{
    use SoftDeletes, LogsActivity;
    protected $table = 'sys_payrolls';
    protected $guarded = [];
    protected $casts = [
        'breakdown_by_duration' => 'array',
        'snapshot'              => 'array',
        'approved_at'   => 'datetime',
        'rejected_at'   => 'datetime',
        'transferred_at'=> 'datetime',
    ];

    public function teacher()     { return $this->belongsTo(Teacher::class); }
    public function adjustments() { return $this->hasMany(PayrollAdjustment::class); }
    public function bonuses()     { return $this->adjustments()->where('type','bonus'); }
    public function deductions()  { return $this->adjustments()->where('type','deduction'); }
    public function approver()    { return $this->belongsTo(User::class, 'approved_by_user_id'); }

    public function recomputeTotals(): void
    {
        $this->bonuses_minor    = (int) $this->bonuses()->sum('amount_minor');
        $this->deductions_minor = (int) $this->deductions()->sum('amount_minor');
        $this->net_salary_minor = $this->base_salary_minor + $this->bonuses_minor - $this->deductions_minor;
        $this->save();
    }

    public function getActivitylogOptions(): LogOptions {
        return LogOptions::defaults()
            ->logOnly(['status','net_salary_minor','approved_at','rejected_at','transferred_at','transfer_reference'])
            ->logOnlyDirty();
    }
}
```

#### Policies

`PayrollPolicy`:

```php
public function viewAny(User $u)
{
    return $u->can('payroll.view_any') || $u->role === 'teacher';
}
public function view(User $u, Payroll $p)
{
    if ($u->role === 'admin') return true;
    if ($u->role === 'teacher') return $p->teacher_id === $u->teacher?->id;
    return $u->can('payroll.view_any');
}
public function adjust(User $u, Payroll $p)
{
    return $u->can('payroll.adjust') && $p->status === 'pending';
}
public function approve(User $u, Payroll $p)
{
    return $u->can('payroll.approve') && $p->status === 'pending';
}
public function markTransferred(User $u, Payroll $p)
{
    return $u->can('payroll.mark_transferred') && $p->status === 'approved';
}
```

`QualityReviewPolicy` follows the same shape with `quality.view_any` / `quality.review`.

#### Factories

`PayrollFactory` with named states: `pending()`, `approved()`, `transferred()`, `withBonus()`, `withDeduction()`. The demo seeder extends:

- For each active teacher with seeded sessions, create payrolls for the last 3 months.
- The most-recent month is `Pending`.
- One Approved, one Transferred among the older months.
- 1–3 quality reviews per teacher.

---

### S6-03 — Payroll calculator  *(1 day)*

`App\Services\System\PayrollCalculator` is pure, deterministic, fully unit-tested.

```php
class PayrollCalculator
{
    /**
     * Compute the base salary from attended sessions in [start, end).
     * Uses the *teacher's current rates* unless overridden via $rateSnapshot.
     */
    public function calculate(Teacher $teacher, Carbon $start, Carbon $end, ?array $rateSnapshot = null): PayrollComputation
    {
        $rates = $rateSnapshot ?? [
            30 => (int) $teacher->per_minute_rate_30,
            45 => (int) $teacher->per_minute_rate_45,
            60 => (int) $teacher->per_minute_rate_60,
        ];

        $sessions = Session::query()
            ->where('teacher_id', $teacher->id)
            ->where('status', 'attended')
            ->whereBetween('scheduled_start', [$start, $end])
            ->get();

        $totalSessions = $sessions->count();
        $byDuration    = [30 => 0, 45 => 0, 60 => 0];
        $base          = 0;

        foreach ($sessions as $s) {
            $d = $this->snapDuration($s->duration_min);
            $byDuration[$d] = ($byDuration[$d] ?? 0) + $s->duration_min;
            $base += $s->duration_min * ($rates[$d] ?? 0);
        }

        $totalMinutes = array_sum($byDuration);

        return new PayrollComputation(
            totalSessions:        $totalSessions,
            totalMinutes:         $totalMinutes,
            breakdownByDuration:  $byDuration,
            baseSalaryMinor:      $base,
            rateSnapshot:         $rates,
        );
    }

    /** Snap arbitrary minute counts to the nearest defined rate bucket (30/45/60). */
    private function snapDuration(int $minutes): int
    {
        if ($minutes <= 37)  return 30;
        if ($minutes <= 52)  return 45;
        return 60;
    }
}
```

`PayrollComputation` is a typed DTO.

> **Why snap durations?** The system is built around 30/45/60-minute sessions, but rescheduled or makeup sessions can technically run other lengths (the duration column on `sys_sessions` is whatever the operator set). Rather than failing on a 40-minute session, we round to the nearest defined rate bucket. Tested with edge cases.

#### Endpoint

```
POST /api/system/payrolls/preview     body: { teacher_id, year, month }
                                       perm: payroll.view_any
```

Returns the calculation without persisting — used by the bonus/deduction UI to show "what's the current month look like if I were to run payroll right now?"

---

### S6-04 — Cron: monthly generation  *(0.5 day)*

`app/Console/Commands/System/CalculatePayroll.php`:

```php
public function handle(PayrollCalculator $calc, PayrollGenerator $gen): int
{
    $prev  = now()->subMonthNoOverflow();
    $year  = $prev->year;
    $month = $prev->month;
    $start = $prev->copy()->startOfMonth()->utc();
    $end   = $prev->copy()->endOfMonth()->addDay()->startOfDay()->utc();

    $count = 0;
    Teacher::where('is_active', true)->cursor()->each(function ($t) use ($calc, $gen, $start, $end, $year, $month, &$count) {
        $p = $gen->generate($t, $year, $month, $start, $end);
        if ($p->wasRecentlyCreated) $count++;
    });

    NotificationService::pushToAdmins(
        'payroll.generated',
        "Payroll for {$year}-{$month} generated ({$count} new)",
        null, "/payroll/{$year}-".str_pad($month,2,'0',STR_PAD_LEFT)
    );
    return self::SUCCESS;
}
```

`PayrollGenerator::generate(Teacher $t, int $year, int $month, ...)`:

1. Idempotent — if a `sys_payrolls` row for `(teacher_id, year, month)` exists, return it.
2. Run `PayrollCalculator::calculate(...)` over the month.
3. Persist with `status=pending`, `snapshot` of rates, totals.
4. Auto-add deductions for "late report" sessions (defined: session attended but report submitted >24h after, capped at one deduction per teacher per month). Configurable via `payroll.late_report_deduction_minor`; admin can delete the auto-added adjustment if they disagree.
5. Recompute totals.
6. Audit log + event `PayrollGenerated`.

Schedule registration:

```php
$schedule->command('system:payroll:calculate')
    ->cron(sprintf('0 %d %d * *',
        Setting::int('payroll.run_hour', 1),
        Setting::int('payroll.run_day_of_month', 1)
    ))
    ->onOneServer();
```

> **Why `->onOneServer()`?** If we ever horizontally scale the queue workers, only one node should run this cron — payroll generation must not double-fire.

---

### S6-05 — Approval workflow  *(1 day)*

State machine: `pending → approved → transferred` (or `pending → rejected`). `PayrollApprover` enforces transitions.

```php
class PayrollApprover
{
    public function approve(Payroll $p, User $by): Payroll
    {
        abort_unless($p->status === 'pending', 422, 'Only pending payrolls can be approved.');
        $p->update([
            'status'              => 'approved',
            'approved_at'         => now(),
            'approved_by_user_id' => $by->id,
        ]);
        NotificationService::push($p->teacher->user, 'payroll.approved',
            "Your payroll for " . Carbon::create($p->period_year,$p->period_month,1)->format('F Y') . " was approved.",
            "EGP " . number_format($p->net_salary_minor / 100, 2), "/teacher/salary");
        event(new PayrollApproved($p));
        return $p;
    }

    public function reject(Payroll $p, User $by, string $reason): Payroll
    {
        abort_unless($p->status === 'pending', 422);
        $p->update(['status'=>'rejected','rejected_at'=>now(),'rejection_reason'=>$reason]);
        // Rejection isn't a permanent state in v1 — admin can edit, then it goes back to pending.
        // For now we just block transfer; future workflow improvements can refine this.
        return $p;
    }

    public function markTransferred(Payroll $p, User $by, string $reference): Payroll
    {
        abort_unless($p->status === 'approved', 422, 'Only approved payrolls can be marked transferred.');
        $p->update([
            'status'                  => 'transferred',
            'transferred_at'          => now(),
            'transferred_by_user_id'  => $by->id,
            'transfer_reference'      => $reference,
        ]);
        NotificationService::push($p->teacher->user, 'payroll.transferred',
            "Your salary has been transferred.", "Reference: {$reference}", "/teacher/salary");
        event(new PayrollTransferred($p));
        return $p;
    }
}
```

#### Endpoints

```
POST /api/system/payrolls/{id}/approve            perm: payroll.approve
POST /api/system/payrolls/{id}/reject             perm: payroll.reject       body: { reason }
POST /api/system/payrolls/{id}/mark-transferred   perm: payroll.mark_transferred   body: { transfer_reference }
POST /api/system/payrolls/bulk-approve            perm: payroll.approve      body: { ids: [] }
POST /api/system/payrolls/bulk-transfer           perm: payroll.mark_transferred   body: [{ id, reference }, ...]
```

Bulk endpoints process within a single DB transaction; partial failures rollback.

---

### S6-06 — Bonuses + deductions UI  *(1 day)*

#### Endpoints

```
POST   /api/system/payrolls/{id}/adjustments      perm: payroll.adjust
PATCH  /api/system/payroll-adjustments/{id}       perm: payroll.adjust
DELETE /api/system/payroll-adjustments/{id}       perm: payroll.adjust
```

`PayrollAdjustmentController::store` validates: payroll must be `pending`, amount > 0, category matches type (bonus categories vs deduction categories), reason required. Persists and triggers `Payroll::recomputeTotals()`.

#### UI

On `/payroll/teacher/{id}` and the payroll detail panel:

```
┌──────────────────────────────────────────────────────────────────┐
│ Adjustments (3)                                  [+ Add adjustment]│
├──────────────────────────────────────────────────────────────────┤
│ + Bonus  · Performance      EGP  200.00   Excellent retention…   │
│ – Deduct · Late report      EGP   50.00   Late report on Jul 14  │
│ + Bonus  · Tenure           EGP  100.00   3-year anniversary     │
└──────────────────────────────────────────────────────────────────┘
```

`+ Add adjustment` opens a sheet:

```
Type:        ( ) Bonus    (●) Deduction
Category:    [Late report ▾]    (filtered by type)
Amount EGP:  [_____ 50.00]
Reason:      [ Late report on Jul 14 — submitted 28h after session ]
                                                    [Cancel] [Save]
```

After save: row appears, totals recompute, audit log entry written. Admin can edit or delete the row inline before the payroll is approved.

---

### S6-07 — Quality scoring  *(1.5 days)*

`App\Services\System\QualityScorer` produces 4 component scores from raw inputs.

```php
class QualityScorer
{
    public function score(Teacher $t, Carbon $start, Carbon $end): QualityScore
    {
        $sessions = Session::where('teacher_id', $t->id)
            ->whereBetween('scheduled_start', [$start, $end])->get();

        $totalSessions   = $sessions->count();
        $attended        = $sessions->where('status', 'attended')->count();
        $reportsExpected = $attended;
        $reportsSubmitted= SessionReport::whereIn('session_id', $sessions->pluck('id'))->count();
        $studentsStart   = $this->studentsAssignedAt($t, $start);
        $studentsEnd     = $this->studentsAssignedAt($t, $end);
        $lostStudents    = max(0, $studentsStart - $studentsEnd);
        $lateStarts      = $this->countLateStarts($sessions);

        return new QualityScore(
            attendance:   $this->pct($attended, $totalSessions),
            reports:      $this->pct($reportsSubmitted, $reportsExpected ?: 1),
            retention:    $studentsStart === 0 ? 100 : (int) round((1 - $lostStudents / $studentsStart) * 100),
            punctuality:  $this->pct($attended - $lateStarts, $attended ?: 1),
            inputs:       compact('totalSessions','attended','reportsExpected','reportsSubmitted','studentsStart','studentsEnd','lostStudents','lateStarts'),
        );
    }

    public function overall(QualityScore $s): int
    {
        $w = Setting::weights('quality.weight.*');
        return (int) round(
            ($s->attendance * $w['attendance']
            + $s->reports * $w['reports']
            + $s->retention * $w['retention']
            + $s->punctuality * $w['punctuality']) / 100
        );
    }

    private function pct(int $num, int $denom): int
    {
        return $denom <= 0 ? 100 : (int) round(100 * $num / $denom);
    }
    private function countLateStarts(Collection $sessions): int { /* zoom start vs scheduled */ return 0; }
    private function studentsAssignedAt(Teacher $t, Carbon $at): int { /* point-in-time count from sys_audit_logs */ return 0; }
}
```

> **`countLateStarts` and `studentsAssignedAt`** rely on data we already have:
> - Late starts: compare `sys_sessions.scheduled_start` to the Zoom meeting's "actual start" (Zoom's webhook publishes this; we're not consuming it yet — v1 ships with `countLateStarts` returning 0 until we hook Zoom's meeting-started webhook in a follow-up).
> - Students assigned at a moment in time: walk `sys_audit_logs` for `sys_students` entries where `assigned_teacher_id` changed to/from this teacher, plus the current count if no changes since.
>
> If either becomes too expensive, we fall back to a denormalized count. Documented in [#risks-open-questions].

#### Weekly cron

`app/Console/Commands/System/RecomputeQualityScores.php` runs Mondays at 02:00:

```php
public function handle(QualityScorer $scorer): int
{
    $end   = now();
    $start = $end->copy()->subDays(30);
    Teacher::where('is_active', true)->cursor()->each(function ($t) use ($scorer, $start, $end) {
        $score = $scorer->score($t, $start, $end);
        $overall = $scorer->overall($score);
        QualityReview::updateOrCreate(
            ['teacher_id'=>$t->id, 'period_year'=>$end->year, 'period_month'=>$end->month, 'source'=>'auto'],
            [
                'reviewer_user_id'=> null,
                'attendance_score'=>$score->attendance,
                'reports_score'   =>$score->reports,
                'retention_score' =>$score->retention,
                'punctuality_score'=>$score->punctuality,
                'overall_score'   =>$overall,
                'inputs'          =>$score->inputs,
                'bonus_recommendation_minor' => app(BonusRecommender::class)->forScore($overall),
            ]
        );
        if ($overall < Setting::int('quality.underperforming_threshold', 70)) {
            event(new TeacherUnderperforming($t, $overall));
        }
    });
    return self::SUCCESS;
}
```

> **Manual vs auto reviews.** The table holds both. `source='auto'` is the cron's output; `source='manual'` is a human review. The UI shows the most-recent manual review prominently and the auto-trend as a sparkline. Admins can submit a manual review to override the auto score in special cases.

---

### S6-08 — Quality dashboard + review form  *(1.5 days)*

#### `/quality/page.tsx` — teacher leaderboard

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Teacher quality                                                          │
│ Auto-scored weekly. Overall is a weighted average of 4 components.       │
├──────────────────────────────────────────────────────────────────────────┤
│ Period: [Last 30 days ▾]                                                 │
├──────────────────────────────────────────────────────────────────────────┤
│ Teacher           Attend.  Reports  Retent.  Punct.  Overall   Trend     │
│ Sh. Hassan        ●  98    ●  95    ●  93    ●  90   ● 94      ───▲─     │
│ Sh. Aisha         ●  95    ●  88    ●  90    ●  85   ● 90      ──╱─      │
│ Sh. Omar          ●  88    ●  75    ●  82    ●  80   ● 82      ─▼─       │
│ Sh. Mohammed      ●  62    ●  55    ●  70    ●  65   ⚠ 64      ─▼▼─      │
└──────────────────────────────────────────────────────────────────────────┘
```

Click a teacher → `/quality/{teacherId}/page.tsx`:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Sh. Hassan — quality                                                     │
├──────────────────────────────────────────────────────────────────────────┤
│ Current period: July 2026                          Overall: ● 94 / 100   │
│   Attendance:   98     Reports:        95                                │
│   Retention:    93     Punctuality:    90                                │
│                                                                          │
│ 🎁 Recommended bonus: EGP 500.00                                         │
│    [ Apply bonus to this month's payroll ]                               │
│                                                                          │
│ Review history                                                           │
│   Jul'26 (auto)   94    [View inputs]                                    │
│   Jun'26 (manual) 92    Notes: "Outstanding student progress"            │
│   Jun'26 (auto)   91    [View inputs]                                    │
│   May'26 (auto)   90    [View inputs]                                    │
│                                                                          │
│ [ + Submit manual review ]                                               │
└──────────────────────────────────────────────────────────────────────────┘
```

#### Manual review sheet

```
Submit monthly review — Sh. Hassan
Period: [July 2026 ▾]
─────────────────────────────────────────
Attendance:    [──────●─────] 90
Reports:       [─────●──────] 85
Retention:     [───────●────] 95
Punctuality:   [──────●─────] 88
─────────────────────────────────────────
Overall (weighted): 89

Notes:
┌──────────────────────────────────────────────┐
│ Strong attendance, slightly behind on reports│
└──────────────────────────────────────────────┘
[Cancel]                            [Submit]
```

Sliders 0–100. The overall preview recomputes as sliders move. Submit creates a manual `sys_quality_reviews` row.

#### Bonus recommender

`BonusRecommender::forScore($overall)`:

- `>= 90` → `quality.recommended_bonus_minor` (default EGP 500)
- `>= 95` → 1.5× recommended
- `< 90` → 0

The "Apply bonus" button on `/quality/{teacherId}` creates a `sys_payroll_adjustments` row on the current month's pending payroll (or shows an error if payroll isn't pending). Audit log entry records "Bonus applied from quality recommendation."

---

### S6-09 — Underperforming alert  *(0.25 day)*

`OnTeacherUnderperforming` listener:

```php
public function handle(TeacherUnderperforming $e): void
{
    foreach (User::role(['admin','supervisor'])->cursor() as $u) {
        if (!$u->can('quality.view_any')) continue;
        NotificationService::push($u, 'quality.underperforming',
            "{$e->teacher->user->name} flagged as underperforming",
            "Overall score: {$e->overall}",
            "/quality/{$e->teacher->id}");
    }
}
```

Deduplicated per teacher per week so a teacher who stays below threshold doesn't spam the bell weekly.

---

### S6-10 — Teacher salary statement  *(1 day)*

`App\Services\System\SalaryStatementBuilder::forTeacher(Teacher $t, ?int $year, ?int $month)` returns a snapshot suitable for both the UI and the PDF salary slip.

```php
public function forTeacher(Teacher $t, ?int $year, ?int $month): SalaryStatement
{
    $current = Payroll::where('teacher_id', $t->id)
        ->when($year && $month, fn($q) => $q->where('period_year',$year)->where('period_month',$month))
        ->latest('period_year')->latest('period_month')
        ->with('adjustments')->first();

    $history = Payroll::where('teacher_id', $t->id)
        ->orderByDesc('period_year')->orderByDesc('period_month')
        ->limit(12)->get();

    return new SalaryStatement(
        teacher: $t,
        current: $current,
        history: $history,
    );
}
```

#### `/teacher/salary/page.tsx`

```
┌──────────────────────────────────────────────────────────────────┐
│ Salary                                                           │
│ Sh. Hassan · Vodafone Cash · 01088xxxxxx                         │
├──────────────────────────────────────────────────────────────────┤
│ July 2026                                          Status: Pending│
│                                                                  │
│ Sessions       42                                                │
│ Total minutes  2,295                                             │
│   30-min × 18 sessions = 540 min                                 │
│   45-min × 5 sessions  = 225 min                                 │
│   60-min × 19 sessions = 1,140 min                               │
│                                                                  │
│ Base salary           EGP 11,475.00                              │
│ Bonuses (1)           EGP +200.00                                │
│   ▸ Performance · Excellent retention this month                 │
│ Deductions (1)        EGP  –50.00                                │
│   ▸ Late report · Late report on Jul 14                          │
│ ─────────────────────────────────────                            │
│ Net salary            EGP 11,625.00                              │
│                                                                  │
│ Status: Pending — awaiting admin approval                        │
│                                                                  │
│ History (12 months)              [ Download PDF salary slip ]    │
│   Jun'26   EGP 10,500.00     Transferred   Ref: VC-202607-0017   │
│   May'26   EGP 11,250.00     Transferred   Ref: VC-202606-0021   │
│   Apr'26   EGP 10,800.00     Transferred                         │
│   …                                                              │
└──────────────────────────────────────────────────────────────────┘
```

`[Download PDF salary slip]` calls `GET /api/system/payrolls/{id}/pdf` → returns signed B2 URL (5-min expiry).

The Teacher policy restricts the response: even if a teacher constructs the URL for another teacher's payroll, the API returns 403.

---

### S6-11 — Payroll summary page  *(1 day)*

`/payroll/page.tsx` — admin-facing monthly overview:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Payroll                                            Month: [July 2026 ▾]  │
│ 4 teachers · 1 transferred · 2 approved · 1 pending  Total: EGP 47,250   │
├──────────────────────────────────────────────────────────────────────────┤
│ [ Recalculate ▾ ]  [ Approve all pending ]  [ Mark all approved as transferred ] │
├──────────────────────────────────────────────────────────────────────────┤
│ ☐ Teacher       Sessions   Minutes   Base       Net       Status         │
│ ☐ Sh. Hassan      42       2,295    EGP 11,475 EGP 11,625 Pending  [⋮]   │
│ ☐ Sh. Aisha       38       1,710    EGP  8,550 EGP  8,750 Approved [⋮]   │
│ ☐ Sh. Omar        25       1,500    EGP  7,500 EGP  7,500 Transf.  [⋮]   │
│ ☐ Sh. Mohammed     8         480    EGP  2,400 EGP  2,400 Pending  [⋮]   │
└──────────────────────────────────────────────────────────────────────────┘
```

Click a row → `/payroll/teacher/{id}` with the per-teacher panel.

The "Recalculate" dropdown offers:
- "Recalculate this teacher" (force re-run of `PayrollCalculator`; only if status=pending — confirms with a dialog).
- "Recalculate all pending" (academy-wide).

Recalculation re-runs the calculator with current rate snapshot; preserves manual adjustments.

---

### S6-12 — Exports  *(0.5 day)*

#### Excel

`App\Exports\System\PayrollMonthlyExport` — one sheet "Summary", one sheet "Adjustments" with all bonuses/deductions broken out per teacher.

Endpoint:

```
POST /api/system/payrolls/export       body: { period: 'YYYY-MM', format: 'xlsx'|'pdf' }
                                       perm: payroll.export
```

Same pattern as the SYS-05 invoice export — queued on `reports`, signed URL on completion.

#### PDF salary slip

`App\Services\System\SalarySlipPdfRenderer` produces a one-page A4 with:

- Academy branding (logo, name, contact)
- Teacher name, payment method + (masked) account
- Period
- Sessions / minutes by duration
- Base, bonuses (itemized), deductions (itemized), net
- Status + transfer reference
- Footer: "Generated on …"

Template at `resources/views/system/pdf/salary-slip.blade.php`. Same DOMPDF stack as the invoice PDF from SYS-05.

---

### S6-13 — Tests  *(1.5 days)*

#### Unit

- `PayrollCalculatorTest` — mixed-duration sessions, snapped 40-min duration, missing rate falls back to 0, empty month, time-zone edge (session at month boundary).
- `QualityScorerTest` — perfect month (all 100s), zero attended (component scores → 0 except retention safe-divide), retention with no prior students.
- `BonusRecommenderTest` — score buckets, custom thresholds via settings.
- `PayrollComputationTest` — DTO immutability.

#### Feature

- `MonthlyCronTest` — fast-forward to 1st, run cron, assert one payroll per active teacher; rerun creates none.
- `ApprovalFlowTest` — full pending → approved → transferred; reject path; invalid transitions return 422.
- `AdjustmentsTest` — add bonus, add deduction, edit, delete; recomputes totals; can't adjust an approved payroll.
- `BulkApproveTest` — partial failure rolls back all.
- `TeacherViewOwnTest` — teacher fetches own salary; gets 403 on another teacher's.
- `QualityReviewSubmitTest` — manual review creates row; overall computed correctly.
- `UnderperformingAlertTest` — score below threshold fires notifications; dedupe within 7 days.

#### PDF goldens

`SalarySlipPdfTest` — render a known payroll, assert key strings present in extracted text.

#### Playwright

`frontend/e2e/system/payroll-quality.spec.ts` — 7 acceptance flows.

---

### S6-14 — Deploy + smoke  *(0.5 day)*

- Run migrations on staging.
- Run `php artisan db:seed --class=System\\SystemDemoSeeder` — adds 3 months of demo payrolls.
- Owner walks through:
  1. Open `/payroll` — see July 2026 with 4 teachers.
  2. Click into Sh. Hassan → see details, add a 200 EGP bonus.
  3. Approve → status flips, button changes to "Mark transferred". Mark transferred with reference "VC-202608-0042". Confirm teacher notification appears.
  4. Switch to teacher impersonation → `/teacher/salary` → see July transferred with the reference and the bonus line.
  5. Download PDF salary slip → verify content.
  6. Open `/quality` → see leaderboard with the demo teacher's score auto-computed. Click into Sh. Mohammed (the low-score one) → see component breakdown.
  7. Submit a manual review for Sh. Hassan with 4 slider scores. Confirm overall computed and history updated.
  8. Confirm "underperforming" notification appeared for Sh. Mohammed.
  9. Export July payroll to Excel; verify file content.
  10. Lighthouse on `/payroll` and `/teacher/salary` ≥ 90 perf, ≥ 95 a11y.
  11. Public site at `alrayan-academy.com` unchanged.

---

## Endpoints {#endpoints}

| Method | Path | Permission |
|---|---|---|
| GET    | `/api/system/payrolls`                                       | `payroll.view_any` |
| GET    | `/api/system/payrolls/{id}`                                  | policy |
| GET    | `/api/system/payrolls/{id}/pdf`                              | policy |
| POST   | `/api/system/payrolls/preview`                               | `payroll.view_any` |
| POST   | `/api/system/payrolls/{id}/approve`                          | `payroll.approve` |
| POST   | `/api/system/payrolls/{id}/reject`                           | `payroll.reject` |
| POST   | `/api/system/payrolls/{id}/mark-transferred`                 | `payroll.mark_transferred` |
| POST   | `/api/system/payrolls/{id}/recalculate`                      | `payroll.adjust` |
| POST   | `/api/system/payrolls/bulk-approve`                          | `payroll.approve` |
| POST   | `/api/system/payrolls/bulk-transfer`                         | `payroll.mark_transferred` |
| POST   | `/api/system/payrolls/{id}/adjustments`                      | `payroll.adjust` |
| PATCH  | `/api/system/payroll-adjustments/{id}`                       | `payroll.adjust` |
| DELETE | `/api/system/payroll-adjustments/{id}`                       | `payroll.adjust` |
| POST   | `/api/system/payrolls/export`                                | `payroll.export` |
| GET    | `/api/system/teachers/{id}/payrolls`                         | policy |
| GET    | `/api/system/quality`                                        | `quality.view_any` |
| GET    | `/api/system/quality/{teacherId}`                            | policy |
| POST   | `/api/system/quality/{teacherId}/reviews`                    | `quality.review` |
| POST   | `/api/system/quality/{teacherId}/apply-bonus`                | `payroll.adjust` |

---

## File deliverables checklist

```
backend/
├── app/
│   ├── Console/Commands/System/
│   │   ├── CalculatePayroll.php
│   │   └── RecomputeQualityScores.php
│   ├── Http/
│   │   ├── Controllers/System/
│   │   │   ├── PayrollController.php
│   │   │   ├── PayrollAdjustmentController.php
│   │   │   ├── PayrollExportController.php
│   │   │   └── QualityController.php
│   │   ├── Requests/System/Payroll/{Approve,Reject,MarkTransferred,Recalc,Export}Request.php
│   │   ├── Requests/System/PayrollAdjustment/{Store,Update}Request.php
│   │   ├── Requests/System/Quality/SubmitReviewRequest.php
│   │   └── Resources/System/{Payroll,PayrollDetail,PayrollAdjustment,QualityReview,QualityLeaderboard}Resource.php
│   ├── Models/System/
│   │   ├── Payroll.php
│   │   ├── PayrollAdjustment.php
│   │   └── QualityReview.php
│   ├── Policies/System/
│   │   ├── PayrollPolicy.php
│   │   └── QualityReviewPolicy.php
│   ├── Events/System/
│   │   ├── PayrollGenerated.php
│   │   ├── PayrollApproved.php
│   │   ├── PayrollTransferred.php
│   │   └── TeacherUnderperforming.php
│   ├── Listeners/System/
│   │   └── NotifyAdminsOnTeacherUnderperforming.php
│   ├── Services/System/
│   │   ├── PayrollCalculator.php
│   │   ├── PayrollGenerator.php
│   │   ├── PayrollApprover.php
│   │   ├── QualityScorer.php
│   │   ├── BonusRecommender.php
│   │   ├── SalaryStatementBuilder.php
│   │   └── SalarySlipPdfRenderer.php
│   └── Exports/System/
│       └── PayrollMonthlyExport.php
├── database/migrations/
│   ├── 2026_08_10_000001_create_sys_payrolls_table.php
│   ├── 2026_08_10_000002_create_sys_payroll_adjustments_table.php
│   ├── 2026_08_10_000003_create_sys_quality_reviews_table.php
│   └── 2026_08_10_000004_seed_payroll_and_quality_settings.php
├── database/factories/System/
│   ├── PayrollFactory.php
│   ├── PayrollAdjustmentFactory.php
│   └── QualityReviewFactory.php
├── resources/views/system/pdf/
│   └── salary-slip.blade.php
└── routes/system.php                                     (UPDATED — 19 endpoints)

frontend/
├── src/app/(system)/
│   ├── payroll/
│   │   ├── page.tsx
│   │   ├── [month]/page.tsx
│   │   └── teacher/[id]/page.tsx
│   ├── quality/
│   │   ├── page.tsx
│   │   └── [teacherId]/page.tsx
│   ├── teachers/[id]/page.tsx                            (UPDATED — Salary, Quality tabs filled in)
│   └── teacher/salary/page.tsx                           (FILLED IN)
├── src/components/system/
│   ├── payroll/
│   │   ├── PayrollSummaryTable.tsx
│   │   ├── PayrollDetailPanel.tsx
│   │   ├── PayrollAdjustmentsList.tsx
│   │   ├── AddAdjustmentSheet.tsx
│   │   ├── ApprovePayrollDialog.tsx
│   │   ├── MarkTransferredDialog.tsx
│   │   ├── BulkApproveBar.tsx
│   │   └── MonthPicker.tsx
│   ├── quality/
│   │   ├── QualityLeaderboard.tsx
│   │   ├── QualityComponentChart.tsx
│   │   ├── QualityTrendSparkline.tsx
│   │   ├── ManualReviewSheet.tsx
│   │   └── BonusRecommendationBanner.tsx
│   └── teacher/
│       ├── SalaryStatement.tsx
│       └── SalaryHistoryTable.tsx
├── src/hooks/system/
│   ├── usePayrolls.ts
│   ├── usePayroll.ts
│   ├── usePayrollAdjustments.ts
│   ├── useQualityLeaderboard.ts
│   ├── useQualityTeacher.ts
│   └── useTeacherSalary.ts
└── src/types/system/
    ├── payroll.ts
    └── quality.ts

docs/system/sprints/sys-06-payroll-bonuses-quality.md   (THIS FILE)
```

---

## Risks & open questions

- **Zoom "actual start" data.** Punctuality scoring depends on knowing when each session *actually* started, not just when it was scheduled. Zoom publishes `meeting.started` and `meeting.ended` webhooks. We're not consuming those in SYS-04. v1 of SYS-06 ships with `countLateStarts` returning 0 — punctuality scores will be 100 for everyone unless an admin manually adjusts. Add a follow-up sprint task to consume the Zoom webhooks if owner wants real punctuality data.
- **Students-assigned-at-time queries.** Walking the audit log for retention calc is O(N) per teacher and could get slow at scale (a teacher who's been around for 5 years has thousands of audit rows). Acceptable for v1 (small academy); cache the snapshot at month-end into a denormalized `sys_teacher_student_counts` table if it becomes a problem.
- **Late-report deduction auto-creation.** The cron auto-adds a single deduction for "late reports this month." This could feel punitive — admin may want to disable or adjust. Setting `payroll.late_report_deduction_minor=0` disables. Admin can delete the auto-added adjustment if they disagree with a specific case. We don't auto-restore deleted ones on recalculation.
- **Currency mismatch in bonuses.** Teachers are paid EGP only. We enforce currency=EGP on all adjustments at the FormRequest level. Multi-currency teacher pay is a future sprint if the owner expands the team globally.
- **Recalc preserves manual adjustments.** Confirmed in `PayrollGenerator::regenerate()`: only the base+breakdown are recomputed; existing adjustments stay. Documented in code comments.
- **Quality weights drift.** Weights are configurable but must sum to 100. `SettingsValidator` (a small helper) enforces this at save time. Save returns 422 with a clear error if weights don't add up.
- **Bulk-transfer payment references.** Each row in `bulk-transfer` needs its own reference (different bank txn IDs per teacher). UI exposes a small CSV-paste box: "paste teacher name + reference, one per line." Future improvement: import from a bank-statement CSV. Not in v1.
- **What about teacher self-service salary disputes?** A teacher who disagrees with their payroll currently can only contact admin out-of-band (WhatsApp). No in-system dispute flow. Backlog item.

---

## Sprint review demo script

(~12 minutes)

1. Open `/payroll` for the previous month — see seeded payrolls per teacher. Show per-currency totals (EGP only here).
2. Click Sh. Hassan → details panel → show base salary breakdown by duration.
3. Add a 200 EGP bonus with reason → net updates inline → audit log entry visible in Tinker.
4. Approve → status flips. Mark transferred with reference "VC-202607-0042" → status flips again.
5. Switch to Sh. Hassan impersonation → `/teacher/salary` → show statement with bonus + transfer reference visible. Download PDF salary slip.
6. Switch back to admin → `/quality` → show leaderboard. Click Sh. Mohammed (low scorer) → component breakdown + auto-inputs.
7. Submit a manual review for Sh. Hassan with slider scores → confirm overall computed and history updated.
8. Show admin notification for the underperforming teacher.
9. Export July payroll to Excel → open file → verify two sheets (Summary, Adjustments).
10. Fast-forward to 1st of next month via Tinker → run cron → next month's payrolls all appear as Pending.
11. Lighthouse + audit log spot checks.

---

*Last updated: May 10, 2026*
