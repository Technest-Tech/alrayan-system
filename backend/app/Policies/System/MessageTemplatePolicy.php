<?php

namespace App\Policies\System;

use App\Models\System\MessageTemplate;
use App\Models\User;

class MessageTemplatePolicy
{
    public function viewAny(User $u): bool { return $u->can('notifications.view'); }
    public function view(User $u, MessageTemplate $t): bool { return $u->can('notifications.view'); }
    public function update(User $u, MessageTemplate $t): bool { return $u->can('notifications.edit_templates'); }
}
