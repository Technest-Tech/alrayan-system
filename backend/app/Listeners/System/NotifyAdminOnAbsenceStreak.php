<?php

namespace App\Listeners\System;

use App\Events\System\SessionAbsent;
use App\Models\System\Session;
use App\Models\User;
use App\Services\System\NotificationService;
use Illuminate\Support\Facades\DB;

class NotifyAdminOnAbsenceStreak
{
    public function handle(SessionAbsent $event): void
    {
        $session   = $event->session;
        $threshold = (int) DB::table('sys_settings')->where('key', 'attendance_absence_threshold')->value('value') ?: 3;

        // Count consecutive absences for this student (most recent sessions)
        $recentStatuses = Session::where('student_id', $session->student_id)
            ->whereIn('status', ['attended', 'absent'])
            ->where('scheduled_start', '<=', $session->scheduled_start)
            ->orderByDesc('scheduled_start')
            ->limit($threshold)
            ->pluck('status')
            ->toArray();

        $streak = 0;
        foreach ($recentStatuses as $status) {
            if ($status === 'absent') {
                $streak++;
            } else {
                break;
            }
        }

        if ($streak >= $threshold) {
            $msg = "Absence streak alert: {$session->student->name} has missed {$streak} sessions in a row.";
            User::whereIn('role', ['admin', 'supervisor'])->cursor()->each(function (User $u) use ($msg, $session) {
                NotificationService::push($u, 'students.absence_streak', $msg, null, "/students/{$session->student_id}");
            });
        }
    }
}
