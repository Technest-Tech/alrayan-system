<?php

namespace App\Services\System;

use App\Models\System\Lesson;
use App\Models\System\Student;
use App\Models\System\StudentPackage;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class PackageService
{
    /** Get or create the right package for a new lesson being added. */
    public function resolvePackageForLesson(Student $student, Carbon $lessonDate): StudentPackage
    {
        $latest = StudentPackage::where('student_id', $student->id)
            ->withoutTrashed()
            ->orderByDesc('package_number')
            ->first();

        if (!$latest) {
            return $this->createPackage($student, 1);
        }

        $consumed = $this->calculateConsumedHours($latest->id);
        if ($consumed >= $latest->package_hours && $latest->package_hours > 0) {
            return $this->createPackage($student, $latest->package_number + 1);
        }

        return $latest;
    }

    /** Create a new package for the student, snapshotting current rates. */
    public function createPackage(Student $student, int $packageNumber): StudentPackage
    {
        return StudentPackage::create([
            'student_id'     => $student->id,
            'package_number' => $packageNumber,
            'package_hours'  => max(1, $student->package_hours_default),
            'tariff_at_time' => $student->hourly_rate_minor,
            'currency'       => $student->currency,
            'status'         => 'pending',
        ]);
    }

    /** Sum of non-cancelled lesson hours in a package. */
    public function calculateConsumedHours(int $packageId): float
    {
        return (float) Lesson::where('package_id', $packageId)
            ->whereNotIn('status', ['cancelled'])
            ->sum(DB::raw('duration_minutes / 60.0'));
    }

    /** Recalculate cumulative session_number_hours for all non-cancelled lessons in a package, ordered by scheduled_at. */
    public function recalculateSessionNumbers(int $packageId): void
    {
        $lessons = Lesson::where('package_id', $packageId)
            ->whereNotIn('status', ['cancelled'])
            ->orderBy('scheduled_at')
            ->get();

        $cumulative = 0.0;
        foreach ($lessons as $lesson) {
            $cumulative += $lesson->duration_minutes / 60.0;
            $lesson->updateQuietly(['session_number_hours' => $cumulative]);
        }
    }

    /**
     * Full re-packaging when student's package_hours_default changes.
     * Re-walks ALL non-cancelled lessons and rebuilds package assignments.
     * Marks previously-paid packages that changed as needs_reconfirmation=true.
     */
    public function repackage(Student $student): void
    {
        DB::transaction(function () use ($student) {
            $packageHours = $student->package_hours_default;
            if ($packageHours <= 0) return;

            $lessons = Lesson::where('student_id', $student->id)
                ->whereNotIn('status', ['cancelled'])
                ->orderBy('scheduled_at')
                ->get();

            if ($lessons->isEmpty()) return;

            // Get existing packages keyed by package_number
            $existing = StudentPackage::where('student_id', $student->id)
                ->withTrashed()
                ->orderBy('package_number')
                ->get()
                ->keyBy('package_number');

            // Group lessons into new packages
            $groups   = [];
            $groupIdx = 1;
            $groupHrs = 0.0;
            $group    = [];

            foreach ($lessons as $lesson) {
                $lh = $lesson->duration_minutes / 60.0;
                if (!empty($group) && ($groupHrs + $lh) > $packageHours) {
                    $groups[$groupIdx++] = $group;
                    $group               = [];
                    $groupHrs            = 0.0;
                }
                $group[]   = $lesson;
                $groupHrs += $lh;
            }
            if (!empty($group)) {
                $groups[$groupIdx] = $group;
            }

            // Soft-delete packages that no longer exist
            StudentPackage::where('student_id', $student->id)
                ->whereNotIn('package_number', array_keys($groups))
                ->delete();

            foreach ($groups as $num => $groupLessons) {
                $pkg = $existing->get($num);

                if ($pkg) {
                    if ($pkg->trashed()) $pkg->restore();
                    $needsReconfirm = $pkg->status === 'paid';
                    $pkg->update([
                        'package_hours'        => $packageHours,
                        'needs_reconfirmation' => $needsReconfirm,
                    ]);
                } else {
                    $pkg = StudentPackage::create([
                        'student_id'     => $student->id,
                        'package_number' => $num,
                        'package_hours'  => $packageHours,
                        'tariff_at_time' => $student->hourly_rate_minor,
                        'currency'       => $student->currency,
                        'status'         => 'pending',
                    ]);
                }

                $cumulative = 0.0;
                foreach ($groupLessons as $lesson) {
                    $cumulative += $lesson->duration_minutes / 60.0;
                    $lesson->updateQuietly([
                        'package_id'           => $pkg->id,
                        'session_number_hours' => $cumulative,
                    ]);
                }
            }
        });
    }
}
