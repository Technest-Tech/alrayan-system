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
    /**
     * Package statuses that are protected from auto-deletion: a rebuild never removes
     * their row even if they end up with no lessons. They still fully re-shift/re-count
     * like any other package — protection is only about keeping the record, not freezing it.
     */
    private const PROTECTED_STATUSES = ['paid', 'suspended'];

    /**
     * A package's hours determine whether it consumes lessons. `package_hours > 0` is a real
     * lesson package (a "slot" the engine fills); `package_hours <= 0` is a legacy down-payment
     * record (Package #0) kept only for backwards compatibility — it never consumes and is never
     * auto-deleted. New students no longer get a #0: their first payment IS lesson Package #1.
     */

    /**
     * Return a live package to satisfy the lesson FK at creation time.
     * The real chronological assignment is done afterwards by rebuild().
     */
    public function resolvePackageForLesson(Student $student, ?Carbon $lessonDate = null): StudentPackage
    {
        $live = StudentPackage::where('student_id', $student->id)
            ->where('package_hours', '>', 0)
            ->orderByDesc('package_number')
            ->first();
        if ($live) {
            return $live;
        }

        $trashed = StudentPackage::withTrashed()
            ->where('student_id', $student->id)
            ->where('package_hours', '>', 0)
            ->orderBy('package_number')
            ->first();
        if ($trashed) {
            $trashed->restore();
            return $trashed;
        }

        return $this->createPackage($student, $this->nextPackageNumber($student));
    }

    /** Next 1-indexed package number for the student (max existing + 1, min 1). */
    private function nextPackageNumber(Student $student): int
    {
        $max = (int) StudentPackage::withTrashed()->where('student_id', $student->id)->max('package_number');
        return max(1, $max + 1);
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

    /**
     * Ensure the student's first lesson package exists — this IS the "down payment": a real
     * Package #1 carrying the enrolled hours, following the normal pending → paid lifecycle, and
     * whose lessons count as paid once it is paid. Idempotent: returns the existing first lesson
     * package if one is already present (restoring it if it was soft-deleted).
     */
    public function ensureFirstPackage(Student $student, ?int $hours = null): StudentPackage
    {
        $existing = StudentPackage::withTrashed()
            ->where('student_id', $student->id)
            ->where('package_hours', '>', 0)
            ->orderBy('package_number')
            ->first();
        if ($existing) {
            if ($existing->trashed()) {
                $existing->restore();
            }
            return $existing;
        }

        return $this->createPackage($student, $this->nextPackageNumber($student), $hours);
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
     *  - EVERY package re-shifts — paid/suspended packages re-count exactly like pending ones,
     *    so an edit cascades through all of them (each keeps its own package_hours limit). Paid/
     *    suspended packages are only PROTECTED from auto-deletion, never frozen against re-shift.
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

            // Every package is re-shiftable: drop all allocations and rebuild from scratch.
            $allPackageIds = $packages->pluck('id')->all();
            if ($allPackageIds) {
                LessonPackageAllocation::whereIn('package_id', $allPackageIds)->delete();
            }

            // Real lesson packages (hours > 0), in number order, are the slots we refill first
            // (new ones appended). Legacy 0-hour down-payment rows are never slots — they don't
            // consume lessons.
            $slots      = $packages
                ->where('package_hours', '>', 0)
                ->sortBy('package_number')
                ->values();
            $slotIndex  = 0;
            $maxNumber  = (int) ($packages->max('package_number') ?? 0);
            $firstNumber = (int) ($packages->min('package_number') ?? 1);

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
                $duration = (int) $lesson->duration_minutes;

                if (!$lesson->isConsuming()) {
                    if ($current === null) { $current = $nextPackage(); $currentMin = 0; }
                    $lessonUpdates[$lesson->id] = ['package_id' => $current->id, 'session_number_hours' => 0];
                    $usedPackageIds[$current->id] = true;
                    continue;
                }

                $remaining = $duration;
                if ($remaining <= 0) {
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

                $lessonUpdates[$lesson->id] = ['package_id' => $firstPkgId, 'session_number_hours' => $firstCum];
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

            // Keep used packages live, paid/suspended ones protected, the first package (the down
            // payment, collected upfront) always kept, and legacy 0-hour rows always kept;
            // soft-delete the rest.
            foreach (StudentPackage::withTrashed()->where('student_id', $student->id)->get() as $p) {
                $isProtected = ((int) $p->package_number === $firstNumber && is_null($p->deleted_at))
                    || ((int) $p->package_hours <= 0)
                    || (in_array($p->status, self::PROTECTED_STATUSES, true) && is_null($p->deleted_at));
                if (isset($usedPackageIds[$p->id]) || $isProtected) {
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
