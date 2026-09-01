<?php

namespace Tests\Feature\System;

use App\Models\System\Lead;
use App\Models\TrialBooking;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BackfillTrialLeadDetailsTest extends TestCase
{
    use RefreshDatabase;

    private function booking(array $overrides = []): TrialBooking
    {
        return TrialBooking::create(array_merge([
            'reference'       => 'TB-2026-0001',
            'name'            => 'Ahmed Omar',
            'email'           => 'ahmed@example.com',
            'country'         => 'United Kingdom',
            'phone'           => '+44 7700 900000',
            'age_group'       => 'adult',
            'course_interest' => 'Tajweed Course',
            'preferred_time'  => 'evening',
            'timezone'        => 'Europe/London',
            'message'         => 'I read slowly and want to improve.',
        ], $overrides));
    }

    public function test_fills_the_details_missing_from_an_older_lead(): void
    {
        $booking = $this->booking();

        $lead = Lead::factory()->create([
            'trial_booking_id' => $booking->id,
            'notes'            => null,
            'country'          => null,
            'whatsapp'         => null,
            'source_detail'    => null,
        ]);

        $this->artisan('system:leads:backfill-trial-details')->assertSuccessful();

        $lead->refresh();

        $this->assertStringContainsString('I read slowly and want to improve.', $lead->notes);
        $this->assertStringContainsString('Course: Tajweed Course', $lead->notes);
        $this->assertSame('GB', $lead->country);
        $this->assertSame('+44 7700 900000', $lead->whatsapp);
        $this->assertSame('Free trial booking · TB-2026-0001', $lead->source_detail);
    }

    public function test_creates_the_lead_a_booking_never_got(): void
    {
        $booking = $this->booking();

        $this->artisan('system:leads:backfill-trial-details')->assertSuccessful();

        $lead = Lead::where('trial_booking_id', $booking->id)->firstOrFail();

        $this->assertSame('GB', $lead->country);
        $this->assertStringContainsString('I read slowly and want to improve.', $lead->notes);

        // Re-running must not produce a second lead.
        $this->artisan('system:leads:backfill-trial-details')->assertSuccessful();
        $this->assertSame(1, Lead::count());
    }

    public function test_leaves_a_deleted_lead_deleted(): void
    {
        $booking = $this->booking();

        Lead::factory()->create(['trial_booking_id' => $booking->id])->delete();

        $this->artisan('system:leads:backfill-trial-details')->assertSuccessful();

        $this->assertSame(0, Lead::count());
    }

    public function test_never_overwrites_what_a_supervisor_already_typed(): void
    {
        $booking = $this->booking();

        $lead = Lead::factory()->create([
            'trial_booking_id' => $booking->id,
            'notes'            => 'Called twice, no answer.',
            'country'          => 'EG',
        ]);

        $this->artisan('system:leads:backfill-trial-details')->assertSuccessful();

        $lead->refresh();

        $this->assertSame('Called twice, no answer.', $lead->notes);
        $this->assertSame('EG', $lead->country);
    }

    public function test_dry_run_writes_nothing(): void
    {
        $booking = $this->booking();

        $lead = Lead::factory()->create([
            'trial_booking_id' => $booking->id,
            'notes'            => null,
        ]);

        $this->artisan('system:leads:backfill-trial-details', ['--dry-run' => true])
            ->assertSuccessful();

        $this->assertNull($lead->refresh()->notes);
    }
}
