<?php

namespace Tests\Feature\System;

use App\Models\System\Certificate;
use App\Models\System\Student;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Tests\SystemTestCase;

class CertificateEndpointsTest extends SystemTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        Storage::fake('local');
    }

    public function test_admin_can_list_certificates(): void
    {
        Certificate::factory()->count(3)->create();

        $this->asAdmin()
            ->getJson('/api/system/certificates')
            ->assertOk()
            ->assertJsonStructure(['data', 'meta']);
    }

    public function test_list_certificates_requires_auth(): void
    {
        $this->getJson('/api/system/certificates')
            ->assertUnauthorized();
    }

    public function test_list_certificates_filter_by_type(): void
    {
        Certificate::factory()->create(['type' => 'ijazah']);
        Certificate::factory()->create(['type' => 'other']);

        $response = $this->asAdmin()
            ->getJson('/api/system/certificates?filter[type]=ijazah');

        $response->assertOk();
        foreach ($response->json('data') as $item) {
            $this->assertEquals('ijazah', $item['type']);
        }
    }

    public function test_list_certificates_filter_by_student_id(): void
    {
        $student = Student::factory()->create();
        Certificate::factory()->create(['student_id' => $student->id]);
        Certificate::factory()->create();

        $response = $this->asAdmin()
            ->getJson('/api/system/certificates?filter[student_id]=' . $student->id);

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($student->id, $data[0]['student']['id']);
    }

    public function test_admin_can_show_certificate(): void
    {
        $cert = Certificate::factory()->create();

        $this->asAdmin()
            ->getJson('/api/system/certificates/' . $cert->id)
            ->assertOk()
            ->assertJsonPath('data.id', $cert->id);
    }

    public function test_show_certificate_returns_404_for_missing(): void
    {
        $this->asAdmin()
            ->getJson('/api/system/certificates/9999')
            ->assertNotFound();
    }

    public function test_admin_can_issue_certificate(): void
    {
        $student = Student::factory()->create();

        $payload = [
            'student_id' => $student->id,
            'type'       => 'course_completion',
            'title'      => 'Quran Memorization Certificate',
            'issued_on'  => '2026-05-01',
        ];

        $response = $this->asAdmin()
            ->postJson('/api/system/certificates', $payload);

        $response->assertCreated()
            ->assertJsonPath('data.type', 'course_completion')
            ->assertJsonPath('data.title', 'Quran Memorization Certificate');

        $certNumber = $response->json('data.certificate_number');
        $this->assertMatchesRegularExpression('/^CRT-\d{4}-\d{5}$/', $certNumber);

        $this->assertDatabaseHas('sys_certificates', [
            'student_id' => $student->id,
            'type'       => 'course_completion',
        ]);
    }

    public function test_issue_certificate_validates_required_fields(): void
    {
        $this->asAdmin()
            ->postJson('/api/system/certificates', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['student_id', 'type', 'title', 'issued_on']);
    }

    public function test_certificate_number_format_is_crt_year_sequence(): void
    {
        $student = Student::factory()->create();

        $response = $this->asAdmin()->postJson('/api/system/certificates', [
            'student_id' => $student->id,
            'type'       => 'hifz_milestone',
            'title'      => 'Test cert',
            'issued_on'  => now()->toDateString(),
        ]);

        $response->assertCreated();
        $number = $response->json('data.certificate_number');
        $year = now()->year;
        $this->assertStringStartsWith("CRT-{$year}-", $number);
    }

    public function test_issuing_multiple_certificates_gives_sequential_numbers(): void
    {
        $student = Student::factory()->create();
        $year = now()->year;

        $payload = fn () => [
            'student_id' => $student->id,
            'type'       => 'other',
            'title'      => 'Cert',
            'issued_on'  => now()->toDateString(),
        ];

        $r1 = $this->asAdmin()->postJson('/api/system/certificates', $payload());
        $r2 = $this->asAdmin()->postJson('/api/system/certificates', $payload());

        $n1 = $r1->json('data.certificate_number');
        $n2 = $r2->json('data.certificate_number');

        $seq1 = (int) explode('-', $n1)[2];
        $seq2 = (int) explode('-', $n2)[2];

        $this->assertEquals(1, $seq2 - $seq1);
    }

    public function test_admin_can_revoke_certificate(): void
    {
        $cert = Certificate::factory()->create(['revoked_at' => null]);

        $this->asAdmin()
            ->postJson('/api/system/certificates/' . $cert->id . '/revoke')
            ->assertOk()
            ->assertJsonPath('data.id', $cert->id);

        $this->assertDatabaseHas('sys_certificates', [
            'id' => $cert->id,
        ]);

        $cert->refresh();
        $this->assertNotNull($cert->revoked_at);
    }

    public function test_revoke_returns_404_for_missing_certificate(): void
    {
        $this->asAdmin()
            ->postJson('/api/system/certificates/9999/revoke')
            ->assertNotFound();
    }

    public function test_teacher_without_permission_cannot_list_certificates(): void
    {
        ['user' => $user] = $this->teacherUser();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/system/certificates')
            ->assertForbidden();
    }
}
