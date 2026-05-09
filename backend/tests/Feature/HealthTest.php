<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthTest extends TestCase
{
    public function test_health_endpoint_returns_ok(): void
    {
        $response = $this->getJson('/api/v1/up');

        $response
            ->assertStatus(200)
            ->assertJsonStructure(['status', 'version'])
            ->assertJsonPath('status', 'ok');
    }

    public function test_laravel_health_route_returns_ok(): void
    {
        $response = $this->get('/up');

        $response->assertStatus(200);
    }
}
