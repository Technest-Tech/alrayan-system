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
            'status'  => 'new',
            'payload' => null,
        ];
    }

    public function statusNew(): static  { return $this->state(['status' => 'new']); }
    public function contacted(): static { return $this->state(['status' => 'contacted']); }
    public function trialBooked(): static { return $this->state(['status' => 'trial_booked']); }
    public function enrolled(): static  { return $this->state(['status' => 'enrolled']); }
    public function lost(): static
    {
        return $this->state([
            'status'      => 'lost',
            'lost_reason' => $this->faker->randomElement(['price', 'schedule', 'teacher', 'no_response', 'personal', 'other']),
        ]);
    }
}
