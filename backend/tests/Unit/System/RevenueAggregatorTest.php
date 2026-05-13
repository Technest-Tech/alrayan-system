<?php

namespace Tests\Unit\System;

use App\Models\System\Payment;
use App\Services\System\RevenueAggregator;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class RevenueAggregatorTest extends TestCase
{
    use RefreshDatabase;

    private RevenueAggregator $aggregator;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        $this->aggregator = new RevenueAggregator();
    }

    public function test_empty_range_returns_empty_collection(): void
    {
        $from = Carbon::parse('2026-01-01');
        $to   = Carbon::parse('2026-01-31');

        $result = $this->aggregator->totalReceived($from, $to);

        $this->assertEmpty($result);
    }

    public function test_payments_outside_range_are_excluded(): void
    {
        Payment::factory()->create([
            'amount_minor' => 10000,
            'currency'     => 'EGP',
            'paid_at'      => '2025-12-15',
        ]);

        $from = Carbon::parse('2026-01-01');
        $to   = Carbon::parse('2026-01-31');

        $result = $this->aggregator->totalReceived($from, $to);

        $this->assertEmpty($result);
    }

    public function test_payments_summed_by_currency(): void
    {
        Payment::factory()->create(['amount_minor' => 5000,  'currency' => 'EGP', 'paid_at' => '2026-02-10']);
        Payment::factory()->create(['amount_minor' => 3000,  'currency' => 'EGP', 'paid_at' => '2026-02-15']);
        Payment::factory()->create(['amount_minor' => 10000, 'currency' => 'USD', 'paid_at' => '2026-02-20']);

        $from = Carbon::parse('2026-02-01');
        $to   = Carbon::parse('2026-02-28');

        Cache::flush();
        $result = $this->aggregator->totalReceived($from, $to);

        $egp = $result->firstWhere('currency', 'EGP');
        $usd = $result->firstWhere('currency', 'USD');

        $this->assertNotNull($egp);
        $this->assertNotNull($usd);
        $this->assertEquals(8000,  (int) $egp->total_minor);
        $this->assertEquals(10000, (int) $usd->total_minor);
    }

    public function test_payment_count_is_correct_per_currency(): void
    {
        Payment::factory()->count(3)->create(['currency' => 'EGP', 'paid_at' => '2026-03-10']);
        Payment::factory()->count(2)->create(['currency' => 'USD', 'paid_at' => '2026-03-10']);

        $from = Carbon::parse('2026-03-01');
        $to   = Carbon::parse('2026-03-31');

        Cache::flush();
        $result = $this->aggregator->totalReceived($from, $to);

        $egp = $result->firstWhere('currency', 'EGP');
        $usd = $result->firstWhere('currency', 'USD');

        $this->assertEquals(3, (int) $egp->payment_count);
        $this->assertEquals(2, (int) $usd->payment_count);
    }

    public function test_result_is_cached_for_subsequent_calls(): void
    {
        Payment::factory()->create(['amount_minor' => 2500, 'currency' => 'EGP', 'paid_at' => '2026-04-05']);

        $from = Carbon::parse('2026-04-01');
        $to   = Carbon::parse('2026-04-30');

        Cache::flush();
        $r1 = $this->aggregator->totalReceived($from, $to);

        Payment::factory()->create(['amount_minor' => 9999, 'currency' => 'EGP', 'paid_at' => '2026-04-10']);

        $r2 = $this->aggregator->totalReceived($from, $to);

        $this->assertEquals(
            (int) $r1->firstWhere('currency', 'EGP')->total_minor,
            (int) $r2->firstWhere('currency', 'EGP')->total_minor
        );
    }

    public function test_cache_flush_causes_fresh_query(): void
    {
        Payment::factory()->create(['amount_minor' => 2500, 'currency' => 'EGP', 'paid_at' => '2026-04-05']);

        $from = Carbon::parse('2026-04-01');
        $to   = Carbon::parse('2026-04-30');

        Cache::flush();
        $r1 = $this->aggregator->totalReceived($from, $to);

        Payment::factory()->create(['amount_minor' => 7500, 'currency' => 'EGP', 'paid_at' => '2026-04-10']);

        Cache::flush();
        $r2 = $this->aggregator->totalReceived($from, $to);

        $this->assertEquals(10000, (int) $r2->firstWhere('currency', 'EGP')->total_minor);
    }

    public function test_boundary_dates_are_inclusive(): void
    {
        Payment::factory()->create(['amount_minor' => 100, 'currency' => 'EGP', 'paid_at' => '2026-05-01 00:00:01']);
        Payment::factory()->create(['amount_minor' => 200, 'currency' => 'EGP', 'paid_at' => '2026-05-31 23:59:59']);

        $from = Carbon::parse('2026-05-01');
        $to   = Carbon::parse('2026-05-31')->endOfDay();

        Cache::flush();
        $result = $this->aggregator->totalReceived($from, $to);

        $egp = $result->firstWhere('currency', 'EGP');
        $this->assertNotNull($egp);
        $this->assertEquals(300, (int) $egp->total_minor);
    }
}
