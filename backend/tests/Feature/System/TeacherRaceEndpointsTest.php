<?php

namespace Tests\Feature\System;

use App\Models\System\Lesson;
use App\Models\System\Student;
use App\Models\System\StudentPackage;
use App\Models\System\Teacher;
use Tests\SystemTestCase;

class TeacherRaceEndpointsTest extends SystemTestCase
{
    /** A lesson the teacher is credited for — the Race counts these, nothing else. */
    private function attendedLesson(Teacher $teacher, string $start, int $duration): void
    {
        $student = Student::factory()->create([
            'assigned_teacher_id' => $teacher->id,
            'currency'            => 'USD',
        ]);

        $package = StudentPackage::create([
            'student_id'     => $student->id,
            'package_number' => 1,
            'package_hours'  => 8,
            'tariff_at_time' => 5000,
            'currency'       => 'USD',
            'status'         => 'paid',
        ]);

        Lesson::create([
            'package_id'       => $package->id,
            'teacher_id'       => $teacher->id,
            'student_id'       => $student->id,
            'status'           => 'attended',
            'scheduled_at'     => $start,
            'duration_minutes' => $duration,
        ]);
    }

    public function test_month_range_ranks_every_active_teacher_by_attended_hours(): void
    {
        $leader = Teacher::factory()->create();
        $second = Teacher::factory()->create();
        $idle   = Teacher::factory()->create();
        Teacher::factory()->inactive()->create();

        $this->attendedLesson($leader, '2026-07-10 10:00:00', 120);
        $this->attendedLesson($second, '2026-07-11 10:00:00', 60);
        $this->attendedLesson($second, '2026-06-11 10:00:00', 180);

        $response = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/teachers/race?month=2026-07')
            ->assertOk()
            ->assertJsonPath('range', 'month')
            ->assertJsonPath('month', '2026-07');

        $racers = collect($response->json('racers'));
        $this->assertCount(3, $racers);
        $this->assertSame([$leader->id, $second->id, $idle->id], $racers->pluck('teacher_id')->all());
        $this->assertSame([1, 2, 3], $racers->pluck('rank')->all());
    }

    public function test_an_admin_sees_every_racers_hours(): void
    {
        $leader = Teacher::factory()->create();
        $second = Teacher::factory()->create();
        $this->attendedLesson($leader, '2026-07-10 10:00:00', 120);
        $this->attendedLesson($second, '2026-07-11 10:00:00', 90);

        $response = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/teachers/race?month=2026-07')
            ->assertOk()
            ->assertJsonMissingPath('leader_hours');

        $this->assertEquals([2, 1.5], collect($response->json('racers'))->pluck('hours')->all());
    }

    public function test_a_teacher_sees_only_their_own_hours(): void
    {
        ['user' => $user, 'teacher' => $me] = $this->teacherUser();
        $rival = Teacher::factory()->create();
        $this->attendedLesson($rival, '2026-07-10 10:00:00', 120);
        $this->attendedLesson($me, '2026-07-11 10:00:00', 90);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/system/teachers/race?month=2026-07')
            ->assertOk()
            ->assertJsonMissingPath('leader_hours');

        $hours = collect($response->json('racers'))->pluck('hours', 'teacher_id');
        $this->assertSame([$rival->id, $me->id], $hours->keys()->all());   // ranking is still shared
        $this->assertEquals(1.5, $hours[$me->id]);
        $this->assertNull($hours[$rival->id]);
    }

    public function test_all_time_and_custom_ranges_use_the_requested_windows(): void
    {
        $spread = Teacher::factory()->create();
        $recent = Teacher::factory()->create();
        $this->attendedLesson($spread, '2026-05-10 10:00:00', 60);
        $this->attendedLesson($spread, '2026-06-10 10:00:00', 120);
        $this->attendedLesson($recent, '2026-07-10 10:00:00', 120);

        $order = fn ($response) => collect($response->json('racers'))->pluck('teacher_id')->all();

        $all = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/teachers/race?range=all')
            ->assertOk()
            ->assertJsonPath('range', 'all');
        $this->assertSame([$spread->id, $recent->id], $order($all));

        $july = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/teachers/race?range=custom&from=2026-07-01&to=2026-07-31')
            ->assertOk()
            ->assertJsonPath('range', 'custom')
            ->assertJsonPath('from', '2026-07-01')
            ->assertJsonPath('to', '2026-07-31');
        $this->assertSame([$recent->id, $spread->id], $order($july));
    }

    public function test_custom_range_rejects_missing_or_reversed_dates(): void
    {
        $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/teachers/race?range=custom&from=2026-07-01')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('to');

        $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/teachers/race?range=custom&from=2026-07-31&to=2026-07-01')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('to');
    }
}
