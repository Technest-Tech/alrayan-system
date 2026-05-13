<?php

namespace Tests\Feature\System;

use App\Models\System\Invoice;
use App\Models\System\Student;
use Illuminate\Support\Facades\Queue;
use Tests\SystemTestCase;

class InvoiceEndpointsTest extends SystemTestCase
{
    public function test_admin_can_list_invoices(): void
    {
        Invoice::factory()->count(3)->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/invoices')
            ->assertOk()
            ->assertJsonStructure(['data', 'meta']);
    }

    public function test_list_supports_status_filter(): void
    {
        Invoice::factory()->paid()->create();
        Invoice::factory()->paid()->create();
        Invoice::factory()->overdue()->create();

        $response = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/invoices?filter[status]=paid')
            ->assertOk();

        $this->assertCount(2, $response->json('data'));
    }

    public function test_admin_can_view_single_invoice(): void
    {
        $invoice = Invoice::factory()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson("/api/system/invoices/{$invoice->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $invoice->id);
    }

    public function test_admin_can_create_manual_invoice(): void
    {
        Queue::fake();

        $student = Student::factory()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson('/api/system/invoices', [
                'student_id' => $student->id,
                'type'       => 'manual',
                'due_at'     => now()->addDays(7)->toDateString(),
                'lines'      => [
                    [
                        'description'      => 'Monthly fee',
                        'kind'             => 'monthly',
                        'quantity'         => 1,
                        'unit_price_minor' => 5000,
                        'line_total_minor' => 5000,
                    ],
                ],
            ])
            ->assertCreated()
            ->assertJsonPath('data.type', 'manual')
            ->assertJsonPath('data.status', 'draft');

        $this->assertDatabaseHas('sys_invoices', [
            'student_id' => $student->id,
            'type'       => 'manual',
            'status'     => 'draft',
        ]);
    }

    public function test_admin_can_send_draft_invoice(): void
    {
        $invoice = Invoice::factory()->create(['status' => 'draft']);

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson("/api/system/invoices/{$invoice->id}/send")
            ->assertOk()
            ->assertJsonPath('data.status', 'sent');

        $this->assertDatabaseHas('sys_invoices', [
            'id'     => $invoice->id,
            'status' => 'sent',
        ]);
    }

    public function test_admin_can_record_payment_on_sent_invoice(): void
    {
        $invoice = Invoice::factory()->create(['status' => 'sent', 'total_minor' => 5000, 'currency' => 'USD']);

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson("/api/system/invoices/{$invoice->id}/payments", [
                'amount_minor' => 5000,
                'currency'     => 'USD',
                'method'       => 'bank_transfer',
                'paid_at'      => now()->toDateTimeString(),
            ])
            ->assertCreated()
            ->assertJsonPath('data.amount_minor', 5000);

        $this->assertDatabaseHas('sys_payments', [
            'invoice_id'   => $invoice->id,
            'amount_minor' => 5000,
        ]);
    }

    public function test_cannot_record_payment_on_draft_invoice(): void
    {
        $invoice = Invoice::factory()->create(['status' => 'draft']);

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson("/api/system/invoices/{$invoice->id}/payments", [
                'amount_minor' => 5000,
                'currency'     => 'USD',
                'method'       => 'bank_transfer',
            ])
            ->assertForbidden();
    }

    public function test_teacher_cannot_access_invoice_list(): void
    {
        ['user' => $teacherUser] = $this->teacherUser();

        $this->actingAs($teacherUser, 'sanctum')
            ->getJson('/api/system/invoices')
            ->assertForbidden();
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/system/invoices')->assertUnauthorized();
    }
}
