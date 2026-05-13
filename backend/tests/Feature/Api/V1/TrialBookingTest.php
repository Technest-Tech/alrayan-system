<?php

namespace Tests\Feature\Api\V1;

use App\Mail\TrialBookingAdminNotification;
use App\Mail\TrialBookingConfirmation;
use App\Models\TrialBooking;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class TrialBookingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Fake Turnstile API always succeeding
        Http::fake([
            'https://challenges.cloudflare.com/turnstile/v0/siteverify' => Http::response(
                ['success' => true],
                200,
            ),
        ]);

        Mail::fake();
    }

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'name'           => 'Ahmed Omar',
            'email'          => 'ahmed@example.com',
            'country'        => 'United Kingdom',
            'ageGroup'       => 'adult',
            'courseInterest' => 'Tajweed Course',
            'preferredTime'  => 'evening',
            'timezone'       => 'Europe/London',
            'turnstileToken' => 'test-token',
        ], $overrides);
    }

    public function test_creates_trial_booking_with_valid_data(): void
    {
        $response = $this->postJson('/api/v1/trial-bookings', $this->validPayload());

        $response->assertStatus(201)
            ->assertJsonStructure(['reference', 'message'])
            ->assertJsonPath('reference', fn ($ref) => str_starts_with($ref, 'TB-'));

        $this->assertDatabaseHas('trial_bookings', [
            'email' => 'ahmed@example.com',
            'age_group' => 'adult',
        ]);
    }

    public function test_returns_422_when_required_fields_missing(): void
    {
        $response = $this->postJson('/api/v1/trial-bookings', [
            'turnstileToken' => 'test-token',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'country', 'ageGroup', 'courseInterest', 'preferredTime', 'timezone']);
    }

    public function test_returns_422_with_invalid_email(): void
    {
        $response = $this->postJson('/api/v1/trial-bookings', $this->validPayload([
            'email' => 'not-an-email',
        ]));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_returns_422_with_invalid_age_group(): void
    {
        $response = $this->postJson('/api/v1/trial-bookings', $this->validPayload([
            'ageGroup' => 'infant',
        ]));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['ageGroup']);
    }

    public function test_queues_two_emails_on_success(): void
    {
        $this->postJson('/api/v1/trial-bookings', $this->validPayload())
            ->assertStatus(201);

        Mail::assertQueued(TrialBookingAdminNotification::class, 1);
        Mail::assertQueued(TrialBookingConfirmation::class, 1);
    }

    public function test_returns_422_when_turnstile_token_missing(): void
    {
        $payload = $this->validPayload();
        unset($payload['turnstileToken']);

        $this->postJson('/api/v1/trial-bookings', $payload)
            ->assertStatus(422)
            ->assertJsonPath('message', 'Security check required.');
    }

    public function test_enforces_rate_limit_after_five_requests(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/trial-bookings', $this->validPayload([
                'email' => "user{$i}@example.com",
            ]))->assertStatus(201);
        }

        $this->postJson('/api/v1/trial-bookings', $this->validPayload([
            'email' => 'overflow@example.com',
        ]))->assertStatus(429);
    }
}
