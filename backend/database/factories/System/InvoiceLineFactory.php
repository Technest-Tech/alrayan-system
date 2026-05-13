<?php

namespace Database\Factories\System;

use App\Models\System\Invoice;
use App\Models\System\InvoiceLine;
use Illuminate\Database\Eloquent\Factories\Factory;

class InvoiceLineFactory extends Factory
{
    protected $model = InvoiceLine::class;

    public function definition(): array
    {
        $qty  = 8;
        $unit = 3125;
        return [
            'invoice_id'           => Invoice::factory(),
            'description'          => '8 sessions × 30 min — ' . now()->format('F Y'),
            'kind'                 => 'monthly',
            'quantity'             => $qty,
            'session_duration_min' => 30,
            'unit_price_minor'     => $unit,
            'line_total_minor'     => $qty * $unit,
        ];
    }
}
