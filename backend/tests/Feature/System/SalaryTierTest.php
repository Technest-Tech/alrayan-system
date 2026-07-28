<?php

namespace Tests\Feature\System;

use App\Models\System\Lesson;
use App\Models\System\Student;
use App\Models\System\StudentPackage;
use App\Models\System\Teacher;
use App\Services\System\SalaryTiers;
use Carbon\Carbon;
use Tests\SystemTestCase;

class SalaryTierTest extends SystemTestCase
{
    private function tiers(): SalaryTiers
    {
        return app(SalaryTiers::class);
    }

    /** Give the teacher `$hours` of credited lessons inside the current month. */
    private function taughtHours(Teacher $teacher, float $hours, ?Carbon $when = null): void
    {
        $student = Student::factory()->create(['assigned_teacher_id' => $teacher->id, 'currency' => 'USD']);

        $package = StudentPackage::create([
            'student_id'     => $student->id,
            'package_number' => 1,
            'package_hours'  => 8,
            'tariff_at_time' => 5000,
            'currency'       => 'USD',
            'status'         => 'paid',
        ]);

        Lesson::create([
            'package_id'       => $package->id,
            'teacher_id'       => $teacher->id,
            'student_id'       => $student->id,
            'status'           => 'attended',
            'scheduled_at'     => ($when ?? Carbon::now()->startOfMonth()->addDay())->copy()->setTime(10, 0),
            'duration_minutes' => (int) round($hours * 60),
        ]);
    }

    // ── The ladder itself ────────────────────────────────────────────────────

    public function test_each_tier_prices_the_whole_month_at_its_own_rate(): void
    {
        $tiers = $this->tiers();

        $cases = [
            [10,  250],   // 0–35
            [35,  250],
            [36,  275],   // 36–60
            [60,  275],
            [61,  300],   // 61–85
            [85,  300],
            [86,  325],   // 86–115
            [115, 325],
            [116, 350],   // 116–150
            [150, 350],
            [151, 375],   // 151–175
            [175, 375],
            [176, 400],   // 176–210
            [210, 400],
        ];

        foreach ($cases as [$hours, $rate]) {
            $this->assertSame($rate, $tiers->rateMinor($hours), "{$hours}h should pay {$rate} per hour");
            // Flat rate of the tier reached — not progressive brackets.
            $this->assertSame((int) round($hours * $rate), $tiers->salaryMinor($hours));
        }
    }

    public function test_the_next_tier_starts_at_its_stated_minimum_hour(): void
    {
        $this->assertSame(250, $this->tiers()->rateMinor(35.0));
        $this->assertSame(250, $this->tiers()->rateMinor(35.5));
        $this->assertSame(275, $this->tiers()->rateMinor(36.0));
        $this->assertSame(275, $this->tiers()->rateMinor(60.5));
        $this->assertSame(300, $this->tiers()->rateMinor(61.0));
    }

    public function test_hours_above_the_top_tier_stay_at_the_cap(): void
    {
        $tiers = $this->tiers();

        $this->assertSame(400, $tiers->rateMinor(210));
        $this->assertSame(400, $tiers->rateMinor(260));
        $this->assertSame(260 * 400, $tiers->salaryMinor(260));
    }

    public function test_progress_reports_the_gap_to_the_next_tier(): void
    {
        $p = $this->tiers()->progress(30);

        $this->assertSame(0, $p['tier']['index']);
        $this->assertSame(1, $p['next_tier']['index']);
        $this->assertEqualsWithDelta(6.0, $p['hours_to_next'], 0.001); // 36 − 30
        $this->assertSame(7500, $p['salary_minor']);                   // 30 × 2.50
        $this->assertEqualsWithDelta(83.3, $p['progress_pct'], 0.1);   // 30 / 36

        $top = $this->tiers()->progress(220);
        $this->assertNull($top['next_tier']);
        $this->assertSame(0.0, $top['hours_to_next']);
        $this->assertSame(100.0, $top['progress_pct']);
    }

    // ── Payroll pays on the ladder ───────────────────────────────────────────

    public function test_generated_payroll_uses_the_hour_tier_rate(): void
    {
        $teacher = Teacher::factory()->create();
        $month   = Carbon::now()->startOfMonth();

        // 40 taught hours → tier 36–60 → $2.75/h → $110.00
        for ($i = 0; $i < 40; $i++) {
            $this->taughtHours($teacher, 1, $month->copy()->addDays($i % 27));
        }

        $start = $month->copy();
        $end   = $month->copy()->endOfMonth()->addDay()->startOfDay();

        $payroll = app(\App\Services\System\PayrollGenerator::class)
            ->generate($teacher, (int) $month->year, (int) $month->month, $start, $end);

        $this->assertEqualsWithDelta(40.0, (float) $payroll->total_hours, 0.001);
        $this->assertSame(275, (int) $payroll->hourly_rate_minor);
        $this->assertSame(1, (int) $payroll->tier_index);
        $this->assertSame(11000, $payroll->base_salary_minor);
        $this->assertSame('USD', $payroll->currency);
        $this->assertSame('hour_tier', $payroll->snapshot['mode']);
        $this->assertCount(7, $payroll->snapshot['ladder']);
    }

    public function test_legacy_per_minute_payrolls_keep_their_old_formula_on_recalculate(): void
    {
        $teacher = Teacher::factory()->create([
            'per_minute_rate_30' => 5,
            'per_minute_rate_45' => 5,
            'per_minute_rate_60' => 5,
        ]);
        $month = Carbon::now()->startOfMonth();
        $this->taughtHours($teacher, 1, $month->copy()->addDay());

        $start = $month->copy();
        $end   = $month->copy()->endOfMonth()->addDay()->startOfDay();

        $comp = app(\App\Services\System\PayrollCalculator::class)
            ->calculate($teacher, $start, $end, [30 => 5, 45 => 5, 60 => 5]);

        // 60 minutes × 5 = 300, the pre-ladder result — untouched by the tiers.
        $this->assertSame(300, $comp->baseSalaryMinor);
    }

    // ── Admin endpoint ───────────────────────────────────────────────────────

    public function test_admin_sees_the_ladder_with_per_tier_statistics(): void
    {
        $onTierZero = Teacher::factory()->create();
        $onTierTwo  = Teacher::factory()->create();

        $this->taughtHours($onTierZero, 10);
        $this->taughtHours($onTierTwo, 70);

        $month = Carbon::now()->format('Y-m');

        $res = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson("/api/system/salary-tiers?month={$month}")
            ->assertOk()
            ->assertJsonPath('currency', 'USD')
            ->assertJsonCount(7, 'tiers');

        $tiers = collect($res->json('tiers'))->keyBy('index');
        $this->assertSame(250, $tiers[0]['rate_minor']);
        $this->assertSame(2500, $tiers[0]['total_salary_minor']);   // 10h × $2.50
        $this->assertSame(21000, $tiers[2]['total_salary_minor']);  // 70h × $3.00
        $this->assertSame(1, $tiers[2]['teacher_count']);
        $this->assertSame('61–85h', $tiers[2]['label']);

        // 80 hours total, $235.00 total bill.
        $this->assertEqualsWithDelta(80.0, $res->json('kpis.total_hours'), 0.001);
        $this->assertSame(23500, $res->json('kpis.total_salary_minor'));
        $this->assertSame(2, $res->json('kpis.active_teachers'));
    }

    public function test_excluded_teachers_do_not_move_the_tier_totals(): void
    {
        $excluded = Teacher::factory()->create(['exclude_from_analytics' => true]);
        $this->taughtHours($excluded, 10);

        $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/salary-tiers')
            ->assertOk()
            ->assertJsonPath('kpis.total_salary_minor', 0)
            ->assertJsonPath('kpis.active_teachers', 0);
    }

    public function test_supervisor_without_payroll_permission_cannot_see_the_ladder(): void
    {
        $this->actingAs($this->staffUser('supervisor'), 'sanctum')
            ->getJson('/api/system/salary-tiers')
            ->assertForbidden();
    }

    // ── Teacher portal endpoint ──────────────────────────────────────────────

    public function test_teacher_sees_their_own_level_and_the_gap_to_the_next_one(): void
    {
        ['user' => $user, 'teacher' => $teacher] = $this->teacherUser();

        $this->taughtHours($teacher, 30);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/system/teachers/me/salary-tier')
            ->assertOk()
            ->assertJsonPath('currency', 'USD')
            ->assertJsonPath('hours', 30)
            ->assertJsonPath('tier.index', 0)
            ->assertJsonPath('rate_minor', 250)
            ->assertJsonPath('salary_minor', 7500)
            ->assertJsonPath('next_tier.index', 1)
            ->assertJsonPath('hours_to_next', 6)
            ->assertJsonCount(7, 'ladder')
            ->assertJsonCount(6, 'history');
    }

    public function test_salary_tier_endpoint_needs_a_teacher_profile(): void
    {
        $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/teachers/me/salary-tier')
            ->assertForbidden();
    }

    public function test_payroll_preview_exposes_the_tier_calculation(): void
    {
        $teacher = Teacher::factory()->create();
        $this->taughtHours($teacher, 40);
        $now = Carbon::now();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson('/api/system/payrolls/preview', [
                'teacher_id' => $teacher->id,
                'year'       => $now->year,
                'month'      => $now->month,
            ])
            ->assertOk()
            ->assertJsonPath('total_hours', 40)
            ->assertJsonPath('hourly_rate_minor', 275)
            ->assertJsonPath('tier_index', 1)
            ->assertJsonPath('currency', 'USD')
            ->assertJsonPath('base_salary_minor', 11000);
    }

    public function test_invalid_month_is_rejected_instead_of_overflowing(): void
    {
        $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/salary-tiers?month=2026-99')
            ->assertUnprocessable();
    }
}
