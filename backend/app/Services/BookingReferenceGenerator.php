<?php

namespace App\Services;

use App\Models\ContactMessage;
use App\Models\TrialBooking;

class BookingReferenceGenerator
{
    public function forTrialBooking(): string
    {
        return $this->generate('TB', fn ($n) => TrialBooking::where('reference', $n)->exists());
    }

    public function forContact(): string
    {
        return $this->generate('CT', fn ($n) => ContactMessage::where('reference', $n)->exists());
    }

    private function generate(string $prefix, callable $exists): string
    {
        $year = now()->year;
        do {
            $number = str_pad(random_int(1, 9999), 4, '0', STR_PAD_LEFT);
            $ref = "{$prefix}-{$year}-{$number}";
        } while ($exists($ref));

        return $ref;
    }
}
