<?php

namespace Tests\Feature\System;

use App\Support\System\Setting;
use Illuminate\Support\Facades\Cache;
use Tests\SystemTestCase;

class SettingsEndpointsTest extends SystemTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    public function test_admin_can_get_academy_settings(): void
    {
        $this->asAdmin()
            ->getJson('/api/system/settings/academy')
            ->assertOk()
            ->assertJsonStructure(['data']);
    }

    public function test_get_academy_settings_requires_auth(): void
    {
        $this->getJson('/api/system/settings/academy')
            ->assertUnauthorized();
    }

    public function test_academy_settings_response_contains_known_keys(): void
    {
        $response = $this->asAdmin()
            ->getJson('/api/system/settings/academy');

        $response->assertOk();
        $data = $response->json('data');
        $this->assertArrayHasKey('academy.name', $data);
        $this->assertArrayHasKey('academy.support_email', $data);
        $this->assertArrayHasKey('academy.default_timezone', $data);
    }

    public function test_admin_can_update_academy_settings(): void
    {
        $this->asAdmin()
            ->putJson('/api/system/settings/academy', [
                'academy.name'          => 'Updated Academy',
                'academy.support_email' => 'support@updated.test',
            ])
            ->assertOk()
            ->assertJsonPath('message', 'Academy settings saved.');

        $this->assertEquals('Updated Academy', Setting::get('academy.name'));
        $this->assertEquals('support@updated.test', Setting::get('academy.support_email'));
    }

    public function test_update_academy_validates_email_format(): void
    {
        $this->asAdmin()
            ->putJson('/api/system/settings/academy', [
                'academy.support_email' => 'not-an-email',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['academy.support_email']);
    }

    public function test_update_academy_validates_timezone(): void
    {
        $this->asAdmin()
            ->putJson('/api/system/settings/academy', [
                'academy.default_timezone' => 'Invalid/Timezone',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['academy.default_timezone']);
    }

    public function test_teacher_without_permission_cannot_view_academy_settings(): void
    {
        ['user' => $user] = $this->teacherUser();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/system/settings/academy')
            ->assertForbidden();
    }

    public function test_teacher_without_permission_cannot_update_academy_settings(): void
    {
        ['user' => $user] = $this->teacherUser();

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/system/settings/academy', ['academy.name' => 'Hacked'])
            ->assertForbidden();
    }

    public function test_admin_can_get_fx_rates(): void
    {
        $this->asAdmin()
            ->getJson('/api/system/settings/fx-rates')
            ->assertOk()
            ->assertJsonStructure(['data']);
    }

    public function test_get_fx_rates_requires_auth(): void
    {
        $this->getJson('/api/system/settings/fx-rates')
            ->assertUnauthorized();
    }

    public function test_fx_rates_response_contains_pair_entries(): void
    {
        $response = $this->asAdmin()
            ->getJson('/api/system/settings/fx-rates');

        $response->assertOk();
        $data = $response->json('data');
        $this->assertIsArray($data);
        $this->assertNotEmpty($data);

        $first = $data[0];
        $this->assertArrayHasKey('pair', $first);
        $this->assertArrayHasKey('from', $first);
        $this->assertArrayHasKey('to', $first);
        $this->assertArrayHasKey('rate', $first);
        $this->assertArrayHasKey('is_stale', $first);
    }

    public function test_admin_can_update_fx_rates(): void
    {
        $this->asAdmin()
            ->putJson('/api/system/settings/fx-rates', [
                'rates' => [
                    ['pair' => 'USD_to_EGP', 'rate' => 49.5],
                    ['pair' => 'EUR_to_EGP', 'rate' => 53.0],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('message', 'FX rates updated.');

        $this->assertEquals('49.5', Setting::get('pricing.fx.USD_to_EGP'));
        $this->assertEquals('53', Setting::get('pricing.fx.EUR_to_EGP'));
    }

    public function test_update_fx_rates_validates_rates_array_required(): void
    {
        $this->asAdmin()
            ->putJson('/api/system/settings/fx-rates', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['rates']);
    }

    public function test_update_fx_rates_validates_rate_numeric(): void
    {
        $this->asAdmin()
            ->putJson('/api/system/settings/fx-rates', [
                'rates' => [
                    ['pair' => 'USD_to_EGP', 'rate' => 'not-a-number'],
                ],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['rates.0.rate']);
    }

    public function test_teacher_without_permission_cannot_view_fx_rates(): void
    {
        ['user' => $user] = $this->teacherUser();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/system/settings/fx-rates')
            ->assertForbidden();
    }

    public function test_teacher_without_permission_cannot_update_fx_rates(): void
    {
        ['user' => $user] = $this->teacherUser();

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/system/settings/fx-rates', [
                'rates' => [['pair' => 'USD_to_EGP', 'rate' => 50.0]],
            ])
            ->assertForbidden();
    }
}
