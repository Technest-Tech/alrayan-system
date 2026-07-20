<?php

namespace Tests\Feature\System;

use App\Models\System\Session;
use App\Models\System\Teacher;
use Tests\SystemTestCase;

class TeacherRaceEndpointsTest extends SystemTestCase
{
    private function attendedSession(Teacher $teacher, string $start, int $duration): void
    {
        Session::factory()->create([
            'teacher_id'      => $teacher->id,
            'status'          => 'attended',
            'scheduled_start' => $start,
            'duration_min'    => $duration,
        ]);
    }

    public function test_month_range_ranks_every_active_teacher_by_attended_hours(): void
    {
        $leader = Teacher::factory()->create();
        $second = Teacher::factory()->create();
        $idle   = Teacher::factory()->create();
        Teacher::factory()->inactive()->create();

        $this->attendedSession($leader, '2026-07-10 10:00:00', 120);
        $this->attendedSession($second, '2026-07-11 10:00:00', 60);
        $this->attendedSession($second, '2026-06-11 10:00:00', 180);

        $response = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/teachers/race?month=2026-07')
            ->assertOk()
            ->assertJsonPath('range', 'month')
            ->assertJsonPath('month', '2026-07')
            ->assertJsonPath('leader_hours', 2);

        $racers = collect($response->json('racers'));
        $this->assertCount(3, $racers);
        $this->assertSame([$leader->id, $second->id, $idle->id], $racers->pluck('teacher_id')->all());
        $this->assertSame([1, 2, 3], $racers->pluck('rank')->all());
        $this->assertSame([2, 1, 0], $racers->pluck('hours')->all());
    }

    public function test_all_time_and_custom_ranges_use_the_requested_windows(): void
    {
        $teacher = Teacher::factory()->create();
        $this->attendedSession($teacher, '2026-05-10 10:00:00', 60);
        $this->attendedSession($teacher, '2026-07-10 10:00:00', 120);

        $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/teachers/race?range=all')
            ->assertOk()
            ->assertJsonPath('range', 'all')
            ->assertJsonPath('leader_hours', 3);

        $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/teachers/race?range=custom&from=2026-05-01&to=2026-05-31')
            ->assertOk()
            ->assertJsonPath('range', 'custom')
            ->assertJsonPath('from', '2026-05-01')
            ->assertJsonPath('to', '2026-05-31')
            ->assertJsonPath('leader_hours', 1);
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
