<?php

namespace Tests\Feature\System;

use App\Models\System\Invoice;
use App\Models\System\Payment;
use Illuminate\Support\Facades\Cache;
use Tests\SystemTestCase;

class AccountingEndpointsTest extends SystemTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    public function test_revenue_endpoint_returns_200_with_correct_keys(): void
    {
        $this->asAdmin()
            ->getJson('/api/system/accounting/revenue')
            ->assertOk()
            ->assertJsonStructure(['from', 'to', 'base_currency', 'totals', 'by_course', 'by_month']);
    }

    public function test_revenue_endpoint_requires_auth(): void
    {
        $this->getJson('/api/system/accounting/revenue')
            ->assertUnauthorized();
    }

    public function test_revenue_endpoint_accepts_date_range_params(): void
    {
        $response = $this->asAdmin()
            ->getJson('/api/system/accounting/revenue?from=2026-01-01&to=2026-03-31');

        $response->assertOk()
            ->assertJsonPath('from', '2026-01-01')
            ->assertJsonPath('to', '2026-03-31');
    }

    public function test_revenue_totals_includes_payments_in_range(): void
    {
        Payment::factory()->create([
            'amount_minor' => 5000,
            'currency'     => 'EGP',
            'paid_at'      => '2026-02-15',
        ]);

        $response = $this->asAdmin()
            ->getJson('/api/system/accounting/revenue?from=2026-02-01&to=2026-02-28');

        $response->assertOk();
        $totals = $response->json('totals');
        $this->assertNotEmpty($totals);
        $egpRow = collect($totals)->firstWhere('currency', 'EGP');
        $this->assertNotNull($egpRow);
        $this->assertEquals(5000, (int) $egpRow['total_minor']);
    }

    public function test_profit_loss_endpoint_returns_200_with_correct_keys(): void
    {
        $this->asAdmin()
            ->getJson('/api/system/accounting/profit-loss')
            ->assertOk()
            ->assertJsonStructure(['from', 'to', 'base_currency', 'monthly', 'totals', 'note']);
    }

    public function test_profit_loss_endpoint_requires_auth(): void
    {
        $this->getJson('/api/system/accounting/profit-loss')
            ->assertUnauthorized();
    }

    public function test_profit_loss_totals_contains_expected_fields(): void
    {
        $response = $this->asAdmin()
            ->getJson('/api/system/accounting/profit-loss?from=2026-01-01&to=2026-01-31');

        $response->assertOk();
        $totals = $response->json('totals');
        $this->assertArrayHasKey('revenue', $totals);
        $this->assertArrayHasKey('salaries', $totals);
        $this->assertArrayHasKey('bonuses', $totals);
        $this->assertArrayHasKey('expenses', $totals);
        $this->assertArrayHasKey('total_costs', $totals);
        $this->assertArrayHasKey('net_profit', $totals);
    }

    public function test_collection_endpoint_returns_200_with_correct_keys(): void
    {
        $this->asAdmin()
            ->getJson('/api/system/accounting/collection')
            ->assertOk()
            ->assertJsonStructure([
                'total_issued',
                'paid_on_time',
                'paid_late',
                'unpaid',
                'collection_rate',
                'average_days_delay',
                'trend',
            ]);
    }

    public function test_collection_endpoint_requires_auth(): void
    {
        $this->getJson('/api/system/accounting/collection')
            ->assertUnauthorized();
    }

    public function test_collection_rate_is_100_when_no_invoices(): void
    {
        $response = $this->asAdmin()
            ->getJson('/api/system/accounting/collection?from=2025-01-01&to=2025-01-31');

        $response->assertOk()
            ->assertJsonPath('total_issued', 0)
            ->assertJsonPath('collection_rate', 100);
    }

    public function test_cancellations_endpoint_returns_200(): void
    {
        $this->asAdmin()
            ->getJson('/api/system/accounting/cancellations')
            ->assertOk();
    }

    public function test_cancellations_endpoint_requires_auth(): void
    {
        $this->getJson('/api/system/accounting/cancellations')
            ->assertUnauthorized();
    }

    public function test_trials_endpoint_returns_200(): void
    {
        $this->asAdmin()
            ->getJson('/api/system/accounting/trials')
            ->assertOk();
    }

    public function test_trials_endpoint_requires_auth(): void
    {
        $this->getJson('/api/system/accounting/trials')
            ->assertUnauthorized();
    }

    public function test_teacher_without_permission_cannot_access_revenue(): void
    {
        ['user' => $user] = $this->teacherUser();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/system/accounting/revenue')
            ->assertForbidden();
    }

    public function test_teacher_without_permission_cannot_access_profit_loss(): void
    {
        ['user' => $user] = $this->teacherUser();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/system/accounting/profit-loss')
            ->assertForbidden();
    }
}
