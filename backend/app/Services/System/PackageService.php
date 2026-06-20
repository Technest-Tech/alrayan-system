<?php

namespace App\Services\System;

use App\Events\System\PackageCompleted;
use App\Models\System\Lesson;
use App\Models\System\LessonPackageAllocation;
use App\Models\System\Student;
use App\Models\System\StudentPackage;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class PackageService
{
    /** Package statuses that are immutable once reached (frozen — never re-shifted). */
    private const FROZEN_STATUSES = ['paid', 'suspended'];

    /**
     * Return a live package to satisfy the lesson FK at creation time.
     * The real chronological assignment is done afterwards by rebuild().
     */
    public function resolvePackageForLesson(Student $student, ?Carbon $lessonDate = null): StudentPackage
    {
        $live = StudentPackage::where('student_id', $student->id)
            ->orderByDesc('package_number')
            ->first();
        if ($live) {
            return $live;
        }

        $trashed = StudentPackage::withTrashed()
            ->where('student_id', $student->id)
            ->orderBy('package_number')
            ->first();
        if ($trashed) {
            $trashed->restore();
            return $trashed;
        }

        return $this->createPackage($student, 1);
    }

    /** Create a new package for the student, snapshotting current rates. */
    public function createPackage(Student $student, int $packageNumber, ?int $hours = null): StudentPackage
    {
        return StudentPackage::create([
            'student_id'     => $student->id,
            'package_number' => $packageNumber,
            'package_hours'  => $hours ?? max(1, (int) $student->package_hours_default),
            'tariff_at_time' => $student->hourly_rate_minor,
            'currency'       => $student->currency,
            'status'         => 'pending',
        ]);
    }

    /** Hours consumed in a package (allocation-based, split-aware). */
    public function calculateConsumedHours(int $packageId): float
    {
        return (float) LessonPackageAllocation::where('package_id', $packageId)->sum('hours');
    }

    /**
     * THE canonical engine. Re-walks every lesson chronologically and rebuilds package
     * assignments, splits, allocations and session numbers for one student.
     *
     * Rules:
     *  - Only CONSUMING statuses (attended / paid_absence / cancelled_by_student) fill hours.
     *  - A lesson that crosses a package limit is split: it fills the current package exactly
     *    to its limit and the overflow flows into the next package (created if needed).
     *  - Paid/suspended packages are FROZEN — their allocations & hours never change; the active
     *    re-shift only flows through pending packages (and new ones).
     *  - session_number_hours = cumulative consuming-hours within the lesson's (first) package.
     *    Non-consuming lessons keep a package pointer with 0 hours and no allocation.
     */
    public function rebuild(Student $student): void
    {
        $completedPackageIds = [];

        DB::transaction(function () use ($student, &$completedPackageIds) {
            // Serialize concurrent rebuilds for the same student.
            Student::whereKey($student->id)->lockForUpdate()->first();

            $defaultHours = max(1, (int) $student->package_hours_default);

            $packages = StudentPackage::withTrashed()
                ->where('student_id', $student->id)
                ->orderBy('package_number')
                ->get();

            $isFrozen = fn (StudentPackage $p) =>
                in_array($p->status, self::FROZEN_STATUSES, true) && is_null($p->deleted_at);

            $frozenPackageIds = $packages->filter($isFrozen)->pluck('id')->all();

            // Drop every non-frozen allocation; frozen ones are preserved.
            $deletablePackageIds = $packages->reject($isFrozen)->pluck('id')->all();
            if ($deletablePackageIds) {
                LessonPackageAllocation::whereIn('package_id', $deletablePackageIds)->delete();
            }

            // Minutes of each lesson already locked into frozen packages (usually 0).
            $frozenMinutesByLesson = [];
            if ($frozenPackageIds) {
                foreach (LessonPackageAllocation::whereIn('package_id', $frozenPackageIds)->get() as $a) {
                    $frozenMinutesByLesson[$a->lesson_id] =
                        ($frozenMinutesByLesson[$a->lesson_id] ?? 0) + (int) round($a->hours * 60);
                }
            }

            // Non-frozen packages, in number order, are the slots we refill first.
            $slots      = $packages->reject($isFrozen)->sortBy('package_number')->values();
            $slotIndex  = 0;
            $maxNumber  = (int) ($packages->max('package_number') ?? 0);

            $nextPackage = function () use (&$slots, &$slotIndex, &$maxNumber, $student, $defaultHours) {
                if ($slotIndex < $slots->count()) {
                    $pkg = $slots[$slotIndex++];
                    if ($pkg->trashed()) {
                        $pkg->restore();
                    }
                    return $pkg;
                }
                $maxNumber++;
                return $this->createPackage($student, $maxNumber, $defaultHours);
            };

            $lessons = Lesson::where('student_id', $student->id)
                ->orderBy('scheduled_at')
                ->orderBy('id')
                ->get();

            $current        = null;   // StudentPackage currently being filled
            $currentMin     = 0;      // minutes already placed in $current
            $usedPackageIds = [];
            $allocRows      = [];
            $lessonUpdates  = [];
            $now            = now()->toDateTimeString();

            foreach ($lessons as $lesson) {
                $duration   = (int) $lesson->duration_minutes;
                $frozenMin  = $frozenMinutesByLesson[$lesson->id] ?? 0;

                if (!$lesson->isConsuming()) {
                    if ($current === null) { $current = $nextPackage(); $currentMin = 0; }
                    $lessonUpdates[$lesson->id] = ['package_id' => $current->id, 'session_number_hours' => 0];
                    $usedPackageIds[$current->id] = true;
                    continue;
                }

                $remaining = $duration - $frozenMin;
                if ($remaining <= 0) {
                    // Fully locked into a frozen package — leave the lesson untouched.
                    if ($lesson->package_id) { $usedPackageIds[$lesson->package_id] = true; }
                    continue;
                }

                $firstPkgId = null; $firstCum = null; $ordinal = 0;

                while ($remaining > 0) {
                    if ($current === null) { $current = $nextPackage(); $currentMin = 0; }
                    $limit = max(1, (int) $current->package_hours) * 60;

                    if ($currentMin >= $limit) {
                        $completedPackageIds[$current->id] = true;
                        $current = $nextPackage(); $currentMin = 0;
                        $limit = max(1, (int) $current->package_hours) * 60;
                    }

                    $place = min($remaining, $limit - $currentMin);
                    $currentMin += $place;
                    $ordinal++;
                    $cum = round($currentMin / 60, 2);

                    $allocRows[] = [
                        'lesson_id'        => $lesson->id,
                        'package_id'       => $current->id,
                        'hours'            => round($place / 60, 2),
                        'cumulative_hours' => $cum,
                        'ordinal'          => $ordinal,
                        'created_at'       => $now,
                        'updated_at'       => $now,
                    ];
                    $usedPackageIds[$current->id] = true;
                    if ($firstPkgId === null) { $firstPkgId = $current->id; $firstCum = $cum; }

                    $remaining -= $place;
                    if ($currentMin >= $limit && $remaining > 0) {
                        $completedPackageIds[$current->id] = true;
                        $current = $nextPackage(); $currentMin = 0;
                    }
                }

                if ($frozenMin > 0) {
                    // Straddles a freeze boundary: its primary (frozen) package_id/session stay.
                    if ($lesson->package_id) { $usedPackageIds[$lesson->package_id] = true; }
                } else {
                    $lessonUpdates[$lesson->id] = ['package_id' => $firstPkgId, 'session_number_hours' => $firstCum];
                }
            }

            // A package that ended exactly full is complete.
            if ($current !== null && $currentMin >= max(1, (int) $current->package_hours) * 60) {
                $completedPackageIds[$current->id] = true;
            }

            foreach ($lessonUpdates as $lessonId => $vals) {
                Lesson::whereKey($lessonId)->update($vals); // query-builder update = no model events / no log spam
            }
            if ($allocRows) {
                LessonPackageAllocation::insert($allocRows);
            }

            // Soft-delete unused non-frozen packages; keep used ones live.
            foreach (StudentPackage::withTrashed()->where('student_id', $student->id)->get() as $p) {
                if (in_array($p->status, self::FROZEN_STATUSES, true) && is_null($p->deleted_at)) {
                    continue;
                }
                if (isset($usedPackageIds[$p->id])) {
                    if ($p->trashed()) { $p->restore(); }
                } elseif (!$p->trashed()) {
                    $p->delete();
                }
            }
        });

        // Dispatch after commit so a rolled-back tx never spawns a task. Idempotent downstream.
        foreach (array_keys($completedPackageIds) as $pid) {
            $pkg = StudentPackage::find($pid);
            if ($pkg && $pkg->status === 'pending') {
                PackageCompleted::dispatch($pkg);
            }
        }
    }

    // ── Backwards-compatible shims (all consumption mutations funnel into rebuild) ──

    public function recalculateSessionNumbers(int $packageId): void
    {
        $pkg = StudentPackage::withTrashed()->find($packageId);
        if ($pkg && $pkg->student) {
            $this->rebuild($pkg->student);
        }
    }

    public function repackage(Student $student): void
    {
        $this->rebuild($student);
    }
}
