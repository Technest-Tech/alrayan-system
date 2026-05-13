<?php

namespace App\Services\System;

use App\Jobs\System\CreateSessionZoomMeeting;
use App\Jobs\System\DeleteSessionZoomMeeting;
use App\Models\System\SchedulePattern;
use App\Models\System\Session;
use App\Models\System\Student;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class SchedulePatternChange
{
    public function __construct(
        public readonly Collection $deletedSessionCount,
        public readonly Collection $createdSessions,
        public readonly array      $conflicts,
    ) {}
}

class SchedulePatternService
{
    public function __construct(
        private ScheduleConflictDetector    $conflicts,
        private SessionMaterializer         $materializer,
        private TeacherAvailabilityResolver $availability,
    ) {}

    /**
     * Replace a student's active patterns from $effectiveDate onward.
     * Past sessions are never modified.
     */
    public function replaceForward(Student $student, Carbon $effectiveDate, array $patterns, bool $forceConflicts = false): SchedulePatternChange
    {
        if (!$student->assignedTeacher) {
            abort(422, 'Student has no assigned teacher.');
        }

        $teacher        = $student->assignedTeacher;
        $deletedCount   = collect();
        $createdSessions = collect();
        $detectedConflicts = [];

        DB::transaction(function () use ($student, $teacher, $effectiveDate, $patterns, $forceConflicts, &$deletedCount, &$createdSessions, &$detectedConflicts) {
            // 1. Close current open-ended patterns
            SchedulePattern::where('student_id', $student->id)
                ->whereNull('valid_to')
                ->whereNull('deleted_at')
                ->update(['valid_to' => $effectiveDate->copy()->subDay()->toDateString()]);

            // Also clip any patterns that overlap from the effectiveDate onward
            SchedulePattern::where('student_id', $student->id)
                ->whereDate('valid_to', '>=', $effectiveDate->toDateString())
                ->whereNull('deleted_at')
                ->update(['valid_to' => $effectiveDate->copy()->subDay()->toDateString()]);

            // 2. Insert new patterns
            foreach ($patterns as $p) {
                SchedulePattern::create([
                    'student_id'   => $student->id,
                    'teacher_id'   => $teacher->id,
                    'day_of_week'  => $p['day_of_week'],
                    'start_time'   => $p['start_time'],
                    'duration_min' => $p['duration_min'],
                    'timezone'     => $student->timezone ?? config('system.default_timezone'),
                    'valid_from'   => $effectiveDate->toDateString(),
                    'valid_to'     => $p['valid_to'] ?? null,
                ]);
            }

            // 3. Delete future scheduled sessions tied to the now-closed patterns
            $futureSessions = Session::where('student_id', $student->id)
                ->where('scheduled_start', '>=', $effectiveDate)
                ->where('status', 'scheduled')
                ->get();

            foreach ($futureSessions as $s) {
                DeleteSessionZoomMeeting::dispatch($s);
                $s->delete();
            }
            $deletedCount = $futureSessions;

            // 4. Materialize forward
            $days           = (int) config('system.session_materialization_window_days', 14);
            $createdSessions = $this->materializer->materialize($student, $days);

            // 5. Conflict detection (non-blocking unless !forceConflicts is caller's responsibility)
            foreach ($createdSessions as $session) {
                $c = $this->conflicts->check(
                    $session->teacher_id,
                    $session->scheduled_start,
                    $session->scheduled_end,
                    $session->id,
                );
                if (!empty($c)) {
                    $detectedConflicts[] = ['session' => $session, 'conflicts' => $c];
                }
                CreateSessionZoomMeeting::dispatch($session);
            }
        });

        return new SchedulePatternChange($deletedCount, $createdSessions, $detectedConflicts);
    }

    /**
     * Preview materialization without persisting. Returns occurrences + conflicts.
     */
    public function preview(Student $student, Carbon $effectiveDate, array $patterns): array
    {
        if (!$student->assignedTeacher) {
            abort(422, 'Student has no assigned teacher.');
        }

        $teacher    = $student->assignedTeacher;
        $calc       = app(RecurrenceCalculator::class);
        $now        = max(now(), $effectiveDate);
        $end        = $now->copy()->addWeeks(4);
        $occurrences = [];
        $conflicts  = [];

        foreach ($patterns as $p) {
            $fakePattern = new SchedulePattern([
                'teacher_id'   => $teacher->id,
                'student_id'   => $student->id,
                'day_of_week'  => $p['day_of_week'],
                'start_time'   => $p['start_time'],
                'duration_min' => $p['duration_min'],
                'timezone'     => $student->timezone ?? config('system.default_timezone'),
                'valid_from'   => $effectiveDate->toDateString(),
                'valid_to'     => $p['valid_to'] ?? null,
            ]);

            $expanded = $calc->expand($fakePattern, $now, $end);

            foreach ($expanded as $occ) {
                $c = $this->conflicts->check($teacher->id, $occ->startUtc, $occ->endUtc);
                if (!empty($c)) {
                    $conflicts[] = ['start' => $occ->startUtc, 'conflicts' => $c];
                }
                $occurrences[] = [
                    'start'       => $occ->startUtc->toIso8601String(),
                    'end'         => $occ->endUtc->toIso8601String(),
                    'teacher'     => $teacher->user->name ?? '',
                    'has_conflict'=> !empty($c),
                ];
            }
        }

        return compact('occurrences', 'conflicts');
    }
}
