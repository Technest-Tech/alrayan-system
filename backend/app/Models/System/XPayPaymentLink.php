<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Model;

class XPayPaymentLink extends Model
{
    protected $table = 'sys_xpay_payment_links';
    protected $guarded = [];
    protected $casts = [
        'is_active'  => 'boolean',
        'expires_at' => 'datetime',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }
}
