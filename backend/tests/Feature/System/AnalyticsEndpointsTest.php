<?php

namespace Tests\Feature\System;

use App\Models\System\Lesson;
use App\Models\System\Student;
use App\Models\System\StudentPackage;
use App\Models\System\Teacher;
use App\Support\System\Setting;
use Illuminate\Support\Facades\Http;
use Tests\SystemTestCase;

class AnalyticsEndpointsTest extends SystemTestCase
{
    /** A teacher with fixed, deterministic per-minute + hourly rates. */
    private function teacherWithRates(int $perMinute, int $hourly, ?string $currency = null): Teacher
    {
        return Teacher::factory()->create([
            'per_minute_rate_30' => $perMinute,
            'per_minute_rate_45' => $perMinute,
            'per_minute_rate_60' => $perMinute,
            'hourly_rate'        => $hourly,
            'currency'           => $currency,
        ]);
    }

    /** A lesson the teacher is credited for — Analytics counts these, nothing else. */
    private function attendedLesson(Teacher $teacher, string $start, int $duration): void
    {
        $student = Student::factory()->create([
            'assigned_teacher_id' => $teacher->id,
            'currency'            => 'USD',
        ]);

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
            'scheduled_at'     => $start,
            'duration_minutes' => $duration,
        ]);
    }

    public function test_supervisor_without_payroll_permission_is_forbidden(): void
    {
        $this->actingAs($this->staffUser('supervisor'), 'sanctum')
            ->getJson('/api/system/analytics?month=2026-05')
            ->assertForbidden();
    }

    public function test_overview_computes_hours_income_and_rate(): void
    {
        $teacher = $this->teacherWithRates(perMinute: 5, hourly: 300, currency: 'EUR');
        // 2 × 60-minute attended lessons in May 2026 → 2h on the 0–35h tier,
        // so income = 2 × $2.50 = $5.00 (the ladder, not the teacher's rate card).
        $this->attendedLesson($teacher, '2026-05-15 10:00:00', 60);
        $this->attendedLesson($teacher, '2026-05-16 10:00:00', 60);

        $res = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/analytics?month=2026-05')
            ->assertOk()
            ->assertJsonPath('kpis.total_hours', 2)
            ->assertJsonPath('kpis.total_lessons', 2)
            // earnings are the USD hour ladder — never converted, never per-teacher
            ->assertJsonPath('kpis.totals_by_currency.0.currency', 'USD')
            ->assertJsonPath('kpis.totals_by_currency.0.income_minor', 500)
            ->assertJsonPath('kpis.totals_by_currency.0.avg_rate_minor', 250);

        // teacher appears in the balance table with the tier rate they reached
        $balances = collect($res->json('teacher_balances'));
        $row = $balances->firstWhere('teacher_id', $teacher->id);
        $this->assertNotNull($row);
        $this->assertSame(250, $row['rate_minor']);
        $this->assertSame(0, $row['tier_index']);
        $this->assertSame('USD', $row['currency']);
        $this->assertSame(500, $row['income_minor']);
        $this->assertEqualsWithDelta(2.0, $row['hours'], 0.001);

        // hours-by-month series contains the May bucket
        $may = collect($res->json('hours_by_month.series'))->firstWhere('month', '2026-05');
        $this->assertNotNull($may);
        $this->assertEqualsWithDelta(2.0, $may['hours'], 0.001);
        $this->assertEqualsWithDelta(2.0, $res->json('hours_by_month.all_time_total'), 0.001);
    }

    public function test_excluded_teacher_is_dropped_from_totals_but_still_listed(): void
    {
        $counted  = $this->teacherWithRates(5, 300);
        $excluded = $this->teacherWithRates(5, 300);
        $excluded->update(['exclude_from_analytics' => true]);

        $this->attendedLesson($counted, '2026-05-15 10:00:00', 60);   // 1h counted
        $this->attendedLesson($excluded, '2026-05-15 10:00:00', 60);  // 1h ignored in totals

        $res = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/analytics?month=2026-05')
            ->assertOk()
            ->assertJsonPath('kpis.total_hours', 1)   // only the counted teacher
            ->assertJsonPath('excluded_count', 1);

        $balances = collect($res->json('teacher_balances'));
        $this->assertTrue($balances->firstWhere('teacher_id', $excluded->id)['excluded']);
        $this->assertContains($counted->id, $balances->pluck('teacher_id')->all());
    }

    public function test_best_days_groups_attended_lessons_by_weekday(): void
    {
        $teacher = $this->teacherWithRates(5, 300);
        // 2026-05-15 is a Friday (Carbon dayOfWeek = 5).
        $this->attendedLesson($teacher, '2026-05-15 10:00:00', 60);
        $this->attendedLesson($teacher, '2026-05-15 12:00:00', 60);

        $res = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/analytics?month=2026-05')
            ->assertOk();

        $friday = collect($res->json('best_days'))->firstWhere('weekday', 5);
        $this->assertSame(2, $friday['lessons']);
    }

    public function test_can_toggle_teacher_exclusion(): void
    {
        $teacher = $this->teacherWithRates(5, 300);

        $this->actingAs($this->adminUser(), 'sanctum')
            ->patchJson("/api/system/analytics/teachers/{$teacher->id}/exclusion", ['excluded' => true])
            ->assertOk()
            ->assertJsonPath('exclude_from_analytics', true);

        $this->assertDatabaseHas('sys_teachers', [
            'id'                     => $teacher->id,
            'exclude_from_analytics' => true,
        ]);
    }

    public function test_teacher_month_breakdown_returns_revenue_and_empty_adjustments(): void
    {
        $teacher = $this->teacherWithRates(5, 300);
        $this->attendedLesson($teacher, '2026-05-15 10:00:00', 60); // 1h × $2.50 tier rate

        $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson("/api/system/analytics/teachers/{$teacher->id}?month=2026-05")
            ->assertOk()
            ->assertJsonPath('revenue_minor', 250)
            ->assertJsonPath('deductions', [])
            ->assertJsonPath('recompenses', []);
    }

    public function test_every_teacher_earns_on_the_same_usd_ladder(): void
    {
        // The teacher's own display currency and rate card no longer price the
        // month — the hour ladder does, in USD, for everyone.
        $eur = $this->teacherWithRates(5, 300, 'EUR');
        $usd = $this->teacherWithRates(10, 400, 'USD');
        $this->attendedLesson($eur, '2026-05-15 10:00:00', 60); // 1h → $2.50
        $this->attendedLesson($usd, '2026-05-15 10:00:00', 60); // 1h → $2.50

        $res = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/analytics?month=2026-05')
            ->assertOk()
            ->assertJsonPath('kpis.total_hours', 2);

        $totals = collect($res->json('kpis.totals_by_currency'))->keyBy('currency');
        $this->assertCount(1, $totals);
        $this->assertSame(500, $totals['USD']['income_minor']);
    }

    public function test_fx_rates_endpoint_returns_live_rates_to_egp(): void
    {
        Http::fake([
            'cdn.jsdelivr.net/*' => Http::response(['date' => '2026-05-01', 'egp' => ['usd' => 0.02, 'eur' => 0.019]], 200),
        ]);

        $res = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/analytics/fx-rates?refresh=1')
            ->assertOk()
            ->assertJsonPath('base', 'EGP')
            ->assertJsonPath('source', 'live');

        $rates = collect($res->json('rates'))->keyBy('currency');
        // ccy → EGP is the inverse of the base-EGP quote: 1 / 0.02 = 50
        $this->assertEqualsWithDelta(50.0, $rates['USD']['to_egp'], 0.01);
        $this->assertSame('live', $rates['USD']['source']);
    }

    public function test_fx_rates_falls_back_to_manual_settings_when_offline(): void
    {
        Http::fake(['*' => Http::response('', 500)]);
        Setting::set('pricing.fx.USD_to_EGP', '48.5');

        $res = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/analytics/fx-rates?refresh=1')
            ->assertOk();

        $rates = collect($res->json('rates'))->keyBy('currency');
        $this->assertEqualsWithDelta(48.5, $rates['USD']['to_egp'], 0.01);
        $this->assertSame('manual', $rates['USD']['source']);
    }
}
