<?php

namespace App\Services\System;

use App\Models\System\Session;
use App\Models\System\SysNotification;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ReportSubmissionMonitor
{
    public function checkOverdue(): int
    {
        $thresholdHours = (int) DB::table('sys_settings')->where('key', 'report_overdue_after_hours')->value('value') ?: 24;
        $cutoff = now()->subHours($thresholdHours);
        $count  = 0;

        $sessions = Session::query()
            ->where('status', 'attended')
            ->where('scheduled_end', '<', $cutoff)
            ->whereNull('report_overdue_at')
            ->whereDoesntHave('report')
            ->limit(200)
            ->get();

        foreach ($sessions as $s) {
            // Notify admins and supervisors
            User::whereIn('role', ['admin', 'supervisor'])->cursor()->each(function (User $u) use ($s) {
                NotificationService::push(
                    $u,
                    'report.overdue',
                    "Missing report: {$s->student->name} · {$s->scheduled_start->format('M j H:i')}",
                    null,
                    "/sessions/{$s->id}"
                );
            });

            $s->update(['report_overdue_at' => now()]);
            $count++;
        }

        return $count;
    }
}
