<?php

namespace App\Services\System;

use App\Models\System\Student;
use App\Models\System\StudentPackage;
use App\Models\User;
use App\Support\System\NotificationTypes;
use Illuminate\Support\Facades\DB;

/**
 * In-app notifications for a student's assigned teacher: a student assigned to them, a
 * package paid, a package used up.
 *
 * Each one waits for the surrounding transaction to commit, so a rolled-back save never
 * notifies and the message reads committed data — enrolment creates the student's first
 * package in the same transaction that assigns the teacher, for one.
 *
 * The English title/body are a fallback; the panel renders these types from `payload` in
 * the teacher's own language. Prices are never included: pricing is finance-only.
 */
class TeacherNotifier
{
    public function studentAssigned(Student $student): void
    {
        DB::afterCommit(function () use ($student) {
            $student = $student->fresh();
            $teacher = $this->teacherUserFor($student);
            if (! $teacher) {
                return;
            }

            $hours = $this->currentPackageHours($student);

            NotificationService::push(
                $teacher,
                NotificationTypes::TEACHER_STUDENT_ASSIGNED,
                'New student assigned',
                "{$student->name} has been assigned to you." . ($hours > 0 ? " Package: {$hours} hours." : ''),
                $this->studentLink($student),
                [
                    'student_id'    => $student->id,
                    'student_name'  => $student->name,
                    'package_hours' => $hours,
                ],
            );
        });
    }

    public function packagePaid(StudentPackage $package): void
    {
        DB::afterCommit(function () use ($package) {
            $package = $package->fresh();
            // Reset to pending again before the commit: nothing was paid after all.
            if (! $package || $package->status !== 'paid') {
                return;
            }

            $this->pushForPackage(
                $package,
                NotificationTypes::TEACHER_PACKAGE_PAID,
                'New package paid',
                fn (string $name, string $label) => "{$name} paid {$label} ({$package->package_hours} hours).",
            );
        });
    }

    public function packageCompleted(StudentPackage $package): void
    {
        DB::afterCommit(function () use ($package) {
            $package = $package->fresh();
            if (! $package) {
                return;
            }

            $this->pushForPackage(
                $package,
                NotificationTypes::TEACHER_PACKAGE_COMPLETED,
                'Package completed',
                fn (string $name, string $label) => "{$name} has finished {$label} ({$package->package_hours} hours).",
            );
        });
    }

    /**
     * One notification per package and event, ever: the engine re-detects a full package on
     * every later lesson edit, and a package can be reset to pending and paid again.
     */
    private function pushForPackage(StudentPackage $package, string $type, string $title, callable $body): void
    {
        $student = $package->student;
        $teacher = $this->teacherUserFor($student);
        if (! $teacher) {
            return;
        }

        $label = (int) $package->package_number === PackageService::FIRST_PACKAGE_NUMBER
            ? 'the down-payment package'
            : "package #{$package->package_number}";

        NotificationService::pushOnce(
            $teacher,
            $type,
            $title,
            $body($student->name, $label),
            $this->studentLink($student) . "&package={$package->id}",
            [
                'student_id'     => $student->id,
                'student_name'   => $student->name,
                'package_id'     => $package->id,
                'package_number' => (int) $package->package_number,
                'package_hours'  => (int) $package->package_hours,
            ],
        );
    }

    private function teacherUserFor(?Student $student): ?User
    {
        return $student?->assignedTeacher?->user;
    }

    /** The deal the student is on: their latest real package, else the enrolment default. */
    private function currentPackageHours(Student $student): int
    {
        $latest = StudentPackage::where('student_id', $student->id)
            ->where('package_hours', '>', 0)
            ->orderByDesc('package_number')
            ->value('package_hours');

        return (int) ($latest ?? $student->package_hours_default ?? 0);
    }

    /** Opens the teacher's My Students page on this student. */
    private function studentLink(Student $student): string
    {
        return "/teacher/students?student={$student->id}";
    }
}
