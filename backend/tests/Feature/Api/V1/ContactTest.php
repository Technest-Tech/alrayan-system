<?php

namespace Tests\Feature\Api\V1;

use App\Mail\ContactConfirmation;
use App\Mail\ContactReceived;
use App\Models\ContactMessage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ContactTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

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
            'name'           => 'Fatima Al-Zahra',
            'email'          => 'fatima@example.com',
            'subject'        => 'Question about female teachers',
            'message'        => 'I would like to know more about your female Quran teachers.',
            'turnstileToken' => 'test-token',
        ], $overrides);
    }

    public function test_creates_contact_message_with_valid_data(): void
    {
        $response = $this->postJson('/api/v1/contacts', $this->validPayload());

        $response->assertStatus(201)
            ->assertJsonStructure(['reference', 'message'])
            ->assertJsonPath('reference', fn ($ref) => str_starts_with($ref, 'CT-'));

        $this->assertDatabaseHas('contact_messages', [
            'email' => 'fatima@example.com',
        ]);
    }

    public function test_returns_422_when_required_fields_missing(): void
    {
        $this->postJson('/api/v1/contacts', [
            'turnstileToken' => 'test-token',
        ])->assertStatus(422)
          ->assertJsonValidationErrors(['name', 'email', 'subject', 'message']);
    }

    public function test_returns_422_with_invalid_email(): void
    {
        $this->postJson('/api/v1/contacts', $this->validPayload([
            'email' => 'bad-email',
        ]))->assertStatus(422)
          ->assertJsonValidationErrors(['email']);
    }

    public function test_queues_two_emails_on_success(): void
    {
        $this->postJson('/api/v1/contacts', $this->validPayload())
            ->assertStatus(201);

        Mail::assertQueued(ContactReceived::class, 1);
        Mail::assertQueued(ContactConfirmation::class, 1);
    }

    public function test_returns_422_when_turnstile_token_missing(): void
    {
        $payload = $this->validPayload();
        unset($payload['turnstileToken']);

        $this->postJson('/api/v1/contacts', $payload)
            ->assertStatus(422)
            ->assertJsonPath('message', 'Security check required.');
    }

    public function test_enforces_rate_limit_after_five_requests(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/contacts', $this->validPayload([
                'email' => "user{$i}@example.com",
            ]))->assertStatus(201);
        }

        $this->postJson('/api/v1/contacts', $this->validPayload([
            'email' => 'overflow@example.com',
        ]))->assertStatus(429);
    }
}
