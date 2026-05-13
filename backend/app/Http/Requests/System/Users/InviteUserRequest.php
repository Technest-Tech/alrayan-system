<?php

namespace App\Http\Requests\System\Users;

use App\Support\System\Permissions\PermissionRegistry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InviteUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'          => ['required', 'string', 'max:100'],
            'email'         => ['required', 'email', 'unique:users,email'],
            'role'          => ['required', Rule::in(['admin', 'supervisor', 'teacher'])],
            'permissions'   => ['sometimes', 'array'],
            'permissions.*' => ['string', Rule::in(PermissionRegistry::all())],
        ];
    }
}
