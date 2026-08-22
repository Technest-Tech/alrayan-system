<?php

namespace Tests\Feature\System;

use App\Models\System\Lesson;
use App\Models\System\LessonPackageAllocation;
use App\Models\System\Student;
use App\Models\System\StudentPackage;
use App\Models\System\Teacher;
use App\Support\System\ProfitabilityConfig;
use App\Support\System\Setting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\SystemTestCase;

class ProfitabilityEndpointsTest extends SystemTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Deterministic FX: 1 USD = 50 EGP, 1 EUR = 55 EGP.
        Cache::flush();
        Http::fake([
            '*' => Http::response(['date' => '2026-05-01', 'egp' => ['usd' => 0.02, 'eur' => 1 / 55]], 200),
        ]);

        // Report in USD so the salary ladder (USD) needs no conversion — the
        // percentage maths stays readable in the assertions below.
        Setting::set(ProfitabilityConfig::CURRENCY_KEY, 'USD');
    }

    /**
     * A taught lesson that consumed `$hours` from a package priced at
     * `$tariffMinor` for `$packageHours` — i.e. the revenue the lesson earned.
     */
    private function billedLesson(
        Teacher $teacher,
        string $start,
        int $durationMinutes,
        float $hours,
        int $tariffMinor,
        int $packageHours,
        string $currency = 'USD',
    ): void {
        $student = Student::factory()->create(['assigned_teacher_id' => $teacher->id, 'currency' => $currency]);

        $package = StudentPackage::create([
            'student_id'     => $student->id,
            'package_number' => 1,
            'package_hours'  => $packageHours,
            'tariff_at_time' => $tariffMinor,
            'currency'       => $currency,
            'status'         => 'paid',
        ]);

        $lesson = Lesson::create([
            'package_id'       => $package->id,
            'teacher_id'       => $teacher->id,
            'student_id'       => $student->id,
            'status'           => 'attended',
            'scheduled_at'     => $start,
            'duration_minutes' => $durationMinutes,
        ]);

        LessonPackageAllocation::create([
            'lesson_id'        => $lesson->id,
            'package_id'       => $package->id,
            'hours'            => $hours,
            'cumulative_hours' => $hours,
            'ordinal'          => 1,
        ]);
    }

    public function test_supervisor_without_pnl_permission_is_forbidden(): void
    {
        $this->actingAs($this->staffUser('supervisor'), 'sanctum')
            ->getJson('/api/system/accounting/profitability?month=2026-05')
            ->assertForbidden();
    }

    public function test_report_walks_income_to_net_profit(): void
    {
        $teacher = Teacher::factory()->create();

        // 2 × 60-min lessons, each consuming 1h of a $100.00 / 10h package
        // → hourly price $10.00, so income = 2 × $10.00 = $20.00.
        $this->billedLesson($teacher, '2026-05-15 10:00:00', 60, 1.0, 10000, 10);
        $this->billedLesson($teacher, '2026-05-16 10:00:00', 60, 1.0, 10000, 10);

        $res = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/accounting/profitability?month=2026-05')
            ->assertOk()
            ->assertJsonPath('currency', 'USD');

        $row = collect($res->json('rows'))->firstWhere('teacher_id', $teacher->id);
        $this->assertNotNull($row);

        $this->assertSame(2000, $row['income_minor']);              // $20.00 billed
        $this->assertEqualsWithDelta(2.0, $row['hours'], 0.001);
        $this->assertSame(250, $row['rate_minor']);                 // 2h → bottom tier, $2.50/h
        $this->assertSame(500, $row['cost_minor']);                 // 2h × $2.50
        $this->assertSame(500, $row['cost_report_minor']);          // already USD
        $this->assertSame(1500, $row['gross_margin_minor']);        // $20.00 − $5.00

        // Defaults: 33% ads + 6.7% charity + 0% other, all off the $15.00 margin.
        $byKey = collect($row['deductions'])->keyBy('key');
        $this->assertSame(495, $byKey['ads']['amount_minor']);      // 33%   of 1500
        $this->assertSame(101, $byKey['charity']['amount_minor']);  // 6.7%  of 1500 → 100.5, rounds to 101
        $this->assertSame(0,   $byKey['other']['amount_minor']);
        $this->assertSame(1500 - 495 - 101, $row['net_profit_minor']);

        // Totals mirror the single row and split three ways by default.
        $this->assertSame(2000, $res->json('totals.income_minor'));
        $this->assertSame(904,  $res->json('totals.net_profit_minor'));
        $this->assertSame(3,    $res->json('totals.partner_count'));
        $this->assertSame(301,  $res->json('totals.partner_share_minor'));
    }

    public function test_income_converts_from_the_package_currency(): void
    {
        $teacher = Teacher::factory()->create();

        // 1h of a €55.00 / 1h package → €55.00 = 3025 EGP = $60.50 at the faked rates.
        $this->billedLesson($teacher, '2026-05-15 10:00:00', 60, 1.0, 5500, 1, 'EUR');

        $res = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/accounting/profitability?month=2026-05')
            ->assertOk();

        $row = collect($res->json('rows'))->firstWhere('teacher_id', $teacher->id);
        $this->assertSame(6050, $row['income_minor']);
        $this->assertSame([['currency' => 'EUR', 'amount_minor' => 5500]], $row['income_by_currency']);
        $this->assertFalse($row['partial']);
    }

    public function test_negative_margin_is_never_charged_a_percentage(): void
    {
        $teacher = Teacher::factory()->create();

        // 1h taught, but the package earns almost nothing → margin is negative.
        $this->billedLesson($teacher, '2026-05-15 10:00:00', 60, 1.0, 100, 10);

        $res = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/accounting/profitability?month=2026-05')
            ->assertOk();

        $row = collect($res->json('rows'))->firstWhere('teacher_id', $teacher->id);
        $this->assertLessThan(0, $row['gross_margin_minor']);
        foreach ($row['deductions'] as $line) {
            $this->assertSame(0, $line['amount_minor']);
        }
        $this->assertSame($row['gross_margin_minor'], $row['net_profit_minor']);
    }

    public function test_excluded_teacher_stays_listed_but_leaves_the_totals(): void
    {
        $counted  = Teacher::factory()->create();
        $excluded = Teacher::factory()->create(['exclude_from_analytics' => true]);

        $this->billedLesson($counted,  '2026-05-15 10:00:00', 60, 1.0, 10000, 10);
        $this->billedLesson($excluded, '2026-05-15 12:00:00', 60, 1.0, 10000, 10);

        $res = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/accounting/profitability?month=2026-05')
            ->assertOk();

        $ids = collect($res->json('rows'))->pluck('teacher_id')->all();
        $this->assertContains($excluded->id, $ids);
        $this->assertSame(1, $res->json('totals.teacher_count'));
        $this->assertSame(1000, $res->json('totals.income_minor')); // only the counted teacher
    }

    public function test_settings_update_persists_and_reshapes_the_report(): void
    {
        $teacher = Teacher::factory()->create();
        $this->billedLesson($teacher, '2026-05-15 10:00:00', 60, 1.0, 10000, 10);

        $this->actingAs($this->adminUser(), 'sanctum')
            ->putJson('/api/system/accounting/profitability/settings', [
                'deductions'    => [['key' => 'ads', 'label' => 'Marketing', 'percent' => 50]],
                'partner_count' => 2,
            ])
            ->assertOk()
            ->assertJsonPath('deductions.0.label', 'Marketing')
            ->assertJsonPath('deductions.0.percent', 50)
            ->assertJsonPath('partner_count', 2);

        $res = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/accounting/profitability?month=2026-05')
            ->assertOk();

        // 1h → income $10.00, cost $2.50, margin $7.50, 50% off → net $3.75.
        $row = collect($res->json('rows'))->firstWhere('teacher_id', $teacher->id);
        $this->assertCount(1, $row['deductions']);
        $this->assertSame('Marketing', $row['deductions'][0]['label']);
        $this->assertSame(375, $row['deductions'][0]['amount_minor']);
        $this->assertSame(375, $row['net_profit_minor']);
        $this->assertSame(188, $res->json('totals.partner_share_minor')); // 375 / 2, rounded
    }

    public function test_settings_update_requires_the_settings_permission(): void
    {
        $this->actingAs($this->staffUser('supervisor'), 'sanctum')
            ->putJson('/api/system/accounting/profitability/settings', ['partner_count' => 5])
            ->assertForbidden();
    }
}
