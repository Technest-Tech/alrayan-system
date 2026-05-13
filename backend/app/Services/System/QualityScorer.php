<?php

namespace App\Services\System;

use App\Models\System\Session;
use App\Models\System\SessionReport;
use App\Models\System\Teacher;
use App\Services\System\Dto\QualityScore;
use App\Support\System\Setting;
use Carbon\Carbon;

class QualityScorer
{
    public function score(Teacher $t, Carbon $start, Carbon $end): QualityScore
    {
        $sessions = Session::where('teacher_id', $t->id)
            ->whereBetween('scheduled_start', [$start, $end])
            ->get();

        $totalSessions    = $sessions->count();
        $attended         = $sessions->where('status', 'attended')->count();
        $reportsExpected  = $attended;
        $reportsSubmitted = SessionReport::whereIn('session_id', $sessions->pluck('id'))->count();
        $studentsStart    = $t->students()->count();
        $studentsEnd      = $t->students()->count();
        $lostStudents     = 0;
        $lateStarts       = 0; // v1 stub — Zoom webhook not wired yet

        return new QualityScore(
            attendance:  $this->pct($attended, $totalSessions),
            reports:     $this->pct($reportsSubmitted, max(1, $reportsExpected)),
            retention:   $studentsStart === 0 ? 100 : (int) round((1 - $lostStudents / $studentsStart) * 100),
            punctuality: $this->pct($attended - $lateStarts, max(1, $attended)),
            inputs:      compact('totalSessions', 'attended', 'reportsExpected', 'reportsSubmitted', 'studentsStart', 'studentsEnd', 'lostStudents', 'lateStarts'),
        );
    }

    public function overall(QualityScore $s): int
    {
        $weights = [
            'attendance'  => Setting::int('quality.weight.attendance', 30),
            'reports'     => Setting::int('quality.weight.reports', 30),
            'retention'   => Setting::int('quality.weight.retention', 25),
            'punctuality' => Setting::int('quality.weight.punctuality', 15),
        ];
        return (int) round(
            ($s->attendance * $weights['attendance']
            + $s->reports * $weights['reports']
            + $s->retention * $weights['retention']
            + $s->punctuality * $weights['punctuality']) / 100
        );
    }

    private function pct(int $num, int $denom): int
    {
        return $denom <= 0 ? 100 : (int) round(100 * $num / $denom);
    }
}
