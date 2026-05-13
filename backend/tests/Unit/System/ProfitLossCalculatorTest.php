<?php

namespace Tests\Unit\System;

use App\Models\System\Expense;
use App\Models\System\Payment;
use App\Services\System\ProfitLossCalculator;
use App\Services\System\RevenueAggregator;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class ProfitLossCalculatorTest extends TestCase
{
    use RefreshDatabase;

    private ProfitLossCalculator $calculator;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        $this->calculator = new ProfitLossCalculator(new RevenueAggregator());
    }

    public function test_zero_revenue_and_zero_costs_gives_zero_net_profit(): void
    {
        $from = Carbon::parse('2026-01-01');
        $to   = Carbon::parse('2026-01-31');

        $stmt = $this->calculator->statement($from, $to, 'EGP');

        $this->assertEquals(0, $stmt->revenue);
        $this->assertEquals(0, $stmt->salaries);
        $this->assertEquals(0, $stmt->bonuses);
        $this->assertEquals(0, $stmt->expenses);
        $this->assertEquals(0, $stmt->totalCosts);
        $this->assertEquals(0, $stmt->netProfit);
    }

    public function test_positive_revenue_no_costs_gives_positive_net_profit(): void
    {
        Payment::factory()->create([
            'amount_minor' => 100000,
            'currency'     => 'EGP',
            'paid_at'      => '2026-02-15',
        ]);

        $from = Carbon::parse('2026-02-01');
        $to   = Carbon::parse('2026-02-28');

        Cache::flush();
        $stmt = $this->calculator->statement($from, $to, 'EGP');

        $this->assertEquals(100000, $stmt->revenue);
        $this->assertEquals(100000, $stmt->netProfit);
    }

    public function test_expenses_reduce_net_profit(): void
    {
        Payment::factory()->create([
            'amount_minor' => 200000,
            'currency'     => 'EGP',
            'paid_at'      => '2026-03-10',
        ]);

        Expense::factory()->create([
            'amount_minor' => 50000,
            'currency'     => 'EGP',
            'occurred_on'  => '2026-03-10',
        ]);

        $from = Carbon::parse('2026-03-01');
        $to   = Carbon::parse('2026-03-31');

        Cache::flush();
        $stmt = $this->calculator->statement($from, $to, 'EGP');

        $this->assertEquals(200000, $stmt->revenue);
        $this->assertEquals(50000, $stmt->expenses);
        $this->assertEquals(150000, $stmt->netProfit);
    }

    public function test_expenses_exceed_revenue_gives_negative_net_profit(): void
    {
        Payment::factory()->create([
            'amount_minor' => 30000,
            'currency'     => 'EGP',
            'paid_at'      => '2026-04-10',
        ]);

        Expense::factory()->create([
            'amount_minor' => 80000,
            'currency'     => 'EGP',
            'occurred_on'  => '2026-04-10',
        ]);

        $from = Carbon::parse('2026-04-01');
        $to   = Carbon::parse('2026-04-30');

        Cache::flush();
        $stmt = $this->calculator->statement($from, $to, 'EGP');

        $this->assertEquals(30000,  $stmt->revenue);
        $this->assertEquals(80000,  $stmt->expenses);
        $this->assertEquals(80000,  $stmt->totalCosts);
        $this->assertEquals(-50000, $stmt->netProfit);
    }

    public function test_statement_dto_has_correct_base_currency(): void
    {
        $from = Carbon::parse('2026-01-01');
        $to   = Carbon::parse('2026-01-31');

        $stmt = $this->calculator->statement($from, $to, 'EGP');

        $this->assertEquals('EGP', $stmt->baseCurrency);
        $this->assertEquals('2026-01-01', $stmt->from->toDateString());
        $this->assertEquals('2026-01-31', $stmt->to->toDateString());
    }

    public function test_total_costs_equals_salaries_plus_bonuses_plus_expenses(): void
    {
        Expense::factory()->create([
            'amount_minor' => 25000,
            'currency'     => 'EGP',
            'occurred_on'  => '2026-05-10',
        ]);

        $from = Carbon::parse('2026-05-01');
        $to   = Carbon::parse('2026-05-31');

        Cache::flush();
        $stmt = $this->calculator->statement($from, $to, 'EGP');

        $this->assertEquals(
            $stmt->salaries + $stmt->bonuses + $stmt->expenses,
            $stmt->totalCosts
        );
    }

    public function test_statement_to_array_returns_all_keys(): void
    {
        $from = Carbon::parse('2026-01-01');
        $to   = Carbon::parse('2026-01-31');

        $array = $this->calculator->statement($from, $to, 'EGP')->toArray();

        $this->assertArrayHasKey('revenue', $array);
        $this->assertArrayHasKey('salaries', $array);
        $this->assertArrayHasKey('bonuses', $array);
        $this->assertArrayHasKey('expenses', $array);
        $this->assertArrayHasKey('total_costs', $array);
        $this->assertArrayHasKey('net_profit', $array);
        $this->assertArrayHasKey('base_currency', $array);
        $this->assertArrayHasKey('from', $array);
        $this->assertArrayHasKey('to', $array);
    }

    public function test_expenses_outside_range_are_excluded(): void
    {
        Payment::factory()->create([
            'amount_minor' => 100000,
            'currency'     => 'EGP',
            'paid_at'      => '2026-06-15',
        ]);

        Expense::factory()->create([
            'amount_minor' => 30000,
            'currency'     => 'EGP',
            'occurred_on'  => '2026-07-01',
        ]);

        $from = Carbon::parse('2026-06-01');
        $to   = Carbon::parse('2026-06-30');

        Cache::flush();
        $stmt = $this->calculator->statement($from, $to, 'EGP');

        $this->assertEquals(100000, $stmt->revenue);
        $this->assertEquals(0, $stmt->expenses);
        $this->assertEquals(100000, $stmt->netProfit);
    }
}
