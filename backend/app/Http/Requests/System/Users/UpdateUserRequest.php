<?php

namespace App\Http\Requests\System\Users;

use App\Support\System\Permissions\PermissionRegistry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'          => ['sometimes', 'string', 'max:100'],
            'role'          => ['sometimes', Rule::in(['admin', 'supervisor', 'teacher'])],
            'permissions'   => ['sometimes', 'array'],
            'permissions.*' => ['string', Rule::in(PermissionRegistry::all())],
        ];
    }
}
