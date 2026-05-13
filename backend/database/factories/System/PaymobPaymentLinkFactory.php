<?php

namespace Database\Factories\System;

use App\Models\System\Invoice;
use App\Models\System\PaymobPaymentLink;
use Illuminate\Database\Eloquent\Factories\Factory;

class PaymobPaymentLinkFactory extends Factory
{
    protected $model = PaymobPaymentLink::class;

    public function definition(): array
    {
        return [
            'invoice_id'      => Invoice::factory(),
            'paymob_order_id' => (string) $this->faker->randomNumber(8),
            'payment_url'     => 'https://accept.paymob.com/api/acceptance/iframes/123?payment_token=test',
            'expires_at'      => now()->addHours(24),
            'is_active'       => true,
        ];
    }
}
