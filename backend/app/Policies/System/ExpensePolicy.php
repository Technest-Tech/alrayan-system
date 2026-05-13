<?php

namespace App\Policies\System;

use App\Models\System\Expense;
use App\Models\User;

class ExpensePolicy
{
    public function viewAny(User $user): bool { return $user->role === 'admin' || $user->can('expenses.view'); }
    public function view(User $user): bool    { return $user->role === 'admin' || $user->can('expenses.view'); }
    public function create(User $user): bool  { return $user->role === 'admin' || $user->can('expenses.create'); }
    public function update(User $user): bool  { return $user->role === 'admin' || $user->can('expenses.edit'); }
    public function delete(User $user): bool  { return $user->role === 'admin' || $user->can('expenses.delete'); }
}
