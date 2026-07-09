<?php

namespace Tests\Feature\System;

use App\Jobs\System\SendLessonReport;
use App\Models\System\Guardian;
use App\Models\System\Lesson;
use App\Models\System\Student;
use App\Models\System\StudentPackage;
use App\Models\System\Teacher;
use App\Models\System\WhatsAppSendLog;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\SystemTestCase;

/**
 * The queue runs synchronously here and the renderer is faked, so a "create &
 * send" walks the whole pipeline: lesson -> Blade -> public disk -> send log.
 * The fake renderer stores the HTML it would have rasterised, which is what
 * lets these tests assert on the template itself.
 */
class LessonReportEndpointsTest extends SystemTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
    }

    private function lessonStudent(array $overrides = []): Student
    {
        return Student::factory()->create(array_merge([
            'package_hours_default' => 8,
            'hourly_rate_minor'     => 5000,
            'currency'              => 'USD',
            'whatsapp'              => '+15550001111',
        ], $overrides));
    }

    private function payload(Student $student, Teacher $teacher, array $overrides = []): array
    {
        return array_merge([
            'teacher_id'       => $teacher->id,
            'student_id'       => $student->id,
            'scheduled_at'     => now()->setTime(10, 0)->toIso8601String(),
            'duration_minutes' => 60,
            'status'           => 'attended',
            'content'          => 'Unit 6, page 111.',
        ], $overrides);
    }

    private function storedReport(): string
    {
        $disk  = Storage::disk('public');
        $files = $disk->allFiles('system/lesson-reports');

        $this->assertCount(1, $files, 'Expected exactly one rendered report on the public disk.');

        return $disk->get($files[0]);
    }

    /* ───────────────────────  DISPATCH  ─────────────────────── */

    public function test_creating_a_lesson_without_send_report_queues_nothing(): void
    {
        Queue::fake();

        $student = $this->lessonStudent();
        $teacher = Teacher::factory()->create();

        $this->asAdmin()
            ->postJson('/api/system/lessons', $this->payload($student, $teacher))
            ->assertCreated();

        Queue::assertNotPushed(SendLessonReport::class);
    }

    public function test_creating_a_lesson_with_send_report_queues_the_report(): void
    {
        Queue::fake();

        $student = $this->lessonStudent();
        $teacher = Teacher::factory()->create();

        $this->asAdmin()
            ->postJson('/api/system/lessons', $this->payload($student, $teacher, ['send_report' => true]))
            ->assertCreated();

        Queue::assertPushedOn('notifications', SendLessonReport::class);
    }

    /* ───────────────────────  RECIPIENT  ────────────────────── */

    public function test_an_adult_students_report_goes_to_their_own_number(): void
    {
        $student = $this->lessonStudent(['student_type' => 'adult', 'whatsapp' => '+1 555 000 2222']);
        $teacher = Teacher::factory()->create();

        $this->asAdmin()
            ->postJson('/api/system/lessons', $this->payload($student, $teacher, ['send_report' => true]))
            ->assertCreated();

        $log = WhatsAppSendLog::sole();

        $this->assertSame('15550002222', $log->recipient_phone);
        $this->assertSame(WhatsAppSendLog::KIND_REPORT, $log->kind);
    }

    public function test_a_childs_report_goes_to_their_guardian(): void
    {
        $guardian = Guardian::factory()->create(['whatsapp' => '+15559998888']);
        $student  = $this->lessonStudent([
            'student_type' => 'child',
            'guardian_id'  => $guardian->id,
            'whatsapp'     => '+15550001111',
        ]);
        $teacher = Teacher::factory()->create();

        $this->asAdmin()
            ->postJson('/api/system/lessons', $this->payload($student, $teacher, ['send_report' => true]))
            ->assertCreated();

        $this->assertSame('15559998888', WhatsAppSendLog::sole()->recipient_phone);
    }

    public function test_an_adult_without_a_number_falls_back_to_their_guardian(): void
    {
        $guardian = Guardian::factory()->create(['whatsapp' => '+15557776666']);
        $student  = $this->lessonStudent([
            'student_type' => 'adult',
            'guardian_id'  => $guardian->id,
            'whatsapp'     => null,
        ]);
        $teacher = Teacher::factory()->create();

        $this->asAdmin()
            ->postJson('/api/system/lessons', $this->payload($student, $teacher, ['send_report' => true]))
            ->assertCreated();

        $this->assertSame('15557776666', WhatsAppSendLog::sole()->recipient_phone);
    }

    public function test_an_unreachable_student_is_rejected_before_the_lesson_is_created(): void
    {
        $student = $this->lessonStudent(['whatsapp' => null, 'guardian_id' => null]);
        $teacher = Teacher::factory()->create();

        $this->asAdmin()
            ->postJson('/api/system/lessons', $this->payload($student, $teacher, ['send_report' => true]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('send_report');

        $this->assertSame(0, Lesson::count());
        $this->assertSame(0, WhatsAppSendLog::count());
    }

    public function test_a_malformed_number_falls_through_to_the_other_party(): void
    {
        $guardian = Guardian::factory()->create(['whatsapp' => '+15554443333']);
        $student  = $this->lessonStudent([
            'student_type' => 'adult',
            'guardian_id'  => $guardian->id,
            'whatsapp'     => '123', // too short for an international number
        ]);
        $teacher = Teacher::factory()->create();

        $this->asAdmin()
            ->postJson('/api/system/lessons', $this->payload($student, $teacher, ['send_report' => true]))
            ->assertCreated();

        $this->assertSame('15554443333', WhatsAppSendLog::sole()->recipient_phone);
    }

    /* ───────────────────────  RENDERING  ────────────────────── */

    public function test_the_report_is_published_to_a_public_https_url(): void
    {
        $student = $this->lessonStudent();
        $teacher = Teacher::factory()->create();

        $this->asAdmin()
            ->postJson('/api/system/lessons', $this->payload($student, $teacher, ['send_report' => true]))
            ->assertCreated();

        $log = WhatsAppSendLog::sole();

        $this->assertStringStartsWith('https://reports.test/storage/system/lesson-reports/', $log->image_url);
        $this->assertStringContainsString($student->name, (string) $log->caption);
        $this->assertSame(WhatsAppSendLog::STATUS_ACCEPTED, $log->status);
    }

    public function test_an_attended_lesson_renders_the_report_variant(): void
    {
        $student = $this->lessonStudent();
        $teacher = Teacher::factory()->create();

        $this->asAdmin()
            ->postJson('/api/system/lessons', $this->payload($student, $teacher, ['send_report' => true]))
            ->assertCreated();

        $html = $this->storedReport();

        $this->assertStringContainsString('Un cours a été enregistré pour', $html);
        $this->assertStringContainsString('Unit 6, page 111.', $html);
        $this->assertStringNotContainsString('Nous avons remarqué', $html);
    }

    public function test_an_absent_lesson_renders_the_condolence_variant(): void
    {
        $student = $this->lessonStudent();
        $teacher = Teacher::factory()->create();

        $this->asAdmin()
            ->postJson('/api/system/lessons', $this->payload($student, $teacher, [
                'send_report' => true,
                'status'      => 'absent',
                'content'     => null,
            ]))
            ->assertCreated();

        $html = $this->storedReport();

        $this->assertStringContainsString('Nous avons remarqué', $html);
        $this->assertStringNotContainsString('Un cours a été enregistré pour', $html);
    }

    public function test_the_report_shows_package_progress(): void
    {
        $student = $this->lessonStudent(['package_hours_default' => 8]);
        $teacher = Teacher::factory()->create();

        $this->asAdmin()
            ->postJson('/api/system/lessons', $this->payload($student, $teacher, [
                'send_report'      => true,
                'duration_minutes' => 120,
            ]))
            ->assertCreated();

        $package = StudentPackage::where('student_id', $student->id)->sole();

        $this->assertSame(8, $package->package_hours);
        $this->assertSame(2.0, $package->consumed_hours);

        // 2h of an 8h package.
        $this->assertStringContainsString('25%', $this->storedReport());
    }

    /* ───────────────────────  RESEND  ───────────────────────── */

    public function test_a_lesson_report_can_be_re_sent(): void
    {
        $guardian = Guardian::factory()->create(['whatsapp' => '+15551112222']);
        $student  = $this->lessonStudent(['student_type' => 'child', 'guardian_id' => $guardian->id]);
        $teacher  = Teacher::factory()->create();

        $lesson = $this->asAdmin()
            ->postJson('/api/system/lessons', $this->payload($student, $teacher))
            ->assertCreated()
            ->json('data.id');

        $this->assertSame(0, WhatsAppSendLog::count());

        $this->asAdmin()
            ->postJson("/api/system/lessons/{$lesson}/report")
            ->assertStatus(202)
            ->assertJsonPath('data.recipient_kind', 'guardian')
            ->assertJsonPath('data.recipient_name', $guardian->name);

        $this->assertSame('15551112222', WhatsAppSendLog::sole()->recipient_phone);
    }

    public function test_re_sending_a_report_for_an_unreachable_student_fails(): void
    {
        $student = $this->lessonStudent(['whatsapp' => null, 'guardian_id' => null]);
        $teacher = Teacher::factory()->create();

        $lesson = $this->asAdmin()
            ->postJson('/api/system/lessons', $this->payload($student, $teacher))
            ->assertCreated()
            ->json('data.id');

        $this->asAdmin()
            ->postJson("/api/system/lessons/{$lesson}/report")
            ->assertStatus(422)
            ->assertJsonValidationErrors('send_report');

        $this->assertSame(0, WhatsAppSendLog::count());
    }

    public function test_re_sending_a_report_requires_the_lessons_edit_permission(): void
    {
        $student = $this->lessonStudent();
        $teacher = Teacher::factory()->create();

        $lesson = $this->asAdmin()
            ->postJson('/api/system/lessons', $this->payload($student, $teacher))
            ->assertCreated()
            ->json('data.id');

        $this->actingAs($this->staffUser('accountant'), 'sanctum')
            ->postJson("/api/system/lessons/{$lesson}/report")
            ->assertStatus(403);
    }

    public function test_re_sending_a_report_requires_authentication(): void
    {
        $this->postJson('/api/system/lessons/1/report')->assertStatus(401);
    }
}
