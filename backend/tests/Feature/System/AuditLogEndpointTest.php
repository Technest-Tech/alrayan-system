<?php

namespace Tests\Feature\System;

use App\Models\System\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Tests\SystemTestCase;

class AuditLogEndpointTest extends SystemTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    private function insertAuditLog(array $overrides = []): int
    {
        $defaults = [
            'actor_user_id' => null,
            'action'        => 'test.action',
            'target_type'   => null,
            'target_id'     => null,
            'payload'       => json_encode(['key' => 'value']),
            'ip'            => '127.0.0.1',
            'user_agent'    => 'PHPUnit',
            'created_at'    => now(),
            'updated_at'    => now(),
        ];

        return DB::table('sys_audit_logs')->insertGetId(array_merge($defaults, $overrides));
    }

    public function test_admin_can_list_audit_log(): void
    {
        $this->insertAuditLog(['action' => 'expenses.created']);
        $this->insertAuditLog(['action' => 'expenses.deleted']);

        $this->asAdmin()
            ->getJson('/api/system/audit-log')
            ->assertOk()
            ->assertJsonStructure(['data', 'meta']);
    }

    public function test_audit_log_requires_auth(): void
    {
        $this->getJson('/api/system/audit-log')
            ->assertUnauthorized();
    }

    public function test_audit_log_response_rows_have_expected_fields(): void
    {
        $this->insertAuditLog(['action' => 'certificates.issued']);

        $response = $this->asAdmin()
            ->getJson('/api/system/audit-log');

        $response->assertOk();
        $data = $response->json('data');
        $this->assertNotEmpty($data);

        $row = $data[0];
        $this->assertArrayHasKey('id', $row);
        $this->assertArrayHasKey('action', $row);
        $this->assertArrayHasKey('source', $row);
        $this->assertArrayHasKey('created_at', $row);
    }

    public function test_audit_log_filter_by_action(): void
    {
        $this->insertAuditLog(['action' => 'expenses.created']);
        $this->insertAuditLog(['action' => 'certificates.issued']);

        $response = $this->asAdmin()
            ->getJson('/api/system/audit-log?action=expenses');

        $response->assertOk();
        $data = $response->json('data');
        foreach ($data as $row) {
            $this->assertStringContainsString('expenses', $row['action']);
        }
    }

    public function test_audit_log_filter_by_date_range(): void
    {
        $this->insertAuditLog([
            'action'     => 'old.action',
            'created_at' => '2026-01-10 12:00:00',
            'updated_at' => '2026-01-10 12:00:00',
        ]);
        $this->insertAuditLog([
            'action'     => 'new.action',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->asAdmin()
            ->getJson('/api/system/audit-log?from=2026-01-01&to=2026-01-31');

        $response->assertOk();
        $data = $response->json('data');
        $this->assertNotEmpty($data);

        foreach ($data as $row) {
            if ($row['source'] === 'audit') {
                $this->assertEquals('old.action', $row['action']);
            }
        }
    }

    public function test_audit_log_is_paginated(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->insertAuditLog(['action' => "action.{$i}"]);
        }

        $response = $this->asAdmin()
            ->getJson('/api/system/audit-log?per_page=2&page=1');

        $response->assertOk();
        $meta = $response->json('meta');
        $this->assertEquals(2, $meta['per_page']);
        $this->assertEquals(1, $meta['current_page']);
        $this->assertGreaterThan(1, $meta['last_page']);
    }

    public function test_audit_log_meta_contains_pagination_fields(): void
    {
        $this->insertAuditLog();

        $response = $this->asAdmin()
            ->getJson('/api/system/audit-log');

        $response->assertOk()
            ->assertJsonStructure([
                'meta' => ['total', 'per_page', 'current_page', 'last_page'],
            ]);
    }

    public function test_teacher_without_permission_cannot_view_audit_log(): void
    {
        ['user' => $user] = $this->teacherUser();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/system/audit-log')
            ->assertForbidden();
    }
}
