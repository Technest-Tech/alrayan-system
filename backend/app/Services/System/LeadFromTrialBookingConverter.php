<?php

namespace App\Services\System;

use App\Models\System\Lead;
use App\Models\TrialBooking;

class LeadFromTrialBookingConverter
{
    public function convert(TrialBooking $tb): Lead
    {
        // Idempotent — return existing lead if already created
        $existing = Lead::where('trial_booking_id', $tb->id)->first();
        if ($existing) return $existing;

        return Lead::create([
            'name'             => $tb->name,
            'email'            => $tb->email ?? null,
            'phone'            => $tb->phone ?? null,
            'whatsapp'         => $tb->whatsapp ?? $tb->phone ?? null,
            'country'          => $tb->country ?? null,
            'source'           => 'website_form',
            'source_detail'    => $tb->meta['utm_source'] ?? null,
            'status'           => 'new',
            'trial_booking_id' => $tb->id,
            'payload'          => array_filter([
                'preferred_time' => $tb->preferred_time ?? null,
                'age_group'      => $tb->age_group ?? null,
                'message'        => $tb->message ?? null,
                'utm_source'     => $tb->meta['utm_source'] ?? null,
                'utm_campaign'   => $tb->meta['utm_campaign'] ?? null,
            ]),
        ]);
    }
}
