<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WalletTransaction extends Model
{
    protected $table = 'sys_wallet_transactions';
    protected $guarded = [];
    protected $casts = [
        'amount_minor'        => 'integer',
        'balance_after_minor' => 'integer',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function actor()
    {
        return $this->belongsTo(\App\Models\User::class, 'actor_user_id');
    }

    public function sourceReference()
    {
        return $this->morphTo('source_reference');
    }
}
