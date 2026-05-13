<?php

namespace App\Console\Commands\System;

use App\Models\System\Lead;
use App\Models\System\SysNotification;
use App\Services\System\NotificationService;
use App\Support\System\NotificationTypes;
use Illuminate\Console\Command;

class CheckTrialFollowUpsNeeded extends Command
{
    protected $signature   = 'system:sweep:trial-followups';
    protected $description = 'Notify supervisors/admins about trial leads needing follow-up';

    public function handle(): int
    {
        // Leads stuck in trial_booked or trial_completed for > 2 days without a scheduled follow-up
        $stale = Lead::query()
            ->whereIn('status', ['trial_booked', 'trial_completed'])
            ->where('updated_at', '<=', now()->subDays(2))
            ->whereDoesntHave('followUps', fn($q) => $q->whereNull('completed_at')->where('due_at', '>=', now()))
            ->limit(100)
            ->get();

        foreach ($stale as $lead) {
            // Dedupe 48h
            $exists = SysNotification::where('type', NotificationTypes::LEAD_TRIAL_PENDING)
                ->where('link', "/leads/{$lead->id}")
                ->where('created_at', '>=', now()->subHours(48))
                ->exists();

            if ($exists) continue;

            NotificationService::pushToAdminsAndSupervisors(
                NotificationTypes::LEAD_TRIAL_PENDING,
                "Trial lead needs follow-up: {$lead->name}",
                null,
                "/leads/{$lead->id}"
            );
        }

        return self::SUCCESS;
    }
}
