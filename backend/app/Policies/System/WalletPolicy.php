<?php

namespace App\Policies\System;

use App\Models\System\Student;
use App\Models\User;

class WalletPolicy
{
    public function view(User $u, Student $s)
    {
        return $u->can('wallet.view');
    }

    public function credit(User $u, Student $s)
    {
        return $u->can('wallet.credit');
    }

    public function debit(User $u, Student $s)
    {
        return $u->can('wallet.debit');
    }

    public function adjust(User $u, Student $s)
    {
        return $u->can('wallet.adjust');
    }
}
