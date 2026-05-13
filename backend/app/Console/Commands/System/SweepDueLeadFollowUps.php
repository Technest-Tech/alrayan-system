<?php

namespace App\Console\Commands\System;

use App\Models\System\LeadFollowUp;
use App\Models\System\SysNotification;
use App\Models\User;
use App\Services\System\NotificationService;
use App\Support\System\NotificationTypes;
use App\Support\System\Setting;
use Illuminate\Console\Command;

class SweepDueLeadFollowUps extends Command
{
    protected $signature   = 'system:sweep:lead-followups';
    protected $description = 'Fire internal notifications for due lead follow-ups';

    public function handle(): int
    {
        $before = (int) Setting::get('reminders.lead_followup_before_min', 0);
        $now    = now();
        $window = $now->copy()->addMinutes($before);

        $due = LeadFollowUp::query()
            ->whereNull('completed_at')
            ->where('due_at', '<=', $window)
            ->where('due_at', '>=', $now->copy()->subHour())
            ->limit(200)
            ->get();

        foreach ($due as $followUp) {
            // Dedupe: skip if a notification for this follow-up already exists in last 24h
            $exists = SysNotification::where('type', NotificationTypes::LEAD_FOLLOWUP_DUE)
                ->where('link', "/leads/{$followUp->lead_id}")
                ->where('created_at', '>=', now()->subHours(24))
                ->exists();

            if ($exists) continue;

            $lead      = $followUp->lead;
            $recipient = $lead->assigned_supervisor_id
                ? User::find($lead->assigned_supervisor_id)
                : null;

            if ($recipient) {
                NotificationService::push($recipient, NotificationTypes::LEAD_FOLLOWUP_DUE,
                    "Follow up with {$lead->name}: {$followUp->action}",
                    null, "/leads/{$lead->id}");
            } else {
                NotificationService::pushToAdmins(NotificationTypes::LEAD_FOLLOWUP_DUE_UNASSIGNED,
                    "Unassigned lead follow-up due: {$lead->name}",
                    null, "/leads/{$lead->id}");
            }
        }

        return self::SUCCESS;
    }
}
