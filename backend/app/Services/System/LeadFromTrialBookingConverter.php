<?php

namespace App\Services\System;

use App\Models\System\Lead;
use App\Models\TrialBooking;

class LeadFromTrialBookingConverter
{
    /**
     * Country name → ISO-3166 alpha-2 code. Trial bookings store the full
     * country name (varchar 100), but sys_leads.country is a 2-char code, so
     * we translate at this boundary. Covers every country the public trial
     * form offers; anything else falls back to null.
     */
    private const COUNTRY_CODES = [
        'france' => 'FR', 'united states' => 'US', 'united kingdom' => 'GB',
        'canada' => 'CA', 'australia' => 'AU', 'germany' => 'DE',
        'netherlands' => 'NL', 'belgium' => 'BE', 'sweden' => 'SE',
        'norway' => 'NO', 'denmark' => 'DK', 'uae' => 'AE',
        'saudi arabia' => 'SA', 'qatar' => 'QA', 'kuwait' => 'KW',
        'bahrain' => 'BH', 'malaysia' => 'MY', 'pakistan' => 'PK',
        'egypt' => 'EG', 'turkey' => 'TR', 'south africa' => 'ZA',
    ];

    private function countryCode(?string $country): ?string
    {
        if ($country === null || $country === '') return null;
        // Already a 2-letter code
        if (strlen($country) === 2) return strtoupper($country);
        return self::COUNTRY_CODES[strtolower(trim($country))] ?? null;
    }

    /**
     * Everything the visitor typed, folded into the lead's notes — the CRM's
     * lead form reads `notes`, so anything left only in `payload` is invisible
     * to the supervisor working the lead.
     */
    private function notes(TrialBooking $tb): string
    {
        $details = array_filter([
            $tb->course_interest ? "Course: {$tb->course_interest}" : null,
            $tb->age_group ? "Age: {$tb->age_group}" : null,
            $tb->preferred_time
                ? 'Preferred: ' . $tb->preferred_time . ($tb->timezone ? " ({$tb->timezone})" : '')
                : null,
        ]);

        return trim(
            ($tb->message ? $tb->message . "\n\n" : '') . implode(' · ', $details)
        );
    }

    public function convert(TrialBooking $tb): Lead
    {
        // Idempotent — return existing lead if already created
        $existing = Lead::where('trial_booking_id', $tb->id)->first();
        if ($existing) return $existing;

        return Lead::create($this->attributesFor($tb));
    }

    /**
     * The lead columns a booking maps onto. Public so the backfill command can
     * repair leads that predate this mapping.
     *
     * @return array<string, mixed>
     */
    public function attributesFor(TrialBooking $tb): array
    {
        return [
            'name'             => $tb->name,
            'email'            => $tb->email ?? null,
            'phone'            => $tb->phone ?? null,
            'whatsapp'         => $tb->phone ?? null,
            'country'          => $this->countryCode($tb->country),
            'source'           => 'website_form',
            'source_detail'    => 'Free trial booking · ' . $tb->reference,
            'platform'         => 'website',
            'status'           => 'new_lead',
            'notes'            => $this->notes($tb),
            'trial_booking_id' => $tb->id,
            'payload'          => array_filter([
                'reference'       => $tb->reference,
                'course_interest' => $tb->course_interest ?? null,
                'preferred_time'  => $tb->preferred_time ?? null,
                'timezone'        => $tb->timezone ?? null,
                'age_group'       => $tb->age_group ?? null,
                'message'         => $tb->message ?? null,
            ]),
        ];
    }
}
