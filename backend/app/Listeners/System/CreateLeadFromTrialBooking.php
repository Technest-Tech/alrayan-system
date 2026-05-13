<?php

namespace App\Listeners\System;

use App\Events\TrialBookingCreated;
use App\Services\System\LeadFromTrialBookingConverter;
use App\Services\System\NotificationService;
use App\Support\System\NotificationTypes;
use Illuminate\Contracts\Queue\ShouldQueue;

class CreateLeadFromTrialBooking implements ShouldQueue
{
    public string $queue = 'notifications';

    public function __construct(private LeadFromTrialBookingConverter $converter) {}

    public function handle(TrialBookingCreated $event): void
    {
        $lead = $this->converter->convert($event->trialBooking);

        NotificationService::pushToAdminsAndSupervisors(
            NotificationTypes::LEAD_CREATED,
            "New lead: {$lead->name} from {$lead->source}",
            null,
            "/leads/{$lead->id}"
        );
    }
}
