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
     * The down-payment "package" number. Package #0 is the student's initial down payment:
     * its own charge (amount = one package price), NOT a lesson-consuming package. It never
     * receives lesson allocations and is never auto-deleted. Lesson packages start at #1.
     */
    public const DOWN_PAYMENT_NUMBER = 0;

    /**
     * Return a live package to satisfy the lesson FK at creation time.
     * The real chronological assignment is done afterwards by rebuild().
     */
    public function resolvePackageForLesson(Student $student, ?Carbon $lessonDate = null): StudentPackage
    {
        $live = StudentPackage::where('student_id', $student->id)
            ->where('package_number', '>', self::DOWN_PAYMENT_NUMBER)
            ->orderByDesc('package_number')
            ->first();
        if ($live) {
            return $live;
        }

        $trashed = StudentPackage::withTrashed()
            ->where('student_id', $student->id)
            ->where('package_number', '>', self::DOWN_PAYMENT_NUMBER)
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

    /**
     * Create (idempotently) the student's down payment — Package #0. It is a standalone charge
     * priced at one package (the enrolled price), never consumes lessons, and follows the normal
     * pending → paid lifecycle. Returns the existing row if one is already present.
     */
    public function createDownPayment(Student $student): StudentPackage
    {
        $existing = StudentPackage::withTrashed()
            ->where('student_id', $student->id)
            ->where('package_number', self::DOWN_PAYMENT_NUMBER)
            ->first();
        if ($existing) {
            if ($existing->trashed()) {
                $existing->restore();
            }
            return $existing;
        }

        return StudentPackage::create([
            'student_id'     => $student->id,
            'package_number' => self::DOWN_PAYMENT_NUMBER,
            'package_hours'  => 0,
            'tariff_at_time' => (int) $student->hourly_rate_minor,
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

            // Lesson packages (#1+), in number order, are the slots we refill first (new ones
            // appended). The down payment (#0) is never a slot — it doesn't consume lessons.
            $slots      = $packages
                ->where('package_number', '>', self::DOWN_PAYMENT_NUMBER)
                ->sortBy('package_number')
                ->values();
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

            // Keep used packages live, paid/suspended ones protected, and the down payment (#0)
            // always kept; soft-delete the rest.
            foreach (StudentPackage::withTrashed()->where('student_id', $student->id)->get() as $p) {
                $isProtected = ($p->package_number === self::DOWN_PAYMENT_NUMBER)
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
