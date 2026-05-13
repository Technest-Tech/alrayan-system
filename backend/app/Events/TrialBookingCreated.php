<?php

namespace App\Events;

use App\Models\TrialBooking;
use Illuminate\Foundation\Events\Dispatchable;

class TrialBookingCreated
{
    use Dispatchable;

    public function __construct(public readonly TrialBooking $trialBooking) {}
}
