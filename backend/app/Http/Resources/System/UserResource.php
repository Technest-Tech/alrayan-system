<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'name'           => $this->name,
            'email'          => $this->email,
            'role'           => $this->role,
            'roles'          => $this->whenLoaded('roles', fn() => $this->roles->pluck('name')->values()),
            'permissions'    => $this->whenLoaded('permissions', fn() => $this->permissions->pluck('name')->values()),
            'is_active'      => $this->is_active,
            'last_login_at'  => $this->last_login_at?->toISOString(),
            'invite_pending' => !$this->last_login_at && $this->is_active,
            'teacher_id'     => $this->whenLoaded('teacher', fn() => $this->teacher?->id),
            'phone'          => $this->phone ?? null,
            'whatsapp'       => $this->whatsapp ?? null,
            'created_at'     => $this->created_at->toISOString(),
        ];
    }
}
