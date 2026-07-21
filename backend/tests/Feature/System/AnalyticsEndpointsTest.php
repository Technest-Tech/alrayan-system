<?php

namespace Tests\Feature\System;

use App\Models\System\Session;
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

    private function attendedSession(Teacher $teacher, string $start, int $duration): void
    {
        Session::factory()->create([
            'teacher_id'      => $teacher->id,
            'status'          => 'attended',
            'scheduled_start' => $start,
            'duration_min'    => $duration,
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
        // 2 × 60-minute attended sessions in May 2026 → 2h, income = 2 × (60 × 5) = 600.
        $this->attendedSession($teacher, '2026-05-15 10:00:00', 60);
        $this->attendedSession($teacher, '2026-05-16 10:00:00', 60);

        $res = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/analytics?month=2026-05')
            ->assertOk()
            ->assertJsonPath('kpis.total_hours', 2)
            ->assertJsonPath('kpis.total_lessons', 2)
            // income + weighted rate roll up under the teacher's own currency (no EGP conversion)
            ->assertJsonPath('kpis.totals_by_currency.0.currency', 'EUR')
            ->assertJsonPath('kpis.totals_by_currency.0.income_minor', 600)
            ->assertJsonPath('kpis.totals_by_currency.0.avg_rate_minor', 300);

        // teacher appears in the balance table with the nominal hourly rate + own currency
        $balances = collect($res->json('teacher_balances'));
        $row = $balances->firstWhere('teacher_id', $teacher->id);
        $this->assertNotNull($row);
        $this->assertSame(300, $row['rate_minor']);
        $this->assertSame('EUR', $row['currency']);
        $this->assertSame(600, $row['income_minor']);
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

        $this->attendedSession($counted, '2026-05-15 10:00:00', 60);   // 1h counted
        $this->attendedSession($excluded, '2026-05-15 10:00:00', 60);  // 1h ignored in totals

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
        $this->attendedSession($teacher, '2026-05-15 10:00:00', 60);
        $this->attendedSession($teacher, '2026-05-15 12:00:00', 60);

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
        $this->attendedSession($teacher, '2026-05-15 10:00:00', 60); // revenue = 60 × 5 = 300

        $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson("/api/system/analytics/teachers/{$teacher->id}?month=2026-05")
            ->assertOk()
            ->assertJsonPath('revenue_minor', 300)
            ->assertJsonPath('deductions', [])
            ->assertJsonPath('recompenses', []);
    }

    public function test_different_currencies_are_never_summed_together(): void
    {
        $eur = $this->teacherWithRates(5, 300, 'EUR');
        $usd = $this->teacherWithRates(10, 400, 'USD');
        $this->attendedSession($eur, '2026-05-15 10:00:00', 60); // EUR income 300
        $this->attendedSession($usd, '2026-05-15 10:00:00', 60); // USD income 600

        $res = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/analytics?month=2026-05')
            ->assertOk()
            ->assertJsonPath('kpis.total_hours', 2); // hours are currency-agnostic

        $totals = collect($res->json('kpis.totals_by_currency'))->keyBy('currency');
        $this->assertSame(300, $totals['EUR']['income_minor']);
        $this->assertSame(600, $totals['USD']['income_minor']);
        $this->assertCount(2, $totals); // two separate currency buckets, not one EGP total
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
