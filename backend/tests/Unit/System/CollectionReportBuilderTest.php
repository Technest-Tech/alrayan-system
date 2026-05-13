<?php

namespace Tests\Unit\System;

use App\Models\System\Invoice;
use App\Services\System\CollectionReportBuilder;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class CollectionReportBuilderTest extends TestCase
{
    use RefreshDatabase;

    private CollectionReportBuilder $builder;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        $this->builder = new CollectionReportBuilder();
    }

    public function test_collection_rate_is_100_when_no_invoices_in_range(): void
    {
        $from = Carbon::parse('2025-01-01');
        $to   = Carbon::parse('2025-01-31');

        $report = $this->builder->build($from, $to);

        $this->assertEquals(0,   $report->totalIssued);
        $this->assertEquals(100, $report->collectionRate);
    }

    public function test_all_paid_on_time_gives_100_collection_rate(): void
    {
        $dueAt  = now()->subDays(2);
        $paidAt = now()->subDays(3);

        Invoice::factory()->count(3)->create([
            'type'      => 'monthly',
            'status'    => 'paid',
            'issued_at' => now()->subDays(10),
            'due_at'    => $dueAt,
            'paid_at'   => $paidAt,
        ]);

        $from = now()->subDays(15);
        $to   = now()->addDay();

        Cache::flush();
        $report = $this->builder->build($from, $to);

        $this->assertEquals(3,   $report->totalIssued);
        $this->assertEquals(3,   $report->paidOnTime);
        $this->assertEquals(0,   $report->paidLate);
        $this->assertEquals(0,   $report->unpaid);
        $this->assertEquals(100, $report->collectionRate);
    }

    public function test_paid_after_due_date_is_counted_as_late(): void
    {
        Invoice::factory()->create([
            'type'      => 'monthly',
            'status'    => 'paid',
            'issued_at' => now()->subDays(10),
            'due_at'    => now()->subDays(5),
            'paid_at'   => now()->subDays(2),
        ]);

        $from = now()->subDays(15);
        $to   = now()->addDay();

        Cache::flush();
        $report = $this->builder->build($from, $to);

        $this->assertEquals(1, $report->totalIssued);
        $this->assertEquals(0, $report->paidOnTime);
        $this->assertEquals(1, $report->paidLate);
        $this->assertEquals(0, $report->unpaid);
    }

    public function test_sent_invoices_are_counted_as_unpaid(): void
    {
        Invoice::factory()->create([
            'type'      => 'monthly',
            'status'    => 'sent',
            'issued_at' => now()->subDays(5),
            'due_at'    => now()->addDays(3),
        ]);

        $from = now()->subDays(10);
        $to   = now()->addDay();

        Cache::flush();
        $report = $this->builder->build($from, $to);

        $this->assertEquals(1, $report->totalIssued);
        $this->assertEquals(0, $report->paidOnTime);
        $this->assertEquals(0, $report->paidLate);
        $this->assertEquals(1, $report->unpaid);
    }

    public function test_overdue_invoices_are_counted_as_unpaid(): void
    {
        Invoice::factory()->create([
            'type'      => 'monthly',
            'status'    => 'overdue',
            'issued_at' => now()->subDays(10),
            'due_at'    => now()->subDays(5),
        ]);

        $from = now()->subDays(15);
        $to   = now()->addDay();

        Cache::flush();
        $report = $this->builder->build($from, $to);

        $this->assertEquals(1, $report->unpaid);
    }

    public function test_mixed_invoices_correct_on_time_late_unpaid_counts(): void
    {
        $issued = now()->subDays(10);

        Invoice::factory()->create([
            'type'      => 'monthly',
            'status'    => 'paid',
            'issued_at' => $issued,
            'due_at'    => now()->subDays(2),
            'paid_at'   => now()->subDays(3),
        ]);

        Invoice::factory()->create([
            'type'      => 'monthly',
            'status'    => 'paid',
            'issued_at' => $issued,
            'due_at'    => now()->subDays(5),
            'paid_at'   => now()->subDays(1),
        ]);

        Invoice::factory()->create([
            'type'      => 'monthly',
            'status'    => 'sent',
            'issued_at' => $issued,
            'due_at'    => now()->addDays(3),
        ]);

        Invoice::factory()->create([
            'type'      => 'monthly',
            'status'    => 'overdue',
            'issued_at' => $issued,
            'due_at'    => now()->subDays(5),
        ]);

        $from = now()->subDays(15);
        $to   = now()->addDay();

        Cache::flush();
        $report = $this->builder->build($from, $to);

        $this->assertEquals(4, $report->totalIssued);
        $this->assertEquals(1, $report->paidOnTime);
        $this->assertEquals(1, $report->paidLate);
        $this->assertEquals(2, $report->unpaid);
    }

    public function test_collection_rate_calculation_with_partial_paid(): void
    {
        $issued = now()->subDays(10);

        Invoice::factory()->create([
            'type'      => 'monthly',
            'status'    => 'paid',
            'issued_at' => $issued,
            'due_at'    => now()->subDays(2),
            'paid_at'   => now()->subDays(3),
        ]);

        Invoice::factory()->create([
            'type'      => 'monthly',
            'status'    => 'sent',
            'issued_at' => $issued,
            'due_at'    => now()->addDays(3),
        ]);

        Invoice::factory()->create([
            'type'      => 'monthly',
            'status'    => 'sent',
            'issued_at' => $issued,
            'due_at'    => now()->addDays(3),
        ]);

        Invoice::factory()->create([
            'type'      => 'monthly',
            'status'    => 'sent',
            'issued_at' => $issued,
            'due_at'    => now()->addDays(3),
        ]);

        $from = now()->subDays(15);
        $to   = now()->addDay();

        Cache::flush();
        $report = $this->builder->build($from, $to);

        $this->assertEquals(4, $report->totalIssued);
        $this->assertEquals(25, $report->collectionRate);
    }

    public function test_non_monthly_invoices_are_excluded(): void
    {
        $issued = now()->subDays(5);

        Invoice::factory()->create([
            'type'      => 'advance',
            'status'    => 'paid',
            'issued_at' => $issued,
            'due_at'    => now()->subDays(1),
            'paid_at'   => now()->subDays(2),
        ]);

        $from = now()->subDays(10);
        $to   = now()->addDay();

        Cache::flush();
        $report = $this->builder->build($from, $to);

        $this->assertEquals(0, $report->totalIssued);
        $this->assertEquals(100, $report->collectionRate);
    }

    public function test_invoices_outside_date_range_are_excluded(): void
    {
        Invoice::factory()->create([
            'type'      => 'monthly',
            'status'    => 'sent',
            'issued_at' => '2025-01-15',
            'due_at'    => '2025-01-20',
        ]);

        $from = Carbon::parse('2026-01-01');
        $to   = Carbon::parse('2026-01-31');

        Cache::flush();
        $report = $this->builder->build($from, $to);

        $this->assertEquals(0, $report->totalIssued);
        $this->assertEquals(100, $report->collectionRate);
    }

    public function test_report_is_cached(): void
    {
        Invoice::factory()->create([
            'type'      => 'monthly',
            'status'    => 'sent',
            'issued_at' => now()->subDays(5),
            'due_at'    => now()->addDays(3),
        ]);

        $from = now()->subDays(10);
        $to   = now()->addDay();

        Cache::flush();
        $r1 = $this->builder->build($from, $to);

        Invoice::factory()->create([
            'type'      => 'monthly',
            'status'    => 'sent',
            'issued_at' => now()->subDays(5),
            'due_at'    => now()->addDays(3),
        ]);

        $r2 = $this->builder->build($from, $to);

        $this->assertEquals($r1->totalIssued, $r2->totalIssued);
    }
}
