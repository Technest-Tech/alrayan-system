<?php

namespace Database\Factories\System;

use App\Models\System\Lead;
use Illuminate\Database\Eloquent\Factories\Factory;

class LeadFactory extends Factory
{
    protected $model = Lead::class;

    public function definition(): array
    {
        return [
            'name'    => $this->faker->name(),
            'email'   => $this->faker->safeEmail(),
            'phone'   => $this->faker->e164PhoneNumber(),
            'whatsapp'=> $this->faker->e164PhoneNumber(),
            'country' => $this->faker->countryCode(),
            'source'  => $this->faker->randomElement([
                'google_ads', 'facebook_ads', 'instagram_ads', 'whatsapp_direct',
                'student_referral', 'website_form', 'manual_entry',
            ]),
            'platform' => $this->faker->randomElement([
                'website', 'facebook', 'instagram', 'youtube', 'whatsapp', 'tiktok', 'other',
            ]),
            'priority' => 'medium',
            'status'   => 'new_lead',
            'payload'  => null,
        ];
    }

    public function newLead(): static          { return $this->state(['status' => 'new_lead']); }
    public function interested(): static       { return $this->state(['status' => 'interested']); }
    public function waitingForTrial(): static  { return $this->state(['status' => 'waiting_for_trial']); }
    public function waitingForPayment(): static{ return $this->state(['status' => 'waiting_for_payment']); }
    public function closed(): static           { return $this->state(['status' => 'closed']); }
    public function notInterested(): static    { return $this->state(['status' => 'not_interested']); }

    public function lost(): static
    {
        return $this->state([
            'status'      => 'lost',
            'lost_reason' => $this->faker->randomElement(['price', 'schedule', 'teacher', 'no_response', 'personal', 'other']),
        ]);
    }
}
