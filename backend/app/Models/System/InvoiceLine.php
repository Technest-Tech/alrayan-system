<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InvoiceLine extends Model
{
    protected $table = 'sys_invoice_lines';
    protected $guarded = [];
    protected $casts = [
        'unit_price_minor'    => 'integer',
        'line_total_minor'    => 'integer',
        'quantity'            => 'integer',
        'session_duration_min'=> 'integer',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function sourceInvoice()
    {
        return $this->belongsTo(Invoice::class, 'source_invoice_id');
    }
}
