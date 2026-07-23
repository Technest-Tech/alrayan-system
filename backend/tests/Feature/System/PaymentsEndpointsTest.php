<?php

namespace Tests\Feature\System;

use App\Models\System\Student;
use App\Models\System\StudentPackage;
use Tests\SystemTestCase;

class PaymentsEndpointsTest extends SystemTestCase
{
    public function test_package_zero_is_hidden_until_package_one_enters_the_payment_flow(): void
    {
        $covered = Student::factory()->withUser()->create();
        $owing   = Student::factory()->withUser()->create();

        $this->package($covered, 0, 'paid', 1000);
        $this->package($owing, 0, 'paid', 1500);
        $pending = $this->package($owing, 1, 'pending', 2500);

        $response = $this->asAdmin()
            ->getJson('/api/system/payments')
            ->assertOk();

        $this->assertSame([$pending->id], collect($response->json('data'))->pluck('package_id')->all());
        $response->assertJsonPath('data.0.package_number', 1);
    }

    public function test_paid_package_zero_counts_as_received_revenue_but_not_as_pending(): void
    {
        $student = Student::factory()->withUser()->create();

        $this->package($student, 0, 'paid', 1800, now());
        $this->package($student, 1, 'pending', 2600);

        $this->asAdmin()
            ->getJson('/api/system/payments/stats')
            ->assertOk()
            ->assertJson([
                'pending_students'     => 1,
                'multiple_unpaid'      => 0,
                'total_pending_minor'  => 2600,
                'received_month_minor' => 1800,
            ]);
    }

    private function package(
        Student $student,
        int $number,
        string $status,
        int $amount,
        mixed $paidAt = null,
    ): StudentPackage {
        return StudentPackage::create([
            'student_id'     => $student->id,
            'package_number' => $number,
            'package_hours'  => 4,
            'tariff_at_time' => $amount,
            'currency'       => 'USD',
            'status'         => $status,
            'paid_at'        => $paidAt,
        ]);
    }
}
