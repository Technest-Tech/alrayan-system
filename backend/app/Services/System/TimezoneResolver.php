<?php

namespace App\Services\System;

use Carbon\Carbon;

class TimezoneResolver
{
    public function toUtc(string $localTime, string $date, string $timezone): Carbon
    {
        return Carbon::createFromFormat('Y-m-d H:i:s', "{$date} {$localTime}:00", $timezone)->utc();
    }

    public function toLocal(Carbon $utc, string $timezone): Carbon
    {
        return $utc->copy()->setTimezone($timezone);
    }
}
