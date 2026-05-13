<?php

namespace App\Console\Commands\System;

use App\Jobs\System\CreateSessionZoomMeeting;
use App\Models\System\Student;
use App\Services\System\SessionMaterializer;
use Illuminate\Console\Command;

class MaterializeUpcomingSessions extends Command
{
    protected $signature = 'system:sessions:materialize
                            {--student= : Only materialize for this student ID}
                            {--days=14  : Number of days ahead to materialize}
                            {--all      : Materialize for all active students}';

    protected $description = 'Generate upcoming session rows from recurring schedule patterns';

    public function handle(SessionMaterializer $materializer): int
    {
        $days      = (int) $this->option('days');
        $studentId = $this->option('student');

        if ($studentId) {
            $student = Student::find($studentId);
            if (!$student) {
                $this->error("Student #{$studentId} not found.");
                return self::FAILURE;
            }
            $created = $materializer->materialize($student, $days);
            $this->info("Created {$created->count()} sessions for student #{$studentId}.");
            foreach ($created as $session) {
                CreateSessionZoomMeeting::dispatch($session);
            }
            return self::SUCCESS;
        }

        $total = 0;
        Student::where('status', 'active')->cursor()->each(function (Student $student) use ($materializer, $days, &$total) {
            $created = $materializer->materialize($student, $days);
            $total += $created->count();
            foreach ($created as $session) {
                CreateSessionZoomMeeting::dispatch($session);
            }
        });

        $this->info("Materialized {$total} sessions across all active students ({$days} day window).");
        return self::SUCCESS;
    }
}
