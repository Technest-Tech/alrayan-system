<?php

namespace App\Policies\System;

use App\Models\System\Payment;
use App\Models\User;

class PaymentPolicy
{
    public function viewAny(User $u)
    {
        return $u->can('payments.view');
    }

    public function view(User $u, Payment $p)
    {
        return $u->can('payments.view');
    }
}
