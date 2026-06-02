<?php

namespace App\Services\System;

use App\Models\System\Session;
use App\Models\System\Student;
use Carbon\Carbon;

class ProRataResult
{
    public function __construct(
        public readonly int $monthlyPriceMinor,
        public readonly int $sessionsInMonth,
        public readonly int $remainingSessions,
        public readonly int $perSessionPriceMinor,
        public readonly int $amountMinor,
    ) {}
}

class ProRataCalculator
{
    /**
     * Session-based pro-rata for the current month.
     *
     * Counts remaining sessions = `sys_sessions` rows for this student in the
     * current month that haven't started yet AND are still on the books
     * (status ∈ scheduled / pending_substitute). Amount = remaining × per_session.
     *
     * If the student has no schedule materialized yet, falls back to the
     * contracted `sessions_per_month` minus any already-consumed slots so the
     * preview still renders something sensible.
     */
    public function forCurrentMonth(Student $student, ?Carbon $reference = null, ?Carbon $startFrom = null): ProRataResult
    {
        $ref   = ($reference ?? now())->copy();
        $start = ($startFrom ?? $ref)->copy();
        $monthStart = $ref->copy()->startOfMonth();
        $monthEnd   = $ref->copy()->endOfMonth();

        $monthlyPriceMinor = (int) $student->monthly_price_minor;
        $sessionsInMonth   = max(1, (int) $student->sessions_per_month);
        $perSessionMinor   = (int) floor($monthlyPriceMinor / $sessionsInMonth);

        // Future scheduled sessions in this period (what they're actually paying for).
        $remaining = Session::query()
            ->where('student_id', $student->id)
            ->whereBetween('scheduled_start', [$start, $monthEnd])
            ->whereIn('status', ['scheduled', 'pending_substitute'])
            ->count();

        // Fallback when no schedule rows exist yet (fresh student, mid-month enroll):
        // contracted_quota minus sessions already used this month.
        if ($remaining === 0) {
            $consumed = Session::query()
                ->where('student_id', $student->id)
                ->whereBetween('scheduled_start', [$monthStart, $monthEnd])
                ->where(function ($q) {
                    $q->where('status', 'attended')
                      ->orWhere(function ($q) {
                          $q->where('status', 'absent')
                            ->where('cancelled_by', 'student')
                            ->where('apology_received', false);
                      });
                })
                ->count();
            $remaining = max(0, $sessionsInMonth - $consumed);
        }
        // Clamp upper bound to the contracted quota — don't bill for more than promised.
        $remaining = min($remaining, $sessionsInMonth);

        $amount = $remaining * $perSessionMinor;

        return new ProRataResult(
            monthlyPriceMinor:    $monthlyPriceMinor,
            sessionsInMonth:      $sessionsInMonth,
            remainingSessions:    $remaining,
            perSessionPriceMinor: $perSessionMinor,
            amountMinor:          $amount,
        );
    }
}
