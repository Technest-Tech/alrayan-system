<?php

namespace App\Policies\System;

use App\Models\System\WhatsAppGroup;
use App\Models\User;

class WhatsAppGroupPolicy
{
    public function viewAny(User $u): bool { return $u->can('whatsapp.view'); }
    public function view(User $u, WhatsAppGroup $g): bool { return $u->can('whatsapp.view'); }
    public function create(User $u): bool  { return $u->can('whatsapp.register_group'); }
    public function update(User $u, WhatsAppGroup $g): bool { return $u->can('whatsapp.edit_group'); }
    public function stop(User $u, WhatsAppGroup $g): bool   { return $u->can('whatsapp.stop_group'); }
    public function reactivate(User $u, WhatsAppGroup $g): bool { return $u->can('whatsapp.edit_group'); }
}
